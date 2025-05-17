
class RegularEventHandler {
    constructor(gameInstance) {
        
        this.game = gameInstance;
        
        
        this.isProcessingChoice = false; 
        this.secondEventLoaded = false; 
        this.currentEventType = null; 
        this.specialDays = [7, 14]; 
        this.choicesVisibilityTimer = null; 
        
        
        this.boundHandleClick = this.handleClick.bind(this);
        
        
        this.init();
    }
    
        init() {
        console.log('[Regular Event] Initializing regular event handler');
        
        
        this.saveDialogBoxOriginalPosition();
        
        
        setInterval(() => this.fixDialogBoxPosition(), 1000);
    }
    
        saveDialogBoxOriginalPosition() {
        const dialogBox = document.querySelector('.dialog-box');
        if (!dialogBox) return;
        
        
        const computedStyle = window.getComputedStyle(dialogBox);
        
        
        this.dialogBoxOriginalPosition = {
            position: computedStyle.position,
            top: computedStyle.top,
            bottom: computedStyle.bottom,
            left: computedStyle.left,
            right: computedStyle.right,
            transform: computedStyle.transform,
            marginTop: computedStyle.marginTop,
            marginBottom: computedStyle.marginBottom,
            display: computedStyle.display,
            height: computedStyle.height,
            maxHeight: computedStyle.maxHeight,
            minHeight: computedStyle.minHeight,
            overflowY: computedStyle.overflowY,
            flexDirection: computedStyle.flexDirection,
            paddingBottom: computedStyle.paddingBottom
        };
        
        
        this.dialogBoxOriginalHeight = dialogBox.offsetHeight;
        
        console.log('[Regular Event] Saved dialog box original position:', this.dialogBoxOriginalPosition);
    }
    
        fixDialogBoxPosition() {
        if (!this.dialogBoxOriginalPosition) {
            this.saveDialogBoxOriginalPosition();
            return;
        }
        
        
        if (this.game.choicesAlreadyShown) {
            return;
        }
        
        const dialogBox = document.querySelector('.dialog-box');
        if (!dialogBox) return;
        
        
        const currentStyle = window.getComputedStyle(dialogBox);
        
        
        const isPositionChanged = 
            this.checkStyleChanged(currentStyle.top, this.dialogBoxOriginalPosition.top) ||
            this.checkStyleChanged(currentStyle.bottom, this.dialogBoxOriginalPosition.bottom) ||
            this.checkStyleChanged(currentStyle.transform, this.dialogBoxOriginalPosition.transform);
        
        
        if (this.game.currentEvent && this.game.currentEvent.choices && 
            this.game.currentEvent.choices.length > 0 && 
            this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1) {
            
            dialogBox.style.zIndex = '999';
            return;
        }
        
        if (isPositionChanged) {
            console.log('[Regular Event] Detected abnormal dialog box position, restoring...');
            
            
            Object.keys(this.dialogBoxOriginalPosition).forEach(key => {
                dialogBox.style[key] = this.dialogBoxOriginalPosition[key];
            });
            
            
            dialogBox.style.zIndex = '999';
            
            
            const gameScreen = document.querySelector('.game-screen');
            if (gameScreen) {
                gameScreen.style.transform = 'none';
                
                
                gameScreen.style.position = '';
                gameScreen.style.top = '';
                gameScreen.style.bottom = '';
            }
            
            console.log('[Regular Event] Dialog box position restored');
        }
    }
    
    /**
     * Check if the style attribute has changed
     * @param {string} current 
     * @param {string} original 
     * @returns {boolean} 
     */
    checkStyleChanged(current, original) {
        // Handle the special case of the transform attribute
        if (current.includes('matrix') || original.includes('matrix')) {
            return current !== original;
        }
        
        
        if (current.includes('px') && original.includes('px')) {
            const currentVal = parseFloat(current);
            const originalVal = parseFloat(original);
            return Math.abs(currentVal - originalVal) > 5; 
        }
        
        
        return current !== original && current !== 'auto' && original !== 'auto';
    }
    
        debug(message) {
        if (this.game.debugMode) {
            const details = ` (Event type:${this.currentEventType}, Dialogue index:${this.game.currentDialogIndex}, Total dialogues:${this.game.currentEvent?.dialogues?.length || 0})`;
            console.log(`[REGULAR] ${message}${details}`);
        }
    }
    
