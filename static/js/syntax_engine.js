let startTime = Date.now();
let hesitationCount = 0;
let choicesHistory = [];
let caseResolved = false;

// Подсчет колебаний при наведении/попытке выбора
const options = document.querySelectorAll('#options-pool button');
options.forEach(button => {
    button.addEventListener('mouseenter', () => {
        if (!caseResolved) hesitationCount++;
    });
});

function selectOption(element, isCorrect, text) {
    if (caseResolved) return;
    
    const targetSlot = document.getElementById('target-slot');
    const placeholder = document.getElementById('slot-placeholder');
    
    // Визуальное перемещение текста в слот
    if (placeholder) placeholder.remove();
    targetSlot.innerHTML = `<p class="text-2xl font-semibold text-amber-400">${text}</p>`;
    
    // Фиксация таймингов
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
    caseResolved = true;

    // Расчет метрик
    const accuracy = isCorrect ? 100 : 0;
    choicesHistory.push({ text: text, isCorrect: isCorrect, time: timeTaken });

    // Отрисовка Scoreboard
    document.getElementById('metric-time').innerText = `${timeTaken}s`;
    document.getElementById('metric-hesitation').innerText = hesitationCount;
    document.getElementById('metric-accuracy').innerText = `${accuracy}%`;

    // Стилизация слота по результату вердикка
    if (isCorrect) {
        targetSlot.className = "mb-8 p-6 bg-emerald-950/30 border-2 border-emerald-500 rounded-lg min-h-[100px] flex items-center justify-center animate-pulse";
        generateOpinion(timeTaken, hesitationCount, true);
    } else {
        targetSlot.className = "mb-8 p-6 bg-rose-950/30 border-2 border-rose-500 rounded-lg min-h-[100px] flex items-center justify-center";
        generateOpinion(timeTaken, hesitationCount, false);
    }

    // Показ аналитики
    document.getElementById('analytics-scoreboard').classList.remove('hidden');
    
    // Отправка Data-driven метрик на бэкенд Flask
    sendAnalyticsToBackend(timeTaken, hesitationCount, isCorrect);
}

function generateOpinion(time, hesitations, isCorrect) {
    const opinionBox = document.getElementById('legal-opinion-text');
    if (isCorrect) {
        if (hesitations < 3) {
            opinionBox.innerText = `Блестящая победа в суде. Структура Mixed/Third Conditional определена мгновенно за ${time} сек. Колебания практически отсутствуют. Мышление на уровне старшего партнера фирмы.`;
        } else {
            opinionBox.innerText = `Дело выиграно, но вердикт дался непросто. Индекс колебаний равен ${hesitations}. Вы верно сопоставили If-Clause и Main-Clause, но присяжные заметили неуверенность при выборе временных форм. Рекомендуется закрепить автоматизм (muscle memory).`;
        }
    } else {
        opinionBox.innerText = `Процесс проигран. Вы выбрали синтаксически несогласованную форму следствия. Нарушена строгая математическая логика условного предложения. Внимательно изучите таймлайн разбора улик.`;
    }
}

function sendAnalyticsToBackend(time, hesitations, success) {
    fetch('/api/v1/syntax-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            case_id: "0412",
            time_spent_seconds: parseFloat(time),
            hesitation_index: parseInt(hesitations),
            is_correct: success
        })
    }).catch(err => console.error("Data tracking offline:", err));
}

function resetCase() {
    location.reload(); // Быстрый сброс состояния для демонстрации
}