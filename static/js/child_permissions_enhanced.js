// Enhanced App Permissions Simulator JS - Add animations and interactive effects

// Set flag to indicate enhanced JS is loading
window.enhancedJSLoaded = true;

// Global variables to track effect containers
let successContainer = null;
let tipContainer = null;

document.addEventListener('DOMContentLoaded', () => {
  // Add page load animation
  animatePageLoad();
  
  // Initialize permissions simulator
  initPermissionsSimulator();
  
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

// Enhanced permissions simulator
function initPermissionsSimulator() {
  // Get simulator elements
  const simulatorBox = document.getElementById('simulator-box');
  const permissionPopup = document.querySelector('.permission-popup');
  const appInfo = document.getElementById('app-info');
  const permissionQuestion = document.getElementById('permission-question');
  const feedbackMessage = document.getElementById('feedback-message');
  const nextButton = document.getElementById('next-button');
  
  if (!simulatorBox) return;
  
  // Enhance simulator UI
  simulatorBox.style.backgroundColor = '#f8f9ff';
  simulatorBox.style.borderRadius = '20px';
  simulatorBox.style.padding = '20px';
  simulatorBox.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
  
  if (permissionPopup) {
    permissionPopup.style.backgroundColor = 'white';
    permissionPopup.style.borderRadius = '18px';
    permissionPopup.style.padding = '25px';
    permissionPopup.style.maxWidth = '450px';
    permissionPopup.style.margin = '20px auto';
    permissionPopup.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
    permissionPopup.style.border = '3px solid #e0e0ff';
    permissionPopup.style.transform = 'scale(0.95)';
    permissionPopup.style.transition = 'all 0.3s ease';
    
    // Add hover effect
    permissionPopup.addEventListener('mouseenter', () => {
      permissionPopup.style.transform = 'scale(1)';
      permissionPopup.style.borderColor = '#c2c0ff';
      permissionPopup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    });
    
    permissionPopup.addEventListener('mouseleave', () => {
      permissionPopup.style.transform = 'scale(0.95)';
      permissionPopup.style.borderColor = '#e0e0ff';
      permissionPopup.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
    });
  }
  
  if (appInfo) {
    appInfo.style.fontSize = '1.4em';
    appInfo.style.fontWeight = 'bold';
    appInfo.style.color = '#5a4fcf';
    appInfo.style.margin = '10px 0';
    appInfo.style.textShadow = '1px 1px 2px rgba(0,0,0,0.1)';
    appInfo.style.fontFamily = "'Balsamiq Sans', cursive";
  }
  
  if (permissionQuestion) {
    permissionQuestion.style.fontSize = '1.2em';
    permissionQuestion.style.margin = '20px 0';
    permissionQuestion.style.padding = '15px';
    permissionQuestion.style.backgroundColor = '#f7f7ff';
    permissionQuestion.style.borderRadius = '12px';
    permissionQuestion.style.color = '#333';
    permissionQuestion.style.transition = 'all 0.3s ease';
  }
  
  if (feedbackMessage) {
    feedbackMessage.style.fontSize = '1.2em';
    feedbackMessage.style.fontWeight = 'bold';
    feedbackMessage.style.padding = '15px';
    feedbackMessage.style.marginTop = '15px';
    feedbackMessage.style.borderRadius = '12px';
    feedbackMessage.style.transition = 'all 0.3s ease';
    feedbackMessage.style.backgroundColor = 'rgba(255,255,255,0.8)';
  }
  
  if (nextButton) {
    nextButton.style.background = 'linear-gradient(45deg, #ff69b4, #6a5acd)';
    nextButton.style.color = 'white';
    nextButton.style.border = 'none';
    nextButton.style.borderRadius = '50px';
    nextButton.style.padding = '12px 25px';
    nextButton.style.fontSize = '1.2em';
    nextButton.style.fontWeight = 'bold';
    nextButton.style.cursor = 'pointer';
    nextButton.style.transition = 'all 0.3s ease';
    nextButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    nextButton.style.margin = '15px 5px';
    nextButton.style.fontFamily = "'Balsamiq Sans', cursive";
    
    // Add hover effects
    nextButton.addEventListener('mouseenter', () => {
      nextButton.style.transform = 'translateY(-3px)';
      nextButton.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
      playSound('buttonHover');
    });
    
    nextButton.addEventListener('mouseleave', () => {
      nextButton.style.transform = 'translateY(0)';
      nextButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    });
  }
  
  // Style simulator buttons
  const buttons = document.querySelectorAll('.simulator-buttons button');
  buttons.forEach(button => {
    button.style.background = 'linear-gradient(45deg, #ff69b4, #6a5acd)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50px';
    button.style.padding = '12px 25px';
    button.style.fontSize = '1.2em';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.3s ease';
    button.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    button.style.margin = '0 15px';
    button.style.minWidth = '100px';
    button.style.fontFamily = "'Balsamiq Sans', cursive";
    
    // Add hover effects
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
  
  // Enhanced app loading
  let apps = [];
  let currentApp = null;
  let currentPermission = null;
  
  const permissionLabels = {
    "ACCESS_FINE_LOCATION": "your location",
    "CAMERA": "your camera",
    "READ_CONTACTS": "your contacts",
    "READ_SMS": "your messages",
    "RECORD_AUDIO": "your microphone",
    "WRITE_EXTERNAL_STORAGE": "your saved files"
  };
  
  // Enhanced load apps function
  async function enhancedLoadApps() {
    try {
      if (appInfo) {
        // Show loading animation
        appInfo.innerHTML = '<span class="loading-text">Loading apps</span>';
        const loadingText = document.querySelector('.loading-text');
        
        if (loadingText) {
          loadingText.style.position = 'relative';
          loadingText.style.display = 'inline-block';
          
          // Add loading dots animation
          let dots = 0;
          const loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            loadingText.textContent = 'Loading apps' + '.'.repeat(dots);
          }, 300);
          
          // Fetch the apps
          const res = await fetch("/random_records/app_permissions");
          apps = await res.json();
          
          // Clear loading animation
          clearInterval(loadingInterval);
          
          // Show success message with animation
          appInfo.innerHTML = '<span class="success-text">✅ Apps loaded successfully!</span>';
          const successText = document.querySelector('.success-text');
          
          if (successText) {
            successText.style.color = '#28a745';
            successText.style.opacity = '0';
            successText.style.transform = 'translateY(-10px)';
            successText.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
              successText.style.opacity = '1';
              successText.style.transform = 'translateY(0)';
            }, 100);
            
            // Show first app after success message
            setTimeout(() => {
              enhancedLoadNewApp();
            }, 800);
          }
        }
      } else {
        // If appInfo element is not available, just load the data
        const res = await fetch("/random_records/app_permissions");
        apps = await res.json();
        enhancedLoadNewApp();
      }
    } catch (e) {
      console.error("Error loading apps:", e);
      if (appInfo) {
        appInfo.textContent = "Failed to load data.";
        appInfo.style.color = '#dc3545';
      }
    }
  }
  
  // Get random app
  function getRandomApp() {
    return apps[Math.floor(Math.random() * apps.length)];
  }
  
  // Get random permission
  function getRandomPermission(app) {
    const perms = Object.keys(permissionLabels);
    return perms[Math.floor(Math.random() * perms.length)];
  }
  
  // Enhanced load new app function
  function enhancedLoadNewApp() {
    // Clean previous tips
    cleanupEffects();
    
    if (feedbackMessage) {
      feedbackMessage.textContent = "";
      feedbackMessage.style.backgroundColor = 'transparent';
    }
    
    if (nextButton) {
      nextButton.style.display = "none";
    }
    
    // Get a new app and permission
    currentApp = getRandomApp();
    currentPermission = getRandomPermission(currentApp);
    
    const appName = currentApp.pkgname;
    const appCategory = currentApp.category;
    const permissionText = permissionLabels[currentPermission];
    
    // Add app icon based on category
    const iconMap = {
      "GAME": "🎮",
      "SOCIAL": "👥",
      "COMMUNICATION": "💬",
      "PRODUCTIVITY": "📝",
      "TOOLS": "🔧",
      "PHOTOGRAPHY": "📸",
      "ENTERTAINMENT": "🎬",
      "MAPS_AND_NAVIGATION": "🗺️",
      "EDUCATION": "📚",
      "LIFESTYLE": "🏡"
    };
    
    const icon = iconMap[appCategory] || "📱";
    
    // Update UI with animation
    if (appInfo) {
      appInfo.style.opacity = '0';
      appInfo.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        appInfo.textContent = `${icon} ${appName} (Category: ${appCategory})`;
        appInfo.style.opacity = '1';
        appInfo.style.transform = 'translateY(0)';
      }, 300);
    }
    
    if (permissionQuestion) {
      permissionQuestion.style.opacity = '0';
      permissionQuestion.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        permissionQuestion.textContent = `This app is asking for permission to access ${permissionText}. What will you do?`;
        permissionQuestion.style.opacity = '1';
        permissionQuestion.style.transform = 'translateY(0)';
        
        // Add subtle pulsing effect to highlight the question
        permissionQuestion.style.animation = 'pulse 2s infinite';
      }, 500);
    }
    
    if (permissionPopup) {
      permissionPopup.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        permissionPopup.style.transform = 'scale(0.95)';
      }, 400);
    }
  }
  
  // 修改应用程序，在多个连续正确答案后显示庆祝效果
  let correctAnswersStreak = 0;
  const CELEBRATION_THRESHOLD = 3; // 连续答对3题后触发庆祝效果
  // Track total questions and correct answers
  let totalQuestions = 0;
  let correctAnswers = 0;
  
  // 修改enhancedHandleChoice函数，以便在玩家达到连续答对题目阈值时触发庆祝效果
  function enhancedHandleChoice(choice) {
    const actuallyNeeded = currentApp[currentPermission] === 1;
    let message = "";
    let isCorrect = false;
    
    totalQuestions++;
    
    if (choice === "allow" && !actuallyNeeded) {
      message = `🛑 Oh no! This app can now access ${permissionLabels[currentPermission]}, but it didn't really need it. That could be risky!`;
      isCorrect = false;
      correctAnswersStreak = 0; // Reset streak
    } else if (choice === "deny" && !actuallyNeeded) {
      message = `✅ Great choice! This app didn't need access to ${permissionLabels[currentPermission]}, and you kept your info safe.`;
      isCorrect = true;
      correctAnswersStreak++;
      correctAnswers++;
    } else if (choice === "allow" && actuallyNeeded) {
      message = `✅ Good job! This app needed access to ${permissionLabels[currentPermission]} to work properly.`;
      isCorrect = true;
      correctAnswersStreak++;
      correctAnswers++;
    } else if (choice === "deny" && actuallyNeeded) {
      message = `⚠️ Hmm… That might stop some features from working, but you stayed cautious. Always ask a grown-up if you're not sure!`;
      isCorrect = false;
      correctAnswersStreak = 0; // Reset streak
    }
    
    // Check if should show celebration for consecutive correct answers
    if (correctAnswersStreak >= CELEBRATION_THRESHOLD) {
      // Trigger celebration effect
      setTimeout(() => {
        showCelebration();
      }, 1000);
      correctAnswersStreak = 0; // Reset counter
    }
    
    // 若本题回答正确，立即触发一次庆祝特效（礼花/彩纸）
    if (isCorrect) {
      // 轻微延迟，确保反馈文字先更新
      setTimeout(() => {
        showCelebration();
      }, 300);
    }
    
    // Check if should show celebration for high accuracy
    if (totalQuestions >= 5 && correctAnswers / totalQuestions >= 0.8) {
      // Also trigger celebration for high overall accuracy
      setTimeout(() => {
        showCelebration();
      }, 1000);
      // Reset counter to avoid showing too frequently
      totalQuestions = 0;
      correctAnswers = 0;
    }
    
    // Update feedback message with animation
    if (feedbackMessage) {
      feedbackMessage.style.opacity = '0';
      feedbackMessage.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        feedbackMessage.textContent = message;
        feedbackMessage.style.opacity = '1';
        feedbackMessage.style.transform = 'translateY(0)';
        
        // Apply color based on correctness
        if (message.includes('✅')) {
          feedbackMessage.style.color = '#28a745';
          feedbackMessage.style.backgroundColor = 'rgba(209, 245, 223, 0.3)';
          showSuccessTip();
          playSound('correct');
          
          // Show RGB effect on single correct answer
          applyRGBEffect('simulator-box');
        } else if (message.includes('🛑')) {
          feedbackMessage.style.color = '#dc3545';
          feedbackMessage.style.backgroundColor = 'rgba(248, 215, 218, 0.3)';
          showErrorShake();
          playSound('wrong');
        } else {
          feedbackMessage.style.color = '#fd7e14';
          feedbackMessage.style.backgroundColor = 'rgba(255, 236, 204, 0.3)';
          playSound('neutral');
        }
      }, 300);
    }
    
    // Show next button
    if (nextButton) {
      nextButton.style.display = "inline-block";
      nextButton.style.opacity = '0';
      nextButton.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        nextButton.style.opacity = '1';
        nextButton.style.transform = 'translateY(0)';
      }, 500);
    }
    
    // Show visual feedback effect
    if (isCorrect) {
      showCorrectEffect();
    } else {
      // Subtle visual feedback even for incorrect or cautious choices
      showSubtleFeedback();
    }
  }
  
  // Replace the original functions with enhanced versions
  window.loadApps = enhancedLoadApps;
  window.loadNewApp = enhancedLoadNewApp;
  window.handleChoice = enhancedHandleChoice;
  
  // Initial load
  enhancedLoadApps();
}

