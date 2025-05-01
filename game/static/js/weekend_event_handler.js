/**
 * 周末事件专用处理器
 * 与常规事件分离，单独处理周末事件的特殊逻辑
 */

class WeekendEventHandler {
    constructor(gameInstance) {
        // 保存对游戏主实例的引用
        this.game = gameInstance;
        
        // 状态标志
        this.hasStartedQuiz = false;  // 答题阶段开始标志
        this.hasCompletedQuiz = false;  // 答题阶段完成标志
        this.hasProcessedBranches = false;  // 已处理过分支对话标志
        this.isProcessingBranchDialogues = false;  // 正在处理分支对话标志
        this.quizScore = 0;  // 答题得分
        this.quizQuestions = [];  // 答题题目数组
        this.currentQuizIndex = 0;  // 当前题目索引
        this.quizQuestionTimer = null;  // 单题计时器
        this.type2Timer = null;    // 第2种答题模式总计时器
        this.currentHotness = 100; // 第2种答题模式热度
        
        // 事件监听器
        this.boundHandleClick = this.handleClick.bind(this);
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化方法
     */
    init() {
        console.log('[周末事件] 初始化周末事件处理器');
    }
    
    /**
     * 调试日志
     */
    debug(message) {
        if (this.game.debugMode) {
            const details = ` (对白索引:${this.game.currentDialogIndex}, 总对白:${this.game.currentEvent?.dialogues?.length || 0}, 答题:${this.hasStartedQuiz ? '已开始' : '未开始'})`;
            console.log(`[WEEKEND] ${message}${details}`);
        }
    }
    
    /**
     * 加载周末事件
     * 取代Game类中的loadWeekendEvent方法
     */
    async loadEvent() {
        this.debug('专用处理器加载周末事件');
        
        // 重置状态
        this.resetState();
        
        // 清除旧的选项
        this.game.clearAllChoices();
        
        try {
            const url = `/get_event/weekend?t=${Date.now()}`;
            this.debug(`发起周末事件请求: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const event = await response.json();
            if (event.error) {
                this.debug(`周末事件返回错误: ${event.error}`);
                // 回退到晨间事件
                await this.game.loadMorningEvent();
                return;
            }
            
            this.debug(`成功加载周末事件: ${event.id}`);
            
            // 设置事件类型并初始化Game实例中的事件
            event.type = 'weekend';
            this.game.currentEvent = event;
            this.game.currentDialogIndex = 0;
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            
            // 重新绑定点击事件，使用周末事件专用的处理器
            document.removeEventListener('click', this.game.boundHandleClick);
            document.removeEventListener('click', this.boundHandleClick);
            
            // 使用setTimeout确保移除操作完成后再添加
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                this.debug('绑定周末事件专用点击监听器');
                
                // 显示事件对话
                this.showCurrentDialog();
            }, 50);
            
            return true; // 表示成功加载
        } catch (error) {
            console.error('加载周末事件失败:', error);
            // 回退到晨间事件
            this.game.loadMorningEvent();
            throw error; // 重新抛出错误给调用者
        }
    }
    
    /**
     * 重置所有状态
     */
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
    
    /**
     * 显示当前对话
     * 专用于周末事件
     */
    showCurrentDialog() {
        // 如果事件已结束，退出
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('事件已结束或正在结束，不显示对话');
            return;
        }
        
        // 检查当前事件和对话是否有效
        if (!this.game.currentEvent || !this.game.currentEvent.dialogues) {
            console.error('无法显示对话: 当前事件或对话不存在');
            return;
        }
        
        // 检查对话索引是否有效
        if (this.game.currentDialogIndex < 0 || this.game.currentDialogIndex >= this.game.currentEvent.dialogues.length) {
            console.error('无法显示对话: 对话索引越界', this.game.currentDialogIndex);
            return;
        }
        
        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
        if (!dialog) {
            console.error('无法显示对话: 当前索引没有对话内容');
            return;
        }
        
        this.debug(`显示对话: ${this.game.currentDialogIndex + 1}/${this.game.currentEvent.dialogues.length}`);
        
        // 检查是否是分支对话（答题后的分支）
        if (this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            console.log(`[分支对话] 显示分支对话: ${this.game.currentDialogIndex + 1}/${this.game.currentEvent.dialogues.length}`);
            
            // 在显示分支对话时分析和重置事件状态
            this.analyzeAndResetEventState();
        }
        
        // 更新背景
        if (this.game.currentEvent.background && this.game.currentDialogIndex === 0) {
            const bgPath = `/static/images/${this.game.currentEvent.background}`;
            this.game.setBackgroundImage(bgPath);
        }
        
        // 更新角色
        this.game.updateCharacters(dialog);
        
        // 显示说话人名字
        const speakerName = dialog.character.split('_')[0];
        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
        
        // 打字机效果显示对话
        this.game.typeText(dialog.text);
        
        // 检查是否是最后一句对话
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        
        // 如果是最后一句对话且有quiz且未完成答题，显示继续按钮进入答题前展示规则
        if (isLastDialog && this.game.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('最后一个对话，展示答题规则面板');
            // 调用游戏实例的规则面板展示方法
            const rules = [
                '请在限时内完成所有题目',
                '每题只有一次作答机会',
                '答对可获得分数，答错不扣分',
                '完成后立即显示分数统计'
            ];
            this.game.clearAllChoices();
            this.game.showRulesPanel(rules, this.showQuizQuestion.bind(this));
            return;
        }
        
        // 处理最后一句对话的继续按钮，结束对话
        if (isLastDialog) {
            setTimeout(() => {
                this.game.showContinueButton('继续', () => {
                    this.debug('点击继续按钮，结束对话');
                    this.endEvent();
                });
            }, 100);
        }
    }
    
    /**
     * 处理点击事件
     * 专用于周末事件
     */
    handleClick(e) {
        // 如果事件已结束或正在答题，不处理点击
        if (this.game.hasEventEnded || this.game.isEventEnding || this.hasStartedQuiz) {
            this.debug('事件已结束或正在答题，忽略点击');
            return;
        }
        
        // 忽略来自按钮和遮罩层的点击
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
            this.debug('忽略按钮或遮罩层点击');
            return;
        }
        
        // 如果正在打字，点击会直接显示完整文本
        if (this.game.isTyping) {
            this.debug('加速显示文本');
            this.game.currentTypingId = null;
            this.game.isTyping = false;
            
            if (this.game.currentEvent && this.game.currentEvent.dialogues && 
                this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                // 直接显示完整文本
                this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
            }
            return;
        }
        
        // 检查当前对话是否是最后一个且有特殊处理
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        
        // 如果是最后一个对话且有quiz且未完成答题，显示继续按钮进入答题前展示规则
        if (isLastDialog && this.game.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('点击末尾对话，展示答题规则面板');
            const rules = [
                '请在限时内完成所有题目',
                '每题只有一次作答机会',
                '答对可获得分数，答错不扣分',
                '完成后立即显示分数统计'
            ];
            this.game.clearAllChoices();
            this.game.showRulesPanel(rules, this.showQuizQuestion.bind(this));
            return;
        }
        
        // 检查是否正在处理分支对话
        const isWeekendBranchDialog = this.hasCompletedQuiz && this.isProcessingBranchDialogues;
        
        if (isWeekendBranchDialog) {
            this.debug(`处理分支对话点击: 当前索引=${this.game.currentDialogIndex}`);
            console.log(`[分支处理] 点击处理：当前索引=${this.game.currentDialogIndex}, 总对话=${this.game.currentEvent.dialogues.length}`);
        }
        
        // 进入下一句对话
        this.debug(`进入下一句对话 ${this.game.currentDialogIndex + 1}`);
        this.game.currentDialogIndex++;
        
        // 检查是否还有更多对话
        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
            // 还有更多对话，显示下一句
            this.showCurrentDialog();
        } else {
            // 对话全部完成
            this.debug('对话全部完成');
            
            // 先清除选项区域
            this.game.clearAllChoices();
            
            // 重置分支对话处理标志
            if (isWeekendBranchDialog) {
                this.debug('分支对话全部完成，准备结束事件');
                this.isProcessingBranchDialogues = false;
                this.hasProcessedBranches = true;
            }
            
            // 显示继续按钮
            setTimeout(() => {
                this.game.showContinueButton('继续', () => {
                    this.debug('点击继续按钮，结束事件');
                    this.endEvent();
                });
            }, 100);
        }
    }
    
    /**
     * 显示答题界面
     */
    showQuizQuestion() {
        this.debug('显示答题界面');
        
        // 开始答题前移除对话点击监听
        document.removeEventListener('click', this.boundHandleClick);
        
        // 判断是否为特殊第2号周末事件
        const eid = this.game.currentEvent.id || this.game.currentEvent.type;
        if (eid === 'WeekendEvent-2' || eid === 'weekend-2') {
            this.startType2Quiz();
            return;
        }
        
        // 原有答题流程
        this.hasStartedQuiz = true;
        this.quizQuestions = this.game.currentEvent.quiz.questions || [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        // 如果有quiz背景，则更新背景
        if (this.game.currentEvent.quiz.background) {
            const bgPath = `/static/images/${this.game.currentEvent.quiz.background}`;
            this.debug(`加载答题背景: ${bgPath}`);
            
            // 预加载图片确保存在
            const img = new Image();
            img.onload = () => {
                this.debug('答题背景图片加载成功');
                this.game.elements.background.style.backgroundImage = `url(${bgPath})`;
                
                // 确保在背景加载完成后显示答题界面
                this.showQuizUI();
            };
            img.onerror = () => {
                this.debug(`答题背景图片加载失败: ${bgPath}`);
                // 即使背景加载失败也显示答题界面
                this.showQuizUI();
            };
            img.src = bgPath;
        } else {
            // 没有背景也直接显示答题界面
            this.showQuizUI();
        }
    }
    
    /**
     * 显示答题UI并开始答题
     */
    showQuizUI() {
        // 显示答题界面元素
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const quizContainer = document.getElementById('quiz-container');
        
        // 确保元素存在
        if (!timerContainer || !quizContainer) {
            this.debug('答题UI元素不存在，可能是DOM结构有问题');
            return;
        }
        
        // 设置显示
        timerContainer.style.display = 'block'; 
        timerContainer.style.zIndex = '2001';
        quizContainer.style.display = 'block'; 
        quizContainer.style.zIndex = '2001';
        
        // 清空角色
        this.game.elements.characterLeft.style.opacity = '0.5';
        this.game.elements.characterRight.style.opacity = '0.5';
        
        this.debug('答题UI显示完成，开始加载第一题');
        
        // 加载第一个问题
        this.displayQuizQuestion();
    }
    
    /**
     * 渲染当前答题问题
     */
    displayQuizQuestion() {
        console.log(`[DEBUG] 渲染第 ${this.currentQuizIndex + 1} 题`);
        const quiz = this.game.currentEvent.quiz;
        const total = quiz.timer;
        let timeLeft = total;
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const timerBar = document.getElementById('quiz-timer-bar');
        const style = quiz.timerStyle || {};
        
        Object.assign(timerContainer.style, {
            backgroundColor: style.backgroundColor || '', 
            borderRadius: style.borderRadius || '',
            boxShadow: style.boxShadow || '', 
            width: style.width || timerContainer.style.width,
            height: style.height || timerContainer.style.height, 
            margin: style.margin || ''
        });
        
        timerBar.style.backgroundColor = style.barColor || timerBar.style.backgroundColor;
        timerBar.style.transition = style.transition || timerBar.style.transition;
        
        const q = this.quizQuestions[this.currentQuizIndex];
        document.getElementById('quiz-question-text').textContent = q.text;
        
        const choicesElem = document.getElementById('quiz-question-choices'); 
        choicesElem.innerHTML = '';
        
        q.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text; 
            btn.className = 'choice-button';
            
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
    
    /**
     * 处理下一题或结束答题
     */
    nextQuizQuestion() {
        clearInterval(this.quizQuestionTimer);
        this.currentQuizIndex++;
        
        if (this.currentQuizIndex < this.quizQuestions.length) {
            this.displayQuizQuestion();
        } else {
            this.hasCompletedQuiz = true;
            this.hasStartedQuiz = false;
            
            // 隐藏答题界面
            document.getElementById('quiz-timer-bar-container').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'none';
            
            // 重新绑定周末事件专用点击监听器
            document.addEventListener('click', this.boundHandleClick);
            
            // 结束事件，展示分支对话
            this.debug(`答题完成，得分: ${this.quizScore}`);
            this.endEvent();
        }
    }
    
    /**
     * 分析和重置事件处理状态
     * 用于排查分支对话卡住的问题
     */
    analyzeAndResetEventState() {
        console.log('[状态诊断] ====== 开始周末事件状态分析 ======');
        
        // 检查当前事件信息
        console.log(`[状态诊断] 当前事件类型: ${this.game.currentEvent?.type || '无事件'}`);
        console.log(`[状态诊断] 当前对白索引: ${this.game.currentDialogIndex}`);
        console.log(`[状态诊断] 总对白数量: ${this.game.currentEvent?.dialogues?.length || 0}`);
        
        // 检查事件状态
        console.log(`[状态诊断] 事件结束状态: hasEventEnded=${this.game.hasEventEnded}, isEventEnding=${this.game.isEventEnding}`);
        console.log(`[状态诊断] 答题状态: hasStartedQuiz=${this.hasStartedQuiz}, hasCompletedQuiz=${this.hasCompletedQuiz}`);
        console.log(`[状态诊断] 分支对话状态: isProcessingBranchDialogues=${this.isProcessingBranchDialogues}, hasProcessedBranches=${this.hasProcessedBranches}`);
        
        // 检查点击处理器状态
        console.log(`[状态诊断] 点击处理器: boundHandleClick=${!!this.boundHandleClick}`);
        
        // 如果处于分支对话状态，重新绑定点击处理器
        if (this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            // 确保处于正确的状态
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            
            // 重新绑定点击处理器
            document.removeEventListener('click', this.boundHandleClick);
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                console.log('[状态诊断] 重新绑定了点击处理器');
                
                // 添加一次性点击监听器确保下一次点击能被处理
                const gameScreen = document.querySelector('.game-screen');
                if (gameScreen) {
                    const forceHandler = (e) => {
                        // 忽略按钮点击
                        if (e.target.tagName === 'BUTTON') return;
                        
                        // 移除此监听器
                        gameScreen.removeEventListener('click', forceHandler);
                        
                        console.log('[状态诊断] 一次性强制点击监听器被触发');
                        
                        // 如果在打字中，完成打字
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
                        
                        // 否则进入下一对话
                        this.game.currentDialogIndex++;
                        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                            this.showCurrentDialog();
                        } else {
                            this.game.showContinueButton('继续', () => this.endEvent());
                        }
                    };
                    
                    gameScreen.addEventListener('click', forceHandler);
                    console.log('[状态诊断] 添加了一次性强制点击监听器');
                }
            }, 100);
        }
        
        console.log('[状态诊断] ====== 周末事件状态分析完成 ======');
    }
    
    /**
     * 结束周末事件
     */
    async endEvent() {
        this.debug('周末事件处理器: 结束事件');
        
        // 设置事件结束标志
        this.game.hasEventEnded = true;
        this.game.isEventEnding = true;
        
        // 清除所有选项与可能的继续按钮
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            // 检查是否已完成答题且有分支，并且尚未处理过分支对话
            if (this.hasCompletedQuiz && this.game.currentEvent.branches && !this.hasProcessedBranches) {
                this.debug(`答题完成，得分: ${this.quizScore}，处理分支对话`);
                
                // 设置已处理分支标志
                this.hasProcessedBranches = true;
                
                // 根据得分选择分支
                let selectedBranch = null;
                
                // 找到适合的分支（按minScore降序排列，找到第一个小于等于得分的分支）
                for (const branch of this.game.currentEvent.branches.sort((a, b) => b.minScore - a.minScore)) {
                    if (this.quizScore >= branch.minScore) {
                        selectedBranch = branch;
                        break;
                    }
                }
                
                if (selectedBranch) {
                    this.debug(`选择分支，最低分要求: ${selectedBranch.minScore}`);
                    
                    // 更新游戏状态（如果有stats）
                    if (selectedBranch.stats) {
                        this.debug(`更新游戏状态: ${JSON.stringify(selectedBranch.stats)}`);
                        Object.keys(selectedBranch.stats).forEach(key => {
                            const gameStateKey = this.game.mapStatKey(key);
                            if (gameStateKey) {
                                this.game.gameState[gameStateKey] += selectedBranch.stats[key];
                                this.debug(`更新 ${gameStateKey}: ${this.game.gameState[gameStateKey]}`);
                            }
                        });
                        this.game.updateStatusBar();
                        await this.game.saveGameState();
                    }
                    
                    // 如果有分支对话，显示这些对话
                    if (selectedBranch.dialogues && selectedBranch.dialogues.length > 0) {
                        this.debug('显示分支对话');
                        
                        // 重置事件结束状态
                        this.game.isEventEnding = false;
                        this.game.hasEventEnded = false;
                        
                        // 设置分支对话处理状态
                        this.isProcessingBranchDialogues = true;
                        
                        // 更新当前事件的对话为分支对话
                        this.game.currentEvent.dialogues = selectedBranch.dialogues;
                        this.game.currentDialogIndex = 0;
                        
                        // 重新绑定点击事件
                        document.removeEventListener('click', this.boundHandleClick);
                        
                        // 使用setTimeout确保移除操作完成后再添加
                        setTimeout(() => {
                            document.addEventListener('click', this.boundHandleClick);
                            this.debug('分支对话：重新绑定点击事件监听器');
                            
                            // 显示第一句分支对话
                            this.showCurrentDialog();
                            
                            // 触发强制点击处理，以确保监听器工作
                            this.forceEnableClickHandler();
                        }, 50);
                        
                        return;
                    }
                }
            }
            
            // 将事件标记为已完成并保存状态
            if (this.game.currentEvent && this.game.currentEvent.id) {
                if (!this.game.gameState.completed_events.includes(this.game.currentEvent.id)) {
                    this.game.gameState.completed_events.push(this.game.currentEvent.id);
                    this.debug(`已完成事件列表: ${this.game.gameState.completed_events.join(', ')}`);
                }
                await this.game.saveGameState();
            }
            
            // 重置周末事件相关状态
            this.resetState();
            
            // 如果事件有summary，展示事件总结
            if (this.game.currentEvent && this.game.currentEvent.summary && this.game.currentEvent.summary.trim() !== '') {
                this.debug(`显示事件总结: ${this.game.currentEvent.summary}`);
                
                // 半透明角色提示
                this.game.elements.characterLeft.style.opacity = '0.5';
                this.game.elements.characterRight.style.opacity = '0.5';
                
                // 确保弹出总结面板前已清除所有可能的遮罩层
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                // 使用游戏主实例的方法显示summary
                this.game.showEventSummaryUI(this.game.currentEvent.summary);
                return;
            }
            
            // 没有summary，直接开始新的一天
            this.debug('周末事件结束，开始新的一天');
            setTimeout(() => this.game.startNewDay(), 200);
            
        } catch (error) {
            console.error('周末事件结束处理出错:', error);
            
            // 出错时也直接进入新的一天
            setTimeout(() => this.game.startNewDay(), 200);
        }
    }
    
    /**
     * 强制启用点击处理
     * 用于分支对话等特殊情况下确保点击监听器工作
     */
    forceEnableClickHandler() {
        // 移除并重新添加事件监听器
        document.removeEventListener('click', this.boundHandleClick);
        document.addEventListener('click', this.boundHandleClick);
        
        console.log('[强制修复] 已重置周末事件点击处理程序');
        
        // 添加一次性点击监听器，确保至少第一次点击能被处理
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            const onceClickHandler = (e) => {
                // 不处理来自按钮的点击
                if (e.target.tagName === 'BUTTON') return;
                
                console.log('[强制修复] 周末事件一次性点击监听器被触发');
                
                // 移除本监听器
                gameScreen.removeEventListener('click', onceClickHandler);
                
                // 如果处于文本打字状态，直接完成打字
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
                
                // 否则尝试进入下一句对话
                if (this.game.currentEvent && this.game.currentEvent.dialogues) {
                    this.game.currentDialogIndex++;
                    
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        this.showCurrentDialog();
                    } else {
                        // 对话已全部完成，显示继续按钮
                        this.game.showContinueButton('继续', () => this.endEvent());
                    }
                }
            };
            
            // 添加一次性监听器
            gameScreen.addEventListener('click', onceClickHandler);
        }
    }
    
    /**
     * 第2种答题模式：90秒内随机答题并更新热度
     */
    startType2Quiz() {
        this.debug('第2模式答题开始：90秒倒计时');
        this.hasStartedQuiz = true;
        this.currentHotness = 100;
        // 显示计时条
        const timerContainer = document.getElementById('quiz-timer-bar-container');
        const quizContainer = document.getElementById('quiz-container');
        timerContainer.style.display = 'block';
        quizContainer.style.display = 'block';
        timerContainer.style.zIndex = '2001';
        quizContainer.style.zIndex = '2001';
        
        // 创建热度显示框
        let hotDiv = document.getElementById('hotness-display');
        if (!hotDiv) {
            hotDiv = document.createElement('div');
            hotDiv.id = 'hotness-display';
            Object.assign(hotDiv.style, {
                position: 'absolute', top: '20px', left: '20px',
                color: '#e74c3c', fontSize: '1.2em', fontWeight: 'bold'
            });
            quizContainer.appendChild(hotDiv);
        }
        hotDiv.textContent = `热度: ${this.currentHotness}`;
        
        // 初始化90秒倒计时
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
                // 隐藏UI并结束事件
                document.getElementById('quiz-timer-bar-container').style.display = 'none';
                document.getElementById('quiz-container').style.display = 'none';
                this.endEvent();
            }
        }, 1000);
        
        // 显示第一个随机问题
        this.displayType2Question();
    }
    
    /**
     * 渲染第2种答题模式的随机问题
     */
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
                // 更新热度（乘法计算）
                this.currentHotness = Math.round(this.currentHotness * choice.multiplier);
                const hotDiv = document.getElementById('hotness-display');
                if (hotDiv) hotDiv.textContent = `热度: ${this.currentHotness}`;

                // 如果热度触底，结束事件
                if (this.currentHotness <= 0) {
                    clearInterval(this.type2Timer);
                    this.hasCompletedQuiz = true;
                    this.hasStartedQuiz = false;
                    // 隐藏答题 UI
                    document.getElementById('quiz-timer-bar-container').style.display = 'none';
                    document.getElementById('quiz-container').style.display = 'none';
                    // 结束事件处理
                    this.endEvent();
                    return;
                }

                // 下一题
                this.displayType2Question();
            }, { once: true });
            choicesElem.appendChild(btn);
        });
    }
}

// 当页面加载完成后，增强Game类
document.addEventListener('DOMContentLoaded', function() {
    // 等待游戏实例初始化
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[周末事件] 游戏实例已找到，准备注入周末事件处理器');
            
            // 扩展Game类，增加周末事件处理器
            enhanceGameWithWeekendHandler();
        }
    }, 100);
});

/**
 * 增强Game类，注入周末事件处理功能
 */
function enhanceGameWithWeekendHandler() {
    // 创建周末事件处理器
    window.currentGame.weekendHandler = new WeekendEventHandler(window.currentGame);
    
    // 替换加载周末事件的方法
    window.currentGame.loadWeekendEvent = async function() {
        console.log('[周末事件] 使用专用处理器加载周末事件');
        return await window.currentGame.weekendHandler.loadEvent();
    };
    
    // 修改init方法中的周末事件检测逻辑
    const originalInit = window.currentGame.init;
    window.currentGame.init = async function() {
        await originalInit.call(this);
        
        // 如果是周末天数(第6天或第13天)，尝试立即加载周末事件
        if (this.gameState && (this.gameState.day === 6 || this.gameState.day === 13)) {
            console.log(`[周末事件] 检测到第${this.gameState.day}天，尝试加载周末事件`);
            try {
                await this.loadWeekendEvent();
            } catch (error) {
                console.error('[周末事件] 加载失败:', error);
            }
        }
    };
    
    // 修改handleNextEventSteps方法，确保周末事件结束后正确处理
    const originalHandleNextEventSteps = window.currentGame.handleNextEventSteps;
    if (originalHandleNextEventSteps) {
        window.currentGame.handleNextEventSteps = function() {
            // 如果是周末事件，使用专用方法处理
            if (this.currentEvent && this.currentEvent.type === 'weekend') {
                console.log('[周末事件] 周末事件结束，开始新的一天');
                setTimeout(() => this.startNewDay(), 200);
                return;
            }
            
            // 否则使用原始方法处理
            return originalHandleNextEventSteps.call(this);
        };
    }
    
    console.log('[周末事件] 周末事件处理器注入完成');
} 