        async loadMorningEvent() {
        this.debug('Loading morning event');
        this.currentEventType = 'morning';
        this.secondEventLoaded = false;
        
        
        this.game.choicesAlreadyShown = false;
        
        try {
            const response = await fetch('/get_event/morning');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            this.game.currentEvent = await response.json();
            
            
            if (this.game.currentEvent && !this.game.currentEvent.error) {
                this.game.currentEvent.type = 'morning';
                this.game.currentDialogIndex = 0;
                this.game.hasEventEnded = false;
                this.game.isEventEnding = false;
                this.debug('Successfully loaded morning event:' + this.game.currentEvent.id);
                
                
                console.log('[Music] Morning event loaded, preparing to play music (morning -> school.mp3)');
                this.game.playBackgroundMusic('morning');
                
                
                document.removeEventListener('click', this.game.boundHandleClick);
                document.removeEventListener('click', this.boundHandleClick);
                
                
                setTimeout(() => {
                    document.addEventListener('click', this.boundHandleClick);
                    this.debug('Binding regular event click listener');
                    
                    
                    this.showCurrentDialog();
                }, 50);
            } else {
                console.error('No available morning events', this.game.currentEvent);
                this.game.elements.dialogText.textContent = 'Nothing special happened today...';
                this.game.elements.speakerName.textContent = 'Narrator';
                this.game.showContinueButton('Continue', () => this.game.startNewDay());
            }
        } catch (error) {
            console.error('Failed to load morning event:', error);
            this.game.elements.dialogText.textContent = 'Error loading event...';
            this.game.elements.speakerName.textContent = 'Error';
        }
    }
    
