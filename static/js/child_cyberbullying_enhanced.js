// Enhanced Cyberbullying Page JS - Add animations and interactive effects

// Set flag to indicate enhanced JS is loading
window.enhancedJSLoaded = true;

// Global variables to track effect containers
let fireworksContainer = null;
let starsContainer = null;
let encouragementElement = null;

document.addEventListener('DOMContentLoaded', () => {
  // Add page load animation
  animatePageLoad();
  
  // Initialize drag and drop game
  initDragDropGame();
  
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
      
      // 特殊处理空格和特殊字符
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
      
      // 特殊处理空格和特殊字符
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
  
  // Special handling for game card title
  const gameCardTitle = document.querySelector('.game-card h2');
  if (gameCardTitle) {
    // Add a special class to the game card title to ensure visibility
    gameCardTitle.classList.add('game-title');
  }
}

// Enhanced drag and drop game
function initDragDropGame() {
  fetch('/random_records/cyberbullying')
    .then(res => res.json())
    .then(data => {
      const messagePool = document.getElementById('message-pool');
      data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'draggable-message';
        div.textContent = item.text;
        div.draggable = true;
        div.dataset.label = item.label;
        div.dataset.id = index;
        
        // Add drag start event
        div.addEventListener('dragstart', (e) => {
          dragStart(e);
          e.target.classList.add('dragging');
          // Add shake effect
          applyShakeEffect(e.target);
        });
        
        // Drag end event
        div.addEventListener('dragend', (e) => {
          e.target.classList.remove('dragging');
          // Stop shake effect
          removeShakeEffect(e.target);
        });
        
        // Add mouse hover sound effect
        div.addEventListener('mouseenter', () => {
          playSound('hover');
        });
        
        messagePool.appendChild(div);
      });
    });

  const dropzones = document.querySelectorAll('.dropzone');
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', dragOver);
    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.target.classList.add('dropzone-active');
    });
    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.target.classList.remove('dropzone-active');
    });
    zone.addEventListener('drop', (e) => {
      dropItem(e);
      e.target.classList.remove('dropzone-active');
      // Play placement sound effect
      playSound('drop');
    });
  });
  
  // Modify check answers button event
  const checkButton = document.querySelector('button[onclick="checkAnswers()"]');
  if (checkButton) {
    checkButton.removeAttribute('onclick');
    checkButton.addEventListener('click', enhancedCheckAnswers);
    
    // Add button click sound effect
    checkButton.addEventListener('mouseenter', () => {
      playSound('buttonHover');
    });
  }
}

// Drag start
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

// Drag over
function dragOver(e) {
  e.preventDefault();
}

// Drop item
function dropItem(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const draggedItem = document.querySelector(`.draggable-message[data-id='${id}']`);
  
  // Add placement animation
  draggedItem.style.transition = 'all 0.3s ease';
  draggedItem.style.transform = 'scale(0.95)';
  setTimeout(() => {
    draggedItem.style.transform = 'scale(1)';
  }, 300);
  
  e.currentTarget.appendChild(draggedItem);
}

// 添加RGB灯光效果函数
function applyRGBEffect(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    // 先清除可能存在的旧效果
    element.classList.remove('rgb-success-effect');
    
    // 保存原有的类名，确保其他特效不受影响
    const originalClasses = element.className;
    
    // 添加新效果
    element.classList.add('rgb-success-effect');
    
    // 设置一个明确的计时器ID，方便取消
    if (window.rgbEffectTimer) {
      clearTimeout(window.rgbEffectTimer);
    }
    
    window.rgbEffectTimer = setTimeout(() => {
      if (element) {
        element.classList.remove('rgb-success-effect');
        // 如果在RGB特效过程中有其他样式被意外覆盖，这里会确保它们被恢复
        if (originalClasses && !element.className.includes(originalClasses)) {
          element.className = originalClasses;
        }
      }
      window.rgbEffectTimer = null;
    }, 3000);
  }
}

