// static/js/match_game.js

document.addEventListener('DOMContentLoaded', () => {
  // Show guide modal on first load in this session
  if (!sessionStorage.getItem('gameGuideShown')) {
    showGameGuide();
    sessionStorage.setItem('gameGuideShown', 'true');
  }

  document.getElementById('new-game')
    .addEventListener('click', () => location.reload());

  fetch('/get_cards')
    .then(r => r.json())
    .then(data => {
      totalPairs = data.length;
      document.getElementById('total-pairs').innerText = totalPairs;
      const cards = prepareCards(data);
      shuffle(cards);
      renderBoard(cards);
    });

  loadVoices();
  setupEventListeners();
  
  // Initialize game timer
  startTime = Date.now();
});

let flippedCards = [];
let lockBoard = false;
let selectedVoice = null;
let matchedPairs = 0;
let totalPairs = 0;
let incorrectAttempts = 0;
let totalFlips = 0;
let startTime = 0;

function showGameGuide() {
  const guide = document.createElement('div');
  guide.className = 'guide-modal';
  guide.innerHTML = `
    <div class="guide-content">
      <h2>How to Play</h2>
      <ul>
        <li>Match story cards with their matching moral cards</li>
        <li>Click cards to flip them</li>
        <li>Click "Read Story" to hear the full story</li>
        <li>Find all pairs to win!</li>
      </ul>
      <button class="btn guide-close">Got It!</button>
    </div>
  `;
  document.body.appendChild(guide);
  guide.querySelector('.guide-close').addEventListener('click', () => {
    guide.remove();
  });
}

function setupEventListeners() {
  document.getElementById('close-modal')
    .addEventListener('click', closeModal);
  document.getElementById('modal-overlay')
    .addEventListener('click', closeModal);
  document.getElementById('listen-again')
    .addEventListener('click', () =>
      speakWithChildVoice(document.getElementById('modal-story').innerText)
    );
  document.getElementById('stop-audio')
    .addEventListener('click', stopAudio);
  document.getElementById('submit-question')
    .addEventListener('click', handleAskQuestion);
    
  // Lulu character click event
  const lulu = document.getElementById('lulu');
  if (lulu) {
    lulu.addEventListener('click', () => {
      showLuluAnimation('happy');
    });
  }
}

function loadVoices() {
  const pick = () => {
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
      selectedVoice = voices.find(v =>
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('jenny') ||
        (v.name.includes('Google') && v.lang.startsWith('en'))
      ) || voices[0];
    }
  };
  pick();
  speechSynthesis.onvoiceschanged = pick;
}