        async loadSecondEvent() {
        this.game.choicesAlreadyShown = false;
        this.game.stopBackgroundMusic();
        
        try {
            const currentDay = this.game.gameState.day;
            
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
                this.game.currentEvent = phoneEvent;
                this.game.currentDialogIndex = 0;
                this.game.hasEventEnded = false;
                this.game.isEventEnding = false;
                this.currentEventType = 'phone';
                this.secondEventLoaded = true;
                
                this.game.playBackgroundMusic('phone');
                
                document.removeEventListener('click', this.boundHandleClick);
                document.addEventListener('click', this.boundHandleClick);
                
                this.showCurrentDialog();
                return true;
            }
            
            const homeEvent = await checkDaySpecificEvent('home', currentDay);
            if (homeEvent) {
                this.game.currentEvent = homeEvent;
                this.game.currentDialogIndex = 0;
                this.game.hasEventEnded = false;
                this.game.isEventEnding = false;
                this.currentEventType = 'home';
                this.secondEventLoaded = true;
                
                this.game.playBackgroundMusic('home');
                
                document.removeEventListener('click', this.boundHandleClick);
                document.addEventListener('click', this.boundHandleClick);
                
                this.showCurrentDialog();
                return true;
            }
            
            const eventTypes = ['phone', 'home'];
            const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            
            return await this.loadSpecificEvent(randomType);
            
        } catch (error) {
            console.error('Failed to load second event:', error);
            this.game.startNewDay();
            return false;
        }
    }
    
        async loadSpecificEvent(type) {
        this.debug(`Loading event type: ${type}`);
        
        this.game.choicesAlreadyShown = false;
        
        if (!this.secondEventLoaded) {
            this.game.stopBackgroundMusic();
        }
        
        try {
            const currentDay = this.game.gameState.day;
            const response = await fetch(`/get_event/${type}?t=${Date.now()}&day=${currentDay}`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const event = await response.json();
            
            if (event.error) {
                return false;
            }
            
            event.type = type;
            this.game.currentEvent = event;
            this.game.currentDialogIndex = 0;
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            this.currentEventType = type;
            this.secondEventLoaded = true;
            
            this.game.playBackgroundMusic(type);
            
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            
            this.showCurrentDialog();
            return true;
            
        } catch (error) {
            console.error('Failed to load specific event:', error);
            return false;
        }
    }
    
        ensureElementVisible(element, shouldScroll = false) {
        if (!element) return;
        
        
        element.style.zIndex = '1000';
        
        
        if (window.getComputedStyle(element).display === 'none') {
            element.style.display = element.tagName.toLowerCase() === 'div' ? 'block' : 'flex';
        }
    }
    
        showCurrentDialog() {
        
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('Event has ended or is ending, not showing dialogue');
            return;
        }
        
        
        if (!this.game.currentEvent || !this.game.currentEvent.dialogues) {
            console.error('Cannot show dialogue: current event or dialogue does not exist');
            return;
        }
        
        
        if (this.game.currentDialogIndex < 0 || this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length) {
            console.error('Cannot show dialogue: dialogue index out of bounds', this.game.currentDialogIndex);
            return;
        }
        
        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
        if (!dialog) {
            console.error('Cannot show dialogue: no dialogue content at current index');
            return;
        }
        
        this.debug(`Showing dialogue: ${this.game.currentDialogIndex + 1}/${this.game.currentEvent.dialogues.length}`);
        
        
        this.cleanupChoiceElements();
        
        
        if (this.game.currentEvent.background && this.game.currentDialogIndex === 0) {
            const bgPath = `/static/images/${this.game.currentEvent.background}`;
            this.game.setBackgroundImage(bgPath);
        }
        
        
        this.game.updateCharacters(dialog);
        
        
        const speakerName = dialog.character.split('_')[0];
        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
        
        
        this.game.typeText(dialog.text);
        
        
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        
        
        this.game.clearAllChoices();
        
        
        if (isLastDialog) {
            
            if (this.game.currentEvent.choices && this.game.currentEvent.choices.length > 0) {
                
                setTimeout(() => {
                    this.debug('Automatically showing choices after dialogue completion');
                    
                    this.forceClearAndShowChoices(this.game.currentEvent.choices);
                }, 1000); 
            } else {
                
                setTimeout(() => {
                    this.game.showContinueButton('Continue', () => {
                        this.debug('Clicked continue button, ending event');
                        this.endEvent();
                    });
                }, 100);
            }
        }
        
        
        this.fixDialogBoxPosition();
    }
    
        cleanupChoiceElements() {
        
        const overlays = document.querySelectorAll('.choice-overlay');
        overlays.forEach(overlay => {
            if (overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                this.debug('Removing choice overlay');
            }
        });
        
        
        const containers = document.querySelectorAll('.choice-container-fixed');
        containers.forEach(container => {
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
                this.debug('Removing choice container');
            }
        });
    }
    
        forceClearAndShowChoices(choices) {
        this.debug(`Force showing choices, count: ${choices.length}`);
        
        
        this.game.choicesAlreadyShown = true;
        
        
        this.game.playPromptSound();
        
        
        this.cleanupChoiceElements();
        
        
        this.fixDialogBoxPosition();
        
        
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
        
        
        choices.forEach((choice, index) => {
            const buttonContainer = document.createElement('div');
            Object.assign(buttonContainer.style, {
                marginBottom: '15px',
                animation: `float-in 0.5s ease forwards ${0.1 + index * 0.1}s`,
                opacity: '0',
                transform: 'translateY(20px)'
            });
            
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
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
                
                this.game.playClickSound();
                
                
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
                    
                    if (ripple && button.contains(ripple)) {
                        ripple.remove();
                    }
                    
                    this.debug(`Clicked option: ${index}`);
                    
                    
                    if (overlay && document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    
                    
                    this.handleChoice(index);
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
        
        
        this.startChoicesVisibilityCheck();
    }
    
        startChoicesVisibilityCheck() {
        
        if (this.choicesVisibilityTimer) {
            clearInterval(this.choicesVisibilityTimer);
            this.choicesVisibilityTimer = null;
        }
        
        
        this.choicesVisibilityTimer = setInterval(() => {
            
            const choicesContainer = document.querySelector('.choices');
            if (!choicesContainer) {
                clearInterval(this.choicesVisibilityTimer);
                this.choicesVisibilityTimer = null;
                return;
            }
            
            
            const dialogBox = document.querySelector('.dialog-box');
            if (!dialogBox) return;
            
            
            dialogBox.style.zIndex = '999';
            
            
            if (dialogBox.style.flexDirection !== 'column-reverse') {
                dialogBox.style.flexDirection = 'column-reverse';
            }
            
            
            if (dialogBox.style.maxHeight !== '80vh') {
                dialogBox.style.maxHeight = '80vh';
            }
            
            
            if (dialogBox.style.overflowY !== 'auto') {
                dialogBox.style.overflowY = 'auto';
            }
            
            
            setTimeout(() => {
                dialogBox.scrollTop = 0;
            }, 10);
            
        }, 500); 
        
        
        setTimeout(() => {
            if (this.choicesVisibilityTimer) {
                clearInterval(this.choicesVisibilityTimer);
                this.choicesVisibilityTimer = null;
            }
        }, 5000);
    }
    
        handleClick(e) {
        
        if (this.game.dialogStartTime && Date.now() - this.game.dialogStartTime < 120) {
            this.debug('Ignoring too fast clicks');
            return;
        }
        
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('Event ended or ending, ignoring click');
            return;
        }
        
        
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay') || e.target.closest('.choice-overlay')) {
            this.debug('Ignoring button or overlay clicks');
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
        const hasChoices = this.game.currentEvent.choices && this.game.currentEvent.choices.length > 0;
        
        
        if (isLastDialog && hasChoices) {
            this.debug('Current dialogue is the last one and has choices, showing choices directly');
            
            this.forceClearAndShowChoices(this.game.currentEvent.choices);
            return;
        }
        
        
        this.debug(`Moving to next dialogue ${this.game.currentDialogIndex + 1}`);
        this.game.currentDialogIndex++;
        
        
        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            
            this.showCurrentDialog();
        } else {
            
            this.debug('All dialogues completed');
            
            
            this.game.clearAllChoices();
            
            
            if (hasChoices) {
                
                this.debug('Force showing choices after dialogue completion');
                
                this.forceClearAndShowChoices(this.game.currentEvent.choices);
                
                
                this.game.choicesAlreadyShown = true;
            } else {
                
                setTimeout(() => {
                    this.game.showContinueButton('Continue', () => {
                        this.debug('Clicked continue button, ending event');
                        this.endEvent();
                    });
                }, 100);
            }
        }
    }
    
        async handleChoice(choiceIndex) {
        try {
            
            if (!this.game.currentEvent || !this.game.currentEvent.choices || choiceIndex >= this.game.currentEvent.choices.length) {
                console.error('Invalid choice index or choices do not exist');
                this.isProcessingChoice = false;
                return;
            }
            
            const choice = this.game.currentEvent.choices[choiceIndex];
            this.debug(`Selected choice: ${choiceIndex}, content: ${choice.text}`);
            
            
            if (choice.outcome && choice.outcome.stats) {
                this.debug(`Updating game state: ${JSON.stringify(choice.outcome.stats)}`);
                Object.keys(choice.outcome.stats).forEach(key => {
                    
                    const gameStateKey = this.game.mapStatKey(key);
                    if (gameStateKey) {
                        this.game.gameState[gameStateKey] += choice.outcome.stats[key];
                        this.debug(`Updated ${gameStateKey}: ${this.game.gameState[gameStateKey]}`);
                    }
                });
                this.game.updateStatusBar();
                await this.game.saveGameState();
            }

            
            this.game.clearAllChoices();
            document.removeEventListener('click', this.boundHandleClick);
            
            
            if (choice.outcome && choice.outcome.dialogues && choice.outcome.dialogues.length > 0) {
                this.debug(`Showing dialogues after choice, count: ${choice.outcome.dialogues.length}`);
                
                
                this.game.currentEvent.dialogues = choice.outcome.dialogues;
                this.game.currentDialogIndex = 0;
                
                
                this.isProcessingChoice = false;
                
                
                const handleOutcomeDialogs = (e) => {
                    
                    if (e.target.tagName === 'BUTTON') {
                        return;
                    }
                    
                    
                    if (this.game.isTyping) {
                        this.debug('Accelerating text display');
                        this.game.isTyping = false;
                        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                            this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                        }
                        return;
                    }
                    
                    
                    this.debug('Clicked continue dialogue');
                    this.game.currentDialogIndex++;
                    
                    
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        
                        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
                        
                        
                        this.game.updateCharacters(dialog);
                        
                        
                        const speakerName = dialog.character.split('_')[0];
                        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                        
                        
                        this.game.typeText(dialog.text);
                    } else {
                        
                        this.debug('End of choice dialogue');
                        
                        
                        document.removeEventListener('click', handleOutcomeDialogs);
                        
                        
                        this.game.clearAllChoices();
                        setTimeout(() => {
                            this.game.showContinueButton('Continue', () => {
                                this.debug('Clicked continue button, ending event');
                                this.endEvent();
                            });
                        }, 100);
                    }
                };
                
                
                document.addEventListener('click', handleOutcomeDialogs);
                
                
                const dialog = this.game.currentEvent.dialogues[0];
                
                
                this.game.updateCharacters(dialog);
                
                
                const speakerName = dialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                
                
                this.game.typeText(dialog.text);
            } else {
                
                this.debug('Choice has no follow-up dialogues, ending event directly');
                this.isProcessingChoice = false; 
                this.endEvent();
            }
        } catch (error) {
            console.error('Error handling choice:', error);
            this.isProcessingChoice = false; 
        }
    }
    
        async endEvent() {
        this.debug('Ending event');
        
        
        this.game.hasEventEnded = true;
        this.game.isEventEnding = true;
        
        
        this.game.choicesAlreadyShown = false;
        
        
        console.log('[Music] Event ended, stopping current music');
        this.game.stopBackgroundMusic();
        
        
        const dialogBox = document.querySelector('.dialog-box');
        if (dialogBox) {
            
            dialogBox.style.flexDirection = 'column';
            dialogBox.style.height = 'auto';
            dialogBox.style.maxHeight = 'none';
            dialogBox.style.overflowY = 'visible';
            
            
            if (this.dialogBoxOriginalPosition) {
                Object.keys(this.dialogBoxOriginalPosition).forEach(key => {
                    dialogBox.style[key] = this.dialogBoxOriginalPosition[key];
                });
            }
        }
        
        
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            
            if (this.game.currentEvent && this.game.currentEvent.id) {
                if (!this.game.gameState.completed_events.includes(this.game.currentEvent.id)) {
                    this.game.gameState.completed_events.push(this.game.currentEvent.id);
                    this.debug(`Completed events list: ${this.game.gameState.completed_events.join(', ')}`);
                }
                
                
                const previousFans = this.game.gameState.fans || 0;
                await this.game.saveGameState();
                const currentFans = this.game.gameState.fans || 0;
                
                if (currentFans > previousFans) {
                    this.debug(`Detected fans growth: ${previousFans} -> ${currentFans}`);
                    this.game.playGrowSound();
                }
            }
            
            
            if (this.game.currentEvent && this.game.currentEvent.summary && this.game.currentEvent.summary.trim() !== '') {
                this.debug(`Showing event summary: ${this.game.currentEvent.summary}`);
                
                // Semi-transparent character hint
                this.game.elements.characterLeft.style.opacity = '0.5';
                this.game.elements.characterRight.style.opacity = '0.5';
                
                
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                
                this.game.showEventSummaryUI(this.game.currentEvent.summary);
                return;
            }
            
            
            if (this.currentEventType === 'morning') {
                
                const isSpecialDay = this.specialDays.includes(this.game.gameState.day);
                
                if (isSpecialDay) {
                    this.debug(`Special day ${this.game.gameState.day}, only one event, starting new day directly`);
                    setTimeout(() => this.game.startNewDay(), 200);
                } else {
                    
                    this.debug('Morning event ended, loading second event');
                    setTimeout(() => this.loadSecondEvent(), 200);
                }
            } else {
                
                this.debug('Non-morning event ended, starting new day');
                setTimeout(() => this.game.startNewDay(), 200);
            }
        } catch (error) {
            console.error('Error ending event:', error);
            
            setTimeout(() => this.game.startNewDay(), 200);
        }
    }
    
        cleanup() {
        
        document.removeEventListener('click', this.boundHandleClick);
        
        
        if (this.choicesVisibilityTimer) {
            clearInterval(this.choicesVisibilityTimer);
            this.choicesVisibilityTimer = null;
        }
        
        
        this.cleanupChoiceElements();
        
        console.log('[Regular event] Resources cleaned up');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[Regular event] Game instance found, preparing to inject regular event handler');
            
            
            enhanceGameWithRegularHandler();
        }
    }, 100);
});

