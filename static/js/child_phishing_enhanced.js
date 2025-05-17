// Enhanced Phishing Page JS - Add animations and interactive effects

// Set flag to indicate enhanced JS is loading
window.enhancedJSLoaded = true;

// Global variables to track effect containers
let confettiContainer = null;
let celebrationElement = null;

document.addEventListener('DOMContentLoaded', () => {
  // Add page load animation
  animatePageLoad();
  
  // Initialize phishing game
  initPhishingGame();
  
  // Add card animation effects
  animateCards();
  
  // Add background elements
  addBackgroundElements();
  
  // Add title letter animation
  animateHeadingLetters();
});

// Page load animation
function animatePageLoad() {
  const cards = document.querySelectorAll('.cyber-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 200 + (index * 150));
  });
  
  // Add title animation
  const title = document.querySelector('.cyber-cover-title');
  if (title) {
    title.style.opacity = '0';
    title.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      title.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      title.style.opacity = '1';
      title.style.transform = 'scale(1)';
    }, 300);
  }
}

// Helper to check if character is emoji or special character
function isEmojiOrSpecial(char) {
  // Check for emoji (Unicode ranges)
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(char)) return true;
  
  // Check for special characters (punctuation, symbols, etc.)
  if (/[^\w\s]/.test(char)) return true;
  
  return false;
}

// Add title letter animation
function animateHeadingLetters() {
  // Process main title
  const mainTitle = document.querySelector('.cyber-cover-title h3');
  if (mainTitle) {
    const text = mainTitle.textContent;
    mainTitle.innerHTML = '';
    
    // Split text and add span tags to each letter
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.style.setProperty('--letter-index', i);
      
      // Special handling for spaces and special characters
      if (text[i] === ' ' || isEmojiOrSpecial(text[i])) {
        span.classList.add('emoji');
        span.style.display = 'inline-block';
        span.style.width = text[i] === ' ' ? '0.5em' : 'auto';
      }
      
      mainTitle.appendChild(span);
    }
  }
  
  // Process all card titles
  const cardTitles = document.querySelectorAll('.cyber-card h2');
  cardTitles.forEach(title => {
    const originalText = title.textContent;
    title.innerHTML = '';
    
    // First, check if the title starts with an emoji and handle it separately
    let text = originalText;
    const firstCharIsEmoji = isEmojiOrSpecial(originalText.charAt(0));
    
    if (firstCharIsEmoji) {
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = originalText.charAt(0);
      emojiSpan.classList.add('emoji');
      title.appendChild(emojiSpan);
      text = originalText.substring(1);
    }
    
    // Then process the rest of the characters
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.classList.add('card-title-letter');
      span.style.setProperty('--letter-index', i);
      span.style.transition = 'transform 0.2s ease-in-out';
      
      // Special handling for spaces and special characters
      if (text[i] === ' ' || isEmojiOrSpecial(text[i])) {
        span.classList.add('emoji');
        span.style.display = 'inline-block';
        span.style.width = text[i] === ' ' ? '0.5em' : 'auto';
      }
      
      // Add mouse hover event
      span.addEventListener('mouseenter', () => {
        if (!span.classList.contains('emoji') && text[i] !== ' ') {
          span.style.transform = 'translateY(-5px) scale(1.2)';
          span.style.display = 'inline-block';
        }
      });
      
      span.addEventListener('mouseleave', () => {
        if (!span.classList.contains('emoji') && text[i] !== ' ') {
          span.style.transform = 'translateY(0) scale(1)';
        }
      });
      
      title.appendChild(span);
    }
  });
}

// Add card animation effects
function animateCards() {
  // Add bounce effect to titles
  const titles = document.querySelectorAll('.cyber-card h2');
  titles.forEach(title => {
    title.addEventListener('mouseenter', () => {
      title.style.animation = 'bounce 0.5s';
      setTimeout(() => {
        title.style.animation = '';
      }, 500);
    });
  });
  
  // Add hover effects to list items
  const listItems = document.querySelectorAll('.cyber-card li');
  listItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateX(10px)';
      item.style.color = '#ff69b4';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateX(0)';
      item.style.color = '';
    });
  });
}