// Add background elements
function addBackgroundElements() {
  const emojis = ['🔒', '🔐', '📱', '🛡️', '⚙️', '🔍', '📲', '🖥️', '🔔', '🎯'];
  
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

// Show success tips
function showSuccessTip() {
  // Clean previous tips
  cleanupEffects();
  
  // Create success tip container
  tipContainer = document.createElement('div');
  tipContainer.className = 'tip-container';
  
  const tips = [
    "Great job protecting your data!",
    "You're becoming a privacy expert!",
    "Smart choice! Always question app permissions!",
    "You're a digital safety superstar!",
    "Awesome work protecting your device!"
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  tipContainer.textContent = randomTip;
  
  document.body.appendChild(tipContainer);
  
  // Animate tip entry
  setTimeout(() => {
    tipContainer.style.opacity = '1';
    tipContainer.style.transform = 'translateY(0)';
  }, 100);
  
  // Remove tip after delay
  setTimeout(() => {
    if (tipContainer) {
      tipContainer.style.opacity = '0';
      tipContainer.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        cleanupEffects();
      }, 500);
    }
  }, 3000);
}

// Show error shake effect
function showErrorShake() {
  const simulatorBox = document.getElementById('simulator-box');
  if (simulatorBox) {
    simulatorBox.classList.add('shake-effect');
    setTimeout(() => {
      simulatorBox.classList.remove('shake-effect');
    }, 500);
  }
}