function enhanceGameWithRegularHandler() {
    
    if (!window.currentGame) {
        console.error('[Regular event] Game instance not initialized, cannot inject handler');
        
        setTimeout(enhanceGameWithRegularHandler, 500);
        return;
    }
    
    
    if (!window.currentGame.clearAllChoices || !window.currentGame.createChoicesContainer) {
        console.error('[常规事  件] 游戏实例缺少关键方法，等待初始化完成');
        
        setTimeout(enhanceGameWithRegularHandler, 500);
        return;
    }
    
    
    if (window.currentGame.regularHandler) {
        console.log('[Regular event] Cleaning up old processor resources');
        try {
            window.currentGame.regularHandler.cleanup();
        } catch(e) {
            console.error('[Regular event] Error cleaning up old processor:', e);
        }
    }
    
    
    window.currentGame.regularHandler = new RegularEventHandler(window.currentGame);
    
    
    const originalLoadMorningEvent = window.currentGame.loadMorningEvent;
    const originalLoadNextEvent = window.currentGame.loadNextEvent;
    const originalLoadSecondEvent = window.currentGame.loadSecondEvent;
    const originalShowChoices = window.currentGame.showChoices; 
    
    
    
    window.currentGame.showChoices = function(choices) {
        console.log('[Regular event] Intercepting showChoices call, using optimized choice styles');
        
        
        if (!this.regularHandler || this.hasEventEnded || this.isEventEnding) {
            return originalShowChoices.call(this, choices);
        }
        
        
        this.regularHandler.forceClearAndShowChoices(choices);
    };
    
    
    window.currentGame.loadMorningEvent = async function() {
        console.log('[Regular event] Using dedicated processor to load morning event');
        try {
            return await window.currentGame.regularHandler.loadMorningEvent();
        } catch (error) {
            console.error('[Regular event] Failed to load morning event, using original method:', error);
            
            if (originalLoadMorningEvent) {
                return await originalLoadMorningEvent.call(this);
            }
        }
    };
    
    
    window.currentGame.loadNextEvent = async function() {
        console.log('[Regular event] Using dedicated processor to load next event');
        
        try {
            
            this.clearAllChoices();
            
            
            console.log('[Music] Preparing to load next event, stopping current music');
            this.stopBackgroundMusic();
            
            
            if (!this.currentEvent || this.currentEvent.type !== 'morning') {
                console.log('[Regular event] Non-morning event, starting new day directly');
                setTimeout(() => this.startNewDay(), 200);
                return;
            }
            
            
            return await window.currentGame.regularHandler.loadSecondEvent();
        } catch (error) {
            console.error('[Regular event] Failed to load next event, using original method:', error);
            
            if (originalLoadNextEvent) {
                return await originalLoadNextEvent.call(this);
            }
        }
    };
    
    
    window.currentGame.loadSecondEvent = async function() {
        console.log('[Regular event] Using dedicated processor to load second event');
        try {
            return await window.currentGame.regularHandler.loadSecondEvent();
        } catch (error) {
            console.error('[Regular event] Failed to load second event, using original method:', error);
            
            if (originalLoadSecondEvent) {
                return await originalLoadSecondEvent.call(this);
            }
        }
    };
    
    
    window.addEventListener('error', function(event) {
        
        if (event.error && event.error.message && (
            event.error.message.includes('choices') || 
            event.error.message.includes('options') ||
            event.error.message.includes('dialog')
        )) {
            console.error('[Regular event] Captured error related to choices or dialog:', event.error);
            
            
            try {
                if (window.currentGame && window.currentGame.regularHandler && 
                    window.currentGame.currentEvent && 
                    window.currentGame.currentEvent.choices && 
                    window.currentGame.currentEvent.choices.length > 0) {
                    
                    console.log('[Regular event] Attempting to fix choice display');
                    window.currentGame.regularHandler.forceClearAndShowChoices(
                        window.currentGame.currentEvent.choices
                    );
                }
            } catch (e) {
                console.error('[Regular event] Failed to fix choice display:', e);
            }
        }
    });
    
    
    window.addEventListener('beforeunload', function() {
        if (window.currentGame && window.currentGame.regularHandler) {
            try {
                window.currentGame.regularHandler.cleanup();
            } catch(e) {
                console.error('[Regular event] Error cleaning up resources on page unload:', e);
            }
        }
    });
    
    console.log('[Regular event] Regular event handler injection completed');
}


