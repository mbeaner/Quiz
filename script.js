document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const builderSection = document.querySelector('.builder-section');
  const quizSection = document.querySelector('.quiz-section');
  const addQuestionBtn = document.getElementById('add-question');
  const startQuizBtn = document.getElementById('start-quiz');
  const addOptionBtn = document.getElementById('add-option');
  const removeOptionBtn = document.getElementById('remove-option');
  const backToBuilderBtn = document.getElementById('back-to-builder');
  const prevQuestionBtn = document.getElementById('prev-question');
  const nextQuestionBtn = document.getElementById('next-question');
  const submitQuizBtn = document.getElementById('submit-quiz');
  const questionsContainer = document.getElementById('questions-container');
  const quizContainer = document.getElementById('quiz-container');
  const resultsDiv = document.getElementById('results');
  const saveQuizBtn = document.getElementById('save-quiz');
  const loadQuizBtn = document.getElementById('load-quiz');
  const deleteQuizBtn = document.getElementById('delete-quiz');
  const quizSelector = document.getElementById('quiz-selector');

  // Create confirmation message element
  const confirmationMessage = document.createElement('div');
  confirmationMessage.className = 'confirmation-message';
  document.body.appendChild(confirmationMessage);

  // Quiz data
  let questions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let currentQuizId = null;

  // Add option
  addOptionBtn.addEventListener('click', function () {
    const optionsContainer = document.querySelector('.options-container');
    const optionCount = optionsContainer.children.length;

    if (optionCount >= 6) {
      showConfirmation('Maximum 6 options allowed', true);
      return;
    }

    const newOption = document.createElement('div');
    newOption.className = 'option';
    newOption.innerHTML = `
            <input type="radio" name="correct-option" value="${optionCount}">
            <input type="text" class="option-text" placeholder="Option ${
              optionCount + 1
            }">
        `;
    optionsContainer.appendChild(newOption);
  });

  // Remove option
  removeOptionBtn.addEventListener('click', function () {
    const optionsContainer = document.querySelector('.options-container');
    if (optionsContainer.children.length > 2) {
      optionsContainer.removeChild(optionsContainer.lastChild);
    } else {
      showConfirmation('Minimum 2 options required', true);
    }
  });

  // Add question
  addQuestionBtn.addEventListener('click', function () {
    const questionText = document.getElementById('question-text').value.trim();
    const optionInputs = document.querySelectorAll('.option-text');

    if (!questionText) {
      showConfirmation('Please enter a question', true);
      return;
    }

    const options = [];
    let correctAnswerIndex = 0;

    optionInputs.forEach((input, index) => {
      const optionText = input.value.trim();
      if (!optionText) {
        showConfirmation(`Option ${index + 1} is empty`, true);
        return;
      }
      options.push(optionText);
    });

    // Get correct answer index
    const radioButtons = document.querySelectorAll(
      'input[name="correct-option"]'
    );
    radioButtons.forEach((radio, index) => {
      if (radio.checked) {
        correctAnswerIndex = index;
      }
    });

    // Add question to array
    questions.push({
      question: questionText,
      options: options,
      correctAnswer: correctAnswerIndex,
    });

    // Clear inputs
    document.getElementById('question-text').value = '';
    optionInputs.forEach((input) => (input.value = ''));
    document.querySelector('input[name="correct-option"]').checked = true;

    // Update questions list
    updateQuestionsList();

    // Enable start quiz button if we have at least one question
    if (questions.length > 0) {
      startQuizBtn.disabled = false;
    }

    // Clear current quiz ID since we're making changes
    currentQuizId = null;

    showConfirmation('Question added');
  });

  // Update questions list in builder
  function updateQuestionsList() {
    questionsContainer.innerHTML = '';

    if (questions.length === 0) {
      questionsContainer.innerHTML = '<p>No questions added yet</p>';
      return;
    }

    questions.forEach((q, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'question-item';
      questionDiv.innerHTML = `
                <p><strong>Q${index + 1}:</strong> ${q.question}</p>
                <p><strong>Correct Answer:</strong> ${
                  q.options[q.correctAnswer]
                }</p>
            `;
      questionsContainer.appendChild(questionDiv);
    });
  }

  // Start quiz
  startQuizBtn.addEventListener('click', function () {
    if (questions.length === 0) {
      showConfirmation('Please add at least one question', true);
      return;
    }

    // Initialize user answers array
    userAnswers = new Array(questions.length).fill(null);

    // Switch to quiz section
    builderSection.classList.remove('active');
    quizSection.classList.add('active');

    // Display first question
    currentQuestionIndex = 0;
    displayQuestion();
  });

  // Display current question in quiz
  function displayQuestion() {
    if (currentQuestionIndex >= questions.length) return;

    const question = questions[currentQuestionIndex];
    quizContainer.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.innerHTML = `<h3>Question ${currentQuestionIndex + 1}/${
      questions.length
    }</h3>
                               <p>${question.question}</p>`;

    const optionsDiv = document.createElement('div');
    question.options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'quiz-option';
      if (userAnswers[currentQuestionIndex] === index) {
        optionDiv.classList.add('selected');
      }
      optionDiv.textContent = option;
      optionDiv.dataset.index = index;
      optionDiv.addEventListener('click', function () {
        selectAnswer(index);
      });
      optionsDiv.appendChild(optionDiv);
    });

    questionDiv.appendChild(optionsDiv);
    quizContainer.appendChild(questionDiv);

    // Update navigation buttons
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
    nextQuestionBtn.disabled = currentQuestionIndex === questions.length - 1;
  }

  // Select answer in quiz
  function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    displayQuestion();
  }

  // Previous question
  prevQuestionBtn.addEventListener('click', function () {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  });

  // Next question
  nextQuestionBtn.addEventListener('click', function () {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    }
  });

  // Submit quiz
  submitQuizBtn.addEventListener('click', function () {
    // Calculate score
    let score = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score++;
      }
    });

    // Display results
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<h3>Quiz Results</h3>
                              <p>You scored ${score} out of ${
      questions.length
    } (${Math.round((score / questions.length) * 100)}%)</p>`;

    // Show correct answers
    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.correctAnswer;

      const resultItem = document.createElement('div');
      resultItem.innerHTML = `
                <p><strong>Q${index + 1}:</strong> ${q.question}</p>
                <p class="${
                  isCorrect ? 'correct' : 'incorrect'
                }">Your answer: ${
        userAnswer !== null ? q.options[userAnswer] : 'Not answered'
      }</p>
                <p>Correct answer: ${q.options[q.correctAnswer]}</p>
                <hr>
            `;
      resultsDiv.appendChild(resultItem);
    });
  });

  // Back to builder
  backToBuilderBtn.addEventListener('click', function () {
    quizSection.classList.remove('active');
    builderSection.classList.add('active');
    resultsDiv.style.display = 'none';
  });

  // Save quiz
  saveQuizBtn.addEventListener('click', saveQuiz);

  // Load quiz
  loadQuizBtn.addEventListener('click', loadSelectedQuiz);

  // Delete quiz
  deleteQuizBtn.addEventListener('click', deleteSelectedQuiz);

  // Show confirmation message
  function showConfirmation(message, isError = false) {
    confirmationMessage.textContent = message;
    confirmationMessage.classList.add('show');
    if (isError) {
      confirmationMessage.classList.add('error');
    } else {
      confirmationMessage.classList.remove('error');
    }
    setTimeout(() => {
      confirmationMessage.classList.remove('show');
    }, 2000);
  }

  // Update quiz selector dropdown
  function updateQuizSelector() {
    quizSelector.innerHTML = '';
    const quizzes = getSavedQuizzes();

    if (quizzes.length === 0) {
      quizSelector.innerHTML = '<option value="">No saved quizzes</option>';
      loadQuizBtn.disabled = true;
      deleteQuizBtn.disabled = true;
      return;
    }

    quizSelector.innerHTML = '<option value="">Select a quiz to load</option>';
    quizzes.forEach((quiz) => {
      const option = document.createElement('option');
      option.value = quiz.id;
      option.textContent = `${quiz.name} (${quiz.questions.length} questions)`;
      quizSelector.appendChild(option);
    });

    loadQuizBtn.disabled = false;
    deleteQuizBtn.disabled = false;
  }

  // Get all saved quizzes from localStorage
  function getSavedQuizzes() {
    const savedQuizzes = localStorage.getItem('savedQuizzes');
    return savedQuizzes ? JSON.parse(savedQuizzes) : [];
  }

  // Save current quiz to localStorage
  function saveQuiz() {
    if (questions.length === 0) {
      showConfirmation('Please add at least one question before saving', true);
      return;
    }

    const quizName = prompt('Enter a name for this quiz:');
    if (!quizName) return;

    const quizzes = getSavedQuizzes();
    const quizId = currentQuizId || Date.now().toString();

    // Remove existing quiz if we're updating it
    const existingQuizIndex = quizzes.findIndex((q) => q.id === quizId);
    if (existingQuizIndex !== -1) {
      quizzes.splice(existingQuizIndex, 1);
    }

    quizzes.push({
      id: quizId,
      name: quizName,
      questions: questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    localStorage.setItem('savedQuizzes', JSON.stringify(quizzes));
    showConfirmation(
      quizId === currentQuizId ? 'Quiz updated!' : 'Quiz saved!'
    );
    currentQuizId = quizId;
    updateQuizSelector();
  }

  // Load selected quiz from localStorage
  function loadSelectedQuiz() {
    const quizId = quizSelector.value;
    if (!quizId) return;

    const quizzes = getSavedQuizzes();
    const selectedQuiz = quizzes.find((q) => q.id === quizId);

    if (selectedQuiz) {
      questions = selectedQuiz.questions;
      currentQuizId = selectedQuiz.id;
      updateQuestionsList();
      startQuizBtn.disabled = false;
      showConfirmation(`Loaded "${selectedQuiz.name}"`);
    }
  }

  // Delete selected quiz from localStorage
  function deleteSelectedQuiz() {
    const quizId = quizSelector.value;
    if (!quizId) return;

    if (!confirm('Are you sure you want to delete this quiz?')) return;

    const quizzes = getSavedQuizzes().filter((q) => q.id !== quizId);
    localStorage.setItem('savedQuizzes', JSON.stringify(quizzes));
    updateQuizSelector();

    // If we deleted the currently loaded quiz, reset the builder
    if (currentQuizId === quizId) {
      questions = [];
      currentQuizId = null;
      updateQuestionsList();
      startQuizBtn.disabled = true;
    }

    showConfirmation('Quiz deleted');
  }

  // Initialize the app
  updateQuizSelector();
  updateQuestionsList();
});
