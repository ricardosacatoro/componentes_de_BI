"use strict";

const questions = [
  {
    prompt: "¿Qué transforma la Inteligencia de Negocios según el artículo?",
    options: ["Datos → Información → Conocimiento", "Conocimiento → Datos → Información", "Información → Conocimiento → Datos", "Datos → Conocimiento → Información"],
    answer: 0,
    explanation: "El artículo presenta la transformación de los datos en información y luego en conocimiento."
  },
  {
    prompt: "¿Cuántos componentes principales componen la Inteligencia de Negocios?",
    options: ["3", "4", "5", "6"],
    answer: 2,
    explanation: "Se describen cinco componentes, desde las fuentes de información hasta su visualización."
  },
  {
    prompt: "¿Cuál de estas NO es una perspectiva del Cuadro de Mando Integral?",
    options: ["Perspectiva Financiera", "Perspectiva del Cliente", "Perspectiva de Marketing", "Perspectiva de Aprendizaje"],
    answer: 2,
    explanation: "Las perspectivas enumeradas son Financiera, Cliente, Interna y Aprendizaje."
  },
  {
    prompt: "¿Qué es un Data Mart?",
    options: ["Un almacén de datos de toda la empresa", "Datos almacenados de un área específica de la empresa", "Una herramienta de visualización", "Un tipo de KPI"],
    answer: 1,
    explanation: "Un Data Mart almacena datos enfocados en un área específica."
  },
  {
    prompt: "¿Cuántos registros como máximo permite trabajar Excel según el artículo?",
    options: ["10.000", "15.000", "20.000", "50.000"],
    answer: 1,
    explanation: "La comparativa del artículo atribuye a Excel un límite de 15.000 registros."
  },
  {
    prompt: "¿Qué herramienta funciona en la nube y requiere una suscripción de pago?",
    options: ["Excel", "Power BI (versión completa)", "Qlik Sense", "Ninguna de las anteriores"],
    answer: 2,
    explanation: "Qlik Sense se describe como una aplicación en la nube que requiere suscripción."
  },
  {
    prompt: "¿Qué significa ERP?",
    options: ["Enterprise Resource Planning", "Electronic Resource Process", "Enterprise Report Platform", "External Resource Planning"],
    answer: 0,
    explanation: "ERP corresponde a Enterprise Resource Planning."
  },
  {
    prompt: "¿Cuál es una característica del Datawarehouse?",
    options: ["Es volátil: los datos se modifican constantemente", "Es no volátil: los datos se leen, pero no se modifican", "Solo almacena datos actuales", "No permite integrar datos"],
    answer: 1,
    explanation: "El almacén es no volátil: los datos se consultan, pero no se modifican."
  },
  {
    prompt: "¿Qué herramienta es gratuita y permite trabajar hasta con 15.000 registros, según el artículo?",
    options: ["Power BI", "Qlik Sense", "Excel", "Tableau"],
    answer: 2,
    explanation: "En la comparativa, Excel se presenta como opción gratuita con ese límite de registros."
  },
  {
    prompt: "¿Qué deben hacer las microempresas para generar ventaja competitiva?",
    options: ["Solo almacenar datos sin analizarlos", "Incorporar mecanismos tecnológicos para analizar datos y generar conocimiento", "Contratar grandes consultoras", "Evitar el uso de tecnología"],
    answer: 1,
    explanation: "La conclusión propone analizar datos con mecanismos tecnológicos para generar conocimiento y decidir mejor."
  }
];

const completedKey = "quizCompleted";
const scoreKey = "quizScore";
const sessionKey = "biQuizSession";
const stateKey = "biQuizState";
const durationSeconds = 10 * 60;

const form = document.querySelector("#quiz-form");
const questionContainer = document.querySelector("#questions");
const timerElement = document.querySelector("#timer");
const timerPanel = document.querySelector("#timer-panel");
const alreadyCompletedPanel = document.querySelector("#already-completed");
const resultsPanel = document.querySelector("#results");

let remainingSeconds = durationSeconds;
let timerInterval = null;
let submitted = false;

// localStorage pertenece al navegador y al origen, no a un servidor compartido: otros navegadores o dispositivos pueden hacer el quiz en paralelo sin mezclar resultados. sessionStorage mantiene el borrador por pestaña; en un mismo navegador el bloqueo de intento es compartido.
function getSessionId() {
  let sessionId = sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  return sessionId;
}

const sessionId = getSessionId();
const scopedStateKey = `${stateKey}:${sessionId}`;

function readState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(scopedStateKey) || "null");
    if (state && Array.isArray(state.answers) && Number.isFinite(state.remainingSeconds)) return state;
  } catch {
    sessionStorage.removeItem(scopedStateKey);
  }
  return { answers: Array(questions.length).fill(null), remainingSeconds: durationSeconds };
}

let quizState = readState();
remainingSeconds = Math.max(0, Math.min(durationSeconds, quizState.remainingSeconds));

function saveState() {
  quizState.remainingSeconds = remainingSeconds;
  sessionStorage.setItem(scopedStateKey, JSON.stringify(quizState));
}

