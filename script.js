let quizData = {}; // Global variable to store all quiz data
let currentSheetQuestions = []; // Stores questions for the currently loaded sheet/exam
let currentMode = 'solve'; // 'solve' or 'answers'

// Function to fetch quiz data from JSON file
async function fetchQuizData() {
    if (Object.keys(quizData).length === 0) { // Fetch only if not already loaded
        try {
            const response = await fetch('data/questions.json');
            quizData = await response.json();
            console.log('Quiz Data Loaded:', quizData);
        } catch (error) {
            console.error('Error fetching quiz data:', error);
            alert('حدث خطأ أثناء تحميل بيانات الاختبار. يرجى المحاولة مرة أخرى لاحقاً.');
        }
    }
}

// --- Home Page Functions (index.html) ---

async function loadSheetsList() {
    await fetchQuizData();
    const sheetsListDiv = document.getElementById('sheets-list');
    if (!sheetsListDiv) return;

    sheetsListDiv.innerHTML = ''; // Clear previous content

    quizData.sheets.forEach(sheet => {
        const sheetCard = document.createElement('div');
        sheetCard.classList.add('sheet-card');
        sheetCard.innerHTML = `
            <h3>${sheet.name} - ${sheet.tutorial_name}</h3>
            <a href="sheet_quiz.html?sheet=${encodeURIComponent(sheet.name)}" class="btn btn-primary">ابدأ الاختبار</a>
            <a href="sheet_quiz.html?sheet=${encodeURIComponent(sheet.name)}&mode=answers" class="btn btn-secondary">عرض الإجابات</a>
        `;
        sheetsListDiv.appendChild(sheetCard);
    });
}

// --- Individual Sheet Quiz Functions (sheet_quiz.html) ---

async function loadSheetForQuiz(sheetName) {
    await fetchQuizData();
    const sheet = quizData.sheets.find(s => s.name === sheetName);

    if (!sheet) {
        alert('الشيت المطلوب غير موجود!');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('sheet-title').textContent = `${sheet.name} - ${sheet.tutorial_name}`;
    document.getElementById('quiz-header').textContent = `${sheet.name} - ${sheet.tutorial_name}`;
    currentSheetQuestions = sheet.questions;

    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'answers') {
        currentMode = 'answers';
        document.getElementById('solve-mode-btn').classList.remove('active');
        document.getElementById('view-answers-mode-btn').classList.add('active');
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('answers-section').style.display = 'block';
        displayCorrectAnswers(currentSheetQuestions, 'correct-answers-display');
    } else {
        currentMode = 'solve';
        document.getElementById('solve-mode-btn').classList.add('active');
        document.getElementById('view-answers-mode-btn').classList.remove('active');
        document.getElementById('quiz-section').style.display = 'block';
        document.getElementById('answers-section').style.display = 'none';
        displayQuestions(currentSheetQuestions, 'quiz-form', 'sheet');
    }
}

function toggleMode(mode) {
    if (currentMode === mode) return; // No change if already in this mode

    currentMode = mode;
    const solveBtn = document.getElementById('solve-mode-btn');
    const viewAnswersBtn = document.getElementById('view-answers-mode-btn');
    const quizSection = document.getElementById('quiz-section');
    const resultsSection = document.getElementById('results-section');
    const answersSection = document.getElementById('answers-section');

    if (mode === 'solve') {
        solveBtn.classList.add('active');
        viewAnswersBtn.classList.remove('active');
        quizSection.style.display = 'block';
        resultsSection.style.display = 'none';
        answersSection.style.display = 'none';
        displayQuestions(currentSheetQuestions, 'quiz-form', 'sheet'); // Re-render for solve mode
    } else if (mode === 'answers') {
        solveBtn.classList.remove('active');
        viewAnswersBtn.classList.add('active');
        quizSection.style.display = 'none';
        resultsSection.style.display = 'none';
        answersSection.style.display = 'block';
        displayCorrectAnswers(currentSheetQuestions, 'correct-answers-display');
    }
}


