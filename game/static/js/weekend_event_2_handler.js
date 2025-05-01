/**
 * 周末事件-2专用答题处理
 * 与默认周末事件答题逻辑分离
 */
(function(){
    /**
     * 自定义答题逻辑：90秒倒计时 + 热度模式
     */
    function customStartType2Quiz() {
        const handler = this;
        handler.debug('Weekendevent-2 专用答题开始：90秒倒计时，热度模式');
        handler.hasStartedQuiz = true;
        handler.hasCompletedQuiz = false;
        handler.currentHotness = 100;
        let timeLeft = 90;

        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const timerBar = document.getElementById('quiz-timer-bar');
        const quizContainer = document.getElementById('quiz-container');
        // 显示答题UI
        timerContainer.style.display = 'block';
        quizContainer.style.display = 'block';
        timerContainer.style.zIndex = '2001';
        quizContainer.style.zIndex = '2001';

        // 创建或更新热度显示框 (独立于题目框体)
        const quizRect = quizContainer.getBoundingClientRect();
        let hotnessBox = document.getElementById('hotness-box');
        if (!hotnessBox) {
            hotnessBox = document.createElement('div');
            hotnessBox.id = 'hotness-box';
            console.log('[周末事件-2] 创建热度显示框');
            Object.assign(hotnessBox.style, {
                position: 'fixed',
                top: quizRect.top + 'px',
                left: (quizRect.left - 240) + 'px',
                width: '220px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '15px',
                boxSizing: 'border-box',
                zIndex: '2002',
                borderRadius: '12px'
            });
            // 热度图标
            const img = document.createElement('img');
            img.src = '/static/images/Hot.png';
            img.alt = '热度';
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.marginBottom = '10px';
            hotnessBox.appendChild(img);
            // 热度文字
            handler.hotTextElem = document.createElement('div');
            handler.hotTextElem.id = 'hotness-display-2';
            handler.hotTextElem.style.cssText = 'color:#ffeb3b; font-size:24px; font-weight:bold;';
            hotnessBox.appendChild(handler.hotTextElem);
            document.body.appendChild(hotnessBox);
        }
        handler.hotTextElem.textContent = `热度: ${handler.currentHotness}`;

        // 90秒倒计时
        if (handler.type2Timer) clearInterval(handler.type2Timer);
        handler.type2Timer = setInterval(() => {
            timeLeft--;
            timerBar.style.width = (timeLeft / 90 * 100) + '%';
            if (timeLeft <= 0) {
                clearInterval(handler.type2Timer);
                handler.hasCompletedQuiz = true;
                handler.hasStartedQuiz = false;
                timerContainer.style.display = 'none';
                quizContainer.style.display = 'none';
                // 清理热度衰减
                clearInterval(handler.heatDecayTimer);
                const box = document.getElementById('hotness-box');
                if (box) box.remove();
                handler.endEvent();
            }
        }, 1000);

        // 每秒热度衰减函数，并启动
        function decayHotness() {
            handler.currentHotness = Math.round(handler.currentHotness * 0.98);
            handler.hotTextElem.textContent = `热度: ${handler.currentHotness}`;
            if (handler.currentHotness <= 0) {
                clearInterval(handler.heatDecayTimer);
                clearInterval(handler.type2Timer);
                timerContainer.style.display = 'none';
                quizContainer.style.display = 'none';
                const box = document.getElementById('hotness-box');
                if (box) box.remove();
                handler.endEvent();
            }
        }
        if (handler.heatDecayTimer) clearInterval(handler.heatDecayTimer);
        handler.heatDecayTimer = setInterval(decayHotness, 1000);

        // 渲染并处理随机题目
        function showNextQuestion() {
            // 检查热度是否耗尽
            if (handler.currentHotness <= 0) return;
            // 随机抽题
            const questions = handler.game.currentEvent.quiz.questions || [];
            if (questions.length === 0) return;
            const idx = Math.floor(Math.random() * questions.length);
            const q = questions[idx];

            const qTextElem = document.getElementById('quiz-question-text');
            const choicesElem = document.getElementById('quiz-question-choices');
            qTextElem.textContent = q.text;
            choicesElem.innerHTML = '';

            q.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.className = 'choice-button';
                btn.addEventListener('click', () => {
                    // 根据选项乘法计算热度变化
                    handler.currentHotness = Math.round(handler.currentHotness * choice.multiplier);
                    // 更新热度显示
                    if (handler.hotTextElem) handler.hotTextElem.textContent = `热度: ${handler.currentHotness}`;
                    showNextQuestion();
                }, { once: true });
                choicesElem.appendChild(btn);
            });
        }
        showNextQuestion();
    }

    // 覆盖 WeekendEventHandler 中的 startType2Quiz 方法，仅对 WeekendEvent-02 生效
    const origStartType2Quiz = WeekendEventHandler.prototype.startType2Quiz;
    WeekendEventHandler.prototype.startType2Quiz = function() {
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        // 同时支持 WeekendEvent-02 和 WeekendEvent-2 ID 格式
        if (eid === 'WeekendEvent-02' || eid === 'WeekendEvent-2') {
            customStartType2Quiz.call(this);
        } else {
            origStartType2Quiz.call(this);
        }
    };

    // 覆盖 showQuizQuestion，使 WeekendEvent-02 调用自定义答题逻辑
    const origShowQuizQuestion = WeekendEventHandler.prototype.showQuizQuestion;
    WeekendEventHandler.prototype.showQuizQuestion = function() {
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        // 使用自定义逻辑启动第2号周末事件答题
        if (eid === 'WeekendEvent-02' || eid === 'WeekendEvent-2') {
            this.startType2Quiz();
            return;
        }
        origShowQuizQuestion.call(this);
    };
})(); 