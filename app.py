import os
import json
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
CONTENT_FOLDER = 'content'

@app.route('/video/<path:filename>')
def serve_video(filename):
    return send_from_directory(CONTENT_FOLDER, filename)

@app.route('/')
def index():
    quizzes = []
    video_files = [f for f in os.listdir(CONTENT_FOLDER) if f.startswith('quiz_') and f.endswith('.mp4')]
    
    for video in video_files:
        json_filename = video.replace('.mp4', '.json')
        json_path = os.path.join(CONTENT_FOLDER, json_filename)
        
        # Данные по умолчанию, если JSON еще не готов
        quiz_data = {
            "question": "Загрузка вопроса...", 
            "option_a": "Вариант A", 
            "option_b": "Вариант B", 
            "option_c": "Вариант C"
        }
        
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                quiz_data = json.load(f)
        
        quizzes.append({
            'video_file': video,
            'data': quiz_data
        })
    
    # Передаем список квизов в шаблон
    return render_template('index.html', quizzes=quizzes)

if __name__ == '__main__':
    app.run(debug=True)