// Enhanced phishing game logic
function initPhishingGame() {
  let messages = [];
  let currentIndex = 0;
  let score = 0;
  
  const gameBox = document.getElementById('game-box');
  if (!gameBox) return;
  
  // Enhance game UI
  gameBox.style.backgroundColor = '#f8f9ff';
  gameBox.style.borderRadius = '20px';
  gameBox.style.padding = '20px';
  gameBox.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
  
  // Style game message
  const gameMessage = document.getElementById('game-message');
  if (gameMessage) {
    gameMessage.style.fontSize = '1.2em';
    gameMessage.style.fontWeight = 'bold';
    gameMessage.style.padding = '15px';
    gameMessage.style.backgroundColor = 'rgba(255,255,255,0.8)';
    gameMessage.style.borderRadius = '12px';
    gameMessage.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
    gameMessage.style.transition = 'all 0.3s ease';
  }
  
  // Style game buttons
  const buttons = document.querySelectorAll('.game-buttons button');
  buttons.forEach(button => {
    button.style.background = 'linear-gradient(45deg, #ff69b4, #6a5acd)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50px';
    button.style.padding = '12px 25px';
    button.style.fontSize = '1.2em';
    button.style.fontWeight = 'bold';
    button.style.margin = '0 10px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.3s ease';
    button.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    button.style.fontFamily = "'Balsamiq Sans', cursive";
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px)';
      button.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
      playSound('buttonHover');
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(2px)';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-3px)';
      button.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
    });
  });
  
  // Enhanced fetch messages function
  async function enhancedFetchMessages() {
    try {
      const response = await fetch("/random_records/phishing_data");
      messages = await response.json();
      currentIndex = 0;
      score = 0;
      
      const scoreBoard = document.getElementById("score-board");
      if (scoreBoard) {
        scoreBoard.textContent = `Score: 0 / 0`;
        scoreBoard.style.fontSize = '1.3em';
        scoreBoard.style.fontWeight = 'bold';
        scoreBoard.style.marginTop = '15px';
        scoreBoard.style.color = '#6a5acd';
      }
      
      showNextMessage();
    } catch (err) {
      if (gameMessage) {
        gameMessage.textContent = "Failed to load messages.";
        gameMessage.style.color = '#dc3545';
      }
      console.error(err);
    }
  }
  
  // Enhanced show next message
  function showNextMessage() {
    const feedbackElement = document.getElementById("feedback");
    
    if (currentIndex < messages.length) {
      const msg = messages[currentIndex].message;
      
      if (gameMessage) {
        // Fade out effect
        gameMessage.style.opacity = '0';
        gameMessage.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          gameMessage.textContent = msg;
          
          // Fade in effect
          gameMessage.style.opacity = '1';
          gameMessage.style.transform = 'translateY(0)';
        }, 300);
      }
      
      if (feedbackElement) {
        feedbackElement.textContent = "";
      }
    } else {
      if (gameMessage) {
        gameMessage.textContent = "🎉 Game Over! Well done!";
        gameMessage.style.fontSize = '1.5em';
        gameMessage.style.color = '#28a745';
      }
      
      const gameButtons = document.querySelector(".game-buttons");
      if (gameButtons) {
        gameButtons.style.display = "none";
      }
      
      // Show celebration effect
      showCelebration();
    }
  }
  
  // Enhanced check answer
  function enhancedCheckAnswer(userAnswer) {
    const actualAnswer = messages[currentIndex].category;
    const isCorrect = userAnswer === actualAnswer;
    const feedbackElement = document.getElementById("feedback");
    
    if (isCorrect) {
      score++;
      if (feedbackElement) {
        feedbackElement.textContent = "✅ Correct!";
        feedbackElement.style.color = '#28a745';
        feedbackElement.style.fontSize = '1.3em';
        feedbackElement.style.fontWeight = 'bold';
      }
      
      playSound('correct');
      showMiniConfetti();
    } else {
      if (feedbackElement) {
        feedbackElement.textContent = "❌ Oops! That was " + actualAnswer.toUpperCase();
        feedbackElement.style.color = '#dc3545';
        feedbackElement.style.fontSize = '1.3em';
        feedbackElement.style.fontWeight = 'bold';
      }
      
      playSound('wrong');
      showShakeEffect();
    }

    currentIndex++;
    
    const scoreBoard = document.getElementById("score-board");
    if (scoreBoard) {
      scoreBoard.textContent = `Score: ${score} / ${currentIndex}`;
      
      // Animate score update
      scoreBoard.style.animation = 'pulse 0.5s';
      setTimeout(() => {
        scoreBoard.style.animation = '';
      }, 500);
    }
    
    setTimeout(showNextMessage, 1000);
  }
  
  // Override the original functions with enhanced versions
  window.fetchMessages = enhancedFetchMessages;
  window.checkAnswer = enhancedCheckAnswer;
  
  // Initial load
  enhancedFetchMessages();
}

