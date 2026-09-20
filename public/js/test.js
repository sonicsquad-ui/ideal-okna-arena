/**
 * ORIENTIRPROF.RU — Интерактивный онлайн-тест профориентации
 * Методика Климова / Холланда
 */

(function () {
  'use strict';

  let testData = null;
  let currentStep = 0;
  let answers = {}; // questionIndex => chosenType

  const testContainer = document.getElementById('interactiveQuiz');
  if (!testContainer) return;

  const progressBar = document.getElementById('quizProgressBar');
  const stepText = document.getElementById('quizStepText');
  const questionText = document.getElementById('quizQuestionText');
  const optionsList = document.getElementById('quizOptionsList');
  const prevBtn = document.getElementById('quizPrevBtn');
  const nextBtn = document.getElementById('quizNextBtn');
  const questionBox = document.getElementById('quizQuestionBox');
  const resultBox = document.getElementById('quizResultBox');

  // Fetch test questions
  fetch('/data/test-questions.json')
    .then(r => r.json())
    .then(data => {
      testData = data;
      initQuiz();
    })
    .catch(err => {
      console.warn('Fallback inline test data', err);
      // Fallback if data route is different
    });

  function initQuiz() {
    if (!testData || !testData.questions || testData.questions.length === 0) return;
    currentStep = 0;
    answers = {};
    renderQuestion(currentStep);
  }

  function renderQuestion(index) {
    const q = testData.questions[index];
    const total = testData.questions.length;
    const progress = Math.round(((index + 1) / total) * 100);

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (stepText) stepText.textContent = `Вопрос ${index + 1} из ${total}`;
    if (questionText) questionText.textContent = q.text;

    if (prevBtn) {
      prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
    }

    if (nextBtn) {
      const isAnswered = answers[index] !== undefined;
      nextBtn.disabled = !isAnswered;
      nextBtn.textContent = (index === total - 1) ? 'Посмотреть результаты' : 'Следующий вопрос →';
    }

    // Render options
    optionsList.innerHTML = '';
    q.options.forEach((opt, optIdx) => {
      const isSelected = answers[index] === opt.type;
      const optBtn = document.createElement('div');
      optBtn.className = `quiz-option-card ${isSelected ? 'selected' : ''}`;
      optBtn.setAttribute('data-type', opt.type);
      optBtn.innerHTML = `
        <div class="quiz-option-radio"></div>
        <div class="quiz-option-text">${opt.text}</div>
      `;

      optBtn.addEventListener('click', () => {
        answers[index] = opt.type;
        document.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
        optBtn.classList.add('selected');
        if (nextBtn) nextBtn.disabled = false;

        // Auto-advance after small pleasant delay
        setTimeout(() => {
          handleNext();
        }, 300);
      });

      optionsList.appendChild(optBtn);
    });
  }

  function handleNext() {
    const total = testData.questions.length;
    if (currentStep < total - 1) {
      currentStep++;
      renderQuestion(currentStep);
    } else {
      showResults();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      currentStep--;
      renderQuestion(currentStep);
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', handleNext);
  if (prevBtn) prevBtn.addEventListener('click', handlePrev);

  function showResults() {
    if (questionBox) questionBox.style.display = 'none';
    if (resultBox) resultBox.classList.add('active');

    // Calculate score for each domain
    const scores = { human: 0, tech: 0, sign: 0, art: 0, nature: 0 };
    Object.values(answers).forEach(type => {
      if (scores[type] !== undefined) scores[type]++;
    });

    const totalAnswers = Object.keys(answers).length || 10;
    
    // Sort domains by highest score
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topType = sorted[0][0];
    const topProfile = testData.profiles[topType] || testData.profiles.human;

    // Fill in top result details
    const resultBadge = document.getElementById('resBadge');
    const resultTitle = document.getElementById('resTitle');
    const resultSummary = document.getElementById('resSummary');
    const resultTraitsList = document.getElementById('resTraitsList');
    const resultProfList = document.getElementById('resProfList');
    const resultTips = document.getElementById('resTips');
    const resultScoresContainer = document.getElementById('resBarsContainer');
    const testResultSummaryInput = document.getElementById('testResultSummaryInput');

    if (resultBadge) resultBadge.textContent = topProfile.badge;
    if (resultTitle) resultTitle.textContent = topProfile.title;
    if (resultSummary) resultSummary.textContent = topProfile.summary;
    if (resultTips) resultTips.textContent = topProfile.tips;

    if (resultTraitsList) {
      resultTraitsList.innerHTML = topProfile.traits.map(t => `<li>${t}</li>`).join('');
    }

    if (resultProfList) {
      resultProfList.innerHTML = topProfile.professions.map(p => `<span class="prof-tag">${p}</span>`).join('');
    }

    // Render percent progress bars
    const domainLabels = {
      human: 'Человек — Человек (коммуникации, люди)',
      tech: 'Человек — Техника (инженерия, разработка)',
      sign: 'Человек — Знаковая система (аналитика, цифры)',
      art: 'Человек — Художественный образ (творчество, дизайн)',
      nature: 'Человек — Природа (биология, экология)'
    };

    if (resultScoresContainer) {
      resultScoresContainer.innerHTML = sorted.map(([type, score]) => {
        const pct = Math.round((score / totalAnswers) * 100);
        return `
          <div class="result-bar-item">
            <div class="result-bar-header">
              <span>${domainLabels[type]}</span>
              <span><strong>${pct}%</strong> (${score} из ${totalAnswers})</span>
            </div>
            <div class="result-bar-track">
              <div class="result-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (testResultSummaryInput) {
      testResultSummaryInput.value = `Ведущий тип: ${topProfile.title} (${Math.round((sorted[0][1]/totalAnswers)*100)}%). ` +
        `Все баллы: Человек: ${scores.human}, Техника: ${scores.tech}, Знаки: ${scores.sign}, Арт: ${scores.art}, Природа: ${scores.nature}`;
    }

    // Smooth scroll to results
    testContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Retake button
  const retakeBtn = document.getElementById('quizRetakeBtn');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      if (resultBox) resultBox.classList.remove('active');
      if (questionBox) questionBox.style.display = 'block';
      initQuiz();
    });
  }
})();
