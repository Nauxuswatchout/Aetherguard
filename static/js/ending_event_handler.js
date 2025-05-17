class EndingEventHandler {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.isProcessingChoice = false;
        this.wrongChoices = [];
        this.correctChoice = 2;
        this.currentChoiceSet = null;
        this.checkedDialogIndices = [];
        this.isProcessingBranch = false;
        this.branchClickHandler = null;
        this.branchAutoAdvanceTimeout = null;
        this.branchSafetyTimeout = null;
        this.hasEnteredPhoneSuccess = false;
        this.lastBackgroundImage = null;
        this.isTransitioningToStrategySystem = false;
        this.isShowingStrategyCompletion = false;
        this.endingOverlay = null;
        
        this.boundHandleClick = this.handleClick.bind(this);
        
        this.init();
    }

    debug(message) {
        if (this.game.debugMode) {
            console.log(`[Ending Event] ${message}`);
        }
    }
    
    
    async init() {
        this.debug('Initializing ending event handler');
        
        
        this.bindEventListeners();
        
        
        if (this.game.debugMode) {
            this.addDebugPanelButton();
        }
        
        
        this.setupKeyboardShortcuts();
        
        
        setTimeout(() => {
            this.checkAndTriggerEndingEvent();
        }, 500);
    }
    
    
    bindEventListeners() {
        this.debug('Binding ending event specific event listeners');
        
        
        const errorHandler = (event) => {
            
            if (this.game.currentEvent && 
                this.game.currentEvent.type === 'ending' && 
                event.error && event.error.message) {
                
                console.error('[Ending Event] Caught related error:', event.error.message);
                
                if (event.error.message.includes('strategy')) {
                    console.log('[Ending Event] Attempting to recover strategy selection system');
                    setTimeout(() => this.directStrategySystemTrigger(), 500);
                } else if (event.error.message.includes('account')) {
                    console.log('[Ending Event] Attempting to recover account selection system');
                    setTimeout(() => this.directAccountChoicesTrigger(), 500);
                }
            }
        };
        
        
        this.endingErrorHandler = errorHandler;
        window.addEventListener('error', this.endingErrorHandler);
    }
    
    
    setupKeyboardShortcuts() {
        const keyHandler = (e) => {
            
            if (!this.game.currentEvent || this.game.currentEvent.type !== 'ending') {
                return;
            }
            
            
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                
                console.log('[Hotkey] Detected Ctrl+A, directly triggering account selection system');
                this.directAccountChoicesTrigger();
            }
            
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                
                console.log('[Hotkey] Detected Ctrl+S, directly triggering strategy selection system');
                this.directStrategySystemTrigger();
            }
        };
        
        
        this.endingKeyHandler = keyHandler;
        document.addEventListener('keydown', this.endingKeyHandler);
    }
    
    
    async checkAndTriggerEndingEvent() {
        const currentDay = this.game.gameState.day || 0;
        
        if (currentDay >= 20) {
            this.debug('Ending event trigger condition met (Day 20), loading ending event');
            await this.loadEvent();
        }
    }
    
    
    addDebugPanelButton() {
        const debugPanel = document.getElementById('debug-panel');
        if (!debugPanel) return;
        
        const jumpButton = document.createElement('button');
        jumpButton.textContent = 'Jump to Day 20';
        jumpButton.className = 'debug-button';
        jumpButton.addEventListener('click', () => {
            console.log('[Debug] Jumping to day 20, triggering ending event');
            this.jumpToDay20();
        });

        const jumpToLouisButton = document.createElement('button');
        jumpToLouisButton.textContent = 'Jump to Mall Scene';
        jumpToLouisButton.className = 'debug-button';
        jumpToLouisButton.addEventListener('click', async () => {
            if (!this.game.currentEvent) return;

            this.game.clearAllChoices();
            document.querySelectorAll('.choice-overlay, #continue-overlay').forEach(el => el.remove());

            Object.assign(this, {
                isProcessingChoice: false,
                wrongChoices: [],
                correctChoice: null,
                currentChoiceSet: null,
                checkedDialogIndices: Array(50).fill(0).map((_, i) => i),
                isProcessingBranch: false,
                hasEnteredPhoneSuccess: true,
                isShowingPhoneSuccess: false,
                isShowingEmotionalConclusion: false,
                isShowingHighFansBranch: true,
                isTransitioningToStrategySystem: false,
                isShowingStrategyCompletion: false
            });

            if (this.game.gameState) {
                this.game.gameState.fans = 300;
                this.game.gameState.social = 100;
            }

            if (this.game.currentEvent.high_fans_branch) {
                const storedDialogues = this.game.currentEvent.dialogues;
                this.game.currentEvent.dialogues = [...this.game.currentEvent.high_fans_branch];
                
                // Force the branch to be recognized
                const fansCheckDialog = {
                    character: "fans_check",
                    text: "200"
                };
                
                // Execute fans check to properly set up the branch
                this.game.currentEvent.dialogues = [fansCheckDialog];
                this.game.currentDialogIndex = 0;
                await this.showCurrentDialog();

                // Now set up the actual high fans branch
                this.game.currentEvent.dialogues = this.game.currentEvent.high_fans_branch;
                this.game.currentDialogIndex = 7;
                this.showCurrentDialog();
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            .debug-button {
                margin: 5px;
                padding: 5px 10px;
                background: #2c3e50;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            .debug-button:hover {
                background: #34495e;
            }
        `;
        document.head.appendChild(style);
        
        debugPanel.appendChild(jumpButton);
        debugPanel.appendChild(jumpToLouisButton);
    }

    autoAdvanceDialog() {
        if (!this.isAutoPlaying) return;
        
        if (this.game.isTyping) {
            // Complete current text immediately
            this.game.currentTypingId = null;
            this.game.isTyping = false;
            if (this.game.currentEvent && this.game.currentEvent.dialogues && 
                this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                this.game.elements.dialogText.textContent = 
                    this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
            }
        }
        
        // Check if we should stop at current dialogue
        const shouldStopHere = this.shouldStopAutoPlay();
        if (shouldStopHere) {
            console.log('[Debug] Auto-play stopped: Choice or special dialogue detected');
            this.isAutoPlaying = false;
            return;
        }
        
        // Schedule next dialogue
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.handleClick({ target: {} });
            }
        }, this.autoPlaySpeed);
    }

    shouldStopAutoPlay() {
        if (!this.game.currentEvent || !this.game.currentEvent.dialogues) return true;
        
        const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
        if (!currentDialog) return true;
        
        // Stop at choices
        if (this.game.currentDialogIndex === 8) return true;
        
        // Stop at strategy discussion
        if (currentDialog.text && 
            currentDialog.text.includes("The three quickly discuss strategies") && 
            this.game.currentEvent.strategy_choice_system &&
            this.game.currentEvent.dialogues === this.game.currentEvent.high_social_branch) {
            return true;
        }
        
        // Stop at ending choices
        if (this.game.currentEvent.ending_choice_triggers) {
            for (const trigger of this.game.currentEvent.ending_choice_triggers) {
                if (trigger.trigger_index === this.game.currentDialogIndex) {
                    return true;
                }
            }
        }
        
        // Stop at trust choices
        if (this.game.currentEvent.trust_choice_triggers &&
            this.game.currentEvent.trust_choice_triggers[0].trigger_index === this.game.currentDialogIndex) {
            return true;
        }
        
        return false;
    }

    skipToNextChoice() {
        while (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            if (this.shouldStopAutoPlay()) {
                // Force display current dialogue
                const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
                this.game.updateCharacters(currentDialog);
                const speakerName = currentDialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                this.game.elements.dialogText.textContent = currentDialog.text;
                this.game.isTyping = false;
                
                // Trigger appropriate continuation
                this.checkChoiceTrigger();
                return;
            }
            this.game.currentDialogIndex++;
        }
    }

    async loadEvent() {
        this.debug('Loading ending event');
        
        this.game.clearAllChoices();
        
        this.wrongChoices = [];
        this.isProcessingChoice = false;
        this.currentChoiceSet = null;
        this.checkedDialogIndices = [];
        this.lastBackgroundImage = null;  // Reset background image state
        
        try {
            const url = `/get_event/ending?t=${Date.now()}`;
            this.debug(`Initiating ending event request: ${url}`);
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
                this.game.showBadEnd();
                return;
            }
            
            this.debug(`Successfully loaded ending event: ${event.id}`);
            
            event.type = 'ending';
            this.game.currentEvent = event;
            this.game.currentDialogIndex = 0;
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            
            if (this.game.currentEventLoaded) {
                this.game.currentEventLoaded = true;
            }
            
            if (typeof this.game.playBackgroundMusic === 'function') {
                this.game.playBackgroundMusic('ending');
            }
            
            document.removeEventListener('click', this.game.boundHandleClick);
            document.removeEventListener('click', this.boundHandleClick);
            
            // Force initial background setup
            if (event.background) {
                const bgPath = `/static/images/${event.background}`;
                this.debug(`Setting initial background: ${bgPath}`);
                await this.game.setBackgroundImage(bgPath);
                this.lastBackgroundImage = event.background;
            }
            
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                this.debug('Bound ending event specific click listener');
                this.showCurrentDialog();
            }, 50);
            
            return true;
        } catch (error) {
            console.error('Failed to load ending event:', error);
            this.game.showBadEnd();
            return false;
        }
    }
    
    
    showCurrentDialog() {
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('Event has ended or is ending, no more dialogues to show');
            return;
        }
        
        if (!this.game.currentEvent || !this.game.currentEvent.dialogues || 
            this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length) {
            this.debug('Dialog index out of range, ending dialogue');
            
            this.checkForStrategyContinuation();
            
            if (!this.isTransitioningToStrategySystem) {
                this.endEvent();
            }
            return;
        }
        
        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
        
        // Handle background changes
        if (this.game.currentEvent.background && this.game.currentDialogIndex === 0) {
            const bgImage = this.game.currentEvent.background;
            if (this.lastBackgroundImage !== bgImage) {
                const bgPath = `/static/images/${bgImage}`;
                this.debug(`Setting background image: ${bgPath}`);
                this.game.setBackgroundImage(bgPath);
                this.lastBackgroundImage = bgImage;
            }
        }

        // Check for strategy system trigger
        if (dialog && dialog.text && 
            (dialog.text.includes("The three quickly discuss strategies") || 
             dialog.text.includes("Everyone has come up with their own plan")) && 
            this.game.currentEvent.strategy_choice_system) {
            
            this.debug('Strategy discussion detected, triggering strategy choice system');
            
            this.game.updateCharacters(dialog);
            const speakerName = dialog.character.split('_')[0];
            this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
            
            this.game.elements.dialogText.textContent = dialog.text;
            this.game.isTyping = false;
            
            this.isTransitioningToStrategySystem = true;
            
            setTimeout(() => {
                this.showStrategyChoiceSystem();
            }, 800);
            return;
        }
        
        if (dialog.character === "background") {
            const bgImage = dialog.text;
            if (this.lastBackgroundImage !== bgImage) {
                const bgPath = `/static/images/${bgImage}`;
                this.debug(`Switching background image: ${bgPath}`);
                this.game.setBackgroundImage(bgPath);
                this.lastBackgroundImage = bgImage;
            }
            
            setTimeout(() => {
                this.game.currentDialogIndex++;
                this.showCurrentDialog();
            }, 500);
            return;
        }
        
        
        if (dialog.character === "security_check") {
            const requiredValue = parseInt(dialog.text);
            const currentSecurityValue = this.game.gameState.security || 0;
            
            this.debug(`Security awareness check: Current value ${currentSecurityValue}, required value ${requiredValue}`);
            
            if (currentSecurityValue >= requiredValue) {
                
                this.debug(`Security awareness check passed, continuing main dialogue`);
                this.game.currentDialogIndex++;
                this.showCurrentDialog();
            } else {
                
                this.debug(`Security awareness check failed (${currentSecurityValue} < ${requiredValue}), entering failure branch`);
                
                
                if (this.game.currentEvent.security_fail_branch && 
                    this.game.currentEvent.security_fail_branch.length > 0) {
                    
                    
                    this.originalDialogues = this.game.currentEvent.dialogues;
                    this.originalDialogIndex = this.game.currentDialogIndex;
                    
                    
                    this.game.currentEvent.dialogues = this.game.currentEvent.security_fail_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                } else {
                    
                    this.debug('No failure dialogue found, continuing main dialogue');
                    this.game.currentDialogIndex++;
                    this.showCurrentDialog();
                }
            }
            return;
        }
        
        
        if (dialog.character === "fans_check") {
            const requiredValue = parseInt(dialog.text);
            const currentFansValue = this.game.gameState.fans || 0;
            
            this.debug(`Fans check: Current value ${currentFansValue}, required value ${requiredValue}`);
            
            if (currentFansValue >= requiredValue) {
                
                this.debug(`Fans check passed (${currentFansValue} >= ${requiredValue}), entering high fans branch`);
                
                if (this.game.currentEvent.high_fans_branch && 
                    this.game.currentEvent.high_fans_branch.length > 0) {
                    
                    
                    this.originalDialogues = this.game.currentEvent.dialogues;
                    this.originalDialogIndex = this.game.currentDialogIndex;
                    
                    
                    this.game.currentEvent.dialogues = this.game.currentEvent.high_fans_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                } else {
                    
                    this.debug('No high fans branch found, continuing main dialogue');
                    this.game.currentDialogIndex++;
                    this.showCurrentDialog();
                }
            } else {
                
                this.debug(`Fans check failed (${currentFansValue} < ${requiredValue}), entering low fans branch`);
                
                if (this.game.currentEvent.low_fans_branch && 
                    this.game.currentEvent.low_fans_branch.length > 0) {
                    
                    
                    this.originalDialogues = this.game.currentEvent.dialogues;
                    this.originalDialogIndex = this.game.currentDialogIndex;
                    
                    
                    this.game.currentEvent.dialogues = this.game.currentEvent.low_fans_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                } else {
                    
                    this.debug('No low fans branch found, continuing main dialogue');
                    this.game.currentDialogIndex++;
                    this.showCurrentDialog();
                }
            }
            return;
        }
        
        
        if (dialog.character === "social_check") {
            const requiredValue = parseInt(dialog.text);
            const currentSocialValue = this.game.gameState.social || 0;
            
            this.debug(`Social value check: Current value ${currentSocialValue}, required value ${requiredValue}`);
            
            if (currentSocialValue >= requiredValue) {
                
                this.debug(`Social value check passed (${currentSocialValue} >= ${requiredValue}), entering high social value branch`);
                
                if (this.game.currentEvent.high_social_branch && 
                    this.game.currentEvent.high_social_branch.length > 0) {
                    
                    
                    this.originalDialogues = this.game.currentEvent.dialogues;
                    this.originalDialogIndex = this.game.currentDialogIndex;
                    
                    
                    this.game.currentEvent.dialogues = this.game.currentEvent.high_social_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                } else {
                    
                    this.debug('No high social value branch found, continuing main dialogue');
                    this.game.currentDialogIndex++;
                    this.showCurrentDialog();
                }
            } else {
                
                this.debug(`Social value check failed (${currentSocialValue} < ${requiredValue}), entering low social value branch`);
                
                if (this.game.currentEvent.low_social_branch && 
                    this.game.currentEvent.low_social_branch.length > 0) {
                    
                    
                    this.originalDialogues = this.game.currentEvent.dialogues;
                    this.originalDialogIndex = this.game.currentDialogIndex;
                    
                    
                    this.game.currentEvent.dialogues = this.game.currentEvent.low_social_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                } else {
                    
                    this.debug('No low social value branch found, continuing main dialogue');
                    this.game.currentDialogIndex++;
                    this.showCurrentDialog();
                }
            }
            return;
        }
        
        
        if (dialog.character === "bad_ending") {
            this.debug('Triggering bad ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing bad ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('BadEnd');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (dialog.character === "failed_ending") {
            this.debug('Triggering failed ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing failed ending animation from end.json');
                        
                        this.debug('Black screen for 3 seconds, playing failed ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('FailedTrustEnd');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (dialog.character === "lonely_ending") {
            this.debug('Triggering lonely ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing lonely ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('Alone');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (dialog.character === "virtual_ending") {
            this.debug('Triggering lost ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing lost ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('Virtual');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (dialog.character === "perfect_ending") {
            this.debug('Triggering perfect ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing perfect ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('PerfectEnd');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (dialog.character === "dream_ending") {
            this.debug('Triggering dream ending, starting fade-out animation');
            
            
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = 'fade-overlay';
            Object.assign(fadeOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                opacity: '0',
                transition: 'opacity 3s ease',
                zIndex: '10000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            document.body.appendChild(fadeOverlay);
            
            
            setTimeout(() => {
                fadeOverlay.style.opacity = '1';
                
                
                setTimeout(() => {
                    
                    setTimeout(() => {
                        this.debug('Black screen for 3 seconds, playing dream ending animation from end.json');
                        
                        document.body.removeChild(fadeOverlay);
                        
                        this.loadAndPlayEndingFromJson('DreamEnd');
                    }, 3000);
                }, 3000); 
            }, 100);
            
            return;
        }
        
        
        if (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1 && 
            !this.hasEnteredPhoneSuccess) { 
            if (this.game.currentEvent.emotion_closure_dialogues && 
                this.game.currentEvent.emotion_closure_dialogues.length > 0 &&
                this.game.currentEvent.dialogues !== this.game.currentEvent.emotion_closure_dialogues) {
                this.debug('Detected last dialogue, preparing to enter emotional closure section');
                
                
                const storedDialogues = this.game.currentEvent.dialogues;
                
                
                this.game.currentEvent.dialogues = this.game.currentEvent.emotion_closure_dialogues;
                this.game.currentDialogIndex = 0;
                
                
                setTimeout(() => {
                    this.debug('Entering emotional closure dialogue');
                    this.showCurrentDialog();
                    
                    
                    document.addEventListener('click', () => {
                        if (this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length - 1) {
                            this.debug('Emotional closure dialogue complete, showing escape choices');
                            this.showEscapeChoices();
                        }
                    }, { once: true });
                }, 1000);
                
                return;
            }
        }
        
        
        if (this.game.currentEvent.dialogues === this.game.currentEvent.emotion_closure_dialogues && 
            this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1) {
            this.debug('Last line of emotional closure dialogue, will show escape choices after click');
            setTimeout(() => {
                this.showEscapeChoices();
            }, 500);
            return;
        }
        
        
        this.game.updateCharacters(dialog);
        
        
        const speakerName = dialog.character.split('_')[0];
        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
        
        
        this.game.typeText(dialog.text);
        
        
        this.checkChoiceTrigger();
    }
    
    
    checkChoiceTrigger() {
        
        if (this.checkedDialogIndices.includes(this.game.currentDialogIndex)) {
            return;
        }
        
        
        this.checkedDialogIndices.push(this.game.currentDialogIndex);
        
        
        if (this.game.currentEvent && this.game.currentEvent.dialogues && 
            this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
            this.debug(`Current dialogue: character=${currentDialog.character}, text=${currentDialog.text}, index=${this.game.currentDialogIndex}`);
            
            
            if (currentDialog.text.includes("The three quickly discuss strategies") && 
                this.game.currentEvent.strategy_choice_system &&
                this.game.currentEvent.dialogues === this.game.currentEvent.high_social_branch) {
                
                this.debug('Special detection: Current dialogue contains "The three quickly discuss strategies", triggering strategy selection system immediately');
                setTimeout(() => {
                    this.showStrategyChoiceSystem();
                }, 500);
                return;
            }
        }
        
        
        if (this.game.currentDialogIndex === 8) {
            setTimeout(() => {
                this.showEndingChoices();
            }, 1000);
            return;
        }
        
        
        if (!this.game.currentEvent.ending_choice_triggers && !this.game.currentEvent.trust_choice_triggers) {
            return;
        }
        
        
        if (this.game.currentEvent.ending_choice_triggers) {
            for (const trigger of this.game.currentEvent.ending_choice_triggers) {
                if (trigger.trigger_index === this.game.currentDialogIndex) {
                    this.debug(`Triggering ending choices at dialogue index ${this.game.currentDialogIndex}`);
                    
                    
                    this.currentChoiceSet = trigger.choice_set;
                    
                    
                    setTimeout(() => {
                        this.showEndingChoices(this.currentChoiceSet);
                    }, 1000);
                    
                    return;
                }
            }
        }
        
        
        const isHighFansBranch = this.game.currentEvent.dialogues === this.game.currentEvent.high_fans_branch;
        this.debug(`In high fans branch: ${isHighFansBranch}`);
        
        
        const isHighSocialBranch = this.game.currentEvent.dialogues === this.game.currentEvent.high_social_branch;
        this.debug(`In high social branch: ${isHighSocialBranch}`);
        
        
        if (isHighSocialBranch && this.game.currentEvent.strategy_choice_system) {
            
            const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
            
            
            if (currentDialog && currentDialog.text.includes("The three quickly discuss strategies") && currentDialog.text.includes("Everyone has come up with their own plan")) {
                this.debug('Detected strategy discussion dialogue, forcing forward progress');
                
                this.game.currentDialogIndex++;
            }
        }
        
        if (isHighFansBranch && this.game.currentEvent.trust_choice_triggers) {
            
            const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
            
            
            const isLouisTrustDialog = currentDialog && 
                                      currentDialog.character === "Zack_sad" && 
                                      (currentDialog.text.includes("Louis") || 
                                       currentDialog.text.includes("路易斯")) && 
                                      (currentDialog.text.includes("believe") || 
                                       currentDialog.text.includes("swear"));
            
            
            const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
            
            if (isLouisTrustDialog || isLastDialog) {
                this.debug(`Detected trust dialogue scene! Character=${currentDialog.character}, Text=${currentDialog.text}`);
                
                
                if (this.game.currentEvent.trust_choice_triggers.length > 0) {
                    this.currentChoiceSet = this.game.currentEvent.trust_choice_triggers[0].choice_set;
                    
                    
                    setTimeout(() => {
                        this.showEndingChoices(this.currentChoiceSet);
                    }, 1000);
                    
                    return;
                }
            }
            
            
            if (this.game.currentEvent.trust_choice_triggers[0].trigger_index === this.game.currentDialogIndex) {
                this.debug(`Triggering trust choice by index: ${this.game.currentDialogIndex}`);
                
                this.currentChoiceSet = this.game.currentEvent.trust_choice_triggers[0].choice_set;
                
                setTimeout(() => {
                    this.showEndingChoices(this.currentChoiceSet);
                }, 1000);
                
                return;
            }
        }
    }
    
    
    showEndingChoices(choiceSet = null) {
        this.debug('Showing ending event choices');
        
        this.game.clearAllChoices();
        
        const existingOverlays = document.querySelectorAll('.choice-overlay');
        existingOverlays.forEach(overlay => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });
        
        const container = document.createElement('div');
        container.className = 'choice-container-fixed';
        container.id = 'ending-choices-container';
        Object.assign(container.style, {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            border: '2px solid #1abc9c',
            borderRadius: '15px',
            padding: '25px',
            maxWidth: '600px',
            width: '85%',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: '1001',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            transform: 'scale(0.9)',
            opacity: '0'
        });
        
        const prompt = document.createElement('div');
        prompt.className = 'choice-prompt';
        prompt.textContent = 'Choose your response';
        Object.assign(prompt.style, {
            color: '#ecf0f1',
            fontSize: '22px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '15px'
        });
        container.appendChild(prompt);
        
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
                @keyframes float-in {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styleElem);
        }
        
        let allChoices;
        
        if (choiceSet) {
            
            allChoices = choiceSet;
            this.debug(`Using provided choice set, containing ${allChoices.length} choices`);
        } else {
            
            allChoices = this.game.currentEvent.ending_choices || [
                { id: 0, text: "Try to reply to their message", correct: false },
                { id: 1, text: "Delete this private message", correct: false },
                { id: 2, text: "Screenshot, report, and block", correct: true }
            ];
            this.debug(`Using initial choice set, containing ${allChoices.length} choices`);
        }
        
        
        const correctChoice = allChoices.find(choice => choice.correct === true);
        if (correctChoice) {
            this.correctChoice = correctChoice.id;
            this.debug(`Current correct choice index: ${this.correctChoice}`);
        }
        
        
        const availableChoices = allChoices.filter(choice => 
            !this.wrongChoices.includes(choice.id) || choice.correct
        );
        
        this.debug(`Available choices: ${availableChoices.length}, Wrong choices: ${this.wrongChoices.join(',')}`);
        
        
        availableChoices.forEach((choice, index) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'ending-choice-button-container';
            Object.assign(buttonContainer.style, {
                marginBottom: '15px',
                animation: `float-in 0.5s ease forwards ${0.1 + index * 0.1}s`,
                opacity: '0',
                transform: 'translateY(20px)'
            });
            
            const button = document.createElement('button');
            button.className = 'choice-button ending-choice-button';
            button.textContent = choice.text;
            button.dataset.choiceId = choice.id; 
            Object.assign(button.style, {
                display: 'block',
                width: '100%',
                backgroundColor: '#1abc9c',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '15px 20px',
                cursor: 'pointer',
                fontSize: '17px',
                textAlign: 'left',
                fontWeight: '500',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
            });
            
            
            button.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#16a085';
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
            });
            
            button.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#1abc9c';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
            });
            
            
            button.addEventListener('click', (e) => {
                
                if (this.isProcessingChoice) {
                    return;
                }
                this.isProcessingChoice = true;
                
                
                const ripple = rippleEffect.cloneNode();
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size/2}px`;
                ripple.style.top = `${e.clientY - rect.top - size/2}px`;
                button.appendChild(ripple);
                
                
                container.style.transform = 'scale(0.95)';
                container.style.opacity = '0';
                
                
                setTimeout(() => {
                    
                    ripple.remove();
                    
                    
                    if (overlay && document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    
                    
                    const choiceId = parseInt(button.dataset.choiceId);
                    this.debug(`选择了选项ID: ${choiceId}, 文本: ${choice.text}`);
                    
                    
                    this.handleChoice(choiceId);
                }, 300);
            });
            
            buttonContainer.appendChild(button);
            container.appendChild(buttonContainer);
        });
        
        
        overlay.appendChild(container);
        
        
        document.body.appendChild(overlay);
        
        
        setTimeout(() => {
            container.style.transform = 'scale(1)';
            container.style.opacity = '1';
        }, 10);
    }
    
    
    handleClick(e) {
        if (this.isProcessingBranch || this.isTransitioningToStrategySystem) {
            this.debug('Processing branch dialogue or transitioning to strategy system, ignoring main line clicks');
            return;
        }
        
        if (this.game.dialogStartTime && Date.now() - this.game.dialogStartTime < 120) {
            this.debug('Ignoring too fast clicks');
            return;
        }
        
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('Event has ended or is ending, ignoring clicks');
            return;
        }
        
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay') || e.target.closest('.choice-overlay')) {
            this.debug('Ignoring button or overlay clicks');
            return;
        }
        
        if (this.game.isTyping) {
            this.game.currentTypingId = null;
            this.game.isTyping = false;
            
            if (this.game.currentEvent && this.game.currentEvent.dialogues && 
                this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                
                this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                
                const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
                if (currentDialog && 
                    currentDialog.text.includes("The three quickly discuss strategies") &&
                    this.game.currentEvent.strategy_choice_system) {
                    
                    setTimeout(() => {
                        this.forceShowStrategySystem();
                    }, 500);
                    return;
                }
            }
            
            if (this.isAutoPlaying) {
                this.autoAdvanceDialog();
            }
            return;
        }
        
        this.game.currentDialogIndex++;
        
        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            this.showCurrentDialog();
            if (this.isAutoPlaying) {
                this.autoAdvanceDialog();
            }
        } else {
            this.onDialogueComplete();
        }
    }
    
    
    async onDialogueComplete() {
        this.debug('All dialogues completed, deciding next action');
        
        const isHighSocialBranch = this.game.currentEvent && 
                                   this.game.currentEvent.dialogues === this.game.currentEvent.high_social_branch;
        
        const isHighFansBranch = this.game.currentEvent && 
                                 this.game.currentEvent.dialogues === this.game.currentEvent.high_fans_branch;

        if (isHighSocialBranch && 
            this.game.currentEvent.strategy_choice_system) {
            
            const lastDialog = this.game.currentEvent.dialogues[this.game.currentEvent.dialogues.length - 1];
            if (lastDialog && (
                lastDialog.text.includes("The three quickly discuss strategies") || 
                lastDialog.text.includes("Everyone has come up with their own plan")
            )) {
                this.debug('Strategy discussion detected, showing strategy choice system');
                this.game.clearAllChoices();
                const existingOverlay = document.getElementById('continue-overlay');
                if (existingOverlay) existingOverlay.remove();
                
                this.isTransitioningToStrategySystem = true;
                setTimeout(() => {
                    this.showStrategyChoiceSystem();
                }, 500);
                return;
            }
        }

        if (isHighFansBranch && this.game.currentEvent.trust_choice_triggers) {
            const currentDialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex - 1];
            if (currentDialog && currentDialog.character === "Louis_sad") {
                this.currentChoiceSet = this.game.currentEvent.trust_choice_triggers[0].choice_set;
                setTimeout(() => {
                    this.showEndingChoices(this.currentChoiceSet);
                }, 500);
                return;
            }
        }

        if (isHighFansBranch && 
            this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length && 
            this.game.currentEvent.trust_choice_triggers) {
            this.currentChoiceSet = this.game.currentEvent.trust_choice_triggers[0].choice_set;
            setTimeout(() => {
                this.showEndingChoices(this.currentChoiceSet);
            }, 500);
            return;
        }

        if (this.isShowingStrategyCompletion) {
            this.debug('Detected strategy selection system completion dialogue finished, automatically triggering account selection system');
            this.isShowingStrategyCompletion = false;
            setTimeout(() => {
                this.showAccountChoices();
            }, 500);
            return;
        }
        
        if (this.isShowingEmotionalConclusion) {
            this.debug('Emotional conclusion dialogue completed, showing escape choices');
            this.showEscapeChoices();
            return;
        }
        
        if (this.isShowingPhoneSuccess) {
            this.debug('Phone success dialogue completed, showing find Louis choices');
            this.showFindLouisChoices();
            return;
        }

        const hasEndingTriggered = this.game.currentEvent.dialogues.some(dialog => 
            dialog.character === "bad_ending" ||
            dialog.character === "failed_ending" ||
            dialog.character === "lonely_ending" ||
            dialog.character === "virtual_ending" ||
            dialog.character === "perfect_ending" ||
            dialog.character === "dream_ending"
        );

        if (!hasEndingTriggered) {
            this.debug('No ending triggered, continuing event');
            return;
        }

        this.debug('Ending triggered, completing event');
        if (document.getElementById('continue-overlay')) {
            this.debug('Click continue button, ending event');
            this.endEvent();
            return;
        }
        
        this.showContinueOverlay();
    }

    
    directStrategySystemTrigger() {
        this.debug('Showing strategy selection system');
        
        if (!this.game.currentEvent.strategy_choice_system || 
            !this.game.currentEvent.strategy_choice_system.introduction || 
            !this.game.currentEvent.strategy_choice_system.choices || 
            !this.game.currentEvent.strategy_choice_system.completion_dialogue) {
            
            this.debug('Error: Strategy selection system structure incomplete, cannot display');
            return;
        }
        
        this.game.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        this.showStrategyChoiceSystem();
    }
    
    
    async handleChoice(choiceId) {
        try {
            
            this.debug(`Selected choice: ${choiceId}`);
            
            
            const currentChoices = this.currentChoiceSet || this.game.currentEvent.ending_choices;
            
            if (!currentChoices) {
                this.debug('没有可用的选择集');
                this.isProcessingChoice = false;
                return;
            }
            
            
            const choice = currentChoices.find(c => c.id === choiceId);
            if (!choice) {
                this.debug(`Choice with ID ${choiceId} not found`);
                this.isProcessingChoice = false;
                return;
            }
            
            this.debug(`Choice: ${choice.text}, Correct: ${choice.correct}`);
            
            
            const hasBranchDialogues = (choice.branch_dialogues && choice.branch_dialogues.length > 0) ||
                (this.game.currentEvent.choices && 
                this.game.currentEvent.choices[choiceId] && 
                this.game.currentEvent.choices[choiceId].outcome && 
                this.game.currentEvent.choices[choiceId].outcome.dialogues && 
                this.game.currentEvent.choices[choiceId].outcome.dialogues.length > 0);
            
            
            if (hasBranchDialogues) {
                this.debug(`选项 ${choiceId} 有分支对话，先显示分支对话`);
                
                
                const savedDialogIndex = this.game.currentDialogIndex;
                this.debug(`保存当前对话索引: ${savedDialogIndex}`);
                
                
                this.isProcessingBranch = true;
                
                try {
                    
                    await this.showBranchDialogue(choiceId);
                    
                    
                    this.debug(`恢复对话索引到: ${savedDialogIndex}`);
                    this.game.currentDialogIndex = savedDialogIndex;
                    
                    
                    this.cleanupBranchState();
                    
                    
                    if (!choice.correct) {
                        
                        if (!this.wrongChoices.includes(choiceId)) {
                            this.wrongChoices.push(choiceId);
                        }
                        
                        this.debug('错误选项分支对话结束，重新显示选项');
                        this.isProcessingChoice = false;
                        this.showEndingChoices(this.currentChoiceSet);
                        return; 
                    }
                } catch (error) {
                    console.error('显示分支对话失败:', error);
                    this.cleanupBranchState();
                }
            } else if (!choice.correct) {
                
                if (!this.wrongChoices.includes(choiceId)) {
                    this.wrongChoices.push(choiceId);
                }
                
                this.debug('选择了错误选项（无分支对话），重新显示选项');
                this.isProcessingChoice = false;
                this.showEndingChoices(this.currentChoiceSet);
                return; 
            }
            
            
            if (choice.correct) {
                this.debug('选择了正确选项，继续事件');
                
                
                this.cleanupBranchState();
                
                this.isProcessingChoice = false;
                
                
                if (this.currentChoiceSet === this.game.currentEvent.escape_choices) {
                    
                    this.handleEscapeSuccess();
                } else if (this.currentChoiceSet === this.game.currentEvent.find_louis_choices) {
                    
                    
                    
                    if (this.game.currentEvent.fans_check) {
                        this.debug('进行粉丝数量检查');
                        
                        
                        const fansCheckDialog = this.game.currentEvent.fans_check;
                        
                        
                        this.game.currentEvent.dialogues = [fansCheckDialog];
                        this.game.currentDialogIndex = 0;
                        
                        
                        this.showCurrentDialog();
                    } else {
                        this.debug('未找到粉丝检查，默认进入高粉丝分支');
                        
                        if (this.game.currentEvent.high_fans_branch) {
                            this.game.currentEvent.dialogues = this.game.currentEvent.high_fans_branch;
                            this.game.currentDialogIndex = 0;
                            this.showCurrentDialog();
                        }
                    }
                } else if (this.currentChoiceSet && 
                          this.game.currentEvent.trust_choice_triggers &&
                          this.game.currentEvent.trust_choice_triggers[0].choice_set === this.currentChoiceSet) {
                    
                    const trustChoiceId = choiceId;
                    this.debug(`选择了信任选项ID: ${trustChoiceId}`);
                    
                    
                    if (this.performSocialCheck) {
                        this.debug('执行社交值检查决定分支');
                        this.performSocialCheck();
                    } else {
                        this.debug('警告: 未找到社交值检查方法');
                        
                        this.debug(`社交值检查方法不存在，继续主线对话`);
                        this.game.currentDialogIndex++;
                        this.showCurrentDialog();
                    }
                } else {
                    
                    this.debug(`继续事件对话，递增当前对话索引: ${this.game.currentDialogIndex} -> ${this.game.currentDialogIndex + 1}`);
                    this.game.currentDialogIndex++;
                    
                    this.debug(`检查当前对话数组长度: ${this.game.currentEvent.dialogues.length}`);
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        this.showCurrentDialog();
                    } else {
                        this.debug('警告: 对话索引超出范围');
                    }
                }
            }
        } catch (error) {
            console.error('处理选择时出错:', error);
            
            
            this.cleanupBranchState();
            
            this.isProcessingChoice = false;
            
            
            setTimeout(() => {
                this.showEndingChoices(this.currentChoiceSet);
            }, 500);
        }
    }
    
    
    async showBranchDialogue(choiceId) {
        this.debug(`开始显示选项 ${choiceId} 的分支对话`);
        
        return new Promise((resolve, reject) => {
            
            let branchDialogues = [];
            
            
            const currentChoices = this.currentChoiceSet || this.game.currentEvent.ending_choices;
            
            if (!currentChoices) {
                this.debug('没有可用的选择集');
                
                resolve();
                return;
            }
            
            
            const selectedChoice = currentChoices.find(choice => choice.id === choiceId);
            
            if (selectedChoice && selectedChoice.branch_dialogues) {
                branchDialogues = selectedChoice.branch_dialogues;
                this.debug(`找到选项${choiceId}的分支对话, 数量: ${branchDialogues.length}`);
            } else {
                this.debug(`找不到选项${choiceId}的分支对话`);
                
                
                if (this.game.currentEvent.choices) {
                    const oldFormatIndex = choiceId; 
                    if (this.game.currentEvent.choices[oldFormatIndex] && 
                        this.game.currentEvent.choices[oldFormatIndex].outcome && 
                        this.game.currentEvent.choices[oldFormatIndex].outcome.dialogues) {
                        branchDialogues = this.game.currentEvent.choices[oldFormatIndex].outcome.dialogues;
                        this.debug(`从旧格式找到分支对话, 数量: ${branchDialogues.length}`);
                    }
                }
            }
            
            if (branchDialogues.length === 0) {
                this.debug(`未找到选项${choiceId}的分支对话, 直接完成分支显示`);
                
                resolve();
                return;
            }
            
            this.debug(`分支对话数量: ${branchDialogues.length}`);
            
            
            const isTrustChoice = (choiceId === 303);
            
            
            const hasSocialCheck = branchDialogues.some(dialog => 
                dialog.character === "social_check" || 
                (dialog.character === "Zack_determined" && 
                dialog.text.includes("This matter... only you and I know"))
            );
            
            this.debug(`是否是信任选项: ${isTrustChoice}, 是否包含社交值检查或特定文本: ${hasSocialCheck}`);
            
            
            let dialogIndex = 0;
            
            
            this.branchSafetyTimeout = setTimeout(() => {
                this.debug('安全超时触发：强制完成分支对话显示');
                
                
                if (isTrustChoice && hasSocialCheck) {
                    this.performSocialCheck();
                } else {
                    resolve();
                }
            }, 10000); 
            
            
            const performSocialCheck = () => {
                
                this.cleanupBranchState();
                
                
                let requiredValue = 70;
                
                
                if (this.lastSocialCheckValue) {
                    this.debug(`使用最近保存的社交值检查值: ${this.lastSocialCheckValue}`);
                    requiredValue = parseInt(this.lastSocialCheckValue) || 70;
                } else {
                    const socialCheckDialog = branchDialogues.find(d => d.character === "social_check");
                    if (socialCheckDialog) {
                        this.debug(`从分支对话中找到社交值检查: ${socialCheckDialog.text}`);
                        requiredValue = parseInt(socialCheckDialog.text) || 70;
                    } else if (this.game.currentEvent.social_check && this.game.currentEvent.social_check.text) {
                        
                        this.debug(`从事件JSON中找到社交值检查: ${this.game.currentEvent.social_check.text}`);
                        requiredValue = parseInt(this.game.currentEvent.social_check.text) || 70;
                    }
                }
                
                const currentSocialValue = this.game.gameState.social || 0;
                this.debug(`执行社交值检查: 当前值=${currentSocialValue}, 要求值=${requiredValue}`);
                
                try {
                    
                    if (currentSocialValue >= requiredValue) {
                        this.debug('社交值检查通过，切换到高社交值分支');
                        
                        
                        if (!this.game.currentEvent.high_social_branch || this.game.currentEvent.high_social_branch.length === 0) {
                            this.debug('错误: 未找到高社交值分支');
                            resolve();
                            return;
                        }
                        
                        
                        this.game.currentEvent.dialogues = [...this.game.currentEvent.high_social_branch];
                        this.game.currentDialogIndex = 0;
                        
                        
                        setTimeout(() => {
                            this.showCurrentDialog();
                        }, 500);
                    } else {
                        this.debug('社交值检查未通过，切换到低社交值分支');
                        
                        
                        if (!this.game.currentEvent.low_social_branch || this.game.currentEvent.low_social_branch.length === 0) {
                            this.debug('错误: 未找到低社交值分支');
                            resolve();
                            return;
                        }
                        
                        
                        this.game.currentEvent.dialogues = [...this.game.currentEvent.low_social_branch];
                        this.game.currentDialogIndex = 0;
                        
                        
                        setTimeout(() => {
                            this.showCurrentDialog();
                        }, 500);
                    }
                } catch (error) {
                    console.error('执行社交值检查时出错:', error);
                    this.debug(`社交值检查出错: ${error}`);
                }
                
                
                resolve();
            };
            
            
            this.performSocialCheck = performSocialCheck;
            
            const showNextBranchDialog = () => {
                if (dialogIndex >= branchDialogues.length) {
                    
                    this.debug('分支对话显示完成，处理结束');
                    
                    
                    if (isTrustChoice && hasSocialCheck) {
                        this.debug('信任选项分支对话完成，执行社交值检查');
                        performSocialCheck();
                    } else {
                        
                        resolve();
                    }
                    return;
                }
                
                const dialog = branchDialogues[dialogIndex];
                this.debug(`显示分支对话: ${dialogIndex + 1}/${branchDialogues.length}`);
                
                
                if (!this.game.elements.speakerName || !this.game.elements.dialogText) {
                    this.debug('UI元素不存在，无法显示对话');
                    
                    resolve();
                    return;
                }
                
                
                if (isTrustChoice && dialog.character === "Zack_determined" && 
                    dialog.text.includes("This matter... only you and I know") && 
                    dialogIndex === branchDialogues.length - 1) {
                    this.debug('Detected trust confirmation dialogue, will perform social check after display');
                }
                
                
                if (dialog.character === "social_check") {
                    this.debug(`检测到社交值检查指令: ${dialog.text}`);
                    
                    
                    if (dialogIndex === branchDialogues.length - 1) {
                        this.debug('社交值检查是最后一个对话，显示后将执行检查');
                        
                        
                        this.lastSocialCheckValue = dialog.text;
                        
                        
                        if (isTrustChoice) {
                            this.debug('直接执行社交值检查');
                            performSocialCheck();
                            return;
                        }
                    }
                    
                    
                    dialogIndex++;
                    showNextBranchDialog();
                    return;
                }
                
                else if (dialog.character === "security_check" || dialog.character === "fans_check") {
                    this.debug(`跳过特殊指令对话: ${dialog.character}`);
                    
                    dialogIndex++;
                    showNextBranchDialog();
                    return;
                }
                
                
                const isLastNormalDialog = dialogIndex === branchDialogues.length - 2 && 
                                          branchDialogues[dialogIndex + 1].character === "social_check";
                
                if (isLastNormalDialog) {
                    this.debug('这是最后一句常规对话，下一句是社交值检查指令');
                }
                
                
                this.game.updateCharacters(dialog);
                
                
                const speakerName = dialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                
                
                this.game.typeText(dialog.text);
                
                
                const handleBranchClick = (e) => {
                    
                    if (e.target.tagName === 'BUTTON' || e.target.closest('#continue-overlay')) {
                        return;
                    }
                    
                    
                    if (this.game.isTyping) {
                        this.game.currentTypingId = null;
                        this.game.isTyping = false;
                        this.game.elements.dialogText.textContent = dialog.text;
                        return;
                    }
                    
                    
                    dialogIndex++;
                    
                    if (dialogIndex >= branchDialogues.length) {
                        this.debug(`这是最后一个分支对话 ${dialogIndex}/${branchDialogues.length}，结束处理`);
                    }
                    
                    
                    showNextBranchDialog();
                };
                
                
                if (this.branchClickHandler) {
                    document.removeEventListener('click', this.branchClickHandler);
                }
                
                
                this.branchClickHandler = handleBranchClick;
                document.addEventListener('click', this.branchClickHandler);
                
                
                if (this.branchAutoAdvanceTimeout) {
                    clearTimeout(this.branchAutoAdvanceTimeout);
                }
                
                this.branchAutoAdvanceTimeout = setTimeout(() => {
                    this.debug(`自动前进超时触发，当前对话: ${dialogIndex + 1}/${branchDialogues.length}`);
                    
                    dialogIndex++;
                    showNextBranchDialog();
                }, 15000); 
            };
            
            
            showNextBranchDialog();
        });
    }
    
    
    async endEvent() {
        this.debug('结束事件');
        
        
        this.game.hasEventEnded = true;
        this.game.isEventEnding = true;
        
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            
            if (this.game.currentEvent && this.game.currentEvent.id) {
                if (!this.game.gameState.completed_events.includes(this.game.currentEvent.id)) {
                    this.game.gameState.completed_events.push(this.game.currentEvent.id);
                    this.debug(`已完成事件列表: ${this.game.gameState.completed_events.join(', ')}`);
                }
                await this.game.saveGameState();
            }
            
            
            if (this.game.currentEvent && this.game.currentEvent.summary && this.game.currentEvent.summary.trim() !== '') {
                this.debug(`显示事件总结: ${this.game.currentEvent.summary}`);
                
                // 半透明角色提示
                this.game.elements.characterLeft.style.opacity = '0.5';
                this.game.elements.characterRight.style.opacity = '0.5';
                
                
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                
                this.game.showEventSummaryUI(this.game.currentEvent.summary);
                return;
            }
            
            
            this.debug('结局事件结束，显示游戏完成画面');
            setTimeout(() => this.game.showGameComplete(), 200);
            
        } catch (error) {
            console.error('结束事件出错:', error);
            
            setTimeout(() => this.game.showGameComplete(), 200);
        }
    }
    
    
    cleanup() {
        this.cleanupBranchState();
        document.removeEventListener('click', this.boundHandleClick);

        if (this.endingOverlay && document.body.contains(this.endingOverlay)) {
            document.body.removeChild(this.endingOverlay);
            this.endingOverlay = null;
        }

        if (this.endingKeyHandler) {
            document.removeEventListener('keydown', this.endingKeyHandler);
            this.endingKeyHandler = null;
        }

        if (this.endingErrorHandler) {
            window.removeEventListener('error', this.endingErrorHandler);
            this.endingErrorHandler = null;
        }

        if (this.branchAutoAdvanceTimeout) {
            clearTimeout(this.branchAutoAdvanceTimeout);
            this.branchAutoAdvanceTimeout = null;
        }
        if (this.branchSafetyTimeout) {
            clearTimeout(this.branchSafetyTimeout);
            this.branchSafetyTimeout = null;
        }

        this.isProcessingBranch = false;
        this.isTransitioningToStrategySystem = false;
        this.isShowingStrategyCompletion = false;
    }
    
    
    cleanupBranchState() {
        
        this.isProcessingBranch = false;
        
        
        if (this.branchSafetyTimeout) {
            clearTimeout(this.branchSafetyTimeout);
            this.branchSafetyTimeout = null;
        }
        
        
        if (this.branchAutoAdvanceTimeout) {
            clearTimeout(this.branchAutoAdvanceTimeout);
            this.branchAutoAdvanceTimeout = null;
        }
        
        
        if (this.branchClickHandler) {
            document.removeEventListener('click', this.branchClickHandler);
            this.branchClickHandler = null;
        }
        
        this.debug('已清理分支对话状态');
    }

    
    async loadAndPlayEndingFromJson(endingId) {
        this.debug(`Loading ending from end.json: ${endingId}`);
        
        try {
            this.createEndingOverlay();

            const response = await fetch('/static/js/end.json');
            const data = await response.json();
            
            const ending = data.events.find(event => event.id === endingId);
            
            if (!ending) {
                this.debug(`Ending ID not found: ${endingId}`);
                this.game.showBadEnd();
                return;
            }
            
            this.debug(`Found ending: ${ending.title}`);
            
            this.clearUI();
            
            await this.playEndingAnimation(ending);
            
        } catch (error) {
            console.error('Failed to load ending:', error);
            this.game.showBadEnd();
        }
    }

    
    clearUI() {
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        const dialogBox = document.getElementById('dialog-box');
        if (dialogBox) dialogBox.style.display = 'none';
        
        if (this.game.elements.characterLeft) this.game.elements.characterLeft.style.opacity = '0';
        if (this.game.elements.characterRight) this.game.elements.characterRight.style.opacity = '0';
    }

    
    async playEndingAnimation(ending) {
        this.debug(`播放结局动画: ${ending.title}`);
        
        
        const container = document.createElement('div');
        container.id = 'ending-animation-container';
        Object.assign(container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        });
        document.body.appendChild(container);
        
        
        const textBox = document.createElement('div');
        Object.assign(textBox.style, {
            color: 'white',
            fontSize: '20px',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: '1.8',
            marginTop: 'auto',
            marginBottom: '50px',
            padding: '0 20px',
            opacity: '0',
            transition: 'opacity 1s ease',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        });
        container.appendChild(textBox);
        
        try {
            
            if (ending.background1 && ending.dialogues1) {
                await this.setEndingBackground(container, ending.background1);
                await this.playEndingDialogues(textBox, ending.dialogues1);
            }
            
            
            if (ending.background2 && ending.dialogues2) {
                await this.setEndingBackground(container, ending.background2);
                await this.playEndingDialogues(textBox, ending.dialogues2);
            }
            
            
            if (ending.background3 && ending.dialogues3) {
                await this.setEndingBackground(container, ending.background3);
                await this.playEndingDialogues(textBox, ending.dialogues3);
            }
            
            
            if (ending.background4 && ending.dialogues4) {
                await this.setEndingBackground(container, ending.background4);
                await this.playEndingDialogues(textBox, ending.dialogues4);
            }
            
            
            textBox.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            
            await this.showEndingTitle(container, ending.title);
            
            
            this.setupEndingClickToReturn(container);
            
        } catch (error) {
            console.error('播放结局动画时出错:', error);
            
            container.remove();
            this.game.showBadEnd();
        }
    }

    
    async setEndingBackground(container, backgroundImage) {
        return new Promise((resolve, reject) => {
            
            if (backgroundImage === 'bedroom.png' && this.lastBackgroundImage === 'bedroom.png') {
                this.debug('背景已经是bedroom.png，不重新加载');
                resolve();
                return;
            }
            
            
            this.lastBackgroundImage = backgroundImage;
            
            
            container.style.transition = 'opacity 1s ease';
            container.style.opacity = '0';
            
            setTimeout(() => {
                
                
                const possiblePaths = [
                    `/static/images/gamebackground/${backgroundImage}`,
                    `/static/images/${backgroundImage}`,
                    `/static/images/background/${backgroundImage}`,
                    `/static/images/backgrounds/${backgroundImage}`
                ];
                
                this.debug(`尝试加载结局背景，首选路径: ${possiblePaths[0]}`);
                
                
                const tryLoadImage = (pathIndex) => {
                    if (pathIndex >= possiblePaths.length) {
                        this.debug(`所有路径尝试失败，使用黑色背景作为备用`);
                        container.style.backgroundColor = 'black';
                        container.style.backgroundImage = 'none';
                        container.style.opacity = '1';
                        setTimeout(resolve, 1000);
                        return;
                    }
                    
                    const currentPath = possiblePaths[pathIndex];
                    this.debug(`尝试路径: ${currentPath}`);
                    
                    const img = new Image();
                    img.onload = () => {
                        this.debug(`成功加载背景: ${currentPath}`);
                        container.style.backgroundImage = `url(${currentPath})`;
                        container.style.backgroundSize = 'cover';
                        container.style.backgroundPosition = 'center';
                        container.style.opacity = '1';
                        setTimeout(resolve, 1000);
                    };
                    
                    img.onerror = () => {
                        this.debug(`加载失败: ${currentPath}，尝试下一个路径`);
                        
                        tryLoadImage(pathIndex + 1);
                    };
                    
                    img.src = currentPath;
                };
                
                
                tryLoadImage(0);
            }, 1000);
        });
    }

    
    async playEndingDialogues(textBox, dialogues) {
        for (const dialogue of dialogues) {
            
            textBox.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            
            textBox.textContent = dialogue;
            textBox.style.opacity = '1';
            
            
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    
    async showEndingTitle(container, title) {
        
        container.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        
        container.innerHTML = '';
        
        // 添加结局标题
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        Object.assign(titleElement.style, {
            color: '#e74c3c',
            fontSize: '64px',
            fontWeight: 'bold',
            opacity: '0',
            transform: 'scale(1.5)',
            transition: 'all 2s ease',
            textShadow: '0 0 10px rgba(231, 76, 60, 0.7)',
            textAlign: 'center'
        });
        container.appendChild(titleElement);
        
        
        const clickTip = document.createElement('div');
        clickTip.textContent = 'Click to return to the main menu';
        Object.assign(clickTip.style, {
            color: '#ffffff',
            fontSize: '16px',
            marginTop: '30px',
            opacity: '0',
            transition: 'opacity 1s ease',
            textAlign: 'center'
        });
        container.appendChild(clickTip);
        
        
        container.style.opacity = '1';
        
        
        setTimeout(() => {
            titleElement.style.opacity = '1';
            titleElement.style.transform = 'scale(1)';
            
            
            setTimeout(() => {
                clickTip.style.opacity = '0.7';
            }, 3000);
        }, 1000);
    }

    
    setupEndingClickToReturn(container) {
        
        setTimeout(() => {
            container.addEventListener('click', () => {
                this.debug('click to return to the main menu');
                
                container.style.opacity = '0';
                
                
                setTimeout(() => {
                    location.href = '/';
                }, 1000);
            });
        }, 3000);
    }

    
    showEscapeChoices() {
        this.debug('显示逃脱选择选项');
        
        if (!this.game.currentEvent.escape_choices) {
            this.debug('没有找到逃脱选择选项，尝试继续主线');
            
            if (this.game.currentEvent.phone_success_dialogues) {
                this.handleEscapeSuccess();
            } else {
                this.debug('没有找到手机成功对话，这里不应该结束事件，而是等待玩家选择');
                
                return;
            }
            return;
        }
        
        
        this.showEndingChoices(this.game.currentEvent.escape_choices);
        
        
        this.currentChoiceSet = this.game.currentEvent.escape_choices;
    }

    
    async handleEscapeSuccess() {
        this.debug('processing escape choice success');
        
        if (!this.game.currentEvent.phone_success_dialogues) {
            this.debug('no phone success dialogues, continue main story');
            return;
        }
        
        
        this.hasEnteredPhoneSuccess = true;
        
        
        const storedDialogues = this.game.currentEvent.dialogues;
        const storedDialogIndex = this.game.currentDialogIndex;
        
        
        this.game.currentEvent.dialogues = this.game.currentEvent.phone_success_dialogues;
        this.game.currentDialogIndex = 0;
        
        
        this.showCurrentDialog();
        
        
        
        const oldClickHandlers = window._endingTempHandlers || [];
        oldClickHandlers.forEach(handler => {
            document.removeEventListener('click', handler);
        });
        window._endingTempHandlers = [];
        
        
        const phoneSuccessClickHandler = (e) => {
            
            if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay') || e.target.closest('.choice-overlay')) {
                return;
            }
            
            
            if (this.game.isTyping) {
                return;
            }
            
            
            if (this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length - 1) {
                this.debug('phone success dialogues completed, showing find louis choices');
                
                
                document.removeEventListener('click', phoneSuccessClickHandler);
                
                
                const index = window._endingTempHandlers.indexOf(phoneSuccessClickHandler);
                if (index > -1) {
                    window._endingTempHandlers.splice(index, 1);
                }
                
                
                setTimeout(() => {
                    this.showFindLouisChoices();
                }, 500);
            }
        };
        
        
        if (!window._endingTempHandlers) {
            window._endingTempHandlers = [];
        }
        window._endingTempHandlers.push(phoneSuccessClickHandler);
        
        
        document.addEventListener('click', phoneSuccessClickHandler);
    }

    
    showFindLouisChoices() {
        this.debug('showing find louis choices');
        
        if (!this.game.currentEvent.find_louis_choices) {
            this.debug('no find louis choices, continue main story');
            return;
        }
        
        
        this.showEndingChoices(this.game.currentEvent.find_louis_choices);
        
        
        this.currentChoiceSet = this.game.currentEvent.find_louis_choices;
    }

    
    showStrategyChoiceSystem() {
        this.debug('Showing strategy selection system');
        
        if (!this.game.currentEvent.strategy_choice_system || 
            !this.game.currentEvent.strategy_choice_system.introduction || 
            !this.game.currentEvent.strategy_choice_system.choices || 
            !this.game.currentEvent.strategy_choice_system.completion_dialogue) {
            
            this.debug('Error: Strategy selection system structure incomplete, cannot display');
            return;
        }
        
        this.game.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        if (!this.strategyChoicesState) {
            this.debug('Initializing strategy selection system state');
            
            this.strategyChoicesState = {
                selectedChoices: [], 
                remainingChoices: [...this.game.currentEvent.strategy_choice_system.choices], 
                completedAll: false 
            };
            
            const introDialog = this.game.currentEvent.strategy_choice_system.introduction;
            if (!introDialog) {
                const defaultIntro = {
                    character: "Zack_thinking",
                    text: "We need to split up and attack him from different directions."
                };
                
                this.game.updateCharacters(defaultIntro);
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName("Zack");
                this.game.typeText(defaultIntro.text);
            } else {
                this.game.updateCharacters(introDialog);
                const speakerName = introDialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                this.game.typeText(introDialog.text);
            }
            
            setTimeout(() => {
                this.showStrategyChoices();
            }, 2000);
            
            return;
        }
        
        if (this.strategyChoicesState.completedAll) {
            this.debug('All strategies selected, showing completion dialogues');
            this.showStrategyCompletionDialogues();
            return;
        }
        
        this.showStrategyChoices();
    }
    
    
    showStrategyChoices() {
        this.debug('showing strategy choices');
        
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        
        const remainingChoices = this.strategyChoicesState.remainingChoices;
        
        if (remainingChoices.length === 0) {
            this.debug('no remaining strategy choices, marking completion');
            this.strategyChoicesState.completedAll = true;
            this.showStrategyCompletionDialogues();
            return;
        }
        
        
        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });
        
        
        const container = document.createElement('div');
        container.className = 'choice-container-fixed';
        container.id = 'strategy-choices-container';
        Object.assign(container.style, {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            border: '2px solid #1abc9c',
            borderRadius: '15px',
            padding: '25px',
            maxWidth: '600px',
            width: '85%',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: '1001',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            transform: 'scale(0.9)',
            opacity: '0'
        });
        
        
        const prompt = document.createElement('div');
        prompt.className = 'choice-prompt';
        prompt.textContent = 'Choose a strategy';
        Object.assign(prompt.style, {
            color: '#ecf0f1',
            fontSize: '22px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '15px'
        });
        container.appendChild(prompt);
        
        
        const progressText = document.createElement('div');
        progressText.className = 'choice-progress';
        const totalChoices = this.game.currentEvent.strategy_choice_system.choices.length;
        const selectedCount = this.strategyChoicesState.selectedChoices.length;
        progressText.textContent = `Selected ${selectedCount}/${totalChoices} strategies`;
        Object.assign(progressText.style, {
            color: '#ecf0f1',
            fontSize: '16px',
            marginBottom: '15px',
            textAlign: 'center',
            opacity: '0.8'
        });
        container.appendChild(progressText);
        
        
        remainingChoices.forEach((choice, index) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'strategy-choice-button-container';
            Object.assign(buttonContainer.style, {
                marginBottom: '15px',
                animation: `float-in 0.5s ease forwards ${0.1 + index * 0.1}s`,
                opacity: '0',
                transform: 'translateY(20px)'
            });
            
            const button = document.createElement('button');
            button.className = 'choice-button strategy-choice-button';
            button.textContent = choice.text;
            button.dataset.choiceId = choice.id; 
            Object.assign(button.style, {
                display: 'block',
                width: '100%',
                backgroundColor: '#1abc9c',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '15px 20px',
                cursor: 'pointer',
                fontSize: '17px',
                textAlign: 'left',
                fontWeight: '500',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
            });
            
            
            button.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#16a085';
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
            });
            
            button.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#1abc9c';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
            });
            
            
            button.addEventListener('click', () => {
                this.debug(`selected strategy: ${choice.text}`);
                
                
                if (overlay && document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                
                
                this.handleStrategyChoice(choice);
            });
            
            buttonContainer.appendChild(button);
            container.appendChild(buttonContainer);
        });
        
        
        overlay.appendChild(container);
        
        
        document.body.appendChild(overlay);
        
        
        setTimeout(() => {
            container.style.transform = 'scale(1)';
            container.style.opacity = '1';
        }, 10);
    }
    
    
    async handleStrategyChoice(choice) {
        this.debug(`selected strategy: ${choice.id}, ${choice.text}`);
        console.log('[strategy system] selected strategy', choice);
        
        if (!this.strategyChoicesState) {
            console.error('[strategy system] error: strategy choice state not initialized');
            return;
        }
        
        
        this.strategyChoicesState.remainingChoices = this.strategyChoicesState.remainingChoices.filter(
            c => c.id !== choice.id
        );
        
        
        this.strategyChoicesState.selectedChoices.push(choice);
        
        
        if (choice.dialogue && choice.dialogue.length > 0) {
            await this.showStrategyChoiceDialogue(choice.dialogue);
        }
        
        
        if (this.strategyChoicesState.remainingChoices.length === 0) {
            this.debug('all strategies have been selected, marking completion');
            this.strategyChoicesState.completedAll = true;
            
            
            setTimeout(() => {
                this.showStrategyCompletionDialogues();
            }, 500);
            
            
            setTimeout(() => {
                if (!document.querySelector('.choice-container-fixed') && 
                    !document.querySelector('.choice-overlay') &&
                    this.game.currentEvent && 
                    this.game.currentEvent.account_choice_system) {
                    
                    console.log('[strategy system] safety check: strategy completion dialogue not detected, force trigger');
                    this.directAccountChoicesTrigger();
                }
            }, 8000);
        } else {
            
            setTimeout(() => {
                this.showStrategyChoices();
            }, 500);
        }
    }
    
    
    async showStrategyChoiceDialogue(dialogues) {
        this.debug('showing strategy dialogues');
        
        return new Promise((resolve) => {
            let dialogIndex = 0;
            
            const showNextDialog = () => {
                if (dialogIndex >= dialogues.length) {
                    resolve();
                    return;
                }
                
                const dialog = dialogues[dialogIndex];
                
                
                this.game.updateCharacters(dialog);
                
                
                const speakerName = dialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                
                
                this.game.typeText(dialog.text);
                
                
                const handleClick = (e) => {
                    
                    if (e.target.tagName === 'BUTTON' || e.target.closest('#continue-overlay')) {
                        return;
                    }
                    
                    
                    if (this.game.isTyping) {
                        this.game.currentTypingId = null;
                        this.game.isTyping = false;
                        this.game.elements.dialogText.textContent = dialog.text;
                        return;
                    }
                    
                    
                    document.removeEventListener('click', handleClick);
                    
                    
                    dialogIndex++;
                    showNextDialog();
                };
                
                
                document.addEventListener('click', handleClick);
            };
            
            
            showNextDialog();
        });
    }
    
    
    async showStrategyCompletionDialogues() {
        this.debug('showing strategy completion dialogues');
        console.log('[strategy system] preparing to show strategy completion dialogues');
        
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        
        const completionDialogues = this.game.currentEvent.strategy_choice_system.completion_dialogue;
        
        if (!completionDialogues || completionDialogues.length === 0) {
            this.debug('error: no strategy choice completion dialogues');
            console.error('[strategy system] error: no strategy choice completion dialogues');
            
            
            setTimeout(() => {
                this.showAccountChoices();
            }, 500);
            return;
        }
        
        console.log('[strategy system] successfully found completion dialogues, number:', completionDialogues.length);
        
        
        await new Promise((resolve) => {
            
            const storedDialogues = this.game.currentEvent.dialogues;
            const storedDialogIndex = this.game.currentDialogIndex;
            
            
            this.game.currentEvent.dialogues = completionDialogues;
            this.game.currentDialogIndex = 0;
            
            
            this.showCurrentDialog();
            
            
            this.isShowingStrategyCompletion = true;
            
            
            const handleCompletionClick = (e) => {
                
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                
                
                if (this.game.isTyping) {
                    this.game.isTyping = false;
                    
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                    }
                    return;
                }
                
                
                this.game.currentDialogIndex++;
                
                
                if (this.game.currentDialogIndex < completionDialogues.length) {
                    this.showCurrentDialog();
                } else {
                    
                    this.game.currentEvent.dialogues = storedDialogues;
                    this.game.currentDialogIndex = storedDialogIndex;
                    this.isShowingStrategyCompletion = false;
                    
                    
                    document.removeEventListener('click', handleCompletionClick);
                    
                    
                    resolve();
                }
            };
            
            
            document.addEventListener('click', handleCompletionClick);
        });
        
        
        this.debug('strategy completion dialogues displayed, automatically triggering account selection system');
        console.log('[strategy system] completion dialogues displayed, automatically triggering account selection system');
        
        
        setTimeout(() => {
            this.showAccountChoices();
        }, 800);
    }
    
    
    showAccountChoices() {
        this.debug('Showing account selection options');
        
        if (!this.game.currentEvent.account_choice_system) {
            this.debug('Account selection system not found, ending event');
            this.endEvent();
            return;
        }
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });
        
        const container = document.createElement('div');
        container.className = 'choice-container-fixed';
        container.id = 'account-choices-container';
        Object.assign(container.style, {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            border: '2px solid #1abc9c',
            borderRadius: '15px',
            padding: '25px',
            maxWidth: '600px',
            width: '85%',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: '1001',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            transform: 'scale(0.9)',
            opacity: '0'
        });
        
        const prompt = document.createElement('div');
        prompt.className = 'choice-prompt';
        prompt.textContent = 'Account Decision';
        Object.assign(prompt.style, {
            color: '#ecf0f1',
            fontSize: '22px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '15px'
        });
        container.appendChild(prompt);
        
        this.game.currentEvent.account_choice_system.choices.forEach((choice, index) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'account-choice-button-container';
            Object.assign(buttonContainer.style, {
                marginBottom: '15px',
                animation: `float-in 0.5s ease forwards ${0.1 + index * 0.1}s`,
                opacity: '0',
                transform: 'translateY(20px)'
            });
            
            const button = document.createElement('button');
            button.className = 'choice-button account-choice-button';
            button.textContent = choice.text;
            button.dataset.choiceId = choice.id; 
            Object.assign(button.style, {
                display: 'block',
                width: '100%',
                backgroundColor: '#1abc9c',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '15px 20px',
                cursor: 'pointer',
                fontSize: '17px',
                textAlign: 'left',
                fontWeight: '500',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
            });
            
            
            button.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#16a085';
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
            });
            
            button.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#1abc9c';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
            });
            
            
            button.addEventListener('click', () => {
                this.debug(`选择了账号选项: ${choice.text}`);
                
                
                if (overlay && document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                
                
                this.handleAccountChoice(choice);
            });
            
            buttonContainer.appendChild(button);
            container.appendChild(buttonContainer);
        });
        
        
        overlay.appendChild(container);
        
        
        document.body.appendChild(overlay);
        
        
        setTimeout(() => {
            container.style.transform = 'scale(1)';
            container.style.opacity = '1';
        }, 10);
    }
    
    
    async handleAccountChoice(choice) {
        this.debug(`Selected account choice: ${choice.text}`);
        
        // Clear any remaining strategy system state
        this.isTransitioningToStrategySystem = false;
        this.isShowingStrategyCompletion = false;
        this.isProcessingBranch = false;

        if (choice.text === "Delete Account") {
            const hasHighSocialValue = this.game.gameState && this.game.gameState.social >= 100;
            const hasHighFans = this.game.gameState && this.game.gameState.fans >= 300;
            const hasCompletedStrategy = this.strategyChoicesState && this.strategyChoicesState.completedAll;

            if (hasHighSocialValue && hasHighFans && hasCompletedStrategy) {
                this.debug('Special ending conditions met, showing special branch');
                if (this.game.currentEvent.account_delete_special_branch) {
                    this.game.currentEvent.dialogues = this.game.currentEvent.account_delete_special_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                }
            } else {
                this.debug('Special ending conditions not met, showing normal branch');
                if (this.game.currentEvent.account_delete_normal_branch) {
                    this.game.currentEvent.dialogues = this.game.currentEvent.account_delete_normal_branch;
                    this.game.currentDialogIndex = 0;
                    this.showCurrentDialog();
                }
            }
        } else if (choice.text === "Keep Account") {
            this.debug('Selected keep account, showing keep account branch');
            if (this.game.currentEvent.account_keep_branch) {
                this.game.currentEvent.dialogues = this.game.currentEvent.account_keep_branch;
                this.game.currentDialogIndex = 0;
                this.showCurrentDialog();
            }
        }
    }

    showAccountChoices() {
        this.debug('Showing account selection options');
        
        // Clear any remaining strategy system state
        this.isTransitioningToStrategySystem = false;
        this.isShowingStrategyCompletion = false;
        this.isProcessingBranch = false;

        if (!this.game.currentEvent.account_choice_system) {
            this.debug('Account selection system not found, ending event');
            this.endEvent();
            return;
        }

        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        const container = document.createElement('div');
        container.className = 'choice-container-fixed';
        container.id = 'account-choices-container';
        Object.assign(container.style, {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            border: '2px solid #1abc9c',
            borderRadius: '15px',
            padding: '25px',
            maxWidth: '600px',
            width: '85%',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: '1001',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            transform: 'scale(0.9)',
            opacity: '0'
        });

        const choices = [
            { text: "Delete Account", id: "delete_account" },
            { text: "Keep Account", id: "keep_account" }
        ];

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button account-choice-button';
            button.textContent = choice.text;
            Object.assign(button.style, {
                display: 'block',
                width: '100%',
                marginBottom: '10px',
                padding: '15px 20px',
                backgroundColor: '#1abc9c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease'
            });

            button.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#16a085';
                this.style.transform = 'scale(1.02)';
            });

            button.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#1abc9c';
                this.style.transform = 'scale(1)';
            });

            button.addEventListener('click', () => {
                if (overlay && document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                this.handleAccountChoice(choice);
            });

            container.appendChild(button);
        });

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        setTimeout(() => {
            container.style.transform = 'scale(1)';
            container.style.opacity = '1';
        }, 10);
    }

    forceShowStrategySystem() {
        this.debug('Forcing strategy selection system display');
        
        if (!this.game.currentEvent.strategy_choice_system) {
            this.debug('Error: Strategy selection system not found, cannot force display');
            return;
        }
        
        this.game.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        this.showStrategyChoiceSystem();
    }

    checkForStrategyContinuation() {
        if (this.game.currentEvent && 
            this.game.currentEvent.dialogues === this.game.currentEvent.high_social_branch && 
            this.game.currentEvent.strategy_choice_system) {
            
            const lastDialog = this.game.currentEvent.dialogues[this.game.currentEvent.dialogues.length - 1];
            if (lastDialog && (
                lastDialog.text.includes("The three quickly discuss strategies") || 
                lastDialog.text.includes("Everyone has come up with their own plan")
            )) {
                this.debug('Strategy discussion detected at end of high social branch, triggering strategy system');
                
                setTimeout(() => {
                    this.showStrategyChoiceSystem();
                }, 500);
            }
        }
    }

    directAccountChoicesTrigger() {
        this.debug('!!!Directly triggering account selection system!!!');
        
        this.game.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        this.showAccountChoices();
    }

    showContinueOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'continue-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        const button = document.createElement('button');
        button.textContent = 'Continue';
        Object.assign(button.style, {
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#1abc9c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        button.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#16a085';
            this.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#1abc9c';
            this.style.transform = 'scale(1)';
        });

        button.addEventListener('click', () => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            this.endEvent();
        });

        overlay.appendChild(button);
        document.body.appendChild(overlay);
    }

    createEndingOverlay() {
        if (this.endingOverlay) {
            document.body.removeChild(this.endingOverlay);
        }

        this.endingOverlay = document.createElement('div');
        Object.assign(this.endingOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            opacity: '0',
            transition: 'opacity 2s ease',
            zIndex: '9998',
            pointerEvents: 'none'
        });
        document.body.appendChild(this.endingOverlay);

        setTimeout(() => {
            if (this.endingOverlay) {
                this.endingOverlay.style.opacity = '1';
            }
        }, 10);
    }

    async performSocialCheck() {
        this.cleanupBranchState();
        
        let requiredValue = 70;
        
        if (this.lastSocialCheckValue) {
            this.debug(`Using last saved social check value: ${this.lastSocialCheckValue}`);
            requiredValue = parseInt(this.lastSocialCheckValue) || 70;
        } else {
            const socialCheckDialog = this.game.currentEvent.dialogues.find(d => d.character === "social_check");
            if (socialCheckDialog) {
                this.debug(`Found social check from dialogues: ${socialCheckDialog.text}`);
                requiredValue = parseInt(socialCheckDialog.text) || 70;
            } else if (this.game.currentEvent.social_check && this.game.currentEvent.social_check.text) {
                this.debug(`Found social check from event JSON: ${this.game.currentEvent.social_check.text}`);
                requiredValue = parseInt(this.game.currentEvent.social_check.text) || 70;
            }
        }
        
        const currentSocialValue = this.game.gameState.social || 0;
        this.debug(`Performing social check: Current=${currentSocialValue}, Required=${requiredValue}`);
        
        try {
            if (currentSocialValue >= requiredValue) {
                this.debug('Social check passed, switching to high social branch');
                
                if (!this.game.currentEvent.high_social_branch || this.game.currentEvent.high_social_branch.length === 0) {
                    this.debug('Error: High social branch not found');
                    return;
                }
                
                this.game.currentEvent.dialogues = [...this.game.currentEvent.high_social_branch];
                this.game.currentDialogIndex = 0;
                
                // Reset strategy system state
                this.isTransitioningToStrategySystem = false;
                this.isShowingStrategyCompletion = false;
                
                setTimeout(() => {
                    this.showCurrentDialog();
                }, 500);
            } else {
                this.debug('Social check failed, switching to low social branch');
                
                if (!this.game.currentEvent.low_social_branch || this.game.currentEvent.low_social_branch.length === 0) {
                    this.debug('Error: Low social branch not found');
                    return;
                }
                
                this.game.currentEvent.dialogues = [...this.game.currentEvent.low_social_branch];
                this.game.currentDialogIndex = 0;
                
                setTimeout(() => {
                    this.showCurrentDialog();
                }, 500);
            }
        } catch (error) {
            console.error('Error during social check:', error);
            this.debug(`Social check error: ${error}`);
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[Ending Event] Game instance found, preparing to inject ending event handler');
            
            
            enhanceGameWithEndingHandler();
        }
    }, 100);
});


