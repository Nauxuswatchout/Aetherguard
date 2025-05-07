let messages = [];
let currentIndex = 0;
let score = 0;

async function fetchMessages() {
  try {
    const response = await fetch("/random_records/phishing_data");
    messages = await response.json();
    currentIndex = 0;
    score = 0;
    document.getElementById("score-board").textContent = `Score: 0 / 0`;
    showNextMessage();
  } catch (err) {
    document.getElementById("game-message").textContent = "Failed to load messages.";
    console.error(err);
  }
}

function showNextMessage() {
  if (currentIndex < messages.length) {
    const msg = messages[currentIndex].message;
    document.getElementById("game-message").textContent = msg;
    document.getElementById("feedback").textContent = "";
  } else {
    document.getElementById("game-message").textContent = "🎉 Game Over! Well done!";
    document.querySelector(".game-buttons").style.display = "none";
  }
}

function checkAnswer(userAnswer) {
  const actualAnswer = messages[currentIndex].category;
  if (userAnswer === actualAnswer) {
    score++;
    document.getElementById("feedback").textContent = "✅ Correct!";
  } else {
    document.getElementById("feedback").textContent = "❌ Oops! That was " + actualAnswer.toUpperCase();
  }

  currentIndex++;
  document.getElementById("score-board").textContent = `Score: ${score} / ${currentIndex}`;
  setTimeout(showNextMessage, 1000);
}

window.onload = fetchMessages;