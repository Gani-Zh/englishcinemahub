let startTime = null;
let hesitationCount = 0;
let caseResolved = false;
let currentCaseId = "#0000";
let careerScore = 20; 

let targetStopTime = null;
let stopTimeReached = false;

const RANKS = ["Legal Intern", "Junior Associate", "Senior Associate", "Junior Partner", "Senior Partner"];

function updateCareerUI() {
    careerScore = Math.max(5, Math.min(100, careerScore));
    const bar = document.getElementById('career-progress-bar');
    if (bar) bar.style.width = `${careerScore}%`;
    let rankIndex = Math.floor((careerScore - 1) / 20);
    rankIndex = Math.max(0, Math.min(RANKS.length - 1, rankIndex));
    const rankLabel = document.getElementById('career-rank');
    if (rankLabel) rankLabel.innerText = RANKS[rankIndex];
}

function bindHesitationTrackers() {
    const options = document.querySelectorAll('#options-pool button');
    options.forEach(button => {
        button.addEventListener('mouseenter', () => {
            if (!caseResolved && stopTimeReached) hesitationCount++;
        });
    });
}

function initVideoController() {
    const video = document.getElementById('cinema-footage');
    if (!video) return;

    // Сброс старых обработчиков
    video.ontimeupdate = null;

    video.addEventListener('timeupdate', () => {
        // Защита от багов смены src (video.currentTime > 0)
        if (targetStopTime && video.currentTime > 0 && video.currentTime >= targetStopTime && !stopTimeReached) {
            video.pause();
            stopTimeReached = true;
            
            startTime = Date.now();
            
            // Активация [ЗОНЫ 4]
            const examZone = document.getElementById('examination-zone');
            examZone.classList.remove('opacity-40');
            examZone.style.pointerEvents = 'auto';
            
            const placeholder = document.getElementById('slot-placeholder');
            if (placeholder) {
                placeholder.innerText = "[Click the correct main clause below to close the gap]";
                placeholder.className = "text-amber-400 text-[10px] uppercase tracking-wider text-center font-bold font-mono animate-pulse";
            }
        }
    });
}

function selectOption(element, isCorrect, text, letter) {
    if (caseResolved || !stopTimeReached) return;
    caseResolved = true;
    
    const targetSlot = document.getElementById('target-slot');
    targetSlot.innerHTML = `<p class="text-sm font-semibold text-amber-400">${text}</p>`;
    
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
    const accuracy = isCorrect ? 100 : 0;
    const opinionBox = document.getElementById('legal-opinion-text');
    
    if (isCorrect) {
        let reward = hesitationCount >= 3 ? 5 : 15;
        careerScore += reward;
        targetSlot.className = "p-4 bg-emerald-950/30 border border-emerald-500 rounded-xl min-h-[70px] flex items-center justify-center";
        if (opinionBox) {
            opinionBox.innerText = hesitationCount >= 3
                ? `Case won, but the verdict was unstable. Hesitation Index: ${hesitationCount}. Structural matching completed after second-guessing.`
                : `Brilliant victory. Structure identified in ${timeTaken}s with zero hesitation.`;
        }
    } else {
        careerScore -= 10;
        targetSlot.className = "p-4 bg-rose-950/30 border border-rose-500 rounded-xl min-h-[70px] flex items-center justify-center";
        if (opinionBox) {
            opinionBox.innerText = `Objection sustained. Structural timeline mismatch detected. Review the prosecution condition rules.`;
        }
    }
    
    updateCareerUI();

    document.getElementById('metric-time').innerText = `${timeTaken}s`;
    document.getElementById('metric-hesitation').innerText = hesitationCount;
    document.getElementById('metric-accuracy').innerText = `${accuracy}%`;

    renderInlineExplanation(element, letter, isCorrect);
    document.getElementById('analytics-scoreboard').classList.remove('hidden');
    
    sendAnalyticsToBackend(timeTaken, hesitationCount, isCorrect);
}

function renderInlineExplanation(element, letter, isCorrect) {
    let html = isCorrect 
        ? `<div class="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mb-1">// STRUCTURAL MATCH</div>
           <p class="text-xs text-slate-400 leading-relaxed font-sans">Perfect alignment. The counterfactual past condition transitions into an active present consequence.</p>`
        : `<div class="text-[9px] font-bold text-rose-400 tracking-widest uppercase mb-1">// TIMELINE VIOLATION</div>
           <p class="text-xs text-slate-400 leading-relaxed font-sans">Syntax failure. The selected clause misinterprets the tense requirements dictated by the clip scenario.</p>`;

    const wrapper = document.createElement('div');
    wrapper.className = "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0";
    wrapper.innerHTML = `<div class="mt-2 pt-2 border-t border-slate-800">${html}</div>`;
    
    element.appendChild(wrapper);
    element.classList.add('border-amber-500/50', 'bg-slate-900');
    
    setTimeout(() => {
        wrapper.style.maxHeight = "120px";
        wrapper.style.opacity = "1";
    }, 10);
}

function loadNextProceduralCase() {
    fetch(`/api/v1/generate-case?score=${careerScore}`)
        .then(res => res.json())
        .then(data => {
            currentCaseId = data.case_id;
            document.getElementById('ui-case-id').innerText = `Case ${data.case_id}: The Syntax Cross-Examination`;
            document.getElementById('if-clause-text').innerText = data.if_clause;
            
            const video = document.getElementById('cinema-footage');
            if (video) {
                targetStopTime = data.stop_time;
                stopTimeReached = false;
                video.src = data.video_url;
                video.load();
                
                // Сброс и блокировка Зоны 4 при загрузке нового кейса
                document.getElementById('examination-zone').classList.add('opacity-40');
                document.getElementById('examination-zone').style.pointerEvents = 'none';
                
                const placeholder = document.getElementById('slot-placeholder');
                if (placeholder) {
                    placeholder.innerText = "[Video Stream Initialized. Run Playback to Unlock Arguments]";
                    placeholder.className = "text-slate-500 text-[10px] uppercase tracking-wider text-center font-mono";
                }
            }

            const pool = document.getElementById('options-pool');
            pool.innerHTML = data.options.map(opt => `
                <button onclick="selectOption(this, ${opt.is_correct}, '${opt.text}', '${opt.letter}')" class="w-full text-left p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-xl text-xs transition-all flex items-start focus:outline-none">
                    <span class="text-amber-500 font-bold mr-3 font-mono">${opt.letter}.</span>
                    <span class="text-slate-200 font-sans">${opt.text}</span>
                </button>
            `).join('');

            hesitationCount = 0;
            caseResolved = false;
            
            document.getElementById('analytics-scoreboard').classList.add('hidden');
            bindHesitationTrackers();
        });
}

function sendAnalyticsToBackend(time, hesitations, success) {
    fetch('/api/v1/syntax-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: currentCaseId, time_spent_seconds: parseFloat(time), hesitation_index: parseInt(hesitations), is_correct: success })
    }).catch(err => console.error("Tracking offline:", err));
}

function resetCase() {
    loadNextProceduralCase();
}

window.onload = () => {
    updateCareerUI();
    initVideoController();
    loadNextProceduralCase();
};