// Enhanced check answers function
function enhancedCheckAnswers() {
  // Clean previous effect containers
  cleanupEffects();
  
  let correct = 0;
  let total = 0;
  const checkResults = [];

  document.querySelectorAll('.dropzone').forEach(zone => {
    const expected = zone.dataset.label;
    // 跳过没有 data-label 的区域（如 message-pool），避免影响得分统计
    if (!expected) return;
    zone.querySelectorAll('.draggable-message').forEach(msg => {
      total++;
      const isCorrect = msg.dataset.label === expected;
      
      // Remove previous result marks
      const existingMark = msg.querySelector('.correct-mark, .wrong-mark');
      if (existingMark) {
        existingMark.remove();
      }
      
      if (isCorrect) {
        correct++;
        msg.style.backgroundColor = '#d4edda';
        msg.style.borderColor = '#28a745';
        // Add effect for correct answers
        applyCorrectAnimation(msg);
        checkResults.push({element: msg, correct: true});
      } else {
        msg.style.backgroundColor = '#f8d7da';
        msg.style.borderColor = '#dc3545';
        checkResults.push({element: msg, correct: false});
      }
    });
  });

  // Delay showing results, play animations first
  setTimeout(() => {
    const resultElement = document.getElementById('result');
    resultElement.textContent = `You answered ${correct} out of ${total} correctly! 🎉`;
    resultElement.style.display = 'inline-block';
    
    console.log(`检查结果: 正确: ${correct}, 总数: ${total}`); // 添加调试信息
    
    // Play different effects based on score
    if (correct === total && total > 0) {
      // All correct, play fireworks
      showFireworks();
      playSound('success');
      resultElement.style.color = '#28a745';
      
      // Apply RGB effect to game container when all answers are correct
      applyRGBEffect('game-container');
      
      // 添加更明显的确认语句
      console.log("全部回答正确，显示烟花特效！");
    } else if (correct >= total / 2 && total > 0) {
      // Most correct, play stars
      showStars();
      playSound('goodJob');
      resultElement.style.color = '#fd7e14';
    } else if (total > 0) {
      // Few correct, show encouragement
      showEncouragement();
      playSound('tryAgain');
      resultElement.style.color = '#dc3545';
    }
  }, 500);
  
  // Show answer results animation one by one
  checkResults.forEach((result, index) => {
    setTimeout(() => {
      if (result.correct) {
        result.element.insertAdjacentHTML('beforeend', '<span class="correct-mark">✓</span>');
      } else {
        result.element.insertAdjacentHTML('beforeend', '<span class="wrong-mark">✗</span>');
      }
    }, 200 * index);
  });
}

