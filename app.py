import random
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Расширенная база данных с видео-маркерами (URL роликов и секунды остановки)
GRAMMAR_DATABASE = {
    "low": {
        "structures": [
            {
                "if": "If Mike had discovered the fraud earlier,", 
                "correct": "he would have notified the senior partners immediately.", 
                "wrong": ["he will notify the board tomorrow.", "he would notify them right now."],
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                "stop_time": 4.0
            },
            {
                "if": "If Louis had lost the client ledger last week,", 
                "correct": "Jessica would have fired him on the spot.", 
                "wrong": ["Jessica will fire him tomorrow.", "Jessica fires him right now."],
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                "stop_time": 3.5
            }
        ]
    },
    "mid": {
        "structures": [
            {
                "if": "If Harvey had settled the class-action lawsuit yesterday,", 
                "correct": "we would easily secure the summary judgment this afternoon.", 
                "wrong": ["we will have won the case tomorrow.", "the jury delivered a verdict yesterday."],
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                "stop_time": 5.0
            }
        ]
    },
    "high": {
        "structures": [
            {
                "if": "Had Jessica anticipated the hostile takeover bid,", 
                "correct": "the firm would not be fighting for survival today.", 
                "wrong": ["the firm will close down next week.", "the board has removed her yesterday."],
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                "stop_time": 6.2
            }
        ]
    }
}

@app.route('/')
def index_page():
    return render_template('index.html')

@app.route('/api/v1/generate-case', methods=['GET'])
def generate_procedural_case():
    score = int(request.args.get('score', 20))
    
    if score < 40:
        tier = "low"
    elif score < 70:
        tier = "mid"
    else:
        tier = "high"
        
    case_data = random.choice(GRAMMAR_DATABASE[tier]["structures"])
    
    options = [
        {"text": case_data["correct"], "is_correct": True, "letter": ""},
        {"text": case_data["wrong"][0], "is_correct": False, "letter": ""},
        {"text": case_data["wrong"][1], "is_correct": False, "letter": ""}
    ]
    
    random.shuffle(options)
    
    for idx, opt in enumerate(options):
        opt["letter"] = ["A", "B", "C"][idx]

    return jsonify({
        "case_id": f"#{random.randint(1000, 9999)}",
        "if_clause": case_data["if"],
        "options": options,
        "tier": tier,
        "video_url": case_data["video_url"],
        "stop_time": case_data["stop_time"]
    })

@app.route('/api/v1/syntax-analytics', methods=['POST'])
def save_syntax_analytics():
    return jsonify({"status": "processed"}), 200

if __name__ == '__main__':
    app.run(debug=True)