import spacy
from spacy.matcher import Matcher
import pysrt
import random
import os
import json
from openai import OpenAI
from moviepy.video.io.VideoFileClip import VideoFileClip

# ==========================================
# ⚙️ НАСТРОЙКИ
# ==========================================
client = OpenAI(api_key="YOUR_KEY_HERE") 

CONTENT_DIR = "content"
SUBTITLE_FILE = os.path.join(CONTENT_DIR, "prada_scene.srt")
FULL_MOVIE_FILE = os.path.join(CONTENT_DIR, "full_movie.mp4")

print("Loading language model...")
nlp = spacy.load("en_core_web_sm")
matcher = Matcher(nlp.vocab)
passive_pattern = [{"DEP": "auxpass"}, {"TAG": "VBN"}]
matcher.add("PASSIVE_VOICE", [passive_pattern])

# ==========================================
# 🧠 МОДУЛИ
# ==========================================
def generate_distractors(sentence, correct_phrase):
    prompt = f"""
    You are an English grammar expert (B2-C1).
    Sentence: "{sentence}"
    Correct construction: "{correct_phrase}"
    
    Provide 2 plausible incorrect distractors and a brief explanation in English.
    Return JSON: {{"distractor_1": "...", "distractor_2": "...", "explanation": "..."}}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": str(e)}

def extract_video_fragment(start_ms, end_ms, output_path, buffer_sec=1.0):
    start_sec = max(0, (start_ms / 1000.0) - buffer_sec)
    end_sec = (end_ms / 1000.0) + buffer_sec
    try:
        with VideoFileClip(FULL_MOVIE_FILE) as video:
            with video.subclipped(start_sec, end_sec) as new_clip:
                new_clip.write_videofile(output_path, codec="libx264", audio_codec="aac", logger=None)
        return True
    except Exception as e:
        print(f"❌ Video Error: {e}")
        return False

# ==========================================
# 🎬 MAIN SCANNER
# ==========================================
def scan_subtitles(filepath):
    if not os.path.exists(filepath) or not os.path.exists(FULL_MOVIE_FILE):
        print("❌ Error: Missing .srt or .mp4 files!")
        return

    subs = pysrt.open(filepath)
    print("\n--- 🚀 GENERATION STARTED ---")
    
    for sub in subs:
        text = sub.text.replace('\n', ' ').capitalize() 
        doc = nlp(text)
        
        # ВАЖНО: Весь этот блок должен быть внутри 'if'
        if matcher(doc):
            matched_phrase = doc[matcher(doc)[0][1]:matcher(doc)[0][2]].text
            print(f"\n[{sub.start.to_time()}] Found: '{matched_phrase}'")
            
            distractors = generate_distractors(text, matched_phrase)
            
            # --- БЛОК СОХРАНЕНИЯ JSON (С ПРАВИЛЬНЫМИ ОТСТУПАМИ) ---
            explanation_text = distractors.get('explanation', 'The correct option preserves the formal register.')
            options = [
                {"text": matched_phrase, "is_correct": True},
                {"text": distractors.get('distractor_1', 'Option B'), "is_correct": False},
                {"text": distractors.get('distractor_2', 'Option C'), "is_correct": False}
            ]
            random.shuffle(options)
            quiz_data = {
                "question": "Select the correct formal equivalent:",
                "options": options,
                "explanation": explanation_text
            }
            json_filename = f"quiz_{sub.start.ordinal}.json"
            json_path = os.path.join(CONTENT_DIR, json_filename)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(quiz_data, f, ensure_ascii=False, indent=4)
            # ----------------------------------------------------

            safe_name = f"quiz_{sub.start.ordinal}.mp4"
            output_path = os.path.join(CONTENT_DIR, safe_name)
            print(f"🎬 Rendering video...")
            extract_video_fragment(sub.start.ordinal, sub.end.ordinal, output_path)

if __name__ == '__main__':
    scan_subtitles(SUBTITLE_FILE)