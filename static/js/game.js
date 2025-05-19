class Game {
    constructor() {
        this.gameState = null;
        this.currentEvent = null;
        this.currentDialogIndex = 0;
        this.typingSpeed = 30;
        this.isTyping = false;
        this.debugMode = true;
        this.currentTypingId = null;

        this.isEventEnding = false;
        this.hasEventEnded = false;
        this.isProcessingChoice = false;
        this.hasStartedQuiz = false; 
        this.hasCompletedQuiz = false;
        this.hasProcessedBranches = false;
        this.isProcessingBranchDialogues = false;
        this.choicesAlreadyShown = false;
        this.quizQuestions = [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        this.quizQuestionTimer = null;
        
        
        this.sounds = {
            click: [
                new Audio('/static/sounds/click1.mp3'),
                new Audio('/static/sounds/click2.mp3'),
                new Audio('/static/sounds/click3.mp3'),
                new Audio('/static/sounds/click4.mp3')
            ],
            grow: new Audio('/static/sounds/grow.mp3'),
            prompt: new Audio('/static/sounds/prompt.mp3'),
            backgroundMusic: null
        };

        this.elements = {
            background: document.getElementById('background'),
            characterLeft: document.getElementById('character-left'),
            characterRight: document.getElementById('character-right'),
            speakerName: document.getElementById('speaker-name'),
            dialogText: document.getElementById('dialog-text'),
            choices: document.getElementById('choices'),
            fansCount: document.getElementById('fans-count'),
            healthValue: document.getElementById('health-value'),
            socialValue: document.getElementById('social-value'),
            securityValue: document.getElementById('safety-awareness-value'),
            dayCount: document.getElementById('day-count')
        };

        this.dialogBox = this.elements.choices.parentNode;

        this.init();
    }

        debug(message) {
        if (this.debugMode) {
            
            const isWeekendEvent = this.currentEvent && this.currentEvent.type === 'weekend';
            
            
            const prefix = isWeekendEvent ? '[WEEKEND]' : '[DEBUG]';
            
            
            let detailInfo = '';
            if (isWeekendEvent) {
                detailInfo = ` (Dialog Index:${this.currentDialogIndex}, Total Dialogs:${this.currentEvent?.dialogues?.length || 0}, Quiz:${this.hasStartedQuiz ? 'Started' : 'Not Started'})`;
            }
            
            console.log(`${prefix} ${message}${detailInfo}`);
        }
    }

    /**
     * Clear all choice areas to prevent duplicate display
     */
    clearAllChoices() {
        this.debug('Clear all choice areas');
        
        // Find all possible choice containers
        const allChoiceContainers = document.querySelectorAll('.choices, [id^=choices]');
        
        // Remove each container
        allChoiceContainers.forEach(container => {
            try {
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            } catch (e) {
                console.error('Error removing choice container:', e);
            }
        });
        
        // Remove choice overlays
        const overlays = document.querySelectorAll('.choice-overlay');
        overlays.forEach(overlay => {
            try {
                if (overlay && document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            } catch (e) {
                console.error('Error removing choice overlay:', e);
            }
        });
        
        // Remove fixed position choice containers
        const fixedContainers = document.querySelectorAll('.choice-container-fixed');
        fixedContainers.forEach(container => {
            try {
                if (container && document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            } catch (e) {
                console.error('Error removing fixed choice container:', e);
            }
        });
        
        // Ensure last created choice is cleared
        this.elements.choices = null;
    }

    /**
     * 
     * @returns {Promise<void>}
     */
    async showDayTransition() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'black', opacity: '0', transition: 'opacity 1s ease',
                zIndex: '2000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
            });
            const text = document.createElement('div');
            text.textContent = `Day ${this.gameState.day}`;
            Object.assign(text.style, {
                color: 'white', fontSize: '4rem', fontWeight: 'bold',
                opacity: '0', transition: 'opacity 1s ease'
            });
            overlay.appendChild(text);
            document.body.appendChild(overlay);
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                text.style.opacity = '1';
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    text.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        resolve();
                    }, 1000);
                }, 1000);
            });
        });
    }

    /**
     * 
     * @returns {HTMLElement} 
     */
    createChoicesContainer() {
        this.debug('Create new choice area');
        
        this.clearAllChoices();
        
        const oldOverlay = document.querySelector('.choice-overlay');
        if (oldOverlay) {
            oldOverlay.remove();
            this.debug('Remove old overlay');
        }
        
        const oldContainer = document.querySelector('.choice-container-fixed');
        if (oldContainer) {
            oldContainer.remove();
            this.debug('Remove old choice container');
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.padding = '0';
        overlay.style.margin = '0';
        overlay.style.boxSizing = 'border-box';
        
        document.body.appendChild(overlay);
        
        // Create container div to hold both options and heat bar
        const containerWrapper = document.createElement('div');
        containerWrapper.className = 'choice-wrapper-fixed';
        containerWrapper.style.position = 'fixed';
        containerWrapper.style.top = '50%';
        containerWrapper.style.left = '50%';
        containerWrapper.style.transform = 'translate(-50%, -50%)';
        containerWrapper.style.display = 'flex';
        containerWrapper.style.flexDirection = 'row'; 
        containerWrapper.style.alignItems = 'center';
        containerWrapper.style.gap = '50px'; 
        containerWrapper.style.zIndex = '10000';
        document.body.appendChild(containerWrapper);
        
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'choices choice-container-fixed';
        choicesContainer.id = 'choices-' + Date.now();
        choicesContainer.style.backgroundColor = 'rgba(34, 34, 34, 0.95)';
        choicesContainer.style.borderRadius = '10px';
        choicesContainer.style.padding = '25px';
        choicesContainer.style.display = 'flex';
        choicesContainer.style.flexDirection = 'column';
        choicesContainer.style.gap = '15px';
        choicesContainer.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.7)';
        choicesContainer.style.textAlign = 'center';
        choicesContainer.style.width = 'auto';
        choicesContainer.style.minWidth = '300px';
        choicesContainer.style.maxWidth = '80%';
        
        containerWrapper.appendChild(choicesContainer);
        
        this.elements.choices = choicesContainer;
        
        const title = document.createElement('div');
        title.textContent = 'Please choose:';
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.color = 'white';
        title.style.marginBottom = '20px';
        title.style.textShadow = '0px 2px 4px rgba(0,0,0,0.5)';
        choicesContainer.appendChild(title);
        
        choicesContainer.style.opacity = '0';
        choicesContainer.style.transform = 'scale(0.9)';
        choicesContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            choicesContainer.style.opacity = '1';
            choicesContainer.style.transform = 'scale(1)';
        }, 50);
        
        return choicesContainer;
    }

    /**
     * 
     * @param {string} text 
     * @param {Function} callback 
     */
    showContinueButton(text, callback) {
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('Event has ended or is ending, not showing continue button');
            return;
        }
        this.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        const overlay = document.createElement('div');
        overlay.id = 'continue-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: '1001', cursor: 'pointer'
        });
        let allowClick = false;
        setTimeout(() => { allowClick = true; }, 1000);
        const imgBtn = document.createElement('img');
        imgBtn.src = '/static/images/continue.png';
        imgBtn.style.cssText = 'width:150px;transition:transform 0.4s ease-out;';
        imgBtn.style.transform = 'translateY(100vh) scale(1)';
        requestAnimationFrame(() => {
            imgBtn.style.transform = 'translateY(0) scale(1)';
        });
        imgBtn.addEventListener('mouseenter', () => imgBtn.style.transform = 'translateY(0) scale(1.2)');
        imgBtn.addEventListener('mouseleave', () => imgBtn.style.transform = 'translateY(0) scale(1)');
        const onOverlayClick = (e) => {
            e.stopPropagation();
            if (!allowClick) return;
            
            // Play click sound
            this.playClickSound();
            
            overlay.removeEventListener('click', onOverlayClick);
            overlay.remove();
            try {
                if (typeof callback === 'function') callback();
            } catch (err) {
                console.error('Continue callback error:', err);
            }
        };
        overlay.addEventListener('click', onOverlayClick);
        overlay.appendChild(imgBtn);
        document.body.appendChild(overlay);
    }

    /**
     * 
     * @param {Array} choices 
     */
    showChoices(choices) {
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('Event has ended or is ending, not showing choices');
            return;
        }
        
        if (!choices || choices.length === 0) {
            this.debug('No valid choices to display');
            return;
        }
        
        // Play prompt sound
        this.playPromptSound();
        
        const choicesContainer = this.createChoicesContainer();
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.id = 'choice-button-' + index + '-' + Date.now();
            button.style.padding = '15px 20px';
            button.style.backgroundColor = '#3498db';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.fontSize = '18px';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.3s ease';
            button.style.textAlign = 'center';
            button.style.width = '100%';
            button.style.marginBottom = '10px';
            button.style.fontWeight = 'bold';
            button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#2980b9';
                button.style.transform = 'scale(1.05)';
                button.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#3498db';
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            });
            
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Play click sound
                this.playClickSound();
                
                if (this.isProcessingChoice) {
                    this.debug('Processing choice, ignoring duplicate click');
                    return;
                }
                
                this.isProcessingChoice = true;
                
                button.style.transform = 'scale(0.95)';
                button.style.opacity = '0.8';
                
                setTimeout(() => {
                    const overlay = document.querySelector('.choice-overlay');
                    const container = document.querySelector('.choice-container-fixed');
                    const wrapper = document.querySelector('.choice-wrapper-fixed');
                    
                    if (overlay) overlay.style.opacity = '0';
                    if (container) container.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (overlay && document.body.contains(overlay)) document.body.removeChild(overlay);
                        if (wrapper && document.body.contains(wrapper)) document.body.removeChild(wrapper);
                
                        this.handleChoice(index);
                    }, 300);
                }, 150);
            }, { once: true });
            
            choicesContainer.appendChild(button);
        });
        
        const overlay = document.querySelector('.choice-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.debug('Clicked choice overlay, but not processing');
            });
        }
    }

    /**
     * 
     */
    async init() {
        this.debug('Initializing game');
        
        try {
            this.boundHandleClick = this.handleClick.bind(this);
            
            const response = await fetch('/get_game_state');
            this.gameState = await response.json();
            this.debug('Game state:' + JSON.stringify(this.gameState));
            
            this.updateStatusBar();
            
            // Check for pending fan growth animation from previous day
            const fanGrowthData = sessionStorage.getItem('fanGrowth');
            if (fanGrowthData) {
                const { previousFans, growthAmount } = JSON.parse(fanGrowthData);
                // Clear the data so it's not shown again
                sessionStorage.removeItem('fanGrowth');
                
                // Wait for 4 seconds before showing the fan growth animation
                setTimeout(() => {
                    this.showFanGrowthAnimation(previousFans, growthAmount);
                }, 1500);
            }
            
            if (this.gameState.day >= 20) {
                this.debug(`Detected day ${this.gameState.day}, waiting for ending event handler to load`);
                await this.showDayTransition();
                return;
            }
            
            await this.showDayTransition();

            try {
                if (this.gameState.force_event_type) {
                    this.debug('Forcing event type:' + this.gameState.force_event_type);
                    const eventType = this.gameState.force_event_type;
                    
                    delete this.gameState.force_event_type;
                    delete this.gameState.force_event_id;
                    await this.saveGameState();
                    
                    await this.loadSpecificEvent(eventType);
                    return;
                }
                
                if (this.gameState.day === 6 || this.gameState.day === 13) {
                    this.debug(`Day ${this.gameState.day}, trying to load weekend event`);
                    try {
                        await this.loadWeekendEvent();
                        return;
                    } catch (error) {
                        console.error('Failed to load weekend event:', error);
                    }
                }
                
                await this.loadMorningEvent();
            } catch (error) {
                console.error('Failed to initialize event loading:', error);
                await this.loadMorningEvent();
            }

            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            
            this.debug('Game initialization complete');
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }

        updateStatusBar() {
        this.elements.fansCount.textContent = this.gameState.fans;
        this.elements.healthValue.textContent = this.gameState.health;
        this.elements.socialValue.textContent = this.gameState.social;
        this.elements.securityValue.textContent = this.gameState.security;
        this.elements.dayCount.textContent = this.gameState.day;
        
        if (this.lastFansCount && this.lastFansCount < this.gameState.fans) {
            this.showFanGrowthAnimation(this.lastFansCount, this.gameState.fans - this.lastFansCount);
        }
        
        this.lastFansCount = this.gameState.fans;
    }

        async loadMorningEvent() {
        this.debug('Loading morning event');
        
        try {
            const response = await fetch('/get_event/morning');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            this.currentEvent = await response.json();
            
            if (this.currentEvent && !this.currentEvent.error) {
                this.currentEvent.type = 'morning';
                this.currentDialogIndex = 0;
                this.hasEventEnded = false;
                this.isEventEnding = false;
                this.debug('Successfully loaded morning event:' + this.currentEvent.id);
                this.showCurrentDialog();
            } else {
                console.error('No available morning events', this.currentEvent);
                this.elements.dialogText.textContent = 'Nothing special happened today...';
                this.elements.speakerName.textContent = 'Narrator';
                this.showContinueButton('Continue', () => this.startNewDay());
            }
        } catch (error) {
            console.error('Failed to load morning event:', error);
            this.elements.dialogText.textContent = 'Error loading event...';
            this.elements.speakerName.textContent = 'Error';
        }
    }

        async loadWeekendEvent() {
        this.debug('Loading weekend event');
        this.clearAllChoices();
        try {
            const url = `/get_event/weekend?t=${Date.now()}`;
            this.debug(`Making weekend event request: ${url}`);
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
                await this.loadMorningEvent();
                return;
            }
            
            this.debug(`Successfully loaded weekend event: ${event.id}`);
            
            event.type = 'weekend';
            this.currentEvent = event;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            this.hasStartedQuiz = false;
            this.hasCompletedQuiz = false;
            this.hasProcessedBranches = false;
            this.isProcessingBranchDialogues = false;
            this.quizScore = 0;
            
            if (!this.boundHandleClick) {
                this.boundHandleClick = this.handleClick.bind(this);
            }
            
            document.removeEventListener('click', this.boundHandleClick);
            
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                this.debug('Weekend event: Rebinding click listener');
                this.showCurrentDialog();
            }, 50);
            
            return true;
        } catch (error) {
            console.error('Failed to load weekend event:', error);
            this.loadMorningEvent();
            throw error;
        }
    }

        analyzeAndResetEventState() {
        console.log('[State Diagnostic] ====== Starting Event State Analysis ======');
        
        console.log(`[State Diagnostic] Current event type: ${this.currentEvent?.type || 'No event'}`);
        console.log(`[State Diagnostic] Current dialog index: ${this.currentDialogIndex}`);
        console.log(`[State Diagnostic] Total dialog count: ${this.currentEvent?.dialogues?.length || 0}`);
        
        console.log(`[State Diagnostic] Event ending state: hasEventEnded=${this.hasEventEnded}, isEventEnding=${this.isEventEnding}`);
        console.log(`[State Diagnostic] Quiz state: hasStartedQuiz=${this.hasStartedQuiz}, hasCompletedQuiz=${this.hasCompletedQuiz}`);
        console.log(`[State Diagnostic] Branch dialog state: isProcessingBranchDialogues=${this.isProcessingBranchDialogues || false}`);
        
        console.log(`[State Diagnostic] Click handler: boundHandleClick=${!!this.boundHandleClick}`);
        
        console.log('[State Diagnostic] Resetting click handler...');
        
        if (this.currentEvent && (this.currentEvent.type === 'weekend') && 
            this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            
            this.hasEventEnded = false;
            this.isEventEnding = false;
            
            if (!this.boundHandleClick) {
                this.boundHandleClick = this.handleClick.bind(this);
            }
            
            document.removeEventListener('click', this.boundHandleClick);
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                console.log('[State Diagnostic] Rebound click handler');
                
                const gameScreen = document.querySelector('.game-screen');
                if (gameScreen) {
                    const forceHandler = (e) => {
                        if (e.target.tagName === 'BUTTON') return;
                        
                        gameScreen.removeEventListener('click', forceHandler);
                        
                        console.log('[State Diagnostic] One-time force click handler triggered');
                        
                        if (this.isTyping) {
                            this.isTyping = false;
                            this.currentTypingId = null;
                            if (this.currentEvent?.dialogues && 
                                this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                this.elements.dialogText.textContent = 
                                    this.currentEvent.dialogues[this.currentDialogIndex].text;
                            }
                            return;
                        }
                        
                        this.currentDialogIndex++;
                        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                            this.showCurrentDialog();
                        } else {
                            this.showContinueButton('Continue', () => this.endEvent());
                        }
                    };
                    gameScreen.addEventListener('click', forceHandler);
                    console.log('[State Diagnostic] Added one-time force click handler');
                }
            }, 100);
        }
        
        console.log('[State Diagnostic] ====== Event State Analysis Complete ======');
    }

        showCurrentDialog() {
        if (this.currentDialogIndex >= this.currentEvent.dialogues.length) {
            this.debug('Dialog index out of range, ending dialog');
            return;
        }
        
        const dialog = this.currentEvent.dialogues[this.currentDialogIndex];
        this.debug(`Showing dialog: ${this.currentDialogIndex + 1}/${this.currentEvent.dialogues.length}`);
        
        if (this.currentEvent.background && this.currentDialogIndex === 0) {
            const bgPath = `/static/images/${this.currentEvent.background}`;
            this.setBackgroundImage(bgPath);
        }
        
        this.updateCharacters(dialog);
        
        const speakerName = dialog.character.split('_')[0];
        this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
        
        
        this.currentTypingId = null;
        this.isTyping = false;
        
        
        setTimeout(() => {
            this.typeText(dialog.text);
        }, 10);
        
        const isLastDialog = (this.currentDialogIndex === this.currentEvent.dialogues.length - 1);
        
        if (isLastDialog && this.currentEvent.type === 'weekend' && this.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('Weekend event: Last dialog, preparing to switch to quiz section');
            setTimeout(() => {
                this.showContinueButton('Continue to Quiz', () => {
                    this.debug('Weekend event: Continue clicked, preparing to enter quiz section');
                    const contOv = document.getElementById('continue-overlay'); 
                    if (contOv) contOv.remove();
                    this.clearAllChoices();
                    this.showQuizQuestion();
                });
            }, 100);
            return;
        }
        
        this.clearAllChoices();
        
        if (isLastDialog) {
            if (this.currentEvent.choices && this.currentEvent.choices.length > 0 && !this.choicesAlreadyShown) {
                if (this.regularHandler && typeof this.regularHandler.forceClearAndShowChoices === 'function') {
                    this.debug('Using regularHandler.forceClearAndShowChoices to display choices');
                setTimeout(() => {
                        this.regularHandler.forceClearAndShowChoices(this.currentEvent.choices);
                }, 100);
            } else {
                    setTimeout(() => {
                        this.showChoices(this.currentEvent.choices);
                    }, 100);
                }
            } else if (!this.choicesAlreadyShown) {
                setTimeout(() => {
                    this.showContinueButton('Continue', () => {
                        this.debug('Continue button clicked, ending event');
                        this.endEvent();
                    });
                }, 100);
            } else {
                this.debug('Choices already displayed by other handler, not showing again');
            }
        }
    }

        formatSpeakerName(name) {
        switch(name) {
            case 'narrator':
                return 'Narrator';
            case 'System':
            case 'System_notification':
                return 'System';
            default:
                return name;
        }
    }

        setBackgroundImage(imagePath) {
        console.log(`Loading background image: ${imagePath}`, new Error().stack);
        
        let adjustedPath = imagePath;
        if (imagePath.includes('school.png') || 
            imagePath.includes('day7.png') || 
            imagePath.includes('day14.png')) {
        }
        
        const img = new Image();
        img.onload = () => {
            console.log(`Successfully loaded background image: ${adjustedPath}`);
            this.elements.background.style.backgroundImage = `url(${adjustedPath})`;
        };
        img.onerror = (e) => {
            console.error(`Unable to load background image: ${adjustedPath}`, e);
            
            this.elements.background.style.backgroundColor = '#000';
        };
        img.src = adjustedPath;
    }

        updateCharacters(dialog) {
        const characterName = dialog.character.split('_')[0];
        const characterMood = dialog.character.split('_')[1] || 'neutral';
        
        this.elements.characterLeft.style.backgroundImage = '';
        this.elements.characterRight.style.backgroundImage = '';
        this.elements.characterLeft.style.background = 'none';
        this.elements.characterRight.style.background = 'none';
        
        if (characterName === 'narrator' || characterName === 'System' || characterName === 'System_notification') {
            this.elements.characterLeft.style.opacity = '0.5';
            this.elements.characterRight.style.opacity = '0.5';
            return;
        }

        const defaultImage = '/static/images/characters/default.png';
        let characterImage;

        // Map character names to exact file names
        const characterMap = {
            'zack': 'Zack',
            'aether': 'Aether',
            'mom': 'Mom',
            'tiktok': 'Tiktok',
            'tiktok_user': 'Tiktok_user',
            'mrswilliam': 'MrsWilliam',
            'bob': 'Bob',
            'derek': 'Derek',
            'evezack': 'Evezack',
            'lisa': 'Lisa',
            'louis': 'Louis',
            'unknown': 'Unknow',
            'unnamed': 'Unnamed',
            'ad': 'Ad'
        };

        const normalizedCharacterName = characterName.toLowerCase();
        const mappedName = characterMap[normalizedCharacterName] || characterName;
        const normalizedMood = characterMood.toLowerCase();

        characterImage = `/static/images/characters/${mappedName}_${normalizedMood}.png`;
        console.log(`Loading character image: ${characterImage}`);

        if (normalizedCharacterName === 'zack') {
            this.elements.characterLeft.style.opacity = '1';
            this.elements.characterRight.style.opacity = '0.5';
            this.setCharacterImage(this.elements.characterLeft, characterImage, defaultImage);
        } else if (normalizedCharacterName === 'tiktok' || normalizedCharacterName === 'tiktok_user') {
            this.elements.characterLeft.style.opacity = '0.5';
            this.elements.characterRight.style.opacity = '1';
            this.setCharacterImage(this.elements.characterRight, characterImage, '/static/images/characters/Tiktok_user_neutral.png');
        } else {
            this.elements.characterLeft.style.opacity = '0.5';
            this.elements.characterRight.style.opacity = '1';
            this.setCharacterImage(this.elements.characterRight, characterImage, defaultImage);
        }
    }

    setCharacterImage(element, imagePath, defaultPath) {
        element.style.background = 'none';
        
        const loadImage = (path, retryCount = 0) => {
            const img = new Image();
            img.onload = () => {
                element.style.backgroundImage = `url(${path})`;
                element.style.backgroundSize = 'contain';
                element.style.backgroundPosition = 'center';
                element.style.backgroundRepeat = 'no-repeat';
                element.style.backgroundColor = 'transparent';
                console.log(`Successfully loaded image: ${path}`);
            };
            img.onerror = () => {
                console.log(`Failed to load image: ${path}`);
                if (retryCount === 0) {
                    const lowerPath = path.toLowerCase();
                    console.log(`Retrying with lowercase path: ${lowerPath}`);
                    loadImage(lowerPath, retryCount + 1);
                } else if (retryCount === 1) {
                    const parts = path.split('/');
                    const fileName = parts[parts.length - 1];
                    const fileNameParts = fileName.split('_');
                    const capitalizedName = fileNameParts[0].charAt(0).toUpperCase() + fileNameParts[0].slice(1).toLowerCase();
                    const capitalizedPath = parts.slice(0, -1).join('/') + '/' + capitalizedName + '_' + fileNameParts.slice(1).join('_');
                    console.log(`Retrying with capitalized name: ${capitalizedPath}`);
                    loadImage(capitalizedPath, retryCount + 2);
                } else if (retryCount === 2) {
                    const extPath = path.replace(/\.png$/i, '.PNG');
                    console.log(`Retrying with uppercase extension: ${extPath}`);
                    loadImage(extPath, retryCount + 1);
                } else {
                    console.log(`All attempts failed. Using default image: ${defaultPath}`);
                    element.style.backgroundImage = `url(${defaultPath})`;
                    element.style.backgroundSize = 'contain';
                    element.style.backgroundPosition = 'center';
                    element.style.backgroundRepeat = 'no-repeat';
                    element.style.backgroundColor = 'transparent';
                    element.classList.add('error');
                }
            };
            img.src = path;
        };

        loadImage(imagePath);
    }

        typeText(text) {
        if (!text || text.length === 0) {
            return;
        }
        
        const typingId = Symbol('typingSession');
        this.currentTypingId = typingId;
        this.isTyping = true;
        this.elements.dialogText.textContent = '';
        
        let buffer = '';
        let index = 0;
        
        const renderText = () => {
            if (this.currentTypingId !== typingId) {
                this.elements.dialogText.textContent = text;
                this.isTyping = false;
                return;
            }
            
            if (index < text.length) {
                buffer += text.charAt(index);
                this.elements.dialogText.textContent = buffer;
                index++;
                
                setTimeout(() => {
                    if (this.currentTypingId === typingId) {
                        renderText();
                    }
                }, this.typingSpeed);
            } else {
                this.isTyping = false;
            }
        };
        
        // Force a small delay before starting
        window.setTimeout(renderText, 20);
    }

    /**
     * 
     * @param {Event} e 
     */
    handleClick(e) {
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('Event has ended or is ending, ignoring click');
            return;
        }
        if (this.hasStartedQuiz) {
            this.debug('Quiz phase, ignoring click events');
            return;
        }
        
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
            this.debug('Ignoring button or overlay click');
            return;
        }
        
        
        this.playClickSound();
        
        if (this.isTyping) {
            this.debug('Accelerating text display');
            this.currentTypingId = null;
            this.isTyping = false;
            if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
            }
            return;
        }
        
        if (!this.currentEvent || !this.currentEvent.dialogues) {
            this.debug('No valid event or dialogs');
            return;
        }
        
        const isLastDialog = (this.currentDialogIndex === this.currentEvent.dialogues.length - 1);
        
        if (isLastDialog && this.currentEvent.choices && this.currentEvent.choices.length > 0) {
            this.debug('Current dialog has choices, not advancing');
            return;
        }
        
        if (isLastDialog && this.currentEvent.type === 'weekend' && this.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('Last dialog is weekend event with quiz, showing continue button');
            this.showContinueButton('Continue to Quiz', () => {
                this.debug('Weekend event: Continue clicked, preparing to enter quiz');
                const contOv = document.getElementById('continue-overlay'); 
                if (contOv) contOv.remove();
                this.clearAllChoices();
                this.showQuizQuestion();
            });
            return;
        }
        
        let isWeekendBranchDialog = false;
        if (typeof window.isWeekendBranchDialog === 'function') {
            isWeekendBranchDialog = window.isWeekendBranchDialog();
        } else {
            isWeekendBranchDialog = this.currentEvent.type === 'weekend' && this.hasCompletedQuiz && this.isProcessingBranchDialogues;
        }
        
        if (isWeekendBranchDialog) {
            this.debug(`Processing weekend branch dialog click: currentIndex=${this.currentDialogIndex}, totalDialogs=${this.currentEvent.dialogues.length}`);
            console.log(`[Branch Processing] Click handling: currentIndex=${this.currentDialogIndex}, totalDialogs=${this.currentEvent.dialogues.length}`);
        }
        
        this.debug(`Going to next dialog ${this.currentDialogIndex + 1}`);
        this.currentDialogIndex++;
        
        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
            
            this.currentTypingId = null;
            this.isTyping = false;
            
            
            setTimeout(() => {
                this.showCurrentDialog();
            }, 10);
        } else {
            this.debug('All dialogs complete');
            
            this.clearAllChoices();
            
            if (isWeekendBranchDialog) {
                this.debug('Weekend event branch dialogs all complete, preparing to end event');
                this.isProcessingBranchDialogues = false;
                
                this.hasProcessedBranches = true;
            }
            
            if (this.currentEvent.choices && this.currentEvent.choices.length > 0) {
                setTimeout(() => {
                    this.showChoices(this.currentEvent.choices);
                }, 100);
            } else {
                setTimeout(() => {
                    this.showContinueButton('Continue', () => {
                        this.debug('Continue button clicked, ending event');
                        this.endEvent();
                    });
                }, 100);
            }
        }
    }

        async handleChoice(choiceIndex) {
        try {
            if (!this.currentEvent || !this.currentEvent.choices || choiceIndex >= this.currentEvent.choices.length) {
                console.error('Invalid choice index or choices do not exist');
                this.isProcessingChoice = false;
                return;
            }
            
            const choice = this.currentEvent.choices[choiceIndex];
            this.debug(`Selected choice: ${choiceIndex}, content: ${choice.text}`);
            
            if (choice.outcome && choice.outcome.stats) {
                this.debug(`Updating game state: ${JSON.stringify(choice.outcome.stats)}`);
                Object.keys(choice.outcome.stats).forEach(key => {
                    const gameStateKey = this.mapStatKey(key);
                    if (gameStateKey) {
                        this.gameState[gameStateKey] += choice.outcome.stats[key];
                        this.debug(`Updated ${gameStateKey}: ${this.gameState[gameStateKey]}`);
                    }
                });
                this.updateStatusBar();
                await this.saveGameState();
            }

            this.clearAllChoices();
            document.removeEventListener('click', this.boundHandleClick);
            
            if (choice.outcome && choice.outcome.dialogues && choice.outcome.dialogues.length > 0) {
                this.debug(`Showing dialogues after choice, count: ${choice.outcome.dialogues.length}`);
                
                this.currentEvent.dialogues = choice.outcome.dialogues;
                this.currentDialogIndex = 0;
                
                const handleOutcomeDialogs = (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        return;
                    }
                    
                    if (this.isTyping) {
                        this.debug('Accelerating text display');
                        this.isTyping = false;
                        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                            this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                        }
                        return;
                    }
                    
                    this.debug('Click to continue dialogue');
                    this.currentDialogIndex++;
                    
                    if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                        const dialog = this.currentEvent.dialogues[this.currentDialogIndex];
                        
                        this.updateCharacters(dialog);
                        
                        const speakerName = dialog.character.split('_')[0];
                        this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
                        
                        this.typeText(dialog.text);
                    } else {
                        this.debug('Dialogues after choice completed');
                        
                        document.removeEventListener('click', handleOutcomeDialogs);
                        
                        this.clearAllChoices();
                        setTimeout(() => {
                            this.showContinueButton('Continue', () => {
                                this.debug('Continue button clicked, ending event');
                                this.endEvent();
                            });
                        }, 100);
                    }
                };
                
                document.addEventListener('click', handleOutcomeDialogs);
                
                const dialog = this.currentEvent.dialogues[0];
                
                this.updateCharacters(dialog);
                
                const speakerName = dialog.character.split('_')[0];
                this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
                
                this.typeText(dialog.text);
            } else {
                this.debug('Choice has no follow-up dialogues, ending event directly');
                this.endEvent();
            }
        } catch (error) {
            console.error('Error handling choice:', error);
        } finally {
            this.isProcessingChoice = false;
        }
    }

        mapStatKey(statKey) {
        const mapping = {
            'privacy': 'security',
            'safety_awareness': 'security',
            'privacy_awareness': 'security',
            'mental_health': 'health',
            'social_awareness': 'social',
            'tech_savvy': 'security',
            'reputation': 'fans'
        };
        return mapping[statKey] || statKey;
    }

        async saveGameState() {
        this.debug('Saving game state');
        try {
            const response = await fetch('/update_game_state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.gameState)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const result = await response.json();
            this.debug(`Successfully saved game state: ${JSON.stringify(result)}`);
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }

        async endEvent() {
        this.debug('Formally ending event');
        
        this.hasEventEnded = true;
        this.isEventEnding = true;
        
        this.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            if (this.currentEvent && this.currentEvent.type === 'weekend' && 
                this.hasCompletedQuiz && this.currentEvent.branches && 
                !this.hasProcessedBranches) {
                
                this.debug(`Weekend event quiz completed, score: ${this.quizScore}, processing branch dialogs`);
                
                this.hasProcessedBranches = true;
                
                let selectedBranch = null;
                
                for (const branch of this.currentEvent.branches.sort((a, b) => b.minScore - a.minScore)) {
                    if (this.quizScore >= branch.minScore) {
                        selectedBranch = branch;
                        break;
                    }
                }
                
                if (selectedBranch) {
                    this.debug(`Selected branch, minimum score required: ${selectedBranch.minScore}`);
                    
                    if (selectedBranch.stats) {
                        this.debug(`Updating game state: ${JSON.stringify(selectedBranch.stats)}`);
                        Object.keys(selectedBranch.stats).forEach(key => {
                            const gameStateKey = this.mapStatKey(key);
                            if (gameStateKey) {
                                this.gameState[gameStateKey] += selectedBranch.stats[key];
                                this.debug(`Updated ${gameStateKey}: ${this.gameState[gameStateKey]}`);
                            }
                        });
                        this.updateStatusBar();
                        await this.saveGameState();
                    }
                    
                    if (selectedBranch.dialogues && selectedBranch.dialogues.length > 0) {
                        this.debug('Displaying branch dialogs');
                        
                        this.isEventEnding = false;
                        this.hasEventEnded = false;
                        
                        this.isProcessingBranchDialogues = true;
                        
                        this.currentEvent.dialogues = selectedBranch.dialogues;
                        this.currentDialogIndex = 0;
                        
                        if (!this.boundHandleClick) {
                            this.boundHandleClick = this.handleClick.bind(this);
                        }
                        
                        document.removeEventListener('click', this.boundHandleClick);
                        
                        setTimeout(() => {
                            document.addEventListener('click', this.boundHandleClick);
                            this.debug('Branch dialogs: Rebinding click event listener');
                            
                            this.showCurrentDialog();
                            
                            this.forceEnableClickHandler();
                        }, 50);
                        
                        return;
                    }
                }
            }
            
            if (this.currentEvent && this.currentEvent.id) {
                if (!this.gameState.completed_events.includes(this.currentEvent.id)) {
                    this.gameState.completed_events.push(this.currentEvent.id);
                    this.debug(`Completed events list: ${this.gameState.completed_events.join(', ')}`);
                }
                await this.saveGameState();
            }
            
            if (this.currentEvent && this.currentEvent.type === 'weekend') {
                this.hasCompletedQuiz = false;
                this.hasProcessedBranches = false;
                this.isProcessingBranchDialogues = false;
                this.debug('Reset weekend event state flags');
            }
            
            if (this.currentEvent && this.currentEvent.summary && this.currentEvent.summary.trim() !== '') {
                this.debug(`Displaying event summary: ${this.currentEvent.summary}`);
                this.elements.characterLeft.style.opacity = '0.5';
                this.elements.characterRight.style.opacity = '0.5';
                
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                this.showEventSummaryUI(this.currentEvent.summary);
                return;
            }
            
            this.handleNextEventSteps();
            
        } catch (error) {
            console.error('endEvent error:', error);
            setTimeout(() => this.startNewDay(), 200);
        }
    }
    
        handleNextEventSteps() {
        const isEndingDay = this.gameState.day >= 20;
        
        if (isEndingDay) {
            this.debug('Reached ending event trigger condition, loading ending event');
            setTimeout(() => this.loadEndingEvent(), 200);
            return;
        }
        
        if (this.currentEvent && this.currentEvent.type === 'morning') {
            this.debug('Morning event ended, loading next event');
            setTimeout(() => this.loadNextEvent(), 200);
        } else if (this.currentEvent && this.currentEvent.type === 'weekend') { 
            this.debug('Weekend event ended, starting new day');
            setTimeout(() => this.startNewDay(), 200);
        } else if (this.currentEvent && (this.currentEvent.type === 'home' || this.currentEvent.type === 'phone')) {
            this.debug('Home/phone event ended, starting new day');
            setTimeout(() => this.startNewDay(), 200);
        } else if (this.currentEvent && this.currentEvent.type === 'ending') {
            this.debug('Ending event concluded, game completed, showing end screen');
            setTimeout(() => this.showGameComplete(), 200);
        } else {
            this.debug('No triggerable events, showing bad ending');
            setTimeout(() => this.showBadEnd(), 200);
        }
    }

        forceEnableClickHandler() {
        if (!this.boundHandleClick) {
            this.boundHandleClick = this.handleClick.bind(this);
        }
        
        document.removeEventListener('click', this.boundHandleClick);
        document.addEventListener('click', this.boundHandleClick);
        
        console.log('[Force Fix] Click handler reset');
        
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            const onceClickHandler = (e) => {
                if (e.target.tagName === 'BUTTON') return;
                
                console.log('[Force Fix] One-time click handler triggered');
                
                gameScreen.removeEventListener('click', onceClickHandler);
                
                if (this.isTyping) {
                    this.isTyping = false;
                    this.currentTypingId = null;
                    if (this.currentEvent && this.currentEvent.dialogues && 
                        this.currentDialogIndex < this.currentEvent.dialogues.length) {
                        this.elements.dialogText.textContent = 
                            this.currentEvent.dialogues[this.currentDialogIndex].text;
                    }
                    return;
                }
                
                if (this.currentEvent && this.currentEvent.dialogues) {
                    this.currentDialogIndex++;
                    if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                        this.showCurrentDialog();
                    } else {
                        this.showContinueButton('Continue', () => this.endEvent());
                    }
                }
            };
            
            gameScreen.addEventListener('click', onceClickHandler);
        }
    }

        showEventSummaryUI(summary, callback) {
        const oldPanel = document.getElementById('summary-panel');
        if (oldPanel) oldPanel.remove();
        const panel = document.createElement('div');
        panel.id = 'summary-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: '0',
            transition: 'opacity 0.4s ease-out',
            width: '90%', maxHeight: '50%',
            backgroundColor: 'rgba(20,20,20,0.95)',
            borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.7)',
            color: '#fff', padding: '40px 20px 20px',
            boxSizing: 'border-box', overflow: 'visible',
            zIndex: '2001', pointerEvents: 'auto'
        });
        document.body.appendChild(panel);
        requestAnimationFrame(() => { panel.style.opacity = '1'; });
        panel.innerHTML = '';
        const imgs = [
            'Aether_warning.png','Aether_toy.png','Aether_thinking.png',
            'Aether_smile.png','Aether_relaxed.png','Aether_proud.png',
            'Aether_neutral.png','Aether_gentle.png','Aether_concerned.png'
        ];
        const chosen = imgs[Math.floor(Math.random()*imgs.length)];
        const imgElem = document.createElement('img');
        
        // 添加图片加载错误处理
        const tryLoadImage = (path, retryCount = 0) => {
            console.log(`Attempting to load summary image: ${path}`);
            const img = new Image();
            img.onload = () => {
                console.log(`Successfully loaded summary image: ${path}`);
                imgElem.src = path;
            };
            img.onerror = () => {
                console.log(`Failed to load summary image: ${path}`);
                if (retryCount === 0) {
                    
                    const parts = path.split('/');
                    const fileName = parts[parts.length - 1].toLowerCase();
                    const lowerPath = parts.slice(0, -1).join('/') + '/' + fileName;
                    console.log(`Retrying with lowercase path: ${lowerPath}`);
                    tryLoadImage(lowerPath, retryCount + 1);
                } else if (retryCount === 1) {
                    
                    const parts = path.split('/');
                    const fileName = parts[parts.length - 1];
                    const fileNameParts = fileName.split('_');
                    const capitalizedName = fileNameParts[0].charAt(0).toUpperCase() + fileNameParts[0].slice(1).toLowerCase();
                    const capitalizedPath = parts.slice(0, -1).join('/') + '/' + capitalizedName + '_' + fileNameParts.slice(1).join('_');
                    console.log(`Retrying with capitalized name: ${capitalizedPath}`);
                    tryLoadImage(capitalizedPath, retryCount + 1);
                } else if (retryCount === 2) {
                    
                    const extPath = path.replace(/\.png$/i, '.PNG');
                    console.log(`Retrying with uppercase extension: ${extPath}`);
                    tryLoadImage(extPath, retryCount + 1);
                } else {
                    console.log('All attempts to load summary image failed, using default image');
                    imgElem.src = '/static/images/characters/default.png';
                }
            };
            img.src = path;
        };

        tryLoadImage(`/static/images/characters/${chosen}`);
        
        imgElem.style.cssText = 'position:absolute; top:-260px; left:50%; transform:translateX(-50%); width:320px; height:320px; border-radius:50%; border:8px solid #fff; box-shadow:0 4px 20px rgba(0,0,0,0.5); object-fit:contain;';
        panel.appendChild(imgElem);
        const speaker = document.createElement('div');
        speaker.textContent = 'How should I do?';
        speaker.style.cssText = 'font-size:28px; font-weight:bold; text-align:center; margin-top:100px; margin-bottom:20px; text-shadow:1px 1px 2px #000;';
        panel.appendChild(speaker);
        const txt = document.createElement('div');
        txt.textContent = summary;
        txt.style.cssText = 'font-size:20px; line-height:1.6; text-align:center; padding:0 10px;';
        panel.appendChild(txt);
        const btn = document.createElement('button');
        btn.textContent = 'Continue';
        btn.className = 'choice-button';
        btn.style.cssText = 'display:block; margin:30px auto 0; padding:10px 30px; font-size:18px; background-color:#3498db; border:none; border-radius:8px; cursor:pointer;';
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 1000);
        btn.addEventListener('click', e => {
            e.stopPropagation();
            panel.style.transition = 'opacity 0.2s ease-in';
            panel.style.opacity = '0';
            panel.addEventListener('transitionend', () => {
                panel.remove();
                if (typeof callback === 'function') {
                    try { 
                        callback(); 
                    } catch(e) { 
                        console.error('Summary callback error', e); 
                        this.handleNextEventSteps();
                    }
                } else {
                    this.handleNextEventSteps();
                }
            }, { once: true });
        }, { once: true });
        panel.appendChild(btn);
    }

        async loadNextEvent() {
        this.debug('Loading next event');
        
        this.clearAllChoices();
        
        if (!this.currentEvent || this.currentEvent.type !== 'morning') {
            this.debug('loadNextEvent: Not a morning event, starting new day');
            setTimeout(() => this.startNewDay(), 200);
            return;
        }
        
        try {
            if (!this.currentEvent || !this.currentEvent.type) {
                console.error('Current event type invalid:', this.currentEvent);
                setTimeout(() => this.startNewDay(), 200);
                return;
            }

            this.debug(`Current event type: ${this.currentEvent.type}`);
            
            if (this.currentEvent.type === 'morning') {
                if (this.currentEvent.id === 'MorningEvent-14' || this.currentEvent.id === 'MorningEvent-11') {
                    this.debug('Special morning event, skipping second event and starting new day');
                    setTimeout(() => this.startNewDay(), 200);
                } else {
                    setTimeout(() => this.loadSecondEvent(), 200);
                }
            } else {
                setTimeout(() => this.startNewDay(), 200);
            }
        } catch (error) {
            console.error('Failed to load next event:', error);
            setTimeout(() => this.startNewDay(), 200);
        }
    }

        async loadSecondEvent() {
        try {
            const currentDay = this.gameState.day;
            
            async function checkDaySpecificEvent(type, day) {
                const response = await fetch(`/get_event/${type}?t=${Date.now()}&day=${day}`, {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                });
                
                if (response.ok) {
                    const event = await response.json();
                    if (!event.error && event.conditions && event.conditions.day === day) {
                        event.type = type;
                        return event;
                    }
                }
                return null;
            }
            
            const phoneEvent = await checkDaySpecificEvent('phone', currentDay);
            if (phoneEvent) {
                this.currentEvent = phoneEvent;
                this.currentDialogIndex = 0;
                this.hasEventEnded = false;
                this.isEventEnding = false;
                document.removeEventListener('click', this.boundHandleClick);
                document.addEventListener('click', this.boundHandleClick);
                this.showCurrentDialog();
                return;
            }
            
            const homeEvent = await checkDaySpecificEvent('home', currentDay);
            if (homeEvent) {
                this.currentEvent = homeEvent;
                this.currentDialogIndex = 0;
                this.hasEventEnded = false;
                this.isEventEnding = false;
                document.removeEventListener('click', this.boundHandleClick);
                document.addEventListener('click', this.boundHandleClick);
                this.showCurrentDialog();
                return;
            }
            
            const eventTypes = ['phone', 'home'];
            const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            await this.loadSpecificEvent(randomType);
            
        } catch (error) {
            console.error('Failed to load second event:', error);
            this.startNewDay();
        }
    }

    async loadSpecificEvent(type) {
        try {
            const response = await fetch(`/get_event/${type}?t=${Date.now()}`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const event = await response.json();
            if (event.error) {
                this.startNewDay();
                return;
            }
            
            event.type = type;
            this.currentEvent = event;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            this.showCurrentDialog();
        } catch (error) {
            console.error('Failed to load specific event:', error);
            this.startNewDay();
        }
    }

        showQuizQuestion() {
        this.debug('Showing quiz interface');
        document.removeEventListener('click', this.boundHandleClick);
        this.hasStartedQuiz = true;
        this.quizQuestions = this.currentEvent.quiz.questions || [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        if (this.currentEvent.quiz.background) {
            const bgPath = `/static/images/${this.currentEvent.quiz.background}`;
            this.debug(`Loading quiz background: ${bgPath}`);

            const img = new Image();
            img.onload = () => {
                this.debug('Quiz background image loaded successfully');
                this.elements.background.style.backgroundImage = `url(${bgPath})`;

                this.showQuizUI();
            };
            img.onerror = () => {
                this.debug(`Failed to load quiz background image: ${bgPath}`);

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
            this.debug('Quiz UI elements do not exist, possible DOM structure issue');
            return;
        }
        
        
        timerContainer.style.display = 'block'; 
        timerContainer.style.zIndex = '2001';
        quizContainer.style.display = 'block'; 
        quizContainer.style.zIndex = '2001';
        
        
        this.elements.characterLeft.style.opacity = '0.5';
        this.elements.characterRight.style.opacity = '0.5';
        
        this.debug('Quiz UI display complete, loading first question');
        
        
        this.displayQuizQuestion();
    }

        displayQuizQuestion() {
        console.log(`[DEBUG] Rendering question ${this.currentQuizIndex + 1}`);
        const quiz = this.currentEvent.quiz;
        const total = quiz.timer;
        let timeLeft = total;
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const timerBar = document.getElementById('quiz-timer-bar');
        const style = quiz.timerStyle || {};
        Object.assign(timerContainer.style, {
            backgroundColor: style.backgroundColor || '', borderRadius: style.borderRadius || '',
            boxShadow: style.boxShadow || '', width: style.width || timerContainer.style.width,
            height: style.height || timerContainer.style.height, margin: style.margin || ''
        });
        timerBar.style.backgroundColor = style.barColor || timerBar.style.backgroundColor;
        timerBar.style.transition = style.transition || timerBar.style.transition;
        const q = this.quizQuestions[this.currentQuizIndex];
        document.getElementById('quiz-question-text').textContent = q.text;
        const choicesElem = document.getElementById('quiz-question-choices'); choicesElem.innerHTML = '';
        q.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text; btn.className = 'choice-button';
            btn.addEventListener('click', () => {
                this.quizScore += choice.score || 0;
                clearInterval(this.quizQuestionTimer);
                this.nextQuizQuestion();
            }, { once: true });
            choicesElem.appendChild(btn);
        });
        timerBar.style.width = '100%';
        this.quizQuestionTimer = setInterval(() => {
            timeLeft--;
            const percent = (timeLeft / total) * 100;
            timerBar.style.width = percent + '%';
            if (quiz.timerStyle.halfTimeEffect?.enabled && timeLeft === Math.ceil(total / 2)) {
                const blinkColor = quiz.timerStyle.halfTimeEffect.blinkColor;
                const duration = quiz.timerStyle.halfTimeEffect.blinkDuration;
                timerBar.style.backgroundColor = blinkColor;
                setTimeout(() => { timerBar.style.backgroundColor = style.barColor; }, duration);
            }
            if (timeLeft <= 0) {
                clearInterval(this.quizQuestionTimer);
                this.nextQuizQuestion();
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
            
            document.getElementById('quiz-timer-bar-container').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'none';
            document.addEventListener('click', this.boundHandleClick);
            this.endEvent();
        }
    }

        async startNewDay() {
        this.debug('Starting new day');
        
        this.gameState.daily_event_completed = false;
        
        const currentDay = this.gameState.day || 0;
        this.gameState.day = currentDay + 1;
        this.gameState.chapter = Math.floor((this.gameState.day - 1) / 7) + 1;
        
        try {
            if (currentDay > 0) {
                const currentFans = this.gameState.fans;
                const baseGrowth = Math.floor(Math.random() * 2) + 1;
                const randomPercent = 2 + Math.random() * 8;
                const percentGrowth = Math.floor(currentFans * (randomPercent / 100));
                const totalGrowth = baseGrowth + percentGrowth;
                
                sessionStorage.setItem('fanGrowth', JSON.stringify({
                    previousFans: currentFans,
                    growthAmount: totalGrowth
                }));
                
                this.gameState.fans += totalGrowth;
                this.debug(`Fans increased by ${totalGrowth} (${baseGrowth} base + ${percentGrowth} percent)`);
            }
            
            await this.saveGameState();
            
            this.debug(`Entering new day: Day ${this.gameState.day}, Chapter ${this.gameState.chapter}`);
            
            this.currentEvent = null;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            this.hasStartedQuiz = false;
            this.hasCompletedQuiz = false;
            this.hasProcessedBranches = false;
            this.isProcessingBranchDialogues = false;
            
            window.location.href = '/new_game?t=' + Date.now();
        } catch (e) {
            console.error('Failed to save game state:', e);
            window.location.href = '/new_game?t=' + Date.now();
        }
    }

    showFanGrowthAnimation(currentFans, growthAmount) {
        const fansCounter = document.getElementById('fans-count');
        if (!fansCounter) return;
        
        
        this.playGrowSound();
        
        const originalValue = fansCounter.textContent;
        fansCounter.style.visibility = 'hidden';
        
        const fanAnimContainer = document.createElement('div');
        fanAnimContainer.className = 'fan-growth-animation';
        Object.assign(fanAnimContainer.style, {
            position: 'absolute',
            top: `${fansCounter.offsetTop}px`,
            left: `${fansCounter.offsetLeft}px`,
            width: `${fansCounter.offsetWidth}px`,
            height: `${fansCounter.offsetHeight}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#4CAF50',
            zIndex: '1000',
            transition: 'all 0.3s ease',
            transform: 'scale(1)'
        });
        
        const arrowUp = document.createElement('div');
        arrowUp.textContent = '↑';
        arrowUp.style.fontSize = '18px';
        arrowUp.style.marginRight = '3px';
        
        const fanCountDisplay = document.createElement('span');
        fanCountDisplay.textContent = currentFans;
        
        fanAnimContainer.appendChild(arrowUp);
        fanAnimContainer.appendChild(fanCountDisplay);
        
        fansCounter.parentNode.appendChild(fanAnimContainer);
        
        setTimeout(() => {
            fanAnimContainer.style.transform = 'scale(1.5)';
        }, 100);
        
        let animationStartTime = null;
        const animationDuration = 2000;
        const targetValue = currentFans + growthAmount;
        
        const updateCounter = (timestamp) => {
            if (!animationStartTime) animationStartTime = timestamp;
            const elapsed = timestamp - animationStartTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            const currentValue = Math.floor(currentFans + (growthAmount * progress));
            fanCountDisplay.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                setTimeout(() => {
                    fanAnimContainer.style.transform = 'scale(1)';
                    
                    setTimeout(() => {
                        if (fanAnimContainer.parentNode) {
                            fanAnimContainer.parentNode.removeChild(fanAnimContainer);
                        }
                        fansCounter.textContent = targetValue;
                        fansCounter.style.visibility = 'visible';
                    }, 300);
                }, 1000);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

        showBadEnd() {
        this.debug('Showing bad ending');
        
        this.clearAllChoices();
        const dialogBox = document.getElementById('dialog-box');
        if (dialogBox) dialogBox.style.display = 'none';
        
        if (this.elements.characterLeft) this.elements.characterLeft.style.opacity = '0';
        if (this.elements.characterRight) this.elements.characterRight.style.opacity = '0';
        
        
        this.playPromptSound();
        
        const endingContainer = document.createElement('div');
        endingContainer.id = 'ending-container';
        Object.assign(endingContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9000',
            opacity: '0',
            transition: 'opacity 2s ease'
        });
        
        const endingContent = document.createElement('div');
        endingContent.className = 'ending-content';
        Object.assign(endingContent.style, {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '40px',
            borderRadius: '15px',
            maxWidth: '80%',
            textAlign: 'center',
            color: '#e74c3c',
            fontSize: '24px',
            boxShadow: '0 0 30px rgba(231, 76, 60, 0.3)',
            transform: 'scale(0.9)',
            transition: 'all 1.5s ease',
            border: '1px solid rgba(231, 76, 60, 0.3)'
        });
        
        const endingTitle = document.createElement('h2');
        endingTitle.textContent = 'You failed to overcome the online challenges';
        Object.assign(endingTitle.style, {
            fontSize: '42px',
            marginBottom: '30px',
            color: '#e74c3c',
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(231, 76, 60, 0.7)'
        });
        endingContent.appendChild(endingTitle);
        
        const endingDesc = document.createElement('p');
        endingDesc.innerHTML = 'Your cybersecurity awareness was insufficient, causing you to make wrong decisions when facing online challenges.<br><br>The internet is full of risks, and only with sufficient knowledge and vigilance can you protect yourself from harm.';
        Object.assign(endingDesc.style, {
            marginBottom: '30px',
            lineHeight: '1.8',
            fontSize: '26px',
            fontFamily: "'Segoe UI', 'Arial', sans-serif"
        });
        endingContent.appendChild(endingDesc);
        
        endingContainer.appendChild(endingContent);
        
        document.body.appendChild(endingContainer);
        
        setTimeout(() => {
            endingContainer.style.opacity = '1';
            endingContent.style.transform = 'scale(1)';
            
            setTimeout(() => {
                
                endingContent.style.opacity = '0';
                endingContent.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    
                    endingContent.remove();
                    
                    const badEndText = document.createElement('div');
                    badEndText.textContent = 'Bad End';
                    Object.assign(badEndText.style, {
                        color: '#e74c3c',
                        fontSize: '96px',
                        fontWeight: 'bold',
                        fontFamily: "'Segoe UI', 'Arial', sans-serif",
                        opacity: '0',
                        transform: 'scale(1.5)',
                        transition: 'all 2s ease',
                        textShadow: '0 0 20px rgba(231, 76, 60, 0.8)'
                    });
                    
                    endingContainer.appendChild(badEndText);
                    
                    setTimeout(() => {
                        badEndText.style.opacity = '1';
                        badEndText.style.transform = 'scale(1)';
                        
                        endingContainer.addEventListener('click', () => {
                            
                            this.playClickSound();
                            location.href = '/';
                        });
                        
                        const clickTip = document.createElement('div');
                        clickTip.textContent = 'Click to return to main menu';
                        Object.assign(clickTip.style, {
                            color: '#ffffff',
                            fontSize: '24px',
                            marginTop: '50px',
                            opacity: '0',
                            fontFamily: "'Segoe UI', 'Arial', sans-serif",
                            transition: 'opacity 1s ease',
                            textShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
                        });
                        endingContainer.appendChild(clickTip);
                        
                        setTimeout(() => {
                            clickTip.style.opacity = '0.9';
                        }, 3000);
                    }, 500);
                }, 1500);
            }, 8000);
        }, 100);
    }

        async loadEndingEvent() {
        this.debug('Loading ending event');
        
        this.clearAllChoices();
        
        try {
            const url = `/get_event/ending?t=${Date.now()}`;
            this.debug(`Making ending event request: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const event = await response.json();
            if (event.error) {
                this.debug(`Ending event returned error: ${event.error}`);
                this.showBadEnd();
                return;
            }
            
            this.debug(`Successfully loaded ending event: ${event.id}`);
            
            event.type = 'ending';
            this.currentEvent = event;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            
            console.log('[Music] Ending event loaded, preparing to play music');
            this.playBackgroundMusic('ending');
            
            if (!this.boundHandleClick) {
                this.boundHandleClick = this.handleClick.bind(this);
            }
            
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            
            this.showCurrentDialog();
        } catch (error) {
            console.error('Failed to load ending event:', error);
            this.showBadEnd();
        }
    }

        showGameComplete() {
        this.debug('Showing game completion screen');
        
        this.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        this.stopBackgroundMusic();
        
        
        this.playPromptSound();
        
        const overlay = document.createElement('div');
        overlay.id = 'game-complete-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            zIndex: '2000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            boxSizing: 'border-box',
            opacity: '0',
            transition: 'opacity 1s ease'
        });
        
        const title = document.createElement('h1');
        title.textContent = 'Game Complete';
        Object.assign(title.style, {
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 'bold',
            marginBottom: '40px',
            textAlign: 'center',
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            textShadow: '0 0 20px rgba(255, 255, 255, 0.6)'
        });
        overlay.appendChild(title);
        
        const description = document.createElement('p');
        description.textContent = 'Congratulations on completing the game! You have learned how to protect yourself in the online world and become a responsible digital citizen.';
        Object.assign(description.style, {
            color: '#ffffff',
            fontSize: '28px',
            lineHeight: '1.6',
            maxWidth: '800px',
            textAlign: 'center',
            marginBottom: '50px',
            fontFamily: "'Segoe UI', 'Arial', sans-serif"
        });
        overlay.appendChild(description);
        
        const stats = document.createElement('div');
        Object.assign(stats.style, {
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '25px',
            marginBottom: '50px'
        });
        
        const statItems = [
            { name: 'Game Days', value: this.gameState.day },
            { name: 'Fans', value: this.gameState.fans },
            { name: 'Health', value: this.gameState.health },
            { name: 'Security', value: this.gameState.security },
            { name: 'Social', value: this.gameState.social },
            { name: 'Completed Events', value: this.gameState.completed_events.length }
        ];
        
        statItems.forEach(item => {
            const statItem = document.createElement('div');
            Object.assign(statItem.style, {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px 25px',
                minWidth: '170px',
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            });
            
            const statName = document.createElement('div');
            statName.textContent = item.name;
            Object.assign(statName.style, {
                color: '#aaaaaa',
                marginBottom: '10px',
                fontSize: '20px',
                fontFamily: "'Segoe UI', 'Arial', sans-serif"
            });
            
            const statValue = document.createElement('div');
            statValue.textContent = item.value;
            Object.assign(statValue.style, {
                color: '#ffffff',
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: "'Segoe UI', 'Arial', sans-serif",
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
            });
            
            statItem.appendChild(statName);
            statItem.appendChild(statValue);
            stats.appendChild(statItem);
        });
        
        overlay.appendChild(stats);
        
        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, {
            display: 'flex',
            gap: '30px'
        });
        
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Restart';
        Object.assign(restartBtn.style, {
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '18px 36px',
            fontSize: '24px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            transition: 'all 0.3s ease',
            boxShadow: '0 0 15px rgba(52, 152, 219, 0.5)'
        });
        
        restartBtn.addEventListener('mouseover', () => {
            restartBtn.style.backgroundColor = '#2980b9';
            restartBtn.style.transform = 'translateY(-3px)';
        });
        
        restartBtn.addEventListener('mouseout', () => {
            restartBtn.style.backgroundColor = '#3498db';
            restartBtn.style.transform = 'translateY(0)';
        });
        
        restartBtn.addEventListener('click', () => {
            
            this.playClickSound();
            window.location.href = '/reset_game';
        });
        
        btnContainer.appendChild(restartBtn);
        
        const homeBtn = document.createElement('button');
        homeBtn.textContent = 'Return to Home';
        Object.assign(homeBtn.style, {
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '18px 36px',
            fontSize: '24px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Segoe UI', 'Arial', sans-serif",
            transition: 'all 0.3s ease',
            boxShadow: '0 0 15px rgba(231, 76, 60, 0.5)'
        });
        
        homeBtn.addEventListener('mouseover', () => {
            homeBtn.style.backgroundColor = '#c0392b';
            homeBtn.style.transform = 'translateY(-3px)';
        });
        
        homeBtn.addEventListener('mouseout', () => {
            homeBtn.style.backgroundColor = '#e74c3c';
            homeBtn.style.transform = 'translateY(0)';
        });
        
        homeBtn.addEventListener('click', () => {
            
            this.playClickSound();
            window.location.href = '/home';
        });
        
        btnContainer.appendChild(homeBtn);
        overlay.appendChild(btnContainer);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
    }

    showRulesPanel(rulesLines, callback) {
        const old = document.getElementById('summary-panel');
        if (old) old.remove();
        const panel = document.createElement('div');
        panel.id = 'summary-panel';
        Object.assign(panel.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            opacity: '0', transition: 'opacity 0.4s ease-out', width: '90%', maxHeight: '50%',
            backgroundColor: 'rgba(20,20,20,0.95)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.7)', color: '#fff', padding: '40px 20px 20px',
            boxSizing: 'border-box', overflow: 'auto', zIndex: '2001', pointerEvents: 'auto'
        });
        document.body.appendChild(panel);
        requestAnimationFrame(() => panel.style.opacity = '1');
        const title = document.createElement('div');
        title.textContent = 'Game Rules';
        title.style.cssText = 'font-size:24px; font-weight:bold; text-align:center; margin-bottom:20px;';
        panel.appendChild(title);
        rulesLines.forEach(line => {
            const div = document.createElement('div');
            div.textContent = line;
            div.style.cssText = 'font-size:18px; line-height:1.6; text-align:left; margin:0 0 10px;';
            panel.appendChild(div);
        });
        const btn = document.createElement('button');
        btn.textContent = 'Start Quiz';
        btn.className = 'choice-button';
        btn.style.cssText = 'display:block; margin:30px auto 0; padding:10px 30px; font-size:18px; background-color:#3498db; border:none; border-radius:8px; cursor:pointer;';
        btn.disabled = true; 
        setTimeout(() => { btn.disabled = false; }, 1000);
        btn.addEventListener('click', e => {
            e.stopPropagation();
            panel.style.transition = 'opacity 0.2s ease-in';
            panel.style.opacity = '0';
            panel.addEventListener('transitionend', () => {
                panel.remove();
                if (typeof callback === 'function') {
                    try { callback(); } catch(e) { console.error('Rules callback error', e); }
                } else {
                    this.handleNextEventSteps();
                }
            }, { once: true });
        }, { once: true });
        panel.appendChild(btn);
    }

    
    playClickSound() {
        const randomIndex = Math.floor(Math.random() * this.sounds.click.length);
        const sound = this.sounds.click[randomIndex];
        sound.volume = 0.5;
        sound.currentTime = 0;
        sound.play().catch(error => console.error('Failed to play click sound:', error));
    }

    
    playGrowSound() {
        this.sounds.grow.volume = 0.6;
        this.sounds.grow.currentTime = 0;
        this.sounds.grow.play().catch(error => console.error('Failed to play grow sound:', error));
    }

    
    playPromptSound() {
        this.sounds.prompt.volume = 0.5;
        this.sounds.prompt.currentTime = 0;
        this.sounds.prompt.play().catch(error => console.error('Failed to play prompt sound:', error));
    }

    
    playBackgroundMusic(type) {
        if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.pause();
        }
        
        let musicPath = '';
        switch(type) {
            case 'morning':
                musicPath = '/static/music/school.mp3';
                break;
            case 'weekend':
                musicPath = '/static/music/live.mp3';
                break;
            case 'phone':
            case 'home':
                musicPath = '/static/music/home.mp3';
                break;
            case 'ending':
                musicPath = '/static/music/end.mp3';
                break;
            default:
                musicPath = `/static/music/${type}.mp3`;
        }
        
        this.sounds.backgroundMusic = new Audio(musicPath);
        
        if (type === 'ending') {
            this.sounds.backgroundMusic.volume = 0.8;
        } else {
            this.sounds.backgroundMusic.volume = 0.6;
        }
        
        this.sounds.backgroundMusic.loop = true;
        this.sounds.backgroundMusic.play().catch(error => console.error(`Failed to play ${type} music:`, error));
    }

    
    stopBackgroundMusic() {
        if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.pause();
            this.sounds.backgroundMusic = null;
        }
    }
}



document.addEventListener('DOMContentLoaded', () => {
    window.currentGame = new Game();
});