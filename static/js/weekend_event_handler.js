
class WeekendEventHandler {
    constructor(gameInstance) {
        
        this.game = gameInstance;
        
        
        this.hasStartedQuiz = false;  
        this.hasCompletedQuiz = false;  
        this.hasProcessedBranches = false;  
        this.isProcessingBranchDialogues = false;  
        this.quizScore = 0;  
        this.quizQuestions = [];  
        this.currentQuizIndex = 0;  
        this.quizQuestionTimer = null;  
        this.type2Timer = null;    
        this.currentHotness = 100; 
        
        
        this.boundHandleClick = this.handleClick.bind(this);
        
        
        this.init();
    }
    
        init() {
        console.log('[Weekend Event] Initialize weekend event handler');
    }
    
        debug(message) {
        if (this.game.debugMode) {
            const details = ` (Dialogue index:${this.game.currentDialogIndex}, Total dialogues:${this.game.currentEvent?.dialogues?.length || 0}, Quiz:${this.hasStartedQuiz ? 'Started' : 'Not started'})`;
            console.log(`[WEEKEND] ${message}${details}`);
        }
    }
    
        async loadEvent() {
        this.debug('Weekend event processor loaded');
        
        
        this.resetState();
        
        
        this.game.clearAllChoices();
        
        try {
            const url = `/get_event/weekend?t=${Date.now()}`;
            this.debug(`Requesting weekend event: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const event = await response.json();
            if (event.error) {
                this.debug(`Weekend event returned error: ${event.error}`);
                
                await this.game.loadMorningEvent();
                return;
            }
            
            this.debug(`Successfully loaded weekend event: ${event.id}`);
            
            
            event.type = 'weekend';
            this.game.currentEvent = event;
            this.game.currentDialogIndex = 0;
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            
            
            console.log('[Music] Weekend event loaded, preparing to play music (weekend -> live.mp3)');
            this.game.playBackgroundMusic('weekend');
            
            
            document.removeEventListener('click', this.game.boundHandleClick);
            document.removeEventListener('click', this.boundHandleClick);
            
            
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                this.debug('Binding weekend event专用点击监听器');
                
                
                this.showCurrentDialog();
            }, 50);
            
            return true; 
        } catch (error) {
            console.error('Failed to load weekend event:', error);
            
            this.game.loadMorningEvent();
            throw error; 
        }
    }
    
        resetState() {
        this.hasStartedQuiz = false;
        this.hasCompletedQuiz = false;
        this.hasProcessedBranches = false;
        this.isProcessingBranchDialogues = false;
        this.quizScore = 0;
        this.quizQuestions = [];
        this.currentQuizIndex = 0;
        
        if (this.quizQuestionTimer) {
            clearInterval(this.quizQuestionTimer);
            this.quizQuestionTimer = null;
        }
    }
    
        showCurrentDialog() {
        
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('Event ended or ending, not displaying dialogue');
            return;
        }
        
        
        if (!this.game.currentEvent || !this.game.currentEvent.dialogues) {
            console.error('Cannot display dialogue: Current event or dialogues do not exist');
            return;
        }
        
        
        if (this.game.currentDialogIndex < 0 || this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length) {
            console.error('Cannot display dialogue: Dialogue index out of bounds', this.game.currentDialogIndex);
            return;
        }
        
        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
        if (!dialog) {
            console.error('Cannot display dialogue: Current index has no dialogue content');
            return;
        }
        
        this.debug(`Displaying dialogue: ${this.game.currentDialogIndex + 1}/${this.game.currentEvent.dialogues.length}`);
        
        
        if (this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            console.log(`[Branch Dialogue] Displaying branch dialogue: ${this.game.currentDialogIndex + 1}/${this.game.currentEvent.dialogues.length}`);
            
            
            this.analyzeAndResetEventState();
        }
        
        
        if (this.game.currentEvent.background && this.game.currentDialogIndex === 0) {
            const bgPath = `/static/images/${this.game.currentEvent.background}`;
            this.game.setBackgroundImage(bgPath);
        }
        
        
        this.game.updateCharacters(dialog);
        
        
        const speakerName = dialog.character.split('_')[0];
        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
        
        
        this.game.typeText(dialog.text);
        
        
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        
        
        if (isLastDialog && this.game.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('Last dialogue, displaying quiz rules panel');
            
            const rules = [
                'Please complete all questions within the time limit',
                'Each question has only one chance to answer',
                'Correct answers earn points, incorrect answers do not deduct points',
                'The score will be displayed immediately after completion'
            ];
            this.game.clearAllChoices();
            this.game.showRulesPanel(rules, this.showQuizQuestion.bind(this));
            return;
        }
        
        
        if (isLastDialog) {
            setTimeout(() => {
                this.game.showContinueButton('Continue', () => {
                    this.debug('Clicked continue button, ending dialogue');
                    this.endEvent();
                });
            }, 100);
        }
    }
    
        handleClick(e) {
        
        if (this.game.hasEventEnded || this.game.isEventEnding || this.hasStartedQuiz) {
            this.debug('Event ended or quiz started, ignoring click');
            return;
        }
        
        
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
            this.debug('Ignoring button or overlay click');
            return;
        }
        
        
        this.game.playClickSound();
        
        
        if (this.game.isTyping) {
            this.debug('Accelerating text display');
            this.game.currentTypingId = null;
            this.game.isTyping = false;
            
            if (this.game.currentEvent && this.game.currentEvent.dialogues && 
                this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                
                this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
            }
            return;
        }
        
        
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        
        
        if (isLastDialog && this.game.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('Clicked last dialogue, displaying quiz rules panel');
            const rules = [
                'Please complete all questions within the time limit',
                'Each question has only one chance to answer',
                'Correct answers earn points, incorrect answers do not deduct points',
                'The score will be displayed immediately after completion'
            ];
            this.game.clearAllChoices();
            this.game.showRulesPanel(rules, this.showQuizQuestion.bind(this));
            return;
        }
        
        
        const isWeekendBranchDialog = this.hasCompletedQuiz && this.isProcessingBranchDialogues;
        
        if (isWeekendBranchDialog) {
            this.debug(`Processing branch dialogue click: Current index=${this.game.currentDialogIndex}`);
            console.log(`[Branch Processing] Click handled: Current index=${this.game.currentDialogIndex}, Total dialogues=${this.game.currentEvent.dialogues.length}`);
        }
        
        
        this.debug(`进入下一句对话 ${this.game.currentDialogIndex + 1}`);
        this.game.currentDialogIndex++;
        
        
        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            
            this.showCurrentDialog();
        } else {
            
            this.debug('All dialogues completed');
            
            
            this.game.clearAllChoices();
            
            
            if (isWeekendBranchDialog) {
                this.debug('All branch dialogues completed, preparing to end event');
                this.isProcessingBranchDialogues = false;
                this.hasProcessedBranches = true;
            }
            
            
            setTimeout(() => {
                this.game.showContinueButton('Continue', () => {
                    this.debug('Clicked continue button, ending event');
                    this.endEvent();
                });
            }, 100);
        }
    }
    
        showQuizQuestion() {
        this.debug('Displaying quiz interface');
        
        
        document.removeEventListener('click', this.boundHandleClick);
        
        
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        if (eid === 'WeekendEvent-2' || eid === 'weekend-2') {
            this.startType2Quiz();
            return;
        }
        
        
        this.hasStartedQuiz = true;
        this.quizQuestions = this.game.currentEvent.quiz.questions || [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        
        if (this.game.currentEvent.quiz.background) {
            const bgPath = `/static/images/${this.game.currentEvent.quiz.background}`;
            this.debug(`Loading quiz background: ${bgPath}`);
            
            
            const img = new Image();
            img.onload = () => {
                this.debug('Quiz background image loaded successfully');
                this.game.elements.background.style.backgroundImage = `url(${bgPath})`;
                
                
                this.showQuizUI();
            };
            img.onerror = () => {
                this.debug(`Quiz background image load failed: ${bgPath}`);
                
                this.showQuizUI();
            };
            img.src = bgPath;
        } else {
            
            this.showQuizUI();
        }
    }
    
        showQuizUI() {
        
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const quizContainer = document.getElementById('quiz-container');
        
        
        if (!timerContainer || !quizContainer) {
            this.debug('Quiz UI elements do not exist, possibly due to DOM structure issues');
            return;
        }
        
        
        timerContainer.style.display = 'block'; 
        timerContainer.style.zIndex = '2001';
        quizContainer.style.display = 'block'; 
        quizContainer.style.zIndex = '2001';
        
        
        Object.assign(quizContainer.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '600px',
            width: '90%'
        });
        
        
        Object.assign(timerContainer.style, {
            position: 'fixed',
            top: 'calc(50% - 230px)', 
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '550px'
        });
        
        
        this.game.elements.characterLeft.style.opacity = '0.5';
        this.game.elements.characterRight.style.opacity = '0.5';
        
        this.debug('Quiz UI displayed, loading first question');
        
        
        this.displayQuizQuestion();
    }
    
        displayQuizQuestion() {
        console.log(`[DEBUG] Rendering question ${this.currentQuizIndex + 1}`);
        const quiz = this.game.currentEvent.quiz;
        const total = quiz.timer;
        let timeLeft = total;
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const timerBar = document.getElementById('quiz-timer-bar');
        const style = quiz.timerStyle || {};
        const quizContainer = document.getElementById('quiz-container');
        
        
        Object.assign(quizContainer.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '600px',
            width: '90%',
            zIndex: '2001'
        });
        
        
        Object.assign(timerContainer.style, {
            position: 'fixed',
            top: 'calc(50% - 230px)', 
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '550px',
            zIndex: '2001'
        });
        
        
        Object.assign(timerContainer.style, {
            backgroundColor: style.backgroundColor || 'rgba(0, 0, 0, 0.7)', 
            borderRadius: style.borderRadius || '8px',
            boxShadow: style.boxShadow || '0 4px 10px rgba(0, 0, 0, 0.3)', 
            width: style.width || timerContainer.style.width,
            height: style.height || timerContainer.style.height, 
            margin: style.margin || '',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            border: '2px solid #3498db'
        });
        
        
        timerBar.style.backgroundColor = style.barColor || '#e74c3c';
        timerBar.style.transition = style.transition || 'width 0.95s linear';
        timerBar.style.borderRadius = '4px';
        
        
        Object.assign(quizContainer.style, {
            backgroundColor: 'rgba(25, 25, 35, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            margin: '0 auto',
            border: '2px solid #3498db',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            zIndex: '2001'
        });
        
        
        quizContainer.style.transform = 'translate(-50%, calc(-50% + 30px))';
        quizContainer.style.opacity = '0';
        
        
        setTimeout(() => {
            quizContainer.style.transform = 'translate(-50%, -50%)';
            quizContainer.style.opacity = '1';
        }, 10);
        
        const q = this.quizQuestions[this.currentQuizIndex];
        const questionTextElem = document.getElementById('quiz-question-text');
        questionTextElem.textContent = q.text;
        
        
        Object.assign(questionTextElem.style, {
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '15px',
            textAlign: 'center',
            padding: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        });
        
        const choicesElem = document.getElementById('quiz-question-choices'); 
        choicesElem.innerHTML = '';
        
        // 美化选项容器样式
        Object.assign(choicesElem.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '15px'
        });
        
        q.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.textContent = choice.text; 
            btn.className = 'choice-button';
            
            
            Object.assign(btn.style, {
                backgroundColor: '#2c3e50',
                color: 'white',
                border: '2px solid #3498db',
                borderRadius: '8px',
                padding: '12px 15px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
            });
            
            
            btn.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#34495e';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            });
            
            btn.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#2c3e50';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            
            const rippleEffect = document.createElement('span');
            rippleEffect.className = 'ripple-effect';
            Object.assign(rippleEffect.style, {
                position: 'absolute',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                transform: 'scale(0)',
                animation: 'ripple-animation 0.6s linear',
                pointerEvents: 'none'
            });
            
            
            if (!document.getElementById('ripple-animation-style')) {
                const styleElem = document.createElement('style');
                styleElem.id = 'ripple-animation-style';
                styleElem.textContent = `
                    @keyframes ripple-animation {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(styleElem);
            }
            
            
            btn.addEventListener('click', (e) => {
                
                const ripple = rippleEffect.cloneNode();
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size/2}px`;
                ripple.style.top = `${e.clientY - rect.top - size/2}px`;
                btn.appendChild(ripple);
                
                
                quizContainer.style.transform = 'translate(-50%, calc(-50% - 50px))';
                quizContainer.style.opacity = '0';
                
                
                setTimeout(() => {
                    
                    ripple.remove();
                    
                    
                    this.quizScore += choice.score || 0;
                    clearInterval(this.quizQuestionTimer);
                    this.nextQuizQuestion();
                }, 300);
            }, { once: true });
            
            choicesElem.appendChild(btn);
        });
        
        timerBar.style.width = '100%';
        
        this.quizQuestionTimer = setInterval(() => {
            timeLeft--;
            const percent = (timeLeft / total) * 100;
            timerBar.style.width = percent + '%';
            
            if (quiz.timerStyle.halfTimeEffect?.enabled && timeLeft === Math.ceil(total / 2)) {
                const blinkColor = quiz.timerStyle.halfTimeEffect.blinkColor || '#ff0000';
                const duration = quiz.timerStyle.halfTimeEffect.blinkDuration || 400;
                timerBar.style.backgroundColor = blinkColor;
                setTimeout(() => { timerBar.style.backgroundColor = style.barColor || '#e74c3c'; }, duration);
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.quizQuestionTimer);
                
                
                quizContainer.style.transform = 'translate(-50%, calc(-50% - 50px))';
                quizContainer.style.opacity = '0';
                
                setTimeout(() => {
                    this.nextQuizQuestion();
                }, 300);
            }
        }, 1000);
    }
    
        nextQuizQuestion() {
        clearInterval(this.quizQuestionTimer);
        this.currentQuizIndex++;
        
        if (this.currentQuizIndex < this.quizQuestions.length) {
            this.displayQuizQuestion();
        } else {
            this.hasCompletedQuiz = true;
            this.hasStartedQuiz = false;
            
            
            const timerContainer = document.getElementById('quiz-timer-bar-container');
            const quizContainer = document.getElementById('quiz-container');
            
            
            timerContainer.style.transform = 'translateX(-50%) translateY(-20px)';
            timerContainer.style.opacity = '0';
            quizContainer.style.transform = 'translate(-50%, calc(-50% - 50px))';
            quizContainer.style.opacity = '0';
            
            
            setTimeout(() => {
                timerContainer.style.display = 'none';
                quizContainer.style.display = 'none';
                
                
                document.addEventListener('click', this.boundHandleClick);
                
                
                this.debug(`答题完成，得分: ${this.quizScore}`);
                this.endEvent();
            }, 300);
        }
    }
    
        analyzeAndResetEventState() {
        console.log('[State Analysis] ====== Starting weekend event state analysis ======');
        
        
        console.log(`[State Analysis] Current event type: ${this.game.currentEvent?.type || 'No event'}`);
        console.log(`[State Analysis] Current dialogue index: ${this.game.currentDialogIndex}`);
        console.log(`[State Analysis] Total dialogue count: ${this.game.currentEvent?.dialogues?.length || 0}`);
        
        
        console.log(`[State Analysis] Event end status: hasEventEnded=${this.game.hasEventEnded}, isEventEnding=${this.game.isEventEnding}`);
        console.log(`[State Analysis] Quiz status: hasStartedQuiz=${this.hasStartedQuiz}, hasCompletedQuiz=${this.hasCompletedQuiz}`);
        console.log(`[State Analysis] Branch dialogue status: isProcessingBranchDialogues=${this.isProcessingBranchDialogues}, hasProcessedBranches=${this.hasProcessedBranches}`);
        
        
        console.log(`[State Analysis] Click handler: boundHandleClick=${!!this.boundHandleClick}`);
        
        
        if (this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            
            
            document.removeEventListener('click', this.boundHandleClick);
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                console.log('[State Analysis] Rebound click handler');
                
                
                const gameScreen = document.querySelector('.game-screen');
                if (gameScreen) {
                    const forceHandler = (e) => {
                        
                        if (e.target.tagName === 'BUTTON') return;
                        
                        
                        gameScreen.removeEventListener('click', forceHandler);
                        
                        console.log('[State Analysis]一次性强制点击监听器被触发');
                        
                        
                        if (this.game.isTyping) {
                            this.game.isTyping = false;
                            this.game.currentTypingId = null;
                            if (this.game.currentEvent?.dialogues && 
                                this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                                this.game.elements.dialogText.textContent = 
                                    this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                            }
                            return;
                        }
                        
                        
                        this.game.currentDialogIndex++;
                        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                            this.showCurrentDialog();
                        } else {
                            this.game.showContinueButton('继续', () => this.endEvent());
                        }
                    };
                    
                    gameScreen.addEventListener('click', forceHandler);
                    console.log('[State Analysis] Added a one-time force click listener');
                }
            }, 100);
        }
        
        console.log('[State Analysis] ====== Weekend event state analysis completed ======');
    }
    
        async endEvent() {
        this.debug('Weekend event processor: Ending event');
        
        
        this.game.hasEventEnded = true;
        this.game.isEventEnding = true;
        
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            
            if (this.hasCompletedQuiz && this.game.currentEvent.branches && !this.hasProcessedBranches) {
                this.debug(`Quiz completed, score: ${this.quizScore}, processing branch dialogues`);
                
                
                this.hasProcessedBranches = true;
                
                
                let selectedBranch = null;
                
                
                for (const branch of this.game.currentEvent.branches.sort((a, b) => b.minScore - a.minScore)) {
                    if (this.quizScore >= branch.minScore) {
                        selectedBranch = branch;
                        break;
                    }
                }
                
                if (selectedBranch) {
                    this.debug(`Selected branch, minimum score requirement: ${selectedBranch.minScore}`);
                    
                    
                    if (selectedBranch.stats) {
                        this.debug(`Update game state: ${JSON.stringify(selectedBranch.stats)}`);
                        
                        
                        if (selectedBranch.stats.fans > 0 || selectedBranch.stats.reputation > 0) {
                            this.game.playGrowSound();
                        }
                        
                        Object.keys(selectedBranch.stats).forEach(key => {
                            const gameStateKey = this.game.mapStatKey(key);
                            if (gameStateKey) {
                                this.game.gameState[gameStateKey] += selectedBranch.stats[key];
                                this.debug(`Update ${gameStateKey}: ${this.game.gameState[gameStateKey]}`);
                            }
                        });
                        this.game.updateStatusBar();
                        await this.game.saveGameState();
                    }
                    
                    
                    if (selectedBranch.dialogues && selectedBranch.dialogues.length > 0) {
                        this.debug('Displaying branch dialogues');
                        
                        
                        this.game.isEventEnding = false;
                        this.game.hasEventEnded = false;
                        
                        
                        this.isProcessingBranchDialogues = true;
                        
                        
                        this.game.currentEvent.dialogues = selectedBranch.dialogues;
                        this.game.currentDialogIndex = 0;
                        
                        
                        document.removeEventListener('click', this.boundHandleClick);
                        
                        
                        setTimeout(() => {
                            document.addEventListener('click', this.boundHandleClick);
                            this.debug('Branch dialogue: Rebound click event listener');
                            
                            
                            this.showCurrentDialog();
                            
                            
                            this.forceEnableClickHandler();
                        }, 50);
                        
                        return;
                    }
                }
            }
            
            
            if (this.game.currentEvent && this.game.currentEvent.id) {
                if (!this.game.gameState.completed_events.includes(this.game.currentEvent.id)) {
                    this.game.gameState.completed_events.push(this.game.currentEvent.id);
                    this.debug(`Completed events list: ${this.game.gameState.completed_events.join(', ')}`);
                }
                await this.game.saveGameState();
            }
            
            
            this.resetState();
            
            
            if (this.game.currentEvent && this.game.currentEvent.summary && this.game.currentEvent.summary.trim() !== '') {
                this.debug(`Display event summary: ${this.game.currentEvent.summary}`);
                
                // 半透明角色提示
                this.game.elements.characterLeft.style.opacity = '0.5';
                this.game.elements.characterRight.style.opacity = '0.5';
                
                
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                
                this.game.showEventSummaryUI(this.game.currentEvent.summary);
                return;
            }
            
            
            this.debug('Weekend event ended, starting a new day');
            setTimeout(() => this.game.startNewDay(), 200);
            
        } catch (error) {
            console.error('Weekend event end processing error:', error);
            
            
            setTimeout(() => this.game.startNewDay(), 200);
        }
    }
    
        forceEnableClickHandler() {
        
        document.removeEventListener('click', this.boundHandleClick);
        document.addEventListener('click', this.boundHandleClick);
        
        console.log('[Force Fix] Weekend event click handler reset');
        
        
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            const onceClickHandler = (e) => {
                
                if (e.target.tagName === 'BUTTON') return;
                
                console.log('[Force Fix] Weekend event one-time click listener triggered');
                
                
                gameScreen.removeEventListener('click', onceClickHandler);
                
                
                if (this.game.isTyping) {
                    this.game.isTyping = false;
                    this.game.currentTypingId = null;
                    
                    if (this.game.currentEvent && this.game.currentEvent.dialogues && 
                        this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        this.game.elements.dialogText.textContent = 
                            this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                    }
                    return;
                }
                
                
                if (this.game.currentEvent && this.game.currentEvent.dialogues) {
                    this.game.currentDialogIndex++;
                    
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        this.showCurrentDialog();
                    } else {
                        
                        this.game.showContinueButton('Continue', () => this.endEvent());
                    }
                }
            };
            
            
            gameScreen.addEventListener('click', onceClickHandler);
        }
    }
    
        startType2Quiz() {
        this.debug('Starting 90-second countdown');
        this.hasStartedQuiz = true;
        this.currentHotness = 100;
        
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const quizContainer = document.getElementById('quiz-container');
        timerContainer.style.display = 'block';
        quizContainer.style.display = 'block';
        timerContainer.style.zIndex = '2001';
        quizContainer.style.zIndex = '2001';
        
        
        let hotDiv = document.getElementById('hotness-display');
        if (!hotDiv) {
            hotDiv = document.createElement('div');
            hotDiv.id = 'hotness-display';
            Object.assign(hotDiv.style, {
                position: 'absolute', top: '20px', left: '20px',
                color: '#e74c3c', fontSize: '1.2em', fontWeight: 'bold'
            });
            quizContainer.appendChild(hotDiv);
            
            
            const hotIcon = document.createElement('img');
            hotIcon.src = '/static/images/Hot.png';
            hotIcon.id = 'hot-icon';
            Object.assign(hotIcon.style, {
                width: '40px',
                height: '40px',
                marginRight: '10px',
                verticalAlign: 'middle',
                animation: 'pulse-animation 1.5s infinite, shake-animation 3s infinite'
            });
            
            
            if (!document.getElementById('hot-animations')) {
                const styleElem = document.createElement('style');
                styleElem.id = 'hot-animations';
                styleElem.textContent = `
                    @keyframes pulse-animation {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                        100% { transform: scale(1); }
                    }
                    @keyframes shake-animation {
                        0%, 100% { transform: translateX(0); }
                        5%, 25% { transform: translateX(-3px) rotate(-2deg); }
                        10%, 30% { transform: translateX(3px) rotate(2deg); }
                        15% { transform: translateX(-3px) rotate(-1deg); }
                        20% { transform: translateX(3px) rotate(1deg); }
                    }
                `;
                document.head.appendChild(styleElem);
            }
            
            
            const hotContainer = document.createElement('div');
            hotContainer.style.display = 'flex';
            hotContainer.style.alignItems = 'center';
            hotContainer.appendChild(hotIcon);
            
            const hotText = document.createElement('span');
            hotText.textContent = `Hotness: ${this.currentHotness}`;
            hotContainer.appendChild(hotText);
            
            hotDiv.appendChild(hotContainer);
        }
        hotDiv.textContent = `Hotness: ${this.currentHotness}`;
        
        
        let timeLeft = 90;
        const timerBar = document.getElementById('quiz-timer-bar');
        timerBar.style.width = '100%';
        if (this.type2Timer) clearInterval(this.type2Timer);
        this.type2Timer = setInterval(() => {
            timeLeft--;
            timerBar.style.width = (timeLeft/90*100) + '%';
            if (timeLeft <= 0) {
                clearInterval(this.type2Timer);
                this.hasCompletedQuiz = true;
                this.hasStartedQuiz = false;
                
                document.getElementById('quiz-timer-bar-container').style.display = 'none';
                document.getElementById('quiz-container').style.display = 'none';
                this.endEvent();
            }
        }, 1000);
        
        
        this.displayType2Question();
    }
    
        displayType2Question() {
        const quiz = this.game.currentEvent.quiz;
        const total = quiz.questions.length;
        const idx = Math.floor(Math.random() * total);
        const q = quiz.questions[idx];
        const qText = document.getElementById('quiz-question-text');
        const choicesElem = document.getElementById('quiz-question-choices');
        qText.textContent = q.text;
        choicesElem.innerHTML = '';
        q.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.className = 'choice-button';
            btn.addEventListener('click', () => {
                
                this.currentHotness = Math.round(this.currentHotness * choice.multiplier);
                const hotDiv = document.getElementById('hotness-display');
                if (hotDiv) hotDiv.textContent = `Hotness: ${this.currentHotness}`;

                
                if (this.currentHotness <= 0) {
                    clearInterval(this.type2Timer);
                    this.hasCompletedQuiz = true;
                    this.hasStartedQuiz = false;
                    
                    document.getElementById('quiz-timer-bar-container').style.display = 'none';
                    document.getElementById('quiz-container').style.display = 'none';
                    
                    this.endEvent();
                    return;
                }

                
                this.displayType2Question();
            }, { once: true });
            choicesElem.appendChild(btn);
        });
    }

    showChoices(choices) {
        
        this.game.playPromptSound();
        
        
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'choices';
        choicesContainer.id = 'weekend-choices';
        
        
        Object.assign(choicesContainer.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(34, 34, 34, 0.95)',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            zIndex: '9999',
            minWidth: '300px',
            maxWidth: '80%'
        });
        
        
        const title = document.createElement('div');
        title.textContent = 'Please select:';
        title.style.fontSize = '20px';
        title.style.fontWeight = 'bold';
        title.style.color = 'white';
        title.style.marginBottom = '15px';
        title.style.textAlign = 'center';
        choicesContainer.appendChild(title);
        
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'choice-button';
            button.style.display = 'block';
            button.style.width = '100%';
            button.style.padding = '10px 15px';
            button.style.margin = '10px 0';
            button.style.backgroundColor = '#3498db';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.color = 'white';
            button.style.fontSize = '16px';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.3s ease';
            
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#2980b9';
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#3498db';
                button.style.transform = 'scale(1)';
            });
            
            button.addEventListener('click', () => {
                
                this.game.playClickSound();
                
                
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
                overlay.style.zIndex = '9998';
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                document.body.appendChild(overlay);
                
                requestAnimationFrame(() => {
                    overlay.style.opacity = '1';
                    setTimeout(() => {
                        
                        this.handleChoice(index, choice);
                        
                        choicesContainer.remove();
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            overlay.remove();
                        }, 300);
                    }, 300);
                });
            });
            
            choicesContainer.appendChild(button);
        });
        
        
        document.body.appendChild(choicesContainer);
        
        
        choicesContainer.style.opacity = '0';
        choicesContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
        choicesContainer.style.transition = 'all 0.3s ease';
        
        requestAnimationFrame(() => {
            choicesContainer.style.opacity = '1';
            choicesContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    }

    forceClearAndShowChoices(choices) {
        this.debug('Force clearing and displaying options');
        
        
        this.game.playPromptSound();
        
        
        this.game.clearAllChoices();
        
        
        this.showChoices(choices);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[Weekend Event] Game instance found, preparing to inject weekend event processor');
            
            
            enhanceGameWithWeekendHandler();
        }
    }, 100);
});

function enhanceGameWithWeekendHandler() {
    
    window.currentGame.weekendHandler = new WeekendEventHandler(window.currentGame);
    
    
    window.currentGame.loadWeekendEvent = async function() {
        console.log('[Weekend Event] Using dedicated processor to load weekend event');
        return await window.currentGame.weekendHandler.loadEvent();
    };
    
    
    const originalInit = window.currentGame.init;
    window.currentGame.init = async function() {
        await originalInit.call(this);
        
        
        if (this.gameState && (this.gameState.day === 6 || this.gameState.day === 13)) {
            console.log(`[Weekend Event] Detected day ${this.gameState.day}, attempting to load weekend event`);
            try {
                await this.loadWeekendEvent();
            } catch (error) {
                console.error('[Weekend Event] Loading failed:', error);
            }
        }
    };
    
    
    const originalHandleNextEventSteps = window.currentGame.handleNextEventSteps;
    if (originalHandleNextEventSteps) {
        window.currentGame.handleNextEventSteps = function() {
            
            if (this.currentEvent && this.currentEvent.type === 'weekend') {
                console.log('[Weekend Event] Weekend event ended, starting a new day');
                setTimeout(() => this.startNewDay(), 200);
                return;
            }
            
            
            return originalHandleNextEventSteps.call(this);
        };
    }
    
    console.log('[Weekend Event] Weekend event processor injection completed');
} 