function renderQuestions() {
  questionContainer.replaceChildren();
  questions.forEach((question, questionIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question-card";
    fieldset.setAttribute("aria-labelledby", `question-title-${questionIndex}`);

    const legend = document.createElement("legend");
    legend.id = `question-title-${questionIndex}`;
    legend.className = "question-title";
    const number = document.createElement("span");
    number.className = "question-number";
    number.textContent = String(questionIndex + 1).padStart(2, "0");
    const prompt = document.createElement("span");
    prompt.textContent = question.prompt;
    legend.append(number, prompt);
    fieldset.append(legend);

    const optionList = document.createElement("div");
    optionList.className = "option-list";
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "option-label";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${questionIndex}`;
      input.value = String(optionIndex);
      input.checked = quizState.answers[questionIndex] === optionIndex;
      input.addEventListener("change", () => {
        quizState.answers[questionIndex] = optionIndex;
        saveState();
        updateProgress();
      });
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      optionList.append(label);
    });
    fieldset.append(optionList);
    questionContainer.append(fieldset);
  });
  updateProgress();
}

function updateProgress() {
  const answered = quizState.answers.filter((answer) => answer !== null).length;
  document.querySelector("#progress-text").textContent = `${answered} de ${questions.length} respondidas`;
  const progress = document.querySelector(".progress-track");
  progress.setAttribute("aria-valuenow", String(answered));
  document.querySelector("#progress-fill").style.width = `${(answered / questions.length) * 100}%`;
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timerElement.textContent = time;
  timerPanel.setAttribute("aria-label", `Tiempo restante: ${minutes} minutos y ${seconds} segundos`);
  timerPanel.classList.toggle("is-low", remainingSeconds <= 60);
}

function pauseTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
    saveState();
  }
}

// El reloj se detiene al ocultar la pestaña y continúa al volver, como se solicita; el tiempo restante también sobrevive a una actualización de la página.
function startTimer() {
  if (submitted || document.hidden || timerInterval !== null) return;
  timerInterval = window.setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    updateTimerDisplay();
    saveState();
    if (remainingSeconds === 0) finishQuiz();
  }, 1000);
}

function buildReview(score) {
  const review = document.querySelector("#answer-review");
  review.replaceChildren();
  questions.forEach((question, questionIndex) => {
    const selectedAnswer = quizState.answers[questionIndex];
    const isCorrect = selectedAnswer === question.answer;
    const item = document.createElement("li");
    item.className = `review-item ${isCorrect ? "correct" : "incorrect"}`;
    const prompt = document.createElement("p");
    prompt.className = "review-question";
    prompt.textContent = `${questionIndex + 1}. ${question.prompt}`;
    const yourAnswer = document.createElement("p");
    yourAnswer.className = "review-answer";
    const yourAnswerLabel = document.createElement("strong");
    yourAnswerLabel.textContent = isCorrect ? "Correcta: " : "Tu respuesta: ";
    yourAnswer.append(yourAnswerLabel, document.createTextNode(selectedAnswer === null ? "Sin responder" : question.options[selectedAnswer]));
    const correctAnswer = document.createElement("p");
    correctAnswer.className = "review-answer";
    const correctLabel = document.createElement("strong");
    correctLabel.textContent = "Respuesta correcta: ";
    correctAnswer.append(correctLabel, document.createTextNode(question.options[question.answer]));
    const explanation = document.createElement("p");
    explanation.className = "review-explanation";
    explanation.textContent = question.explanation;
    item.append(prompt, yourAnswer, correctAnswer, explanation);
    review.append(item);
  });
  document.querySelector("#final-score").textContent = `${score}/${questions.length}`;
  const message = document.querySelector("#result-message");
  message.textContent = score >= 7 ? "¡Aprobado! Has comprendido el artículo" : "Repasa el artículo y vuelve a intentarlo en otra sesión";
  message.classList.toggle("needs-review", score < 7);
}

// La puntuación se calcula comparando cada opción guardada con su índice correcto; el resultado se fija en localStorage para bloquear otro intento en este navegador.
function finishQuiz() {
  if (submitted) return;
  submitted = true;
  pauseTimer();
  const score = questions.reduce((total, question, index) => total + (quizState.answers[index] === question.answer ? 1 : 0), 0);
  localStorage.setItem(scoreKey, String(score));
  localStorage.setItem(completedKey, "true");
  sessionStorage.removeItem(scopedStateKey);
  form.hidden = true;
  alreadyCompletedPanel.hidden = true;
  resultsPanel.hidden = false;
  buildReview(score);
  document.querySelector("#timer-panel").setAttribute("aria-label", "Evaluación finalizada");
  document.querySelector("#results-title").focus?.();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showCompletedState() {
  submitted = true;
  pauseTimer();
  form.hidden = true;
  resultsPanel.hidden = true;
  alreadyCompletedPanel.hidden = false;
  const savedScore = localStorage.getItem(scoreKey);
  document.querySelector("#saved-score").textContent = `${savedScore ?? "0"}/${questions.length}`;
  document.querySelector("#timer-panel").hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  finishQuiz();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseTimer();
  else startTimer();
});

// Otra pestaña del mismo navegador comparte localStorage; al detectar su envío, se bloquea también este formulario.
window.addEventListener("storage", (event) => {
  if (event.key === completedKey && event.newValue === "true") showCompletedState();
});

if (localStorage.getItem(completedKey) === "true") {
  showCompletedState();
} else {
  renderQuestions();
  updateTimerDisplay();
  if (remainingSeconds === 0) finishQuiz();
  else startTimer();
}