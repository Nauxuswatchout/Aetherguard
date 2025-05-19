// Game state
const gameState = {
    currentLevel: 1,
    completedLevels: [],
    progress: 0,
    parentBadges: [],
    childBadges: [],
    quizAnswers: {}, // Tracks selected answers
    quizResults: {}, // Tracks correct/incorrect results
    allQuestionsAnswered: false
};

// Level data
const levelData = [
    {
        id: 1,
        title: "Starting the Journey: Internet Basics",
        icon: "🏠",
        content: `
            <p>Welcome to your Internet Safety Journey! In this first level, parents and children will learn the basics of internet safety together.</p>
            
            <div class="participants">
                <div class="participant">
                    <h3>For Parents</h3>
                    <p>This is an opportunity to establish open communication about internet use and set the foundation for safe online habits.</p>
                </div>
                
                <div class="participant">
                    <h3>For Children</h3>
                    <p>You'll learn what the internet is, how to use it responsibly, and why it's important to talk to your parents about your online activities.</p>
                </div>
            </div>
            
            <div class="activity-container">
                <h3>Activity: Internet Safety Contract <span class="badge">10 min</span></h3>
                <p>Create a family internet safety contract together. Discuss and agree on:</p>
                <ul>
                    <li>How much time can be spent online each day</li>
                    <li>Which websites and apps are appropriate</li>
                    <li>What personal information should never be shared</li>
                    <li>What to do if something uncomfortable happens online</li>
                </ul>
            </div>
            
            <div class="quiz-container">
                <h3>Knowledge Check</h3>
                
                <div class="quiz-progress">
                    <div class="quiz-stats">0/3 Questions Answered | 0 Correct</div>
                </div>
                
                <div class="question-list">
                    <!-- Question 1 -->
                    <div class="question-item" data-question="1-1">
                        <div class="quiz-question">1. What should you do if a website asks for your full name and address?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '1-1')" data-option="A" data-correct="false">A. Enter the information to access cool content</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-1')" data-option="B" data-correct="true">B. Ask a parent before sharing any personal information online</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-1')" data-option="C" data-correct="false">C. Make up a fake name and address</div>
                        </div>
                        <button class="check-answer-btn" data-question="1-1" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 2 -->
                    <div class="question-item" data-question="1-2">
                        <div class="quiz-question">2. Why is it important to create a family internet safety contract?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '1-2')" data-option="A" data-correct="false">A. So parents can control everything their children do online</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-2')" data-option="B" data-correct="false">B. To limit internet access as much as possible</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-2')" data-option="C" data-correct="true">C. To establish clear expectations and open communication about internet use</div>
                        </div>
                        <button class="check-answer-btn" data-question="1-2" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 3 -->
                    <div class="question-item" data-question="1-3">
                        <div class="quiz-question">3. Which of these is NOT a good internet safety practice?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '1-3')" data-option="A" data-correct="true">A. Keeping online activities secret from parents</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-3')" data-option="B" data-correct="false">B. Using child-friendly search engines</div>
                            <div class="quiz-option" onclick="selectOption(this, '1-3')" data-option="C" data-correct="false">C. Setting time limits for internet use</div>
                        </div>
                        <button class="check-answer-btn" data-question="1-3" disabled>Check Answer</button>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 2,
        title: "Password Power: Creating Strong Passwords",
        icon: "🔒",
        content: `
            <p>Strong passwords are your first line of defense in the digital world! In this level, learn how to create and manage secure passwords.</p>
            
            <div class="participants">
                <div class="participant">
                    <h3>For Parents</h3>
                    <p>Learn how to create and manage strong, unique passwords for your accounts and how to help your child do the same.</p>
                </div>
                
                <div class="participant">
                    <h3>For Children</h3>
                    <p>Discover why passwords are important and learn how to create passwords that are hard for others to guess but easy for you to remember.</p>
                </div>
            </div>
            
            <div class="activity-container">
                <h3>Activity: Password Challenge <span class="badge">15 min</span></h3>
                <p>Create a secure password method together:</p>
                <ul>
                    <li>Think of a memorable phrase or sentence</li>
                    <li>Use the first letter of each word</li>
                    <li>Add numbers, symbols, and capital letters</li>
                    <li>Test your password's strength using a password checker tool (without entering real passwords)</li>
                </ul>
            </div>
            
            <div class="quiz-container">
                <h3>Knowledge Check</h3>
                
                <div class="quiz-progress">
                    <div class="quiz-stats">0/3 Questions Answered | 0 Correct</div>
                </div>
                
                <div class="question-list">
                    <!-- Question 1 -->
                    <div class="question-item" data-question="2-1">
                        <div class="quiz-question">1. Which of these would be the strongest password?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '2-1')" data-option="A" data-correct="false">A. password123</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-1')" data-option="B" data-correct="false">B. MyDogRex</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-1')" data-option="C" data-correct="true">C. T4k3@H1k3!2023</div>
                        </div>
                        <button class="check-answer-btn" data-question="2-1" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 2 -->
                    <div class="question-item" data-question="2-2">
                        <div class="quiz-question">2. How often should you change your passwords?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '2-2')" data-option="A" data-correct="false">A. Never, if they're strong enough</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-2')" data-option="B" data-correct="true">B. Every few months or if you suspect a security breach</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-2')" data-option="C" data-correct="false">C. Every day for maximum security</div>
                        </div>
                        <button class="check-answer-btn" data-question="2-2" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 3 -->
                    <div class="question-item" data-question="2-3">
                        <div class="quiz-question">3. What is a good way to remember multiple passwords?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '2-3')" data-option="A" data-correct="false">A. Use the same password for everything</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-3')" data-option="B" data-correct="false">B. Write them down on a sticky note on your computer</div>
                            <div class="quiz-option" onclick="selectOption(this, '2-3')" data-option="C" data-correct="true">C. Use a secure password manager with a strong master password</div>
                        </div>
                        <button class="check-answer-btn" data-question="2-3" disabled>Check Answer</button>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 3,
        title: "Digital Communication: Safe Social Interactions",
        icon: "💬",
        content: `
            <p>Communication is at the heart of the internet experience. This level focuses on safe interactions online.</p>
            
            <div class="participants">
                <div class="participant">
                    <h3>For Parents</h3>
                    <p>Learn about the platforms children use to communicate online and how to guide them in making safe choices.</p>
                </div>
                
                <div class="participant">
                    <h3>For Children</h3>
                    <p>Discover how to communicate respectfully online and what to do if someone is unkind or makes you uncomfortable.</p>
                </div>
            </div>
            
            <div class="activity-container">
                <h3>Activity: Communication Scenarios <span class="badge">20 min</span></h3>
                <p>Role-play these online communication scenarios together:</p>
                <ul>
                    <li>A friend requests to video chat when parents aren't home</li>
                    <li>Someone you don't know sends you a friend request</li>
                    <li>Someone asks for personal information in a game chat</li>
                    <li>A classmate posts an embarrassing photo of another student</li>
                </ul>
                <p>Discuss the best response for each scenario and why.</p>
            </div>
            
            <div class="quiz-container">
                <h3>Knowledge Check</h3>
                
                <div class="quiz-progress">
                    <div class="quiz-stats">0/3 Questions Answered | 0 Correct</div>
                </div>
                
                <div class="question-list">
                    <!-- Question 1 -->
                    <div class="question-item" data-question="3-1">
                        <div class="quiz-question">1. What should you do if someone online asks to meet you in person?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '3-1')" data-option="A" data-correct="false">A. Suggest meeting in a public place</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-1')" data-option="B" data-correct="true">B. Tell your parents or a trusted adult immediately</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-1')" data-option="C" data-correct="false">C. Ask them for more information first</div>
                        </div>
                        <button class="check-answer-btn" data-question="3-1" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 2 -->
                    <div class="question-item" data-question="3-2">
                        <div class="quiz-question">2. What should you do if someone is being mean or bullying others in an online game or chat?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '3-2')" data-option="A" data-correct="false">A. Be mean back to teach them a lesson</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-2')" data-option="B" data-correct="false">B. Ignore it and keep playing</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-2')" data-option="C" data-correct="true">C. Report the behavior, block the person if needed, and tell a trusted adult</div>
                        </div>
                        <button class="check-answer-btn" data-question="3-2" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 3 -->
                    <div class="question-item" data-question="3-3">
                        <div class="quiz-question">3. When is it okay to share photos of your friends online?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '3-3')" data-option="A" data-correct="true">A. Only when you have their permission and a parent approves</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-3')" data-option="B" data-correct="false">B. Anytime - if you took the photo, you can share it</div>
                            <div class="quiz-option" onclick="selectOption(this, '3-3')" data-option="C" data-correct="false">C. Only on private accounts that strangers can't see</div>
                        </div>
                        <button class="check-answer-btn" data-question="3-3" disabled>Check Answer</button>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 4,
        title: "Digital Footprint: What You Leave Behind",
        icon: "👁️",
        content: `
            <p>Everything you do online leaves a trace. This level helps you understand your digital footprint and how to manage it.</p>
            
            <div class="participants">
                <div class="participant">
                    <h3>For Parents</h3>
                    <p>Learn about digital footprints and how to help your child develop awareness of their long-term online presence.</p>
                </div>
                
                <div class="participant">
                    <h3>For Children</h3>
                    <p>Discover how your online actions can be saved forever and how to make choices that protect your reputation.</p>
                </div>
            </div>
            
            <div class="activity-container">
                <h3>Activity: Future Self Letter <span class="badge">15 min</span></h3>
                <p>Imagine you're 10 years in the future:</p>
                <ul>
                    <li>Write a letter from your future self thanking your present self for being careful online</li>
                    <li>Include specific examples of good choices made</li>
                    <li>Discuss what opportunities were available because of a positive digital footprint</li>
                </ul>
            </div>
            
            <div class="quiz-container">
                <h3>Knowledge Check</h3>
                
                <div class="quiz-progress">
                    <div class="quiz-stats">0/3 Questions Answered | 0 Correct</div>
                </div>
                
                <div class="question-list">
                    <!-- Question 1 -->
                    <div class="question-item" data-question="4-1">
                        <div class="quiz-question">1. Which of these could be part of your digital footprint?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '4-1')" data-option="A" data-correct="false">A. Photos you've been tagged in by friends</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-1')" data-option="B" data-correct="false">B. Comments you've made on websites and videos</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-1')" data-option="C" data-correct="false">C. Search history and websites you've visited</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-1')" data-option="D" data-correct="true">D. All of the above</div>
                        </div>
                        <button class="check-answer-btn" data-question="4-1" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 2 -->
                    <div class="question-item" data-question="4-2">
                        <div class="quiz-question">2. Why is it important to think before posting something online?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '4-2')" data-option="A" data-correct="false">A. Because your friends might not like it</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-2')" data-option="B" data-correct="true">B. Because once something is online, it can be very difficult to completely remove</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-2')" data-option="C" data-correct="false">C. Because you might make spelling mistakes</div>
                        </div>
                        <button class="check-answer-btn" data-question="4-2" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 3 -->
                    <div class="question-item" data-question="4-3">
                        <div class="quiz-question">3. How might your digital footprint affect you in the future?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '4-3')" data-option="A" data-correct="false">A. It won't - everything disappears after a few years</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-3')" data-option="B" data-correct="false">B. It only matters for famous people</div>
                            <div class="quiz-option" onclick="selectOption(this, '4-3')" data-option="C" data-correct="true">C. Schools, employers, and others might see it when making decisions about you</div>
                        </div>
                        <button class="check-answer-btn" data-question="4-3" disabled>Check Answer</button>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 5,
        title: "Digital Citizens: Rights and Responsibilities",
        icon: "🎓",
        content: `
            <p>Congratulations on reaching the final level! Here we'll bring everything together and focus on being good digital citizens.</p>
            
            <div class="participants">
                <div class="participant">
                    <h3>For Parents</h3>
                    <p>Learn how to continue supporting your child's development as a responsible digital citizen as they grow.</p>
                </div>
                
                <div class="participant">
                    <h3>For Children</h3>
                    <p>Discover your rights and responsibilities online and how to be a positive force in digital spaces.</p>
                </div>
            </div>
            
            <div class="activity-container">
                <h3>Activity: Digital Citizenship Pledge <span class="badge">20 min</span></h3>
                <p>Create a family pledge for digital citizenship that includes:</p>
                <ul>
                    <li>How you'll treat others online</li>
                    <li>How you'll protect your privacy and security</li>
                    <li>How you'll balance screen time with other activities</li>
                    <li>How you'll continue learning about digital safety</li>
                </ul>
            </div>
            
            <div class="quiz-container">
                <h3>Final Knowledge Check</h3>
                
                <div class="quiz-progress">
                    <div class="quiz-stats">0/3 Questions Answered | 0 Correct</div>
                </div>
                
                <div class="question-list">
                    <!-- Question 1 -->
                    <div class="question-item" data-question="5-1">
                        <div class="quiz-question">1. What does being a good digital citizen mean?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '5-1')" data-option="A" data-correct="false">A. Using technology as much as possible</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-1')" data-option="B" data-correct="true">B. Using technology responsibly and respectfully</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-1')" data-option="C" data-correct="false">C. Knowing how to code and build websites</div>
                        </div>
                        <button class="check-answer-btn" data-question="5-1" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 2 -->
                    <div class="question-item" data-question="5-2">
                        <div class="quiz-question">2. What is the best approach to balancing screen time with other activities?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '5-2')" data-option="A" data-correct="false">A. Using screens whenever you want, for as long as you want</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-2')" data-option="B" data-correct="false">B. Avoiding all screen time because it's harmful</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-2')" data-option="C" data-correct="true">C. Creating a schedule that includes both screen time and other activities like outdoor play, reading, and family time</div>
                        </div>
                        <button class="check-answer-btn" data-question="5-2" disabled>Check Answer</button>
                    </div>
                    
                    <!-- Question 3 -->
                    <div class="question-item" data-question="5-3">
                        <div class="quiz-question">3. What is an important part of continuing to learn about internet safety?</div>
                        <div class="quiz-options">
                            <div class="quiz-option" onclick="selectOption(this, '5-3')" data-option="A" data-correct="true">A. Having regular family discussions about new apps, websites, and online trends</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-3')" data-option="B" data-correct="false">B. Letting children figure it out on their own as they get older</div>
                            <div class="quiz-option" onclick="selectOption(this, '5-3')" data-option="C" data-correct="false">C. Only using the internet when absolutely necessary</div>
                        </div>
                        <button class="check-answer-btn" data-question="5-3" disabled>Check Answer</button>
                    </div>
                </div>
            </div>
        `
    }
];

