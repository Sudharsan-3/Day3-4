interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
}

const questions: Question[] = [
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Machine Learning", "Hyperlink Text Markup Language", "Hyper Text Managing Language"], correctAnswer: "Hyper Text Markup Language" },
    { question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswer: "Paris" },
    { question: "Which programming language is used for web development?", options: ["Python", "Java", "C++", "JavaScript"], correctAnswer: "JavaScript" },
    { question: "Which symbol is used for comments in JavaScript?", options: ["//", "/* */", "#", "--"], correctAnswer: "//" },
    { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style System", "Creative Style Sheet", "Cascading System Sheets"], correctAnswer: "Cascading Style Sheets" }
];

let currentQuestionIndex: number = 0;
let score: number = 0;
let timer: number | undefined;
let timeLeft: number = 0;
let difficulty: string = "easy";

// Start Quiz & Store Difficulty
function startQuiz(): void {
    const selectedDifficulty = (document.querySelector('input[name="choice"]:checked') as HTMLInputElement)?.value;
    if (!selectedDifficulty) {
        alert("Please select a difficulty level.");
        return;
    }
    difficulty = selectedDifficulty;
    localStorage.setItem("difficulty", difficulty);
    localStorage.setItem("currentQuestionIndex", "0");
    localStorage.setItem("score", "0");
    window.location.href = "./src/pages/questions.html";
}

// Load Question & Manage Timer
function loadQuestion(): void {
    const questionText = document.getElementById("question-text") as HTMLHeadingElement;
    const optionsContainer = document.getElementById("options-container") as HTMLElement;
    const progress = document.getElementById("progress") as HTMLProgressElement;
    if (!questionText || !optionsContainer || !progress) return;

    currentQuestionIndex = parseInt(localStorage.getItem("currentQuestionIndex") || "0", 10);
    score = parseInt(localStorage.getItem("score") || "0", 10);
    difficulty = localStorage.getItem("difficulty") || "easy";

    if (currentQuestionIndex >= questions.length) {
        endQuiz();
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    questionText.textContent = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
    
    optionsContainer.innerHTML = "";
    currentQuestion.options.forEach((option) => {
        const optionElement = document.createElement("label");
        optionElement.classList.add("flex", "items-center", "gap-2", "cursor-pointer");
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quiz-option";
        radio.value = option;
        radio.classList.add("option-radio");
        
        optionElement.appendChild(radio);
        optionElement.appendChild(document.createTextNode(option));
        optionsContainer.appendChild(optionElement);
    });

    progress.value = ((currentQuestionIndex + 1) / questions.length) * 100;
    startTimer();
}

// Start Timer Based on Difficulty
function startTimer(): void {
    const timerElement = document.getElementById("timer") as HTMLParagraphElement;
    clearInterval(timer);

    timeLeft = difficulty === "easy" ? 15 * 60 : difficulty === "medium" ? 60 : 45;

    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleAutoNext();
        } else {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            }
        }
    }, 1000) as unknown as number;
}

function handleAutoNext(): void {
    if (difficulty === "medium" || difficulty === "hard") {
        // Save empty answer if user didn't select any option
        const selectedOption = document.querySelector<HTMLInputElement>(".option-radio:checked");
        localStorage.setItem(`answer_${currentQuestionIndex}`, selectedOption ? selectedOption.value : "No Answer");
        
        // Proceed to next question
        currentQuestionIndex++;
        localStorage.setItem("currentQuestionIndex", currentQuestionIndex.toString());

        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            endQuiz();
        }
    }
}

// Move to Next Question
function nextQuestion(): void {
    const selectedOption = document.querySelector<HTMLInputElement>(".option-radio:checked");
    if (!selectedOption) {
        alert("Please select an answer before proceeding!");
        return;
    }

    // Store the user's selected answer
    localStorage.setItem(`answer_${currentQuestionIndex}`, selectedOption.value);

    if (selectedOption.value === questions[currentQuestionIndex].correctAnswer) {
        score++;
        localStorage.setItem("score", score.toString());
    }

    currentQuestionIndex++;
    localStorage.setItem("currentQuestionIndex", currentQuestionIndex.toString());

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}


// End Quiz
function endQuiz(): void {
    clearInterval(timer);
    localStorage.setItem("finalScore", score.toString());
    window.location.href = "../pages/result.html";
}

// Restart Quiz
function restartQuiz(): void {
    localStorage.clear();
    window.location.href = "../../index.html"; 
}


document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("startButton")?.addEventListener("click", startQuiz);
    document.getElementById("next")?.addEventListener("click", nextQuestion);
    document.getElementById("restart")?.addEventListener("click", restartQuiz);

    if (window.location.pathname.includes("questions.html")) {
        loadQuestion();
    }
    if (window.location.pathname.includes("result.html")) {
        showResults();
    }
});

function showResults(): void {
    const resultMessage = document.getElementById("result-message") as HTMLHeadingElement;
    const resultChartCanvas = document.getElementById("resultChart") as HTMLCanvasElement;
    const wrongAnswersList = document.getElementById("wrong-answers") as HTMLUListElement;

    if (!resultMessage || !resultChartCanvas || !wrongAnswersList) return;

    const finalScore = parseInt(localStorage.getItem("finalScore") || "0", 10);
    const totalQuestions = questions.length;
    const incorrect = totalQuestions - finalScore;

    resultMessage.textContent = `You answered ${finalScore} correctly and ${incorrect} incorrectly!`;

   
    wrongAnswersList.innerHTML = "";

    
    questions.forEach((q, index) => {
        const userAnswer = localStorage.getItem(`answer_${index}`);
        const listItem = document.createElement("li");

        listItem.innerHTML = `<strong>${index + 1}. ${q.question}</strong><br>
                              Your Answer: <span>${userAnswer || "No Answer"}</span><br>
                              Correct Answer: <span>${q.correctAnswer}</span>`;

        listItem.classList.add("p-2", "rounded", "text-sm");

        
        if (userAnswer === q.correctAnswer) {
            listItem.classList.add("bg-green-200", "text-green-700"); 
        } else {
            listItem.classList.add("bg-red-200", "text-red-700"); 
        }

        wrongAnswersList.appendChild(listItem);
    });


    const ctx = resultChartCanvas.getContext("2d");
    if (ctx) {
        new Chart(ctx, {
            type: "pie",
            data: {
                labels: ["Correct", "Incorrect"],
                datasets: [{
                    data: [finalScore, incorrect],
                    backgroundColor: ["#36A2EB", "#FF6384"]
                }]
            }
        });
    }
}