// Clean effect containers
function cleanupEffects() {
  // Remove previous fireworks container
  if (fireworksContainer) {
    fireworksContainer.remove();
    fireworksContainer = null;
  }
  
  // Remove previous stars container
  if (starsContainer) {
    starsContainer.remove();
    starsContainer = null;
  }
  
  // Remove previous encouragement element
  if (encouragementElement) {
    encouragementElement.remove();
    encouragementElement = null;
  }
  
  // Clear all possible existing effect containers
  document.querySelectorAll('.fireworks-container, .stars-container, .encouragement').forEach(el => {
    el.remove();
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
}

// Add background elements
function addBackgroundElements() {
  const emojis = ['🌟', '✨', '🌈', '🦄', '🎈', '🎁', '🚀', '🦋', '🐾', '💫'];
  
  // Create background elements
  for (let i = 0; i < 30; i++) {
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

// Effect functions
function applyShakeEffect(element) {
  element.classList.add('shake-effect');
}

function removeShakeEffect(element) {
  element.classList.remove('shake-effect');
}

function applyCorrectAnimation(element) {
  element.classList.add('correct-answer');
  
  // Retrigger animation effect
  element.classList.remove('correct-answer');
  void element.offsetWidth; // Trigger reflow
  element.classList.add('correct-answer');
}

// Fireworks effect
function showFireworks() {
  // 清除之前的特效容器
  cleanupEffects();
  
  console.log("显示烟花特效！");
  
  fireworksContainer = document.createElement('div');
  fireworksContainer.className = 'fireworks-container';
  fireworksContainer.style.zIndex = '20000'; // 确保在最上层
  document.body.appendChild(fireworksContainer);
  
  // 同时显示一个祝贺文本
  const celebrationText = document.createElement('div');
  celebrationText.className = 'celebration';
  celebrationText.style.zIndex = '20001';
  celebrationText.innerHTML = '<p>🎉 Perfect Score! 🎉</p><p>You\'re a Cyberbullying Expert!</p>';
  document.body.appendChild(celebrationText);
  
  // Create multiple fireworks with better visibility
  for (let i = 0; i < 25; i++) { // 增加烟花数量
    setTimeout(() => {
      const firework = document.createElement('div');
      firework.className = 'firework';
      firework.style.left = `${5 + Math.random() * 90}%`; // 扩大分布范围
      firework.style.top = `${5 + Math.random() * 70}%`;
      firework.style.transform = 'scale(1.8)'; // 增大烟花尺寸
      firework.style.zIndex = '20000'; // 确保可见性
      fireworksContainer.appendChild(firework);
      
      // Create sparkles with more vibrant colors
      for (let j = 0; j < 16; j++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.transform = `rotate(${j * 22.5}deg)`;
        
        // 使用更鲜明的颜色
        const brightColors = [
          '#FF3366', '#FF6633', '#FFCC33', '#33CC33', 
          '#3366FF', '#CC33FF', '#FF33CC', '#00CCFF'
        ];
        spark.style.backgroundColor = brightColors[Math.floor(Math.random() * brightColors.length)];
        
        // 增加火花的长度
        spark.style.height = `${20 + Math.random() * 15}px`;
        spark.style.width = '3px'; // 增加宽度
        spark.style.boxShadow = '0 0 8px rgba(255,255,255,0.8)'; // 添加发光效果
        firework.appendChild(spark);
      }
      
      // Remove individual firework after longer time
      setTimeout(() => {
        firework.style.opacity = '0';
        setTimeout(() => {
          firework.remove();
        }, 500);
      }, 2000); // 增加单个烟花持续时间
    }, i * 150); // 缩短间隔，加快出现
  }
  
  // 添加一些彩纸效果增强视觉体验
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.style.zIndex = '19999';
  document.body.appendChild(confettiContainer);
  
  // 添加彩纸粒子
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${-20 - Math.random() * 50}px`;
    
    // 随机大小
    const size = 8 + Math.random() * 12;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * 1.5}px`;
    
    // 确保彩纸可见性
    confetti.style.opacity = '1';
    
    // 随机旋转动画
    confetti.style.animation = `confetti-drop ${3 + Math.random() * 4}s ease-out forwards`;
    
    // 使用鲜明的颜色
    const brightColors = [
      '#FF3366', '#FF6633', '#FFCC33', '#33CC33', 
      '#3366FF', '#CC33FF', '#FF33CC', '#00CCFF'
    ];
    confetti.style.backgroundColor = brightColors[Math.floor(Math.random() * brightColors.length)];
    
    confettiContainer.appendChild(confetti);
  }
  
  // Remove fireworks container after longer time
  setTimeout(() => {
    console.log("清理烟花特效");
    if (fireworksContainer) {
      fireworksContainer.style.opacity = '0';
      fireworksContainer.style.transition = 'opacity 1s';
      
      setTimeout(() => {
        cleanupEffects();
      }, 1000);
    }
  }, 10000); // 增加持续时间到10秒
}

// Stars effect
function showStars() {
  starsContainer = document.createElement('div');
  starsContainer.className = 'stars-container';
  document.body.appendChild(starsContainer);
  
  // Create multiple stars
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.className = 'star';
      star.innerHTML = '⭐';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.fontSize = `${20 + Math.random() * 20}px`;
      starsContainer.appendChild(star);
      
      // Star disappear
      setTimeout(() => {
        star.remove();
      }, 2000);
    }, i * 100);
  }
  
  // Remove stars container
  setTimeout(() => {
    if (starsContainer) {
      starsContainer.remove();
      starsContainer = null;
    }
  }, 4000);
}

// Encouragement effect
function showEncouragement() {
  encouragementElement = document.createElement('div');
  encouragementElement.className = 'encouragement';
  encouragementElement.innerText = 'Try again, you can do it!';
  document.body.appendChild(encouragementElement);
  
  // Fade out effect
  setTimeout(() => {
    if (encouragementElement) {
      encouragementElement.style.opacity = '0';
      setTimeout(() => {
        if (encouragementElement) {
          encouragementElement.remove();
          encouragementElement = null;
        }
      }, 1000);
    }
  }, 2000);
}

// Get random color
function getRandomColor() {
  const colors = ['#ff9999', '#ffcc99', '#ffff99', '#99ff99', '#99ffff', '#9999ff', '#ff99ff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Sound system
function playSound(type) {
  const sounds = {
    hover: 'pop_small',
    drop: 'pop',
    buttonHover: 'button_hover',
    success: 'success',
    goodJob: 'good_job',
    tryAgain: 'try_again'
  };
  
  const soundName = sounds[type] || 'pop';
  // If you have audio files, uncomment the lines below
  // const audio = new Audio(`/static/sounds/${soundName}.mp3`);
  // audio.volume = 0.3;
  // audio.play();
}

// Remove addExtraStyles function and its call at the end 