// Open level modal
function openLevel(levelId) {
    const levelElement = document.getElementById(`level${levelId}`);
    
    // Check if level is locked
    if (levelElement.classList.contains('locked') && !gameState.completedLevels.includes(levelId - 1)) {
        alert("This level is locked! Complete the previous level first.");
        return;
    }
    
    const level = levelData.find(l => l.id === levelId);
    gameState.currentLevel = levelId;
    
    // Reset quiz state
    gameState.quizAnswers = {};
    gameState.quizResults = {};
    gameState.allQuestionsAnswered = false;
    
    // Populate modal content
    document.getElementById('modalTitle').textContent = level.title;
    document.getElementById('modalBody').innerHTML = level.content;
    
    // Add event listeners to Check Answer buttons
    document.querySelectorAll('.check-answer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const questionId = this.dataset.question;
            checkAnswer(questionId);
        });
    });
    
    // Reset the complete button to disabled state
    document.getElementById('completeBtn').disabled = true;
    document.getElementById('completeBtn').classList.remove('btn-success');
    document.getElementById('completeBtn').textContent = "Mark as Complete";
    
    // Check if already completed
    if (gameState.completedLevels.includes(levelId)) {
        document.getElementById('completeBtn').textContent = "Already Completed";
        document.getElementById('completeBtn').disabled = true;
        
        // Show all correct answers for completed levels
        document.querySelectorAll('.question-item').forEach(question => {
            const correctOption = question.querySelector('.quiz-option[data-correct="true"]');
            if (correctOption) {
                correctOption.classList.add('correct');
            }
        });
    }
    
    // Initialize quiz progress
    updateQuizProgress();
    
    // Show modal
    document.getElementById('levelModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('levelModal').style.display = 'none';
}