function enhanceGameWithEndingHandler() {
    
    if (!window.currentGame) {
        console.error('[ending event] game instance not initialized, cannot inject handler');
        
        setTimeout(enhanceGameWithEndingHandler, 500);
        return;
    }
    
    
    if (window.currentGame.endingHandler) {
        console.log('[Ending Event] Cleaning up old handler resources');
        try {
            window.currentGame.endingHandler.cleanup();
        } catch(e) {
            console.error('[ending event] error: cleaning up old handler resources', e);
        }
    }
    
    
    window.currentGame.endingHandler = new EndingEventHandler(window.currentGame);
    
    
    const originalInit = window.currentGame.init;
    window.currentGame.init = async function() {
        
        await originalInit.call(this);
        
        
        setTimeout(() => {
            if (this.gameState && this.gameState.day >= 20) {
                console.log(`[ending event] initialized, detected day ${this.gameState.day}, preparing to trigger ending event`);
                
                this.hasEventEnded = true;
                this.isEventEnding = true;
                
                
                setTimeout(() => {
                    if (this.endingHandler) {
                        this.endingHandler.loadEvent();
                    }
                }, 500);
            }
        }, 300);
    };
    
    
    const originalHandleNextEventSteps = window.currentGame.handleNextEventSteps;
    window.currentGame.handleNextEventSteps = function() {
        
        const isEndingDay = this.gameState.day >= 20; 
        
        if (isEndingDay) {
            this.debug('reached ending event trigger condition (day 20), loading ending event');
            
            
            setTimeout(() => {
                if (this.endingHandler) {
                    this.endingHandler.loadEvent();
                } else {
                    console.error('[ending event] handler not found');
                    originalHandleNextEventSteps.call(this);
                }
            }, 200);
            return;
        }
        
        
        originalHandleNextEventSteps.call(this);
    };
    
    
    const originalLoadMorningEvent = window.currentGame.loadMorningEvent;
    window.currentGame.loadMorningEvent = async function() {
        
        if (this.gameState && this.gameState.day >= 20) {
            console.log(`[ending event] day ${this.gameState.day}, not loading morning event`);
            
            
            if (this.endingHandler) {
                await this.endingHandler.loadEvent();
            }
            return;
        }
        
        
        return originalLoadMorningEvent.call(this);
    };
    
    
    const originalLoadEvent = window.currentGame.loadEvent;
    window.currentGame.loadEvent = async function(eventType) {
        
        if (eventType !== 'ending' && this.endingHandler) {
            console.log(`[ending event] loading ${eventType} event, cleaning up ending event listener`);
            try {
                this.endingHandler.cleanup();
            } catch(e) {
                console.error('[ending event] error: cleaning up handler', e);
            }
        }
        
        
        return originalLoadEvent.call(this, eventType);
    };
    
    
    const originalEndEvent = window.currentGame.endEvent;
    window.currentGame.endEvent = async function() {
        
        if (this.currentEvent && this.currentEvent.type !== 'ending' && this.endingHandler) {
            console.log(`[ending event] ${this.currentEvent.type} event ended, cleaning up ending event listener`);
            try {
                this.endingHandler.cleanup();
            } catch(e) {
                console.error('[ending event] error: cleaning up handler', e);
            }
        }
        
        
        return originalEndEvent.call(this);
    };
    
    
    const originalShowEventSummaryUI = window.currentGame.showEventSummaryUI;
    window.currentGame.showEventSummaryUI = function(summary) {
        
        if (this.currentEvent && this.currentEvent.type !== 'ending' && this.endingHandler) {
            console.log(`[ending event] ${this.currentEvent.type} event summary displayed, cleaning up ending event listener`);
            try {
                this.endingHandler.cleanup();
            } catch(e) {
                console.error('[ending event] error: cleaning up handler', e);
            }
        }
        
        
        return originalShowEventSummaryUI.call(this, summary);
    };
    
    console.log('[Ending Event] Ending event handler injection complete');
} 