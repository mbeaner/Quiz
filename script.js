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
  const questionTextInput = document.getElementById('question-text');
  const optionsContainer = document.querySelector('.options-container');

  // Create confirmation message element
  const confirmationMessage = document.createElement('div');
  confirmationMessage.className = 'confirmation-message';
  document.body.appendChild(confirmationMessage);

  // Quiz data
  let questions = [];
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let currentQuizId = null;
  let currentlyEditingIndex = null;

  // Utility functions
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function getRandomizedQuestions(originalQuestions) {
    return shuffleArray(originalQuestions).map((question) => {
      const optionIndices = question.options.map((_, index) => index);
      const shuffledIndices = shuffleArray(optionIndices);
      const shuffledOptions = shuffledIndices.map((i) => question.options[i]);
      const newCorrectIndex = shuffledIndices.indexOf(question.correctAnswer);

      return {
        ...question,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
      };
    });
  }

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

  function getSavedQuizzes() {
    const savedQuizzes = localStorage.getItem('savedQuizzes');
    return savedQuizzes ? JSON.parse(savedQuizzes) : [];
  }

  function resetQuestionForm() {
    questionTextInput.value = '';
    optionsContainer.innerHTML = `
            <div class="option">
                <input type="radio" name="correct-option" value="0" checked>
                <input type="text" class="option-text" placeholder="Option 1">
            </div>
            <div class="option">
                <input type="radio" name="correct-option" value="1">
                <input type="text" class="option-text" placeholder="Option 2">
            </div>
        `;
    currentlyEditingIndex = null;
    addQuestionBtn.textContent = 'Add Question';
  }

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
                <div class="question-actions">
                    <button class="edit-question" data-index="${index}">Edit</button>
                    <button class="delete-question" data-index="${index}">Delete</button>
                </div>
            `;
      questionsContainer.appendChild(questionDiv);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-question').forEach((button) => {
      button.addEventListener('click', function () {
        editQuestion(parseInt(this.dataset.index));
      });
    });

    document.querySelectorAll('.delete-question').forEach((button) => {
      button.addEventListener('click', function () {
        deleteQuestion(parseInt(this.dataset.index));
      });
    });
  }

  function editQuestion(index) {
    const question = questions[index];
    questionTextInput.value = question.question;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Add options from the question
    question.options.forEach((option, i) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';
      optionDiv.innerHTML = `
                <input type="radio" name="correct-option" value="${i}" ${
        i === question.correctAnswer ? 'checked' : ''
      }>
                <input type="text" class="option-text" placeholder="Option ${
                  i + 1
                }" value="${option}">
            `;
      optionsContainer.appendChild(optionDiv);
    });

    currentlyEditingIndex = index;
    addQuestionBtn.textContent = 'Update Question';
  }

  function deleteQuestion(index) {
    if (confirm('Are you sure you want to delete this question?')) {
      questions.splice(index, 1);
      updateQuestionsList();
      showConfirmation('Question deleted');
      currentQuizId = null;

      if (questions.length === 0) {
        startQuizBtn.disabled = true;
      }
    }
  }

  function saveQuestion() {
    const questionText = questionTextInput.value.trim();
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

    // Update or add question
    if (currentlyEditingIndex !== null) {
      // Update existing question
      questions[currentlyEditingIndex] = {
        question: questionText,
        options: options,
        correctAnswer: correctAnswerIndex,
      };
      showConfirmation('Question updated');
    } else {
      // Add new question
      questions.push({
        question: questionText,
        options: options,
        correctAnswer: correctAnswerIndex,
      });
      showConfirmation('Question added');
    }

    resetQuestionForm();
    updateQuestionsList();
    startQuizBtn.disabled = false;
    currentQuizId = null;
  }

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

  function loadSelectedQuiz() {
    const quizId = quizSelector.value;
    if (!quizId) return;

    const quizzes = getSavedQuizzes();
    const selectedQuiz = quizzes.find((q) => q.id === quizId);

    if (selectedQuiz) {
      questions = selectedQuiz.questions;
      currentQuizId = selectedQuiz.id;
      resetQuestionForm();
      updateQuestionsList();
      startQuizBtn.disabled = false;
      showConfirmation(`Loaded "${selectedQuiz.name}"`);
    }
  }

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
      resetQuestionForm();
      updateQuestionsList();
      startQuizBtn.disabled = true;
    }

    showConfirmation('Quiz deleted');
  }

  function displayQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) return;

    const question = quizQuestions[currentQuestionIndex];
    quizContainer.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.innerHTML = `<h3>Question ${currentQuestionIndex + 1}/${
      quizQuestions.length
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
    nextQuestionBtn.disabled =
      currentQuestionIndex === quizQuestions.length - 1;
  }

  function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    displayQuestion();
  }

  // Event listeners
  addOptionBtn.addEventListener('click', function () {
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

  removeOptionBtn.addEventListener('click', function () {
    if (optionsContainer.children.length > 2) {
      optionsContainer.removeChild(optionsContainer.lastChild);
    } else {
      showConfirmation('Minimum 2 options required', true);
    }
  });

  addQuestionBtn.addEventListener('click', saveQuestion);

  startQuizBtn.addEventListener('click', function () {
    if (questions.length === 0) {
      showConfirmation('Please add at least one question', true);
      return;
    }

    const randomizedQuestions = getRandomizedQuestions(questions);
    userAnswers = new Array(randomizedQuestions.length).fill(null);
    quizQuestions = randomizedQuestions;

    builderSection.classList.remove('active');
    quizSection.classList.add('active');

    currentQuestionIndex = 0;
    displayQuestion();
  });

  prevQuestionBtn.addEventListener('click', function () {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  });

  nextQuestionBtn.addEventListener('click', function () {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    }
  });

  submitQuizBtn.addEventListener('click', function () {
    let score = 0;
    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score++;
      }
    });

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<h3>Quiz Results</h3>
                              <p>You scored ${score} out of ${
      quizQuestions.length
    } (${Math.round((score / quizQuestions.length) * 100)}%)</p>`;

    quizQuestions.forEach((q, index) => {
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

  backToBuilderBtn.addEventListener('click', function () {
    quizSection.classList.remove('active');
    builderSection.classList.add('active');
    resultsDiv.style.display = 'none';
  });

  saveQuizBtn.addEventListener('click', saveQuiz);
  loadQuizBtn.addEventListener('click', loadSelectedQuiz);
  deleteQuizBtn.addEventListener('click', deleteSelectedQuiz);

  // Initialize the app
  resetQuestionForm();
  updateQuizSelector();
  updateQuestionsList();
});