// Select quiz option
function selectOption(element, questionId) {
    const questionContainer = element.closest('.question-item');
    
    // Remove selected class from all siblings
    const options = questionContainer.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    element.classList.add('selected');
    
    // Store the selected answer
    gameState.quizAnswers[questionId] = element.dataset.option;
    
    // Enable check answer button
    const checkBtn = questionContainer.querySelector('.check-answer-btn');
    if (checkBtn) {
        checkBtn.disabled = false;
    }
}

// Check answer
function checkAnswer(questionId) {
    const questionContainer = document.querySelector(`.question-item[data-question="${questionId}"]`);
    const selectedOption = questionContainer.querySelector('.quiz-option.selected');
    
    if (!selectedOption) {
        alert("Please select an answer first!");
        return;
    }
    
    // Disable all options
    const options = questionContainer.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.onclick = null; // Disable further clicks
    });
    
    // Disable the check answer button
    const checkBtn = questionContainer.querySelector('.check-answer-btn');
    checkBtn.disabled = true;
    
    const isCorrect = selectedOption.dataset.correct === "true";
    
    // Mark selected answer
    if (isCorrect) {
        selectedOption.classList.add('correct');
        
        // Show feedback
        let feedback = questionContainer.querySelector('.feedback-text');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'feedback-text correct';
            feedback.innerHTML = '<strong>Correct!</strong> Great job! That\'s the right answer.';
            questionContainer.appendChild(feedback);
        } else {
            feedback.className = 'feedback-text correct';
            feedback.innerHTML = '<strong>Correct!</strong> Great job! That\'s the right answer.';
        }
    } else {
        selectedOption.classList.add('incorrect');
        
        // Find and highlight the correct answer
        options.forEach(option => {
            if (option.dataset.correct === "true") {
                option.classList.add('correct');
            }
        });
        
        // Show feedback
        let feedback = questionContainer.querySelector('.feedback-text');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'feedback-text incorrect';
            feedback.innerHTML = '<strong>Not quite right.</strong> Take another look at the correct answer highlighted in green.';
            questionContainer.appendChild(feedback);
        } else {
            feedback.className = 'feedback-text incorrect';
            feedback.innerHTML = '<strong>Not quite right.</strong> Take another look at the correct answer highlighted in green.';
        }
    }
    
    // Store the result
    gameState.quizResults[questionId] = isCorrect;
    
    // Check if all questions are answered
    updateQuizProgress();
    
    // Check if all questions are answered correctly
    const allQuestions = document.querySelectorAll('.question-item');
    const allAnsweredCorrectly = Array.from(allQuestions).every(q => {
        const qId = q.dataset.question;
        return gameState.quizResults[qId] === true;
    });
    
    // Enable complete button if all questions are answered correctly
    if (allAnsweredCorrectly) {
        document.getElementById('completeBtn').disabled = false;
        document.getElementById('completeBtn').classList.add('btn-success');
        document.getElementById('completeBtn').innerHTML = 'Mark as Complete <span style="margin-left: 5px;">✓</span>';
    }
}