// Add background elements
function addBackgroundElements() {
  const emojis = ['🔍', '🔐', '📱', '💻', '🔒', '📧', '🕵️', '⚠️', '🛡️', '🦸'];
  
  // Create background elements
  for (let i = 0; i < 20; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'floating-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${Math.random() * 100}%`;
    emoji.style.top = `${Math.random() * 100}%`;
    emoji.style.animationDuration = `${5 + Math.random() * 10}s`;
    emoji.style.animationDelay = `${Math.random() * 5}s`;
    document.querySelector('.cyber-container').appendChild(emoji);
  }
}

// Show shake effect for wrong answers
function showShakeEffect() {
  const gameBox = document.getElementById('game-box');
  if (gameBox) {
    gameBox.classList.add('shake-effect');
    setTimeout(() => {
      gameBox.classList.remove('shake-effect');
    }, 500);
  }
}

// Show mini confetti for correct answers
function showMiniConfetti() {
  const gameBox = document.getElementById('game-box');
  if (!gameBox) return;
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'mini-confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.animationDuration = `${0.5 + Math.random() * 1}s`;
    gameBox.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
      confetti.remove();
    }, 1500);
  }
}

// 添加RGB灯光效果函数
function applyRGBEffect(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    // 保存原有的类名，确保其他特效不受影响
    const originalClasses = element.className;
    element.classList.add('rgb-success-effect');
    
    setTimeout(() => {
      element.classList.remove('rgb-success-effect');
      // 如果在RGB特效过程中有其他样式被意外覆盖，这里会确保它们被恢复
      if (originalClasses && !element.className.includes(originalClasses)) {
        element.className = originalClasses;
      }
    }, 3000);
  }
}

// Show celebration effect for game completion
function showCelebration() {
  // Clean previous effect containers
  cleanupEffects();
  
  // Create celebration container
  celebrationElement = document.createElement('div');
  celebrationElement.className = 'celebration';
  celebrationElement.innerHTML = '<p>🎉 Congratulations! 🎉</p><p>You\'re a Phishing Detective!</p>';
  document.body.appendChild(celebrationElement);
  
  // Create confetti container
  confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // Add confetti particles
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 5}s`;
    confetti.style.backgroundColor = getRandomColor();
    confettiContainer.appendChild(confetti);
  }
  
  // Apply RGB effect to game box if score is perfect or almost perfect
  if (score / currentIndex >= 0.8) {
    applyRGBEffect('game-box');
  }
  
  // Play celebration sound
  playSound('celebration');
  
  // Remove effects after some time
  setTimeout(() => {
    cleanupEffects();
  }, 5000);
}

// Clean effect containers
function cleanupEffects() {
  // Remove previous confetti container
  if (confettiContainer) {
    confettiContainer.remove();
    confettiContainer = null;
  }
  
  // Remove previous celebration element
  if (celebrationElement) {
    celebrationElement.remove();
    celebrationElement = null;
  }
  
  // Clear all possible existing effect containers
  document.querySelectorAll('.confetti-container, .celebration').forEach(el => {
    el.remove();
  });
}

// Get random color
function getRandomColor() {
  const colors = ['#ff9999', '#ffcc99', '#ffff99', '#99ff99', '#99ffff', '#9999ff', '#ff99ff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Sound system
function playSound(type) {
  const sounds = {
    buttonHover: 'button_hover',
    correct: 'correct',
    wrong: 'wrong',
    celebration: 'celebration'
  };
  
  const soundName = sounds[type] || 'pop';
  // If you have audio files, uncomment the lines below
  // const audio = new Audio(`/static/sounds/${soundName}.mp3`);
  // audio.volume = 0.3;
  // audio.play();
} 