// Show correct effect with particles
function showCorrectEffect() {
  // Clean previous effects
  cleanupEffects();
  
  // Create success container
  successContainer = document.createElement('div');
  successContainer.className = 'success-container';
  document.body.appendChild(successContainer);
  
  // Add success particles
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.className = 'success-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.backgroundColor = getRandomColor();
    successContainer.appendChild(particle);
  }
  
  // Remove effects after some time
  setTimeout(() => {
    cleanupEffects();
  }, 2000);
}

// Show subtle feedback for any choice
function showSubtleFeedback() {
  const permissionPopup = document.querySelector('.permission-popup');
  if (permissionPopup) {
    permissionPopup.style.animation = 'pulse 0.5s';
    setTimeout(() => {
      permissionPopup.style.animation = '';
    }, 500);
  }
}

// Clean effect containers
function cleanupEffects() {
  console.log("执行特效清理");
  
  // Remove previous success container
  if (successContainer) {
    successContainer.remove();
    successContainer = null;
  }
  
  // Remove previous tip container
  if (tipContainer) {
    tipContainer.remove();
    tipContainer = null;
  }
  
  // 清理所有可能的特效容器，使用更具体的选择器
  const effectSelectors = [
    '.success-container', 
    '.tip-container', 
    '.confetti-container', 
    '.celebration',
    '.fireworks-container',
    '.stars-container',
    '.encouragement'
  ];
  
  // 记录找到的特效元素数量
  let count = 0;
  
  // 对每种类型的特效进行清理
  effectSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      // 先应用淡出动画再移除
      el.style.transition = "opacity 0.5s";
      el.style.opacity = 0;
      
      // 计数并记录
      count++;
      
      // 短暂延迟后移除元素
      setTimeout(() => {
        el.remove();
      }, 500);
    });
  });
  
  console.log(`清理了 ${count} 个特效元素`);
  
  // 手动重置所有动画状态
  const animatedElements = document.querySelectorAll('.rgb-success-effect');
  animatedElements.forEach(el => {
    el.classList.remove('rgb-success-effect');
  });
  
  // 如果有外部计时器，也要清理
  if (window.celebrationTimer) {
    clearTimeout(window.celebrationTimer);
    window.celebrationTimer = null;
  }
  
  if (window.rgbEffectTimer) {
    clearTimeout(window.rgbEffectTimer);
    window.rgbEffectTimer = null;
  }
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
    neutral: 'neutral'
  };
  
  const soundName = sounds[type] || 'pop';
  // If you have audio files, uncomment the lines below
  // const audio = new Audio(`/static/sounds/${soundName}.mp3`);
  // audio.volume = 0.3;
  // audio.play();
}