// Update quiz progress
function updateQuizProgress() {
    const totalQuestions = document.querySelectorAll('.question-item').length;
    const answeredQuestions = Object.keys(gameState.quizResults).length;
    const correctAnswers = Object.values(gameState.quizResults).filter(result => result === true).length;
    
    const progressElement = document.querySelector('.quiz-stats');
    if (progressElement) {
        progressElement.textContent = `${answeredQuestions}/${totalQuestions} Questions Answered | ${correctAnswers} Correct`;
    }
}

// Complete level
function completeLevel() {
    const levelId = gameState.currentLevel;
    
    // Add to completed levels if not already there
    if (!gameState.completedLevels.includes(levelId)) {
        gameState.completedLevels.push(levelId);
        
        // Update UI
        document.getElementById(`level${levelId}`).classList.remove('active');
        document.getElementById(`level${levelId}`).classList.add('completed');
        
        // Unlock next level if exists
        if (levelId < levelData.length) {
            document.getElementById(`level${levelId + 1}`).classList.remove('locked');
            document.getElementById(`level${levelId + 1}`).classList.add('active');
        }
        
        // Add badges
        gameState.parentBadges.push(levelId);
        gameState.childBadges.push(levelId);
        updateBadges();
        
        // Update progress
        updateProgress();
        
        // Check for game completion
        if (gameState.completedLevels.length === levelData.length) {
            setTimeout(() => {
                alert("Congratulations! You've completed the entire Internet Safety Journey! You are now digital safety experts!");
            }, 500);
        }
    }
    
    closeModal();
}

// Update progress bar
function updateProgress() {
    const progress = (gameState.completedLevels.length / levelData.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${gameState.completedLevels.length}/${levelData.length}`;
}

// Update badges
function updateBadges() {
    // Update parent badges
    const parentBadgeElements = document.querySelectorAll('#parentBadges .badge-item');
    parentBadgeElements.forEach((badge, index) => {
        if (gameState.parentBadges.includes(index + 1)) {
            badge.classList.add('earned');
        }
    });
    
    // Update child badges
    const childBadgeElements = document.querySelectorAll('#childBadges .badge-item');
    childBadgeElements.forEach((badge, index) => {
        if (gameState.childBadges.includes(index + 1)) {
            badge.classList.add('earned');
        }
    });
}

// Initialize game
function initGame() {
    updateProgress();
}

// Event listeners
document.addEventListener('DOMContentLoaded', initGame);

// Add keyboard event listener for ESC key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});