function displayQuestions(questions, formId, quizType) {
    const quizForm = document.getElementById(formId);
    quizForm.innerHTML = ''; // Clear previous questions

    questions.forEach((q, index) => {
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');

        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `${index + 1}. ${q.question_text}`;
        questionItem.appendChild(questionText);

        const optionsGroup = document.createElement('div');
        optionsGroup.classList.add('options-group');

        if (q.type === 'multiple_choice') {
            for (const optionKey in q.options) {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `${quizType}-question-${q.id}`;
                input.value = optionKey;
                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${optionKey}. ${q.options[optionKey]}`));
                optionsGroup.appendChild(label);
            }
        } else if (q.type === 'true_false') {
            optionsGroup.classList.add('true-false-options');
            const trueLabel = document.createElement('label');
            const trueInput = document.createElement('input');
            trueInput.type = 'radio';
            trueInput.name = `${quizType}-question-${q.id}`;
            trueInput.value = 'True';
            trueLabel.appendChild(trueInput);
            trueLabel.appendChild(document.createTextNode('صحيح'));
            optionsGroup.appendChild(trueLabel);

            const falseLabel = document.createElement('label');
            const falseInput = document.createElement('input');
            falseInput.type = 'radio';
            falseInput.name = `${quizType}-question-${q.id}`;
            falseInput.value = 'False';
            falseLabel.appendChild(falseInput);
            falseLabel.appendChild(document.createTextNode('خطأ'));
            optionsGroup.appendChild(falseLabel);
        }
        questionItem.appendChild(optionsGroup);
        quizForm.appendChild(questionItem);
    });
}

function submitQuiz() {
    const form = document.getElementById('quiz-form');
    const userAnswers = {};
    currentSheetQuestions.forEach(q => {
        const selectedOption = form.querySelector(`input[name="sheet-question-${q.id}"]:checked`);
        if (selectedOption) {
            userAnswers[q.id] = selectedOption.value;
        } else {
            userAnswers[q.id] = null; // No answer selected
        }
    });

    displayResults(currentSheetQuestions, userAnswers, 'results-section', 'score-display', 'review-section');
    document.getElementById('quiz-section').style.display = 'none';
}

function displayResults(questions, userAnswers, resultsSectionId, scoreDisplayId, reviewSectionId) {
    const resultsSection = document.getElementById(resultsSectionId);
    const scoreDisplay = document.getElementById(scoreDisplayId);
    const reviewSection = document.getElementById(reviewSectionId);

    let correctCount = 0;
    reviewSection.innerHTML = ''; // Clear previous review

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = (userAnswer === String(q.correct_answer)); // Ensure string comparison

        if (isCorrect) {
            correctCount++;
        }

        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');
        reviewItem.innerHTML = `
            <p class="question-text">${index + 1}. ${q.question_text}</p>
            <p class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                إجابتك: ${userAnswer !== null ? (q.type === 'true_false' ? (userAnswer === 'True' ? 'صحيح' : 'خطأ') : userAnswer) : 'لم تجب'}
            </p>
            <p class="correct-answer">
                الإجابة الصحيحة: ${q.type === 'true_false' ? (q.correct_answer === 'True' ? 'صحيح' : 'خطأ') : q.correct_answer}
            </p>
        `;
        reviewSection.appendChild(reviewItem);
    });

    scoreDisplay.textContent = `${correctCount} من ${questions.length}`;
    resultsSection.style.display = 'block';
    // Push quiz result to dataLayer for GTM
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'quizSubmitted',
            correctAnswers: correctCount,
            totalQuestions: questions.length
        });
}

function displayCorrectAnswers(questions, displayElementId) {
    const displayElement = document.getElementById(displayElementId);
    displayElement.innerHTML = ''; // Clear previous answers

    questions.forEach((q, index) => {
        const answerItem = document.createElement('div');
        answerItem.classList.add('answer-item');

        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `${index + 1}. ${q.question_text}`;
        answerItem.appendChild(questionText);

        const correctAnswerText = document.createElement('p');
        correctAnswerText.classList.add('correct-solution');

        let answerContent;
        if (q.type === 'multiple_choice') {
            answerContent = `${q.correct_answer}. ${q.options[q.correct_answer]}`;
        } else if (q.type === 'true_false') {
            answerContent = q.correct_answer === 'True' ? 'صحيح' : 'خطأ';
        }
        correctAnswerText.textContent = `الإجابة الصحيحة: ${answerContent}`;
        answerItem.appendChild(correctAnswerText);
        displayElement.appendChild(answerItem);
        
    });
}


// --- Random Exam Functions (random_exam.html) ---

async function loadRandomExam() {
    await fetchQuizData();
    const allQuestions = [];
    quizData.sheets.forEach(sheet => {
        allQuestions.push(...sheet.questions);
    });

    // Shuffle all questions
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]]; // Swap
    }

    // Select first 40 questions
    currentSheetQuestions = allQuestions.slice(0, 40);

    displayQuestions(currentSheetQuestions, 'random-quiz-form', 'random-exam');
}

function submitRandomQuiz() {
    const form = document.getElementById('random-quiz-form');
    const userAnswers = {};
    currentSheetQuestions.forEach(q => {
        const selectedOption = form.querySelector(`input[name="random-exam-question-${q.id}"]:checked`);
        if (selectedOption) {
            userAnswers[q.id] = selectedOption.value;
        } else {
            userAnswers[q.id] = null; // No answer selected
        }
    });

    displayResults(currentSheetQuestions, userAnswers, 'results-section', 'score-display', 'review-section');
    document.getElementById('quiz-section').style.display = 'none';
}