window.isWeekendBranchDialog = function() {
    if (!window.currentGame) return false;
    return window.currentGame.currentEvent && 
           window.currentGame.currentEvent.type === 'weekend' && 
           window.currentGame.hasCompletedQuiz && 
           window.currentGame.isProcessingBranchDialogues;
};


(function enhanceGameCore() {
    
    if (!window.currentGame) {
        setTimeout(enhanceGameCore, 100);
        return;
    }
    
    console.log('[Enhance] Adding music and background enhancement features');
    
    
    let audioElement = document.getElementById('background-music');
    if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = 'background-music';
        audioElement.loop = true; 
        audioElement.volume = 0.5; 
        audioElement.style.display = 'none';
        audioElement.preload = 'auto'; 
        audioElement.crossOrigin = 'anonymous'; 
        document.body.appendChild(audioElement);
        console.log('[Audio] Created audio element', audioElement);
    }
    
    
    audioElement.addEventListener('canplaythrough', () => console.log('[Audio] Event: Audio loaded, ready to play'));
    audioElement.addEventListener('play', () => console.log('[Audio] Event: Playing'));
    audioElement.addEventListener('playing', () => console.log('[Audio] Event: Playing'));
    audioElement.addEventListener('pause', () => console.log('[Audio] Event: Paused'));
    audioElement.addEventListener('error', (e) => console.error('[Audio] Event: Error', e));
    audioElement.addEventListener('stalled', () => console.warn('[Audio] Event: Loading stalled'));
    
    
    const musicMapping = {
        'morning': 'school.mp3',  
        'school': 'school.mp3',
        'home': 'home.mp3',       
        'phone': 'home.mp3',      
        'weekend': 'live.mp3',    
        'default': 'school.mp3'
    };
    
    
    let audioContext, analyser;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        console.log('[Audio] Successfully created audio context and analyzer');
    } catch (err) {
        console.error('[Audio] Failed to create audio context:', err);
    }
    
    
    function tryMultiplePaths(musicType, onSuccess) {
        const musicFile = musicMapping[musicType] || musicMapping['default'];
        console.log(`[Audio] Selected music file for event type "${musicType}": "${musicFile}"`);
        
        const paths = [
            `/static/music/${musicFile}`,
            `./static/music/${musicFile}`,
            `static/music/${musicFile}`,
            `../static/music/${musicFile}`,
            `../../static/music/${musicFile}`,
            `C:/Users/15207/8080/static/music/${musicFile}` 
        ];
        
        console.log(`[Audio] Attempting multiple paths for music type "${musicType}":`, paths);
        
        function tryNextPath(index) {
            if (index >= paths.length) {
                console.error('[Audio] All paths failed');
                return;
            }
            
            const path = paths[index];
            console.log(`[Audio] Attempting path ${index+1}/${paths.length}: ${path}`);
            
            
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', path, true);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    
                    console.log(`[Audio] File exists: ${path}`);
                    audioElement.src = path;
                    audioElement.load();
                    onSuccess(path);
                } else {
                    
                    console.log(`[Audio] File does not exist (${xhr.status}): ${path}`);
                    tryNextPath(index + 1);
                }
            };
            xhr.onerror = function() {
                console.log(`[Audio] Request failed: ${path}`);
                tryNextPath(index + 1);
            };
            xhr.send();
        }
        
        
        tryNextPath(0);
    }
    
    
    if (!window.currentGame.playBackgroundMusic) {
        window.currentGame.playBackgroundMusic = function(musicType, isDirectPath = false) {
            try {
                console.log(`[Audio] Attempting to play background music: ${musicType}, is direct path: ${isDirectPath}`);
                
                
                audioElement.pause();
                
                
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log('[Audio] Audio context resumed');
                    }).catch(err => {
                        console.error('[Audio] Failed to resume audio context:', err);
                    });
                }
                
                
                if (isDirectPath) {
                    console.log(`[Audio] Using direct path to load audio: ${musicType}`);
                    audioElement.src = musicType;
                    audioElement.load();
                    
                    
                    audioElement.oncanplaythrough = function() {
                        console.log(`[Audio] Audio loaded, starting playback: ${musicType}`);
                        
                        const playPromise = audioElement.play();
                        
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('[Audio] Playback started successfully');
                                
                                
                                setTimeout(() => {
                                    if (!audioElement.paused) {
                                        console.log('[Audio] Confirming audio is playing');
                                    } else {
                                        console.warn('[Audio] Audio stopped playing');
                                        
                                        audioElement.play().catch(e => console.error('[Audio] Failed to retry playback:', e));
                                    }
                                }, 1000);
                                
                            }).catch(err => {
                                
                                if (err.name === 'NotAllowedError') {
                                    console.warn('[Audio] Automatic playback blocked, attempting to create play button');
                                    createAudioPlayButton();
                                } else {
                                    console.error('[Audio] Playback failed:', err);
                                }
                            });
                        }
                    };
                } else {
                    
                    tryMultiplePaths(musicType, (path) => {
                        console.log(`[Audio] Successfully loaded audio: ${path}, starting playback`);
                        
                        
                        audioElement.oncanplaythrough = function() {
                            console.log(`[Audio] Audio loaded, starting playback`);
                            
                            const playPromise = audioElement.play();
                            
                            if (playPromise !== undefined) {
                                playPromise.then(() => {
                                    console.log('[Audio] Playback started successfully');
                                    
                                    
                                    setTimeout(() => {
                                        if (!audioElement.paused) {
                                            console.log('[Audio] Confirming audio is playing');
                                        } else {
                                            console.warn('[Audio] Audio stopped playing');
                                            
                                            audioElement.play().catch(e => console.error('[Audio] Failed to retry playback:', e));
                                        }
                                    }, 1000);
                                    
                                }).catch(err => {
                                    
                                    if (err.name === 'NotAllowedError') {
                                        console.warn('[Audio] Automatic playback blocked, attempting to create play button');
                                        createAudioPlayButton();
                                    } else {
                                        console.error('[Audio] Playback failed:', err);
                                    }
                                });
                            }
                        };
                    });
                }
            } catch (err) {
                console.error('[Audio] Error playing music:', err);
            }
        };
    }
    
    
    function createAudioPlayButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Play Music';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = '#3498db';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        
        btn.addEventListener('click', () => {
            audioElement.play().then(() => {
                console.log('[Audio] User click playback successful');
                btn.remove();
            }).catch(err => {
                console.error('[Audio] Even after clicking, playback failed:', err);
            });
        });
        
        document.body.appendChild(btn);
    }
    
    
    if (!window.currentGame.stopBackgroundMusic) {
        window.currentGame.stopBackgroundMusic = function() {
            try {
                console.log('[Audio] Stopping background music');
                audioElement.pause();
                audioElement.currentTime = 0; 
            } catch (err) {
                console.error('[Audio] Error stopping music:', err);
            }
        };
    }
    
    
    const originalSetBackgroundImage = window.currentGame.setBackgroundImage;
    
    window.currentGame.setBackgroundImage = function(imagePath) {
        console.log(`[Background] Attempting to load background image: ${imagePath}`);
        
        
        if (imagePath.includes('school.png') || 
            imagePath.includes('day7.png') || 
            imagePath.includes('day14.png')) {
            
            
            const baseName = imagePath.split('/').pop();
            console.log(`[Background] Detected special image: ${baseName}`);
            
            
            const possiblePaths = [
                `/static/images/${baseName}`,                   
                `/static/images/gamebackground/${baseName}`,    
                `./static/images/gamebackground/${baseName}`,   
                `static/images/gamebackground/${baseName}`,     
                `/static/images/bedroom.png`                    
            ];
            
            
            tryLoadBackgroundImage(possiblePaths);
            return;
        }
        
        
        originalSetBackgroundImage.call(this, imagePath);
    };
    
    
    function tryLoadBackgroundImage(paths, index = 0) {
        if (index >= paths.length) {
            console.error('[Background] All paths failed to load background image');
            window.currentGame.elements.background.style.backgroundColor = '#000';
            return;
        }
        
        const path = paths[index];
        console.log(`[Background] Attempting path ${index+1}/${paths.length}: ${path}`);
        
        const img = new Image();
        img.onload = function() {
            console.log(`[Background] Successfully loaded: ${path}`);
            window.currentGame.elements.background.style.backgroundImage = `url(${path})`;
        };
        
        img.onerror = function() {
            console.log(`[Background] Failed to load: ${path}, trying next path`);
            tryLoadBackgroundImage(paths, index + 1);
        };
        
        
        img.src = `${path}?t=${Date.now()}`;
    }
    
    
    window.currentGame.setMusicVolume = function(volume) {
        try {
            volume = Math.min(1, Math.max(0, volume)); 
            console.log(`[Audio] Setting volume: ${volume}`);
            audioElement.volume = volume;
        } catch (err) {
            console.error('[Audio] Error setting volume:', err);
        }
    };
    
    console.log('[Enhance] Music and background enhancement features added');
})(); 