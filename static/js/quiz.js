// 1. Конфигурация интерактивного квиза
const quizConfig = {
    videoId: "CPt3MiTVkSM", 
    question: "What is Harvey’s underlying strategy when he exposes Mike’s 'backup plan'?",
    options: [
        { id: "A", text: "He wants to manipulate Mike into resigning voluntarily.", isCorrect: false },
        { id: "B", text: "He is provoking Mike to step up and prove his intellectual confidence.", isCorrect: true }
    ],
    feedback: {
        correct: "Bullseye. You don't look for excuses, you look for leverage. You read people like an open book. Keep this momentum up.",
        wrong: "Wrong. You're letting your emotions cloud your judgment. In this game, if you don't have a backup plan, you're out. Try again.",
        timeout: "Time's up. Hesitation is the ultimate deal-killer. While you were second-guessing yourself, the opportunity just walked out the door."
    },
    settings: {
        timeLimit: 12,    
        triggerTime: 19   
    }
};

// 2. Класс управления квизом и плеером
class QuizEngine {
    constructor(config) {
        this.config = config;
        this.player = null;
        this.timeCheckInterval = null;
        this.isTriggered = false;
        this.isAnswered = false; 
    }

    init() {
        this.player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: this.config.videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 1,
                'rel': 0
            },
            events: {
                'onReady': () => console.log("YouTube плеер готов!"),
                'onStateChange': (event) => this.onPlayerStateChange(event)
            }
        });
    }

    onPlayerStateChange(event) {
        if (event.data === 1) {
            this.startTimeTracking();
        } else {
            this.stopTimeTracking();
        }
    }

    startTimeTracking() {
        this.timeCheckInterval = setInterval(() => {
            const currentTime = this.player.getCurrentTime();
            if (currentTime >= this.config.settings.triggerTime && !this.isTriggered) {
                this.isTriggered = true;
                this.triggerQuiz();
            }
        }, 500);
    }

    stopTimeTracking() {
        clearInterval(this.timeCheckInterval);
    }

    triggerQuiz() {
        this.player.pauseVideo(); 
        
        document.getElementById('quiz-question').innerText = this.config.question;
        
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        this.config.options.forEach(option => {
            const button = document.createElement('button');
            button.className = "w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-200 focus:outline-none text-white";
            button.innerHTML = `<span class="font-bold text-green-400 mr-2">${option.id}:</span> ${option.text}`;
            
            // Передаем в обработчик не только данные опции, но и саму кнопку (button)
            button.addEventListener('click', () => this.handleAnswer(option, button));
            
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('quiz-modal').classList.remove('hidden');
    }

    handleAnswer(selectedOption, clickedButton) {
        if (this.isAnswered) return; 
        this.isAnswered = true;

        const feedbackElement = document.getElementById('quiz-feedback');
        
        if (selectedOption.isCorrect) {
            // Окрашиваем НАЖАТУЮ КНОПКУ в зелёный стиль
            clickedButton.className = "w-full text-left bg-green-500/20 border-green-500 rounded-xl p-4 transition-all duration-200 text-white font-medium";
            
            // Выводим текст успеха Харви
            feedbackElement.innerText = this.config.feedback.correct;
            feedbackElement.className = "mt-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-200 text-sm font-medium transition-all duration-300";
        } else {
            // Окрашиваем НАЖАТУЮ КНОПКУ в красный стиль
            clickedButton.className = "w-full text-left bg-red-500/20 border-red-500 rounded-xl p-4 transition-all duration-200 text-white font-medium";
            
            // Выводим жесткий фидбэк Харви
            feedbackElement.innerText = this.config.feedback.wrong;
            feedbackElement.className = "mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm font-medium transition-all duration-300";
        }

        feedbackElement.classList.remove('hidden');
    }
}

// 3. Инициализация при готовности API
const engine = new QuizEngine(quizConfig);
function onYouTubeIframeAPIReady() {
    engine.init();
}