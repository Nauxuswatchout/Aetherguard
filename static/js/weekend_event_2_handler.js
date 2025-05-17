(function(){
        function customStartType2Quiz() {
        const handler = this;
        handler.debug('Weekendevent-2 selected Start: 90 seconds countdown, hotness mode');
        handler.hasStartedQuiz = true;
        handler.hasCompletedQuiz = false;
        handler.currentHotness = 100;
        let timeLeft = 90;

        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const timerBar = document.getElementById('quiz-timer-bar');
        const quizContainer = document.getElementById('quiz-container');
        
        timerContainer.style.display = 'block';
        quizContainer.style.display = 'block';
        timerContainer.style.zIndex = '2001';
        quizContainer.style.zIndex = '2001';
        
        
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
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            border: '2px solid #3498db',
            transition: 'transform 0.3s ease, opacity 0.3s ease'
        });
        
        
        Object.assign(quizContainer.style, {
            backgroundColor: 'rgba(25, 25, 35, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
            padding: '20px',
            border: '2px solid #3498db',
            transition: 'transform 0.3s ease, opacity 0.3s ease'
        });

        
        const quizRect = quizContainer.getBoundingClientRect();
        let hotnessBox = document.getElementById('hotness-box');
        if (!hotnessBox) {
            hotnessBox = document.createElement('div');
            hotnessBox.id = 'hotness-box';
            console.log('[WeekendEvent-2] Create hotness display box');
            Object.assign(hotnessBox.style, {
                position: 'fixed',
                top: '50%',
                left: 'calc(50% + 340px)',
                transform: 'translateY(-50%)',
                width: '160px', 
                backgroundColor: 'rgba(25, 25, 35, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '15px',
                boxSizing: 'border-box',
                zIndex: '2002',
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
                border: '2px solid #e74c3c',
                transition: 'opacity 0.3s ease',
                opacity: '0',
                margin: '0 0 0 10px'
            });

            
            if (window.innerWidth < 1100) {
                hotnessBox.style.left = 'auto';
                hotnessBox.style.right = '10px';
                hotnessBox.style.top = '50%';
                hotnessBox.style.transform = 'translateY(-50%)';
            }
            
            
            const iconContainer = document.createElement('div');
            Object.assign(iconContainer.style, {
                position: 'relative',
                width: '80px',
                height: '80px',
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                border: '2px solid #e74c3c'
            });
            
            
            const hotIcon = document.createElement('img');
            hotIcon.src = '/static/images/Hot.png';
            hotIcon.alt = '热度';
            Object.assign(hotIcon.style, {
                width: '60px',
                height: '60px',
                animation: 'pulse-hot 1.5s infinite, shake-hot 3s infinite'
            });

            
            if (!document.getElementById('hot-icon-animations')) {
                const styleElem = document.createElement('style');
                styleElem.id = 'hot-icon-animations';
                styleElem.textContent = `
                    @keyframes pulse-hot {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                    @keyframes shake-hot {
                        0%, 100% { transform: translateX(0) rotate(0); }
                        5%, 25% { transform: translateX(-5px) rotate(-3deg); }
                        10%, 30% { transform: translateX(5px) rotate(3deg); }
                        15% { transform: translateX(-5px) rotate(-2deg); }
                        20% { transform: translateX(5px) rotate(2deg); }
                    }
                `;
                document.head.appendChild(styleElem);
            }

            iconContainer.appendChild(hotIcon);
            hotnessBox.appendChild(iconContainer);
            
            
            const textContainer = document.createElement('div');
            Object.assign(textContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                padding: '10px 15px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
            });
            
            
            const label = document.createElement('div');
            label.textContent = 'HOTNESS';
            Object.assign(label.style, {
                fontSize: '16px',
                color: '#e74c3c',
                marginBottom: '5px',
                fontWeight: 'bold'
            });
            textContainer.appendChild(label);
            
            
            handler.hotTextElem = document.createElement('div');
            handler.hotTextElem.id = 'hotness-display-2';
            Object.assign(handler.hotTextElem.style, {
                color: '#ffeb3b',
                fontSize: '28px',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            });
            textContainer.appendChild(handler.hotTextElem);
            hotnessBox.appendChild(textContainer);
            
            document.body.appendChild(hotnessBox);
            
            
            setTimeout(() => {
                hotnessBox.style.opacity = '1';
            }, 100);
        }
        handler.hotTextElem.textContent = `${handler.currentHotness}`;
        
        
        const updateHotnessColor = () => {
            if (handler.currentHotness >= 80) {
                handler.hotTextElem.style.color = '#ffeb3b'; 
            } else if (handler.currentHotness >= 50) {
                handler.hotTextElem.style.color = '#ff9800'; 
            } else if (handler.currentHotness >= 30) {
                handler.hotTextElem.style.color = '#ff5722'; 
            } else {
                handler.hotTextElem.style.color = '#e74c3c'; 
            }
        };
        updateHotnessColor();

        
        if (handler.type2Timer) clearInterval(handler.type2Timer);
        handler.type2Timer = setInterval(() => {
            timeLeft--;
            timerBar.style.width = (timeLeft / 90 * 100) + '%';
            if (timeLeft <= 0) {
                clearInterval(handler.type2Timer);
                
                
                timerContainer.style.transform = 'translateX(-50%) translateY(-20px)';
                timerContainer.style.opacity = '0';
                quizContainer.style.transform = 'translate(-50%, calc(-50% - 50px))';
                quizContainer.style.opacity = '0';
                
                
                const hotnessBox = document.getElementById('hotness-box');
                if (hotnessBox) {
                    hotnessBox.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    hotnessBox.style.transform = 'translateX(-30px)';
                    hotnessBox.style.opacity = '0';
                }
                
                
                setTimeout(() => {
                    handler.hasCompletedQuiz = true;
                    handler.hasStartedQuiz = false;
                    timerContainer.style.display = 'none';
                    quizContainer.style.display = 'none';
                    
                    
                    clearInterval(handler.heatDecayTimer);
                    if (hotnessBox) hotnessBox.remove();
                    
                    handler.endEvent();
                }, 300);
            }
        }, 1000);

        
        function decayHotness() {
            handler.currentHotness = Math.round(handler.currentHotness * 0.98);
            handler.hotTextElem.textContent = `${handler.currentHotness}`;
            updateHotnessColor();
            if (handler.currentHotness <= 0) {
                clearInterval(handler.heatDecayTimer);
                clearInterval(handler.type2Timer);
                
                
                timerContainer.style.transform = 'translateX(-50%) translateY(-20px)';
                timerContainer.style.opacity = '0';
                quizContainer.style.transform = 'translate(-50%, calc(-50% - 50px))';
                quizContainer.style.opacity = '0';
                
                
                const hotnessBox = document.getElementById('hotness-box');
                if (hotnessBox) {
                    hotnessBox.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    hotnessBox.style.transform = 'translateX(-30px)';
                    hotnessBox.style.opacity = '0';
                }
                
                
                setTimeout(() => {
                    timerContainer.style.display = 'none';
                    quizContainer.style.display = 'none';
                    if (hotnessBox) hotnessBox.remove();
                    handler.endEvent();
                }, 300);
            }
        }
        if (handler.heatDecayTimer) clearInterval(handler.heatDecayTimer);
        handler.heatDecayTimer = setInterval(decayHotness, 1000);

        
        function showNextQuestion() {
            
            if (handler.currentHotness <= 0) return;
            
            const questions = handler.game.currentEvent.quiz.questions || [];
            if (questions.length === 0) return;
            const idx = Math.floor(Math.random() * questions.length);
            const q = questions[idx];

            const qTextElem = document.getElementById('quiz-question-text');
            const choicesElem = document.getElementById('quiz-question-choices');
            const quizContainer = document.getElementById('quiz-container');
            
            
            Object.assign(quizContainer.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, calc(-50% + 30px))',
                maxWidth: '600px',
                width: '90%',
                zIndex: '2001'
            });
            
            
            quizContainer.style.opacity = '0';
            
            
            const timerContainer = document.getElementById('quiz-timer-bar-container');
            Object.assign(timerContainer.style, {
                position: 'fixed',
                top: 'calc(50% - 230px)', 
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                maxWidth: '550px',
                zIndex: '2001'
            });
            
            
            qTextElem.textContent = q.text;
            Object.assign(qTextElem.style, {
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '15px',
                textAlign: 'center',
                padding: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            });
            
            
            choicesElem.innerHTML = '';
            Object.assign(choicesElem.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '15px'
            });
            
            
            setTimeout(() => {
                quizContainer.style.transform = 'translate(-50%, -50%)';
                quizContainer.style.opacity = '1';
            }, 10);

            
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

            q.choices.forEach(choice => {
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
                
                btn.addEventListener('click', (e) => {
                    
                    handler.game.playClickSound();
                    
                    
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
                        
                        
                        const previousHotness = handler.currentHotness;
                        
                        
                        handler.currentHotness = Math.round(handler.currentHotness * choice.multiplier);
                        
                        
                        if (handler.hotTextElem) handler.hotTextElem.textContent = `${handler.currentHotness}`;
                        updateHotnessColor();
                        
                        
                        if (handler.currentHotness > previousHotness) {
                            const hotIcon = document.getElementById('hot-icon');
                            if (hotIcon) {
                                console.log('[Hotness Animation] ');
                                
                                hotIcon.style.animation = 'none';
                                
                                
                                void hotIcon.offsetWidth;
                                
                                
                                hotIcon.style.animation = 'hot-icon-shake 0.8s ease-in-out';
                                
                                
                                hotIcon.style.filter = 'drop-shadow(0 0 10px #ff5722) brightness(1.5)';
                                
                                
                                hotIcon.addEventListener('animationend', () => {
                                    hotIcon.style.animation = 'none';
                                    
                                    hotIcon.style.transition = 'filter 0.5s ease';
                                    hotIcon.style.filter = 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))';
                                }, { once: true });
                                
                                
                                try {
                                    const audio = new Audio('/static/sound/heat_up.mp3');
                                    audio.volume = 0.3;
                                    audio.play().catch(e => console.log('Cannot play hotness sound effect:', e));
                                } catch (e) {
                                    console.log('Hotness sound effect unavailable');
                                }
                            }
                        }
                        
                        showNextQuestion();
                    }, 300);
                }, { once: true });
                
                choicesElem.appendChild(btn);
            });
        }
        showNextQuestion();

        
        if (!document.getElementById('hotness-animations')) {
            const styleElem = document.createElement('style');
            styleElem.id = 'hotness-animations';
            styleElem.textContent = `
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }
                
                @keyframes hot-icon-scale {
                    0% { transform: scale(1); }
                    50% { transform: scale(2); }
                    100% { transform: scale(1); }
                }
                
                @keyframes hot-icon-shake {
                    0% { transform: translate(0, 0) scale(1); }
                    10% { transform: translate(-10px, -10px) scale(1.2); }
                    20% { transform: translate(15px, -15px) scale(1.4); }
                    30% { transform: translate(-15px, 15px) scale(1.6); }
                    40% { transform: translate(15px, 15px) scale(1.8); }
                    50% { transform: translate(-15px, -15px) scale(2); }
                    60% { transform: translate(15px, -15px) scale(1.8); }
                    70% { transform: translate(-15px, 15px) scale(1.6); }
                    80% { transform: translate(15px, 15px) scale(1.4); }
                    90% { transform: translate(-15px, 0) scale(1.2); }
                    100% { transform: translate(0, 0) scale(1); }
                }
            `;
            document.head.appendChild(styleElem);
        }
    }

    
    const origStartType2Quiz = WeekendEventHandler.prototype.startType2Quiz;
    WeekendEventHandler.prototype.startType2Quiz = function() {
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        
        if (eid === 'WeekendEvent-02' || eid === 'WeekendEvent-2') {
            customStartType2Quiz.call(this);
        } else {
            origStartType2Quiz.call(this);
        }
    };

    
    const origShowQuizQuestion = WeekendEventHandler.prototype.showQuizQuestion;
    WeekendEventHandler.prototype.showQuizQuestion = function() {
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        
        if (eid === 'WeekendEvent-02' || eid === 'WeekendEvent-2') {
            this.startType2Quiz();
            return;
        }
        origShowQuizQuestion.call(this);
    };
})(); 