function speakWithChildVoice(text) {
  stopAudio();
  if (window.puter?.audio?.speak) {
    return puter.audio.speak(text);
  }
  if (!selectedVoice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = selectedVoice;
  u.pitch = 1.9;
  u.rate = 1.1;
  u.volume = 1;
  speechSynthesis.speak(u);
}

function stopAudio() {
  if (window.puter?.audio?.cancel) {
    puter.audio.cancel();
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

function prepareCards(data) {
  return data.flatMap(item => [
    { id: item.id, type: 'story', displayText: item.title,  speakText: item.story },
    { id: item.id, type: 'moral', displayText: item.moral,  speakText: item.moral }
  ]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function renderBoard(cards) {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.classList.add(card.type); // Add type class for styling
    cardEl.dataset.id = card.id;
    cardEl.dataset.type = card.type;
    cardEl.dataset.displayText = card.displayText;
    cardEl.dataset.speakText = card.speakText;

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    inner.innerHTML = `
      <div class="card-back"></div>
      <div class="card-front">
        <div class="card-title">${card.displayText}</div>
        <div class="card-buttons">
          ${card.type === 'story'
            ? '<button class="btn blue-btn read-btn">Read Story</button>'
            : '<div style="flex:1"></div>'}
          <button class="btn red-btn stop-btn">Stop</button>
        </div>
      </div>`;
    cardEl.append(inner);
    board.append(cardEl);

    cardEl.addEventListener('click', handleCardClick);
  });
}

function handleCardClick(e) {
  const cardEl = e.currentTarget;
  const inner = cardEl.querySelector('.card-inner');
  if (lockBoard || inner.classList.contains('flipped') || cardEl.classList.contains('matched'))
    return;

  // Track total flips for statistics
  totalFlips++;
  
  inner.classList.add('flipped');
  flippedCards.push(cardEl);

  const isStory = cardEl.dataset.type === 'story';
  const text = cardEl.dataset.speakText;
  const title = cardEl.dataset.displayText;

  if (isStory) {
    speakWithChildVoice('Click Read Story to hear this one.');
    inner.querySelector('.read-btn').addEventListener('click', () => {
      openModal(title, text);
      speakWithChildVoice(text);
    }, { once: true });
  } else {
    speakWithChildVoice(text);
  }

  inner.querySelector('.stop-btn').addEventListener('click', ev => {
    ev.stopPropagation();
    stopAudio();
  }, { once: true });

  if (flippedCards.length === 2) {
    lockBoard = true;
    setTimeout(() => {
      const [a, b] = flippedCards;
      const match = a.dataset.id === b.dataset.id && a.dataset.type !== b.dataset.type;
      if (match) {
        a.classList.add('matched'); 
        b.classList.add('matched');
        matchedPairs++;
        document.getElementById('matched-count').innerText = matchedPairs;
        document.getElementById('correct-sound').play();
        
        const lulu = document.getElementById('lulu');
        if (lulu) {
          lulu.src = '/static/images/animations/correct.gif';
          setTimeout(() => {
            lulu.src = '/static/images/animations/normal.gif';
          }, 3000);
        }
        if (matchedPairs === totalPairs) showWinPopup();
      } else {
        [a, b].forEach(c => c.querySelector('.card-inner').classList.remove('flipped'));
        document.getElementById('wrong-sound').play();
        incorrectAttempts++;
        
        const lulu = document.getElementById('lulu');
        if (lulu) {
          lulu.src = '/static/images/animations/wrong.gif';
          setTimeout(() => {
            lulu.src = '/static/images/animations/normal.gif';
          }, 4000);
        }
        
        // Show hint after 3 incorrect attempts
        if (incorrectAttempts % 6 === 0) {
          showHint();
        }
      }
      flippedCards = [];
      lockBoard = false;
    }, 800);
  }
}

function showHint() {
  // Find all unmatched cards
  const unmatchedCards = Array.from(document.querySelectorAll('.card:not(.matched)'));
  const storyCards = unmatchedCards.filter(c => c.dataset.type === 'story');
  
  if (storyCards.length > 0) {
    const randomStory = storyCards[Math.floor(Math.random() * storyCards.length)];
    const moralId = randomStory.dataset.id;
    const matchingMoral = unmatchedCards.find(c => 
      c.dataset.id === moralId && c.dataset.type === 'moral'
    );
    
    if (matchingMoral) {
      // Briefly highlight the matching pair
      randomStory.classList.add('hint');
      matchingMoral.classList.add('hint');
      
      setTimeout(() => {
        randomStory.classList.remove('hint');
        matchingMoral.classList.remove('hint');
      }, 2000);
      
      // Show Lulu animation
      showLuluAnimation('hint');
    }
  }
}

function showLuluAnimation(type) {
  const lulu = document.getElementById('lulu');
  if (!lulu) return;
  
  let duration = 2000;
  if (type === 'correct') {
    duration = 3000;
    lulu.src = `/static/images/animations/correct.gif`;
  } else if (type === 'wrong') {
    duration = 4000;
    lulu.src = `/static/images/animations/wrong.gif`;
  } else if (type === 'hint') {
    duration = 2000;
    lulu.src = '/static/images/animations/Lulu_helper.png';
  }
  
  lulu.classList.add('animated');
  
  setTimeout(() => {
    lulu.classList.remove('animated');
    lulu.src = '/static/images/animations/normal.gif';
  }, duration);
}

function openModal(title, story) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-story').innerText = story;
  const resp = document.getElementById('modal-response');
  resp.innerText = '';
  resp.style.display = 'none';
  document.getElementById('question-input').value = '';

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('story-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('story-modal').style.display = 'none';
  stopAudio();
}

function showWinPopup() {
  const endTime = Date.now();
  const timeTaken = Math.floor((endTime - startTime) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  
  createConfetti();
  const popup = document.createElement('div');
  popup.className = 'win-popup';
  popup.style.display = 'block';
  popup.innerHTML = `
    <h2>You Won! 🎉</h2>
    <div class="stats">
      <p>Time: ${minutes}m ${seconds}s</p>
      <p>Total Flips: ${totalFlips}</p>
      <p>Accuracy: ${Math.round((totalPairs / totalFlips) * 100)}%</p>
    </div>
    <button class="btn">Play Again</button>`;
  document.body.append(popup);
  popup.querySelector('button').addEventListener('click', () => location.reload());
}

function createConfetti() {
  const colors = ['#4a6bff','#ff6b6b','#4caf50','#ffc107','#9c27b0'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.append(container);
  for (let i = 0; i < 150; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 5 + 's';
    c.style.width = Math.random() * 10 + 5 + 'px';
    c.style.height = Math.random() * 10 + 5 + 'px';
    container.append(c);
  }
  setTimeout(() => container.remove(), 8000);
}

async function handleAskQuestion() {
  const respEl = document.getElementById('modal-response');
  const questionInput = document.getElementById('question-input');
  const question = questionInput.value.trim();
  
  if (!question) {
    respEl.innerText = 'Please ask a question!';
    respEl.style.display = 'block';
    return;
  }

  // Show loading state
  respEl.innerText = 'Thinking...';
  respEl.style.display = 'block';
  questionInput.disabled = true;
  document.getElementById('submit-question').disabled = true;

  try {
    // Define tools/functions available to the AI
    const tools = [{
      type: "function",
      function: {
        name: "explain_to_child",
        description: "Explain to a 5-10 years in ONE short sentence (under 10 words), then add 'Like...' with a simple example (under 7 words). Never exceed 20 words total.",
        parameters: {
          type: "object",
          properties: {
            concept: {
              type: "string",
              description: "The concept to explain in child-friendly terms"
            }
          },
          required: ["concept"],
          additionalProperties: false
        },
        strict: true
      }
    }];

    // First call to determine if we need to use our function
    const completion = await puter.ai.chat(question, { 
      tools,
      system_message: "Answer in 5-7 words MAX. Only give: [Thing] is like [simple example]. Example: 'Popups are like digital sticky notes.' Never explain concepts - only give the comparison."
    });

    let finalResponse;

    // Check for function call
    if (completion.message.tool_calls && completion.message.tool_calls.length > 0) {
      const toolCall = completion.message.tool_calls[0];
      if (toolCall.function.name === 'explain_to_child') {
        // Parse arguments and process locally
        const args = JSON.parse(toolCall.function.arguments);
        const explanation = await generateChildFriendlyExplanation(args.concept);
        
        // Send result back to AI for final response
        finalResponse = await puter.ai.chat([
          { role: "user", content: question },
          completion.message,
          { 
            role: "tool",
            tool_call_id: toolCall.id,
            content: explanation
          }
        ]);
      }
    } else {
      finalResponse = completion;
    }

    // Display the response
    const content = finalResponse.message?.content || finalResponse.content || "I'm not sure how to answer that.";
    respEl.innerText = content;
    speakWithChildVoice(content);

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.status === 400 
      ? "That question wasn't quite right. Can you try asking differently?"
      : "Sorry, I'm having trouble answering right now.";
    
    respEl.innerText = errorMessage;
    speakWithChildVoice(errorMessage);
  } finally {
    questionInput.disabled = false;
    document.getElementById('submit-question').disabled = false;
  }
}

async function generateChildFriendlyExplanation(concept) {
  return `Here's a simple way to understand ${concept}: Imagine it like...`;
}