
document.addEventListener('DOMContentLoaded', function() {
    console.log('[fix] weekend event fix script loading...');
    
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[fix] game instance found, start enhance');
            
            const originalHandleClick = window.currentGame.handleClick;
            const originalShowCurrentDialog = window.currentGame.showCurrentDialog;
            
            window.currentGame.showCurrentDialog = function() {
                try {
                    let isWeekendBranchDialog = false;
                    if (typeof window.isWeekendBranchDialog === 'function') {
                        isWeekendBranchDialog = window.isWeekendBranchDialog();
                    } else {
                        isWeekendBranchDialog = this.currentEvent && 
                            this.currentEvent.type === 'weekend' && 
                            this.hasCompletedQuiz && 
                            this.isProcessingBranchDialogues;
                    }
                    
                    if (isWeekendBranchDialog) {
                        console.log(`[fix] show weekend branch dialog: ${this.currentDialogIndex + 1}/${this.currentEvent.dialogues.length}`);
                        

                        if (!this.boundHandleClick) {
                            this.boundHandleClick = this.handleClick.bind(this);
                        }
                        document.removeEventListener('click', this.boundHandleClick);
                        document.addEventListener('click', this.boundHandleClick);
                    }
                } catch (err) {
                    console.error('[fix] showCurrentDialog enhance error:', err);
                }
                

                return originalShowCurrentDialog.apply(this, arguments);
            };
            
            window.currentGame.handleClick = function(e) {
                try {

                    if (this.currentEvent && this.currentEvent.type === 'weekend') {

                        let isWeekendBranchDialog = false;
                        if (typeof window.isWeekendBranchDialog === 'function') {
                            isWeekendBranchDialog = window.isWeekendBranchDialog();
                        } else {
                            isWeekendBranchDialog = this.hasCompletedQuiz && this.isProcessingBranchDialogues;
                        }
                        
                        if (isWeekendBranchDialog) {
                            console.log('[fix] handle weekend event branch dialog click');
                            

                            if (this.hasEventEnded || this.isEventEnding) {
                                console.log('[fix] event ended or ending, ignore click');
                                return;
                            }
                            
                            
                            if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
                                console.log('[fix] ignore button or overlay click');
                                return;
                            }
                            

                            if (this.isTyping) {
                                console.log('[fix] speed up text display');
                                
                                this.currentTypingId = null;
                                this.isTyping = false;
                                if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                    this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                                }
                                return;
                            }
                            
                            console.log('[fix] weekend event branch dialog click to next dialog', this.currentDialogIndex);
                            
                            
                            this.currentDialogIndex++;
                            
                            
                            if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                
                                this.showCurrentDialog();
                            } else {

                                console.log('[fix] weekend event branch dialog end, prepare to end event');
                                

                                this.isProcessingBranchDialogues = false;
                                
                                
                                this.hasProcessedBranches = true;
                                
                                
                                this.showContinueButton('continue', () => {
                                    this.endEvent();
                                });
                            }
                            return;
                        } else {

                            console.log('[fix] handle normal weekend event click');
                            
                            if (this.hasEventEnded || this.isEventEnding) {
                                console.log('[fix] event ended or ending, ignore click');
                                return;
                            }
                            

                            if (this.hasStartedQuiz) {
                                console.log('[fix] quiz stage, ignore click event');
                                return;
                            }
                            
                            
                            if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
                                console.log('[fix] ignore button or overlay click');
                                return;
                            }
                            

                            if (this.isTyping) {
                                console.log('[fix] speed up text display');
                                
                                this.currentTypingId = null;
                                this.isTyping = false;
                                if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                    this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                                }
                                return;
                            }
                            
                            console.log('[fix] weekend event click to next dialog', this.currentDialogIndex);
                            

                            this.currentDialogIndex++;
                            
                            
                            if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                
                                this.showCurrentDialog();
                            } else {
                                
                                console.log('[fix] weekend event dialog end, prepare to enter quiz');
                                
                                if (this.currentEvent.quiz && !this.hasCompletedQuiz) {

                                    this.showContinueButton('start quiz', () => {
                                        this.showQuizQuestion();
                                    });
                                } else {
                                    
                                    this.showContinueButton('continue', () => {
                                        this.endEvent();
                                    });
                                }
                            }
                            return;
                        }
                    }
                } catch (err) {
                    console.error('[fix] handleClick enhance error:', err);
                }
                

                return originalHandleClick.apply(this, arguments);
            };
            
            console.log('[fix] weekend event fix script completed');
        }
    }, 100);
});

document.addEventListener('DOMContentLoaded', function() {

    setTimeout(() => {

        const gameScreen = document.querySelector('.game-screen');
        
        if (gameScreen) {

            gameScreen.addEventListener('click', function(event) {

                if (!window.currentGame) return;
                

                let isInBranchDialog = false;
                if (typeof window.isWeekendBranchDialog === 'function') {
                    isInBranchDialog = window.isWeekendBranchDialog();
                } else {
                    isInBranchDialog = window.currentGame.currentEvent && 
                                    window.currentGame.currentEvent.type === 'weekend' && 
                                    window.currentGame.hasCompletedQuiz && 
                                    window.currentGame.isProcessingBranchDialogues;
                }
                
                if (isInBranchDialog) {

                    if (event.target.tagName === 'BUTTON' || 
                        event.target.id === 'continue-overlay' || 
                        event.target.closest('#continue-overlay')) {
                        return;
                    }
                    
                    console.log('[direct click] detect branch dialog click');
                    

                    if (window.currentGame.isTyping) {
                        console.log('[direct click] speed up text display');
                        window.currentGame.isTyping = false;
                        window.currentGame.currentTypingId = null;
                        
                        
                        if (window.currentGame.currentEvent.dialogues && 
                            window.currentGame.currentDialogIndex < window.currentGame.currentEvent.dialogues.length) {
                            window.currentGame.elements.dialogText.textContent = 
                                window.currentGame.currentEvent.dialogues[window.currentGame.currentDialogIndex].text;
                        }
                        return;
                    }
                    

                    event.stopPropagation();
                    
                    console.log('[direct click] handle branch dialog click');
                    
                    window.currentGame.currentDialogIndex++;
                    

                    if (window.currentGame.currentDialogIndex < window.currentGame.currentEvent.dialogues.length) {

                        window.currentGame.showCurrentDialog();
                    } else {
                        
                        console.log('[direct click] branch dialog end, show continue button');
                        window.currentGame.isProcessingBranchDialogues = false;
                        window.currentGame.hasProcessedBranches = true; 
                        window.currentGame.showContinueButton('continue', () => {
                            window.currentGame.endEvent();
                        });
                    }
                }
            });
            
            console.log('[fix] add click event listener');
        }
    }, 3000);
}); 