// 添加庆祝特效函数 - 类似于烟花和礼花效果
function showCelebration() {
  // Clean previous effects
  cleanupEffects();
  
  console.log("显示庆祝特效！");
  
  // 确保即使container被清除，特效也能在document.body上显示
  const mainContainer = document.querySelector('.cyber-container') || document.body;
  
  // Create celebration container with higher z-index
  const celebrationElement = document.createElement('div');
  celebrationElement.className = 'celebration';
  celebrationElement.style.zIndex = '99999'; // 确保在最上层
  celebrationElement.innerHTML = '<p>🎉 Amazing Job! 🎉</p><p>You\'re a Permissions Expert!</p>';
  document.body.appendChild(celebrationElement);
  
  // Create confetti container
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.style.zIndex = '99999';  // 确保在最上层
  document.body.appendChild(confettiContainer);
  
  // 使用简单的动画回调避免延迟问题
  requestAnimationFrame(() => {
    // 添加彩色粒子
    for (let i = 0; i < 250; i++) { // 增加粒子数量
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // 设置随机位置，覆盖整个屏幕
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${-20 - Math.random() * 80}px`; // 从更高处开始
      
      // 随机大小
      const size = 10 + Math.random() * 20;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 1.5}px`;
      
      // 确保彩纸可见性
      confetti.style.opacity = '1';
      confetti.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      
      // 使用内联样式设置动画，避免CSS定义问题
      const animationDuration = 3 + Math.random() * 4;
      confetti.style.animation = `confetti-drop ${animationDuration}s ease-out forwards`;
      
      // 使用更鲜明的颜色
      const brightColors = [
        '#FF3366', '#FF6633', '#FFCC33', '#33CC33', 
        '#3366FF', '#CC33FF', '#FF33CC', '#00CCFF'
      ];
      confetti.style.backgroundColor = brightColors[Math.floor(Math.random() * brightColors.length)];
      
      // 随机形状
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      } else {
        confetti.style.borderRadius = `${Math.random() * 10}px`;
        // 随机旋转起始角度
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      }
      
      confettiContainer.appendChild(confetti);
    }
  });
  
  // Also apply RGB effect to simulator box
  applyRGBEffect('simulator-box');
  
  // 添加全局标记，用于调试
  window.celebrationDisplayed = true;
  
  // 播放连续两次音效，确保用户能听到
  playSound('correct');
  setTimeout(() => {
    playSound('correct');
  }, 300);
  
  // 记录清理定时器
  console.log("设置庆祝特效清理定时器: 10秒后");
  
  // 延长持续时间并确保清理
  if (window.celebrationTimer) {
    clearTimeout(window.celebrationTimer);
  }
  
  window.celebrationTimer = setTimeout(() => {
    console.log("庆祝特效清理定时器触发，执行清理");
    cleanupEffects();
    window.celebrationDisplayed = false;
  }, 10000);
} 