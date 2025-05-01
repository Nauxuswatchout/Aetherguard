/**
 * 主游戏类
 */
class Game {
    constructor() {
        this.gameState = null;
        this.currentEvent = null;
        this.currentDialogIndex = 0;
        this.typingSpeed = 30; // 文字显示速度（毫秒/字符）
        this.isTyping = false;
        this.debugMode = true; // 启用调试模式
        this.currentTypingId = null; // 当前打字会话ID

        // 状态标志
        this.isEventEnding = false; // 事件正在结束过程中
        this.hasEventEnded = false; // 事件已经彻底结束
        this.isProcessingChoice = false; // 正在处理选择
        this.hasStartedQuiz = false; // 答题阶段开始标志
        this.hasCompletedQuiz = false; // 答题阶段完成标志
        this.hasProcessedBranches = false; // 已处理过分支对话标志
        this.isProcessingBranchDialogues = false; // 正在处理分支对话标志
        this.quizQuestions = []; // 答题题目数组
        this.currentQuizIndex = 0; // 当前题目索引
        this.quizScore = 0; // 答题得分
        this.quizQuestionTimer = null; // 单题计时器

        // 音乐控制相关属性
        this.backgroundMusic = null;
        this.currentMusicPath = '';
        this.musicVolume = 0.5; // 默认音量

        // DOM元素
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
            securityValue: document.getElementById('security-value'),
            dayCount: document.getElementById('day-count')
        };

        // 记录对话框元素，用于后续添加选项
        this.dialogBox = this.elements.choices.parentNode;

        // 初始化游戏
        this.init();
    }

    /**
     * 调试日志
     * @param {string} message 日志消息
     */
    debug(message) {
        if (this.debugMode) {
            // 检查是否是周末事件
            const isWeekendEvent = this.currentEvent && this.currentEvent.type === 'weekend';
            
            // 为周末事件添加特殊标记
            const prefix = isWeekendEvent ? '[WEEKEND]' : '[DEBUG]';
            
            // 添加更多详细信息
            let detailInfo = '';
            if (isWeekendEvent) {
                detailInfo = ` (对白索引:${this.currentDialogIndex}, 总对白:${this.currentEvent?.dialogues?.length || 0}, 答题:${this.hasStartedQuiz ? '已开始' : '未开始'})`;
            }
            
            console.log(`${prefix} ${message}${detailInfo}`);
        }
    }

    /**
     * 清除所有选项区域，防止选项重复显示
     */
    clearAllChoices() {
        this.debug('清除所有选项区域');
        
        // 查找所有可能的选项容器
        const allChoiceContainers = document.querySelectorAll('.choices, [id^=choices]');
        
        // 遍历并移除每个容器
        allChoiceContainers.forEach(container => {
            try {
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            } catch (e) {
                console.error('移除选项容器时出错:', e);
            }
        });
        
        // 确保记录最后创建的选项已清除
        this.elements.choices = null;
    }

    /**
     * 每日过渡动画黑屏，展示当天天数
     * @returns {Promise<void>}
     */
    async showDayTransition() {
        return new Promise(resolve => {
            // 创建全屏覆盖层
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'black', opacity: '0', transition: 'opacity 1s ease',
                zIndex: '2000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
            });
            // 文本显示当前天数
            const text = document.createElement('div');
            text.textContent = `Day ${this.gameState.day}`;
            Object.assign(text.style, {
                color: 'white', fontSize: '4rem', fontWeight: 'bold',
                opacity: '0', transition: 'opacity 1s ease'
            });
            overlay.appendChild(text);
            document.body.appendChild(overlay);
            // 触发过渡
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                text.style.opacity = '1';
                // 过渡后再淡出
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
     * 创建新的选项区域
     * @returns {HTMLElement} 新创建的选项元素
     */
    createChoicesContainer() {
        this.debug('创建新的选项区域');
        
        // 先清除所有现有选项
        this.clearAllChoices();
        
        // 创建新的选项容器
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'choices';
        choicesContainer.id = 'choices-' + Date.now(); // 使用时间戳确保唯一性
        
        // 添加到对话框
        this.dialogBox.appendChild(choicesContainer);
        
        // 更新引用
        this.elements.choices = choicesContainer;
        
        return choicesContainer;
    }

    /**
     * 显示继续按钮
     * @param {string} text 按钮文本
     * @param {Function} callback 点击回调函数
     */
    showContinueButton(text, callback) {
        // 如果事件已结束或正在结束，不显示继续按钮
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('事件已结束或正在结束，不显示继续按钮');
            return;
        }
        // 清除所有选项区域，移除旧的覆盖层
        this.clearAllChoices();
        const existingOverlay = document.getElementById('continue-overlay');
        if (existingOverlay) existingOverlay.remove();
        // 创建全屏覆盖层，点击任意位置继续
        const overlay = document.createElement('div');
        overlay.id = 'continue-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: '1001', cursor: 'pointer'
        });
        // 锁定点击一秒
        let allowClick = false;
        setTimeout(() => { allowClick = true; }, 1000);
        // 创建继续图标
        const imgBtn = document.createElement('img');
        imgBtn.src = '/static/images/continue.png';
        imgBtn.style.cssText = 'width:150px;transition:transform 0.4s ease-out;';
        imgBtn.style.transform = 'translateY(100vh) scale(1)';
        requestAnimationFrame(() => {
            imgBtn.style.transform = 'translateY(0) scale(1)';
        });
        imgBtn.addEventListener('mouseenter', () => imgBtn.style.transform = 'translateY(0) scale(1.2)');
        imgBtn.addEventListener('mouseleave', () => imgBtn.style.transform = 'translateY(0) scale(1)');
        // 点击任意位置触发回调（锁定1秒后生效），手动移除监听
        const onOverlayClick = (e) => {
            e.stopPropagation();
            if (!allowClick) return;
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
     * 显示选项按钮
     * @param {Array} choices 选项数组
     */
    showChoices(choices) {
        // 如果事件已结束或正在结束，不显示选项
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('事件已结束或正在结束，不显示选项');
            return;
        }
        
        // 如果没有有效选项，不显示
        if (!choices || choices.length === 0) {
            this.debug('没有有效的选项可显示');
            return;
        }
        
        // 清除现有选项
        this.clearAllChoices();
        
        // 创建全屏居中的选项容器
        const overlayContainer = document.createElement('div');
        overlayContainer.className = 'choices-overlay';
        overlayContainer.id = 'choices-overlay-' + Date.now();
        Object.assign(overlayContainer.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: '1001'
        });
        
        // 创建选项容器
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'choices choices-centered';
        choicesContainer.id = 'choices-' + Date.now();
        Object.assign(choicesContainer.style, {
            width: '70%',
            maxWidth: '600px',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        
        // 更新引用
        this.elements.choices = choicesContainer;
        
        // 添加每个选项按钮
        choices.forEach((choice, index) => {
            // 创建按钮
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.id = 'choice-button-' + index + '-' + Date.now();
            
            // 设置按钮样式
            Object.assign(button.style, {
                padding: '15px',
                backgroundColor: 'rgba(74, 144, 226, 0.6)',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                fontSize: '1.1em',
                textAlign: 'left'
            });
            
            // 添加悬停效果
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = 'rgba(74, 144, 226, 0.8)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'rgba(74, 144, 226, 0.6)';
            });
            
            // 添加点击事件，使用一次性事件监听器
            button.addEventListener('click', (e) => {
                // 阻止事件冒泡
                e.stopPropagation();
                
                // 防止重复处理
                if (this.isProcessingChoice) {
                    this.debug('正在处理选择，忽略重复点击');
                    return;
                }
                
                // 设置标志防止重复点击
                this.isProcessingChoice = true;
                
                // 移除选项覆盖层
                overlayContainer.remove();
                
                // 处理选择
                this.handleChoice(index);
            }, { once: true });
            
            // 添加到选项容器
            choicesContainer.appendChild(button);
        });
        
        // 添加选项容器到覆盖层
        overlayContainer.appendChild(choicesContainer);
        
        // 添加到页面
        document.body.appendChild(overlayContainer);
    }

    /**
     * 初始化游戏
     */
    async init() {
        this.debug('初始化游戏');
        
        try {
            // 保存handleClick的绑定实例，以便后续可以正确地添加和移除
            this.boundHandleClick = this.handleClick.bind(this);
            
            // 获取游戏状态
            const response = await fetch('/get_game_state');
            this.gameState = await response.json();
            this.debug('游戏状态:' + JSON.stringify(this.gameState));
            
            // 更新状态栏
            this.updateStatusBar();
            
            // 游戏日志标记
            console.log('[EventFix] 游戏初始化完成，状态：', {
                day: this.gameState.day,
                chapter: this.gameState.chapter,
                completedEvents: this.gameState.completed_events.length
            });
            
            // 强制重写事件加载流程，修复顺序混乱问题
            const dayStart = (window.location.href.includes('/new_game') || 
                             window.location.href.includes('?t='));
                             
            if (dayStart) {
                console.log('[EventFix] 检测到新一天开始，优先加载morning事件');
                
                // 播放每日过渡动画
                await this.showDayTransition();
                
                // 工作日逻辑
                if (!(this.gameState.day === 6 || this.gameState.day === 13)) {
                    console.log('[EventFix] 工作日模式，加载morning事件');
                    // 直接调用loadSpecificEvent而非loadMorningEvent，避免可能的问题
                    await this.loadSpecificEvent('morning');
                } else {
                    // 周末逻辑
                    console.log('[EventFix] 周末模式，加载weekend事件');
                    await this.loadSpecificEvent('weekend');
                }
                
                // 添加点击事件监听
                document.removeEventListener('click', this.boundHandleClick);
                document.addEventListener('click', this.boundHandleClick);
                
                this.debug('游戏初始化完成');
                return; // 退出init，防止执行后续代码
            }
            
            // 原有流程 - 保留作为备份
            // 播放每日过渡动画
            await this.showDayTransition();

            // 每天的标准事件加载流程
            try {
                // 1. 检查是否强制加载特定事件
                if (this.gameState.force_event_type) {
                    this.debug('强制加载事件类型:' + this.gameState.force_event_type);
                    const eventType = this.gameState.force_event_type;
                    
                    // 清除强制加载标记
                    delete this.gameState.force_event_type;
                    delete this.gameState.force_event_id;
                    await this.saveGameState();
                    
                    await this.loadSpecificEvent(eventType);
                    return;
                }
                
                // 2. 检查是否是周末(第6或13天)
                if (this.gameState.day === 6 || this.gameState.day === 13) {
                    this.debug(`第${this.gameState.day}天，尝试加载周末事件`);
                    // 使用专门的方法加载周末事件
                    try {
                        await this.loadWeekendEvent();
                        return; // 成功加载周末事件后返回
                    } catch (error) {
                        console.error('加载周末事件失败:', error);
                        // 失败时回退到加载早晨事件
                    }
                }
                
                // 3. 默认情况：加载早晨事件
                await this.loadMorningEvent();
            } catch (error) {
                console.error('初始化事件加载失败:', error);
                // 出错回退到加载早晨事件
                await this.loadMorningEvent();
            }

            // 添加点击事件监听
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            
            this.debug('游戏初始化完成');
        } catch (error) {
            console.error('游戏初始化失败:', error);
        }
    }

    /**
     * 更新状态栏
     */
    updateStatusBar() {
        this.elements.fansCount.textContent = this.gameState.fans;
        this.elements.healthValue.textContent = this.gameState.health;
        this.elements.socialValue.textContent = this.gameState.social;
        this.elements.securityValue.textContent = this.gameState.security;
        this.elements.dayCount.textContent = this.gameState.day;
    }

    /**
     * 加载早晨事件
     */
    async loadMorningEvent() {
        this.debug('加载早晨事件');
        
        try {
            const response = await fetch('/get_event/morning');
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            this.currentEvent = await response.json();
            
            // 确保事件有类型属性
            if (this.currentEvent && !this.currentEvent.error) {
                this.currentEvent.type = 'morning';
                this.currentDialogIndex = 0;
                this.hasEventEnded = false;
                this.isEventEnding = false;
                this.debug('成功加载早晨事件:' + this.currentEvent.id);
                
                // 播放早晨事件的背景音乐
                this.playEventMusic('morning');
                
                this.showCurrentDialog();
            } else {
                console.error('无可用的早晨事件', this.currentEvent);
                this.elements.dialogText.textContent = '今天没有特别的事情发生...';
                this.elements.speakerName.textContent = '旁白';
                this.showContinueButton('继续', () => this.startNewDay());
            }
        } catch (error) {
            console.error('加载早晨事件失败:', error);
            this.elements.dialogText.textContent = '加载事件时出现错误...';
            this.elements.speakerName.textContent = '错误';
        }
    }

    /**
     * 播放背景音乐
     * @param {string} musicPath 音乐文件路径
     */
    playBackgroundMusic(musicPath) {
        this.debug(`播放背景音乐: ${musicPath}`);
        
        // 如果已经在播放相同的音乐，则不做任何操作
        if (this.currentMusicPath === musicPath && this.backgroundMusic && !this.backgroundMusic.paused) {
            this.debug('已经在播放相同的音乐，跳过');
            return;
        }
        
        // 停止当前播放的音乐
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        // 创建新的音频元素
        this.backgroundMusic = new Audio(musicPath);
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.loop = true;
        
        // 记录当前音乐路径
        this.currentMusicPath = musicPath;
        
        // 播放音乐
        this.backgroundMusic.play().catch(err => {
            console.error('播放音乐失败:', err);
        });
    }
    
    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        this.debug('停止背景音乐');
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.currentMusicPath = '';
        }
    }
    
    /**
     * 根据事件类型播放对应的背景音乐
     * @param {string} eventType 事件类型
     * @param {boolean} isQuizPhase 是否处于答题阶段
     */
    playEventMusic(eventType, isQuizPhase = false) {
        let musicPath = '';
        
        // 根据事件类型选择音乐
        switch (eventType) {
            case 'morning':
                musicPath = '/static/music/school.mp3';
                break;
            case 'home':
            case 'phone':
                musicPath = '/static/music/home.mp3';
                break;
            case 'weekend':
                // 周末事件答题阶段播放live.mp3，其他阶段播放home.mp3
                musicPath = isQuizPhase ? '/static/music/live.mp3' : '/static/music/home.mp3';
                break;
            default:
                // 默认音乐
                musicPath = '/static/music/home.mp3';
        }
        
        // 播放选定的音乐
        if (musicPath) {
            this.playBackgroundMusic(musicPath);
        }
    }

    /**
     * 加载周末事件
     */
    async loadWeekendEvent() {
        this.debug('加载周末事件');
        // 清除旧的选项
        this.clearAllChoices();
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
                await this.loadMorningEvent();
                return;
            }
            
            this.debug(`成功加载周末事件: ${event.id}`);
            
            // 设置事件类型并初始化
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
            
            // 播放周末事件的背景音乐（对白阶段）
            this.playEventMusic('weekend', false);
            
            // 确保监听器会被正确重置
            if (!this.boundHandleClick) {
                this.boundHandleClick = this.handleClick.bind(this);
            }
            
            // 重新绑定监听，确保先移除旧的再添加新的
            document.removeEventListener('click', this.boundHandleClick);
            
            // 使用setTimeout确保移除操作完成后再添加
            setTimeout(() => {
                document.addEventListener('click', this.boundHandleClick);
                this.debug('周末事件：重新绑定点击监听器');
                // 显示事件对话
                this.showCurrentDialog();
            }, 50);
            
            return true; // 表示成功加载
        } catch (error) {
            console.error('加载周末事件失败:', error);
            // 回退到晨间事件
            this.loadMorningEvent();
            throw error; // 重新抛出错误给调用者
        }
    }

    /**
     * 分析和重置事件处理状态
     * 用于排查分支对话卡住的问题
     */
    analyzeAndResetEventState() {
        console.log('[状态诊断] ====== 开始事件状态分析 ======');
        
        // 检查当前事件信息
        console.log(`[状态诊断] 当前事件类型: ${this.currentEvent?.type || '无事件'}`);
        console.log(`[状态诊断] 当前对白索引: ${this.currentDialogIndex}`);
        console.log(`[状态诊断] 总对白数量: ${this.currentEvent?.dialogues?.length || 0}`);
        
        // 检查事件状态
        console.log(`[状态诊断] 事件结束状态: hasEventEnded=${this.hasEventEnded}, isEventEnding=${this.isEventEnding}`);
        console.log(`[状态诊断] 答题状态: hasStartedQuiz=${this.hasStartedQuiz}, hasCompletedQuiz=${this.hasCompletedQuiz}`);
        console.log(`[状态诊断] 分支对话状态: isProcessingBranchDialogues=${this.isProcessingBranchDialogues || false}`);
        
        // 检查点击处理器状态
        console.log(`[状态诊断] 点击处理器: boundHandleClick=${!!this.boundHandleClick}`);
        
        // 尝试重置点击绑定
        console.log('[状态诊断] 正在重置点击处理器...');
        
        if (this.currentEvent && (this.currentEvent.type === 'weekend') && 
            this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            
            // 确保处于正确的状态
            this.hasEventEnded = false;
            this.isEventEnding = false;
            
            // 重新绑定点击处理器
            if (!this.boundHandleClick) {
                this.boundHandleClick = this.handleClick.bind(this);
            }
            
            // 强制移除和重新添加监听器
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
                        
                        // 否则进入下一对话
                        this.currentDialogIndex++;
                        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                            this.showCurrentDialog();
                        } else {
                            this.showContinueButton('继续', () => this.endEvent());
                        }
                    };
                    gameScreen.addEventListener('click', forceHandler);
                    console.log('[状态诊断] 添加了一次性强制点击监听器');
                }
            }, 100);
        }
        
        console.log('[状态诊断] ====== 事件状态分析完成 ======');
    }

    /**
     * 显示当前对话
     */
    showCurrentDialog() {
        // 如果事件已结束或正在结束，退出
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('事件已结束或正在结束，不显示对话');
            return;
        }
        
        // 检查当前事件和对话是否有效
        if (!this.currentEvent || !this.currentEvent.dialogues) {
            console.error('无法显示对话: 当前事件或对话不存在');
            return;
        }
        
        // 检查对话索引是否有效
        if (this.currentDialogIndex < 0 || this.currentDialogIndex >= this.currentEvent.dialogues.length) {
            console.error('无法显示对话: 对话索引越界', this.currentDialogIndex);
            return;
        }
        
        const dialog = this.currentEvent.dialogues[this.currentDialogIndex];
        if (!dialog) {
            console.error('无法显示对话: 当前索引没有对话内容');
            return;
        }
        
        this.debug(`显示对话: ${this.currentDialogIndex + 1}/${this.currentEvent.dialogues.length}`);
        
        // 检查是否是分支对话（答题后的分支）
        if (this.currentEvent.type === 'weekend' && this.hasCompletedQuiz && this.isProcessingBranchDialogues) {
            console.log(`[分支对话] 显示分支对话: ${this.currentDialogIndex + 1}/${this.currentEvent.dialogues.length}`);
            
            // 在显示分支对话时分析和重置事件状态
            this.analyzeAndResetEventState();
        }
        
        // 更新背景
        if (this.currentEvent.background && this.currentDialogIndex === 0) {
            const bgPath = `/static/images/${this.currentEvent.background}`;
            this.setBackgroundImage(bgPath);
        }
        
        // 更新角色
        this.updateCharacters(dialog);
        
        // 显示说话人名字
        const speakerName = dialog.character.split('_')[0];
        this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
        
        // 打字机效果显示对话
        this.typeText(dialog.text);
        
        // 检查是否是最后一句对话
        const isLastDialog = (this.currentDialogIndex === this.currentEvent.dialogues.length - 1);
        
        // 如果是周末事件且存在 quiz 且未完成，则直接进入答题
        if (isLastDialog && this.currentEvent.type === 'weekend' && this.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('周末事件：最后一个对话，准备切换到答题环节');
            // 不立即切换到答题，而是等待用户点击后再进入
            // 显示一个继续按钮
            setTimeout(() => {
                this.showContinueButton('继续答题', () => {
                    this.debug('周末事件：点击继续，准备进入答题环节');
                    // 清除继续按钮遮罩与选项
                    const contOv = document.getElementById('continue-overlay'); 
                    if (contOv) contOv.remove();
                    this.clearAllChoices();
                    // 显示答题界面
                    this.showQuizQuestion();
                });
            }, 100);
            return;
        }
        
        // 先清除选项区域
        this.clearAllChoices();
        
        // 重置分支对话处理标志
        if (isWeekendBranchDialog) {
            this.debug('周末事件分支对话全部完成，准备结束事件');
            this.isProcessingBranchDialogues = false;
            
            // 记录已经处理过分支对话，防止再次触发
            this.hasProcessedBranches = true;
        }
        
        // 处理最后一句对话的选项或继续按钮
        if (isLastDialog) {
            // 检查是否有选项
            if (this.currentEvent.choices && this.currentEvent.choices.length > 0) {
                setTimeout(() => {
                    this.showChoices(this.currentEvent.choices);
                }, 100);
            } else {
                // 统一为结束事件，触发summary或后续事件
                setTimeout(() => {
                    this.showContinueButton('继续', () => {
                        this.debug('点击继续按钮，结束事件');
                        this.endEvent();
                    });
                }, 100);
            }
        }
    }

    /**
     * 格式化角色名称
     * @param {string} name 原始角色名
     * @returns {string} 格式化后的角色名
     */
    formatSpeakerName(name) {
        // 处理特殊角色名称
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

    /**
     * 设置背景图片
     * @param {string} imagePath 图片路径
     */
    setBackgroundImage(imagePath) {
        // 使用全局图片路径修复函数
        if (window.fixImagePath) {
            imagePath = window.fixImagePath(imagePath);
        }
        
        // 创建一个Image对象用于预加载和错误处理
        const img = new Image();
        img.onload = () => {
            this.elements.background.style.backgroundImage = `url(${imagePath})`;
        };
        img.onerror = () => {
            console.error(`背景图片加载失败: ${imagePath}`);
            // 使用默认背景
            const defaultBg = '/static/images/bedroom.png';
            if (window.handleImageError) {
                window.handleImageError(this.elements.background, defaultBg);
            } else {
                this.elements.background.style.backgroundImage = `url(${defaultBg})`;
            }
        };
        img.src = imagePath;
    }

    /**
     * 更新角色图片
     * @param {Object} dialog 对话数据
     */
    updateCharacters(dialog) {
        if (!dialog) return;
        
        try {
            // 解析角色信息并更新角色图片
            if (dialog.character) {
                const parts = dialog.character.split('_');
                const name = parts[0].toLowerCase(); // 角色名转小写
                let emotion = parts.length > 1 ? parts[1].toLowerCase() : 'neutral'; // 表情默认为neutral
                
                // 针对特殊角色的处理
                if (name === 'system' || name === 'narrator') {
                    // 旁白或系统消息，清除所有角色显示
                    this.elements.characterLeft.style.backgroundImage = '';
                    this.elements.characterRight.style.backgroundImage = '';
                    return;
                }
                
                // 处理游戏内预设的场景或特殊角色
                if (name === 'students' || name === 'crowd' || name === 'class') {
                    // 群体场景，使用专用背景
                    const imagePath = `/static/images/characters/Students_background.png`;
                    this.setCharacterImage(this.elements.characterLeft, imagePath, `/static/images/characters/default.png`);
                    this.elements.characterRight.style.backgroundImage = '';
                    return;
                }
                
                // 为游戏中的角色获取对应的图片路径
                // 规则：角色名_情绪.png，如 zack_neutral.png
                const characterPath = `/static/images/characters/${name}_${emotion}.png`;
                const defaultPath = `/static/images/characters/default.png`;
                
                // 根据角色名确定角色放在左侧还是右侧
                // 只有主角Zack放左边，其他所有角色放右边
                if (name === 'zack') {
                    this.setCharacterImage(this.elements.characterLeft, characterPath, defaultPath);
                    this.elements.characterRight.style.backgroundImage = '';
                } else {
                    this.elements.characterLeft.style.backgroundImage = '';
                    this.setCharacterImage(this.elements.characterRight, characterPath, defaultPath);
                }
            } else {
                // 没有角色信息，清除所有角色显示
                this.elements.characterLeft.style.backgroundImage = '';
                this.elements.characterRight.style.backgroundImage = '';
            }
        } catch (err) {
            console.error('更新角色图片失败:', err);
            // 发生错误时清除所有角色显示
            this.elements.characterLeft.style.backgroundImage = '';
            this.elements.characterRight.style.backgroundImage = '';
        }
    }

    /**
     * 设置角色图片
     * @param {HTMLElement} element 要设置图片的DOM元素
     * @param {string} imagePath 图片路径
     * @param {string} defaultPath 默认图片路径
     */
    setCharacterImage(element, imagePath, defaultPath = '/static/images/characters/default.png') {
        // 确保元素存在
        if (!element) return;
        
        // 先移除错误状态
        element.classList.remove('error');
        element.style.backgroundColor = 'transparent';
        
        // 使用全局图片路径修复函数
        if (window.fixImagePath) {
            imagePath = window.fixImagePath(imagePath);
            defaultPath = window.fixImagePath(defaultPath);
        }
        
        const img = new Image();
        img.onload = () => {
            // 图片加载成功
            element.style.backgroundImage = `url(${imagePath})`;
            // 确保移除错误样式类
            element.classList.remove('error');
            element.style.backgroundColor = 'transparent';
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}, using default`);
            
            // 检查默认图片是否与目标图片相同
            if (imagePath === defaultPath) {
                // 防止无限循环：如果默认图片就是当前图片，则清除背景
                console.error('Default image is same as failed image, clearing background');
                element.style.backgroundImage = 'none';
                element.classList.remove('error');
                return;
            }
            
            // 使用错误处理函数或直接设置默认图像
            if (window.handleImageError) {
                window.handleImageError(element, defaultPath);
            } else {
                // 直接设置默认图像
                const defaultImg = new Image();
                defaultImg.onload = () => {
                    element.style.backgroundImage = `url(${defaultPath})`;
                    element.classList.add('error');
                };
                defaultImg.onerror = () => {
                    // 如果默认图片也无法加载，清除背景
                    console.error('Default image also failed to load');
                    element.style.backgroundImage = 'none';
                    element.classList.remove('error');
                };
                defaultImg.src = defaultPath;
            }
        };
        img.src = imagePath;
    }

    /**
     * 打字机效果显示文本
     * @param {string} text 要显示的文本
     */
    typeText(text) {
        // 生成打字会话ID，并记录
        const typingId = Symbol('typingSession');
        this.currentTypingId = typingId;
        this.isTyping = true;
        
        // 首先清空对话文本内容，避免内容累积
        this.elements.dialogText.textContent = '';
        
        let index = 0;
        const type = () => {
            // 如果会话已被取消或切换，停止继续打字
            if (this.currentTypingId !== typingId) {
                return;
            }
            if (index < text.length) {
                // 确保清除之前的内容，再逐字添加新内容
                this.elements.dialogText.textContent = text.substring(0, index + 1);
                index++;
                setTimeout(type, this.typingSpeed);
            } else {
                this.isTyping = false;
            }
        };
        type();
    }

    /**
     * 处理点击事件
     * @param {Event} e 点击事件对象
     */
    handleClick(e) {
        // 如果事件已结束或正在结束，不处理点击
        if (this.hasEventEnded || this.isEventEnding) {
            this.debug('事件已结束或正在结束，忽略点击');
            return;
        }
        // 如果正在答题阶段，不处理点击事件
        if (this.hasStartedQuiz) {
            this.debug('答题阶段，忽略点击事件');
            return;
        }
        
        // 忽略来自按钮和遮罩层的点击
        if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
            this.debug('忽略按钮或遮罩层点击');
            return;
        }
        
        // 如果正在打字，点击会直接显示完整文本
        if (this.isTyping) {
            this.debug('加速显示文本');
            // 取消当前打字会话，防止旧的超时回调干扰
            this.currentTypingId = null;
            this.isTyping = false;
            if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                // 直接显示完整文本
                this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
            }
            return;
        }
        
        // 确保有有效的事件和对话
        if (!this.currentEvent || !this.currentEvent.dialogues) {
            this.debug('没有有效的事件或对话');
            return;
        }
        
        // 检查当前对话是否是最后一个且有选项
        const isLastDialog = (this.currentDialogIndex === this.currentEvent.dialogues.length - 1);
        
        // 如果是最后一个对话且有选项，不进入下一句
        if (isLastDialog && this.currentEvent.choices && this.currentEvent.choices.length > 0) {
            this.debug('当前对话有选项，不进入下一句');
            return;
        }
        
        // 如果是最后一个对话且是周末事件有quiz，则处理特殊逻辑
        if (isLastDialog && this.currentEvent.type === 'weekend' && this.currentEvent.quiz && !this.hasCompletedQuiz) {
            this.debug('最后一个对话是周末事件且有quiz，显示继续按钮');
            // 显示继续按钮，进入答题环节
            this.showContinueButton('继续答题', () => {
                this.debug('周末事件：点击继续，准备进入答题环节');
                // 清除继续按钮遮罩与选项
                const contOv = document.getElementById('continue-overlay'); 
                if (contOv) contOv.remove();
                this.clearAllChoices();
                // 显示答题界面
                this.showQuizQuestion();
            });
            return;
        }
        
        // 检查是否正在处理分支对话（答题后的分支）
        const isWeekendBranchDialog = this.currentEvent.type === 'weekend' && this.hasCompletedQuiz && this.isProcessingBranchDialogues;
        
        if (isWeekendBranchDialog) {
            this.debug(`处理周末分支对话点击: 当前索引=${this.currentDialogIndex}, 总对话=${this.currentEvent.dialogues.length}`);
            console.log(`[分支处理] 点击处理：当前索引=${this.currentDialogIndex}, 总对话=${this.currentEvent.dialogues.length}`);
        }
        
        // 进入下一句对话
        this.debug(`进入下一句对话 ${this.currentDialogIndex + 1}`);
        this.currentDialogIndex++;
        
        // 检查是否还有更多对话
        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
            // 还有更多对话，显示下一句
            this.showCurrentDialog();
        } else {
            // 对话全部完成
            this.debug('对话全部完成');
            
            // 先清除选项区域
            this.clearAllChoices();
            
            // 重置分支对话处理标志
            if (isWeekendBranchDialog) {
                this.debug('周末事件分支对话全部完成，准备结束事件');
                this.isProcessingBranchDialogues = false;
                
                // 记录已经处理过分支对话，防止再次触发
                this.hasProcessedBranches = true;
            }
            
            // 检查是否有选项
            if (this.currentEvent.choices && this.currentEvent.choices.length > 0) {
                // 延迟显示选项
                setTimeout(() => {
                    this.showChoices(this.currentEvent.choices);
                }, 100);
            } else {
                // 延迟显示继续按钮
                setTimeout(() => {
                    this.showContinueButton('继续', () => {
                        this.debug('点击继续按钮，结束事件');
                        this.endEvent();
                    });
                }, 100);
            }
        }
    }

    /**
     * 处理选择事件
     * @param {number} choiceIndex 选择的索引
     */
    async handleChoice(choiceIndex) {
        try {
            // 检查选择是否有效
            if (!this.currentEvent || !this.currentEvent.choices || choiceIndex >= this.currentEvent.choices.length) {
                console.error('无效的选择索引或选项不存在');
                this.isProcessingChoice = false;
                return;
            }
            
            const choice = this.currentEvent.choices[choiceIndex];
            this.debug(`选择了选项: ${choiceIndex}, 内容: ${choice.text}`);
            
            // 更新游戏状态
            if (choice.outcome && choice.outcome.stats) {
                this.debug(`更新游戏状态: ${JSON.stringify(choice.outcome.stats)}`);
                Object.keys(choice.outcome.stats).forEach(key => {
                    // 将stats中的键映射到gameState中的键
                    const gameStateKey = this.mapStatKey(key);
                    if (gameStateKey) {
                        this.gameState[gameStateKey] += choice.outcome.stats[key];
                        this.debug(`更新 ${gameStateKey}: ${this.gameState[gameStateKey]}`);
                    }
                });
                this.updateStatusBar();
                await this.saveGameState();
            }

            // 清除之前的所有选项和事件监听器
            this.clearAllChoices();
            document.removeEventListener('click', this.boundHandleClick);
            
            // 处理选择后的对话
            if (choice.outcome && choice.outcome.dialogues && choice.outcome.dialogues.length > 0) {
                this.debug(`显示选择后的对话，数量: ${choice.outcome.dialogues.length}`);
                
                // 更新当前事件的对话为选择后的对话
                this.currentEvent.dialogues = choice.outcome.dialogues;
                this.currentDialogIndex = 0;
                
                // 创建一个专用的事件处理函数来处理选择后的对话点击
                const handleOutcomeDialogs = (e) => {
                    // 忽略来自按钮的点击
                    if (e.target.tagName === 'BUTTON') {
                        return;
                    }
                    
                    // 处理打字机效果加速
                    if (this.isTyping) {
                        this.debug('加速显示文本');
                        this.isTyping = false;
                        if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                            this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                        }
                        return;
                    }
                    
                    // 进入下一句对话
                    this.debug('点击继续对话');
                    this.currentDialogIndex++;
                    
                    // 检查是否还有更多对话
                    if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                        // 显示下一句
                        const dialog = this.currentEvent.dialogues[this.currentDialogIndex];
                        
                        // 更新角色
                        this.updateCharacters(dialog);
                        
                        // 显示说话人名字
                        const speakerName = dialog.character.split('_')[0];
                        this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
                        
                        // 打字机效果显示对话
                        this.typeText(dialog.text);
                    } else {
                        // 对话完成，结束事件
                        this.debug('选择后的对话结束');
                        
                        // 移除事件监听器
                        document.removeEventListener('click', handleOutcomeDialogs);
                        
                        // 延迟显示继续按钮
                        this.clearAllChoices();
                        setTimeout(() => {
                            this.showContinueButton('继续', () => {
                                this.debug('点击继续按钮，结束事件');
                                this.endEvent();
                            });
                        }, 100);
                    }
                };
                
                // 添加新的点击事件监听器
                document.addEventListener('click', handleOutcomeDialogs);
                
                // 显示第一句选择后的对话
                const dialog = this.currentEvent.dialogues[0];
                
                // 更新角色
                this.updateCharacters(dialog);
                
                // 显示说话人名字
                const speakerName = dialog.character.split('_')[0];
                this.elements.speakerName.textContent = this.formatSpeakerName(speakerName);
                
                // 打字机效果显示对话
                this.typeText(dialog.text);
            } else {
                // 没有后续对话，直接结束事件
                this.debug('选择没有后续对话，直接结束事件');
                this.endEvent();
            }
        } catch (error) {
            console.error('处理选择时出错:', error);
        } finally {
            // 重置处理标志
            this.isProcessingChoice = false;
        }
    }

    /**
     * 将事件文件中的状态键映射到游戏状态键
     * @param {string} statKey 事件文件中的状态键
     * @returns {string} 游戏状态键
     */
    mapStatKey(statKey) {
        // 映射事件文件中的状态键到游戏状态键
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

    /**
     * 保存游戏状态
     */
    async saveGameState() {
        this.debug('保存游戏状态');
        try {
            const response = await fetch('/update_game_state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.gameState)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const result = await response.json();
            this.debug(`保存游戏状态成功: ${JSON.stringify(result)}`);
        } catch (error) {
            console.error('保存游戏状态失败:', error);
        }
    }

    /**
     * 结束当前事件
     */
    async endEvent() {
        this.debug('正式结束事件');
        
        // 设置事件结束标志
        this.hasEventEnded = true;
        this.isEventEnding = true;
        
        // 清除所有选项与可能的继续按钮
        this.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            // 检查是否是周末事件且已完成答题，并且尚未处理过分支对话
            if (this.currentEvent && this.currentEvent.type === 'weekend' && 
                this.hasCompletedQuiz && this.currentEvent.branches && 
                !this.hasProcessedBranches) {  // 添加标志防止重复处理
                
                this.debug(`周末事件答题完成，得分: ${this.quizScore}，处理分支对话`);
                
                // 设置已处理分支标志
                this.hasProcessedBranches = true;
                
                // 根据得分选择分支
                let selectedBranch = null;
                
                // 找到适合的分支（按minScore降序排列，找到第一个小于等于得分的分支）
                for (const branch of this.currentEvent.branches.sort((a, b) => b.minScore - a.minScore)) {
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
                            const gameStateKey = this.mapStatKey(key);
                            if (gameStateKey) {
                                this.gameState[gameStateKey] += selectedBranch.stats[key];
                                this.debug(`更新 ${gameStateKey}: ${this.gameState[gameStateKey]}`);
                            }
                        });
                        this.updateStatusBar();
                        await this.saveGameState();
                    }
                    
                    // 如果有分支对话，显示这些对话
                    if (selectedBranch.dialogues && selectedBranch.dialogues.length > 0) {
                        this.debug('显示分支对话');
                        
                        // 重置事件结束状态和分支对话处理状态
                        this.isEventEnding = false;
                        this.hasEventEnded = false;
                        
                        // 对于分支对话，保持hasCompletedQuiz为true，但需要设置一个新标志表示正在处理分支对话
                        this.isProcessingBranchDialogues = true;
                        
                        // 切换回对白阶段的音乐
                        this.playEventMusic('weekend', false);
                        
                        // 更新当前事件的对话为分支对话
                        this.currentEvent.dialogues = selectedBranch.dialogues;
                        this.currentDialogIndex = 0;
                        
                        // 确保boundHandleClick已定义
                        if (!this.boundHandleClick) {
                            this.boundHandleClick = this.handleClick.bind(this);
                        }
                        
                        // 重新绑定点击事件（先移除再添加）
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
            if (this.currentEvent && this.currentEvent.id) {
                if (!this.gameState.completed_events.includes(this.currentEvent.id)) {
                    this.gameState.completed_events.push(this.currentEvent.id);
                    this.debug(`已完成事件列表: ${this.gameState.completed_events.join(', ')}`);
                }
                await this.saveGameState();
            }
            
            // 重置周末事件相关状态，确保不会重复触发
            if (this.currentEvent && this.currentEvent.type === 'weekend') {
                this.hasCompletedQuiz = false;
                this.hasProcessedBranches = false;
                this.isProcessingBranchDialogues = false;
                this.debug('重置周末事件状态标志');
            }
            
            // 如果事件有 summary，展示事件总结并结束函数
            if (this.currentEvent && this.currentEvent.summary && this.currentEvent.summary.trim() !== '') {
                this.debug(`显示事件总结: ${this.currentEvent.summary}`);
                // 半透明角色提示
                this.elements.characterLeft.style.opacity = '0.5';
                this.elements.characterRight.style.opacity = '0.5';
                
                // 确保弹出总结面板前已清除所有可能的遮罩层
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                this.showEventSummaryUI(this.currentEvent.summary);
                return;
            }
            
            // 没有summary时处理下一步
            this.handleNextEventSteps();
            
        } catch (error) {
            console.error('endEvent 出错:', error);
            // 出错时也直接进入新的一天
            setTimeout(() => this.startNewDay(), 200);
        }
    }
    
    /**
     * 处理事件结束后的下一步操作
     * 从endEvent方法中提取出来方便维护
     */
    handleNextEventSteps() {
        // 对于晨间事件，加载第二个事件；否则直接开始新的一天
        if (this.currentEvent && this.currentEvent.type === 'morning') {
            this.debug('晨间事件结束，加载下一个事件');
            setTimeout(() => this.loadNextEvent(), 200);
        } else if (this.currentEvent && this.currentEvent.type === 'weekend') { 
            this.debug('周末事件结束，开始新的一天');
            setTimeout(() => this.startNewDay(), 200);
        } else if (this.currentEvent && (this.currentEvent.type === 'home' || this.currentEvent.type === 'phone')) {
            this.debug('家庭/手机事件结束，开始新的一天');
            setTimeout(() => this.startNewDay(), 200);
        } else {
            this.debug('没有可触发的事件，显示悲惨结局');
            // 延迟小段时间后展示悲惨结局
            setTimeout(() => this.showBadEnd(), 200);
        }
    }

    /**
     * 强制启用点击处理
     * 用于分支对话等特殊情况下确保点击监听器工作
     */
    forceEnableClickHandler() {
        // 确保boundHandleClick已定义
        if (!this.boundHandleClick) {
            this.boundHandleClick = this.handleClick.bind(this);
        }
        
        // 移除现有监听器并重新添加
        document.removeEventListener('click', this.boundHandleClick);
        document.addEventListener('click', this.boundHandleClick);
        
        // 打印调试信息
        console.log('[强制修复] 已重置点击处理程序');
        
        // 直接使用DOM添加一个一次性点击监听器，确保至少第一次点击能被处理
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            const onceClickHandler = (e) => {
                // 不处理来自按钮的点击
                if (e.target.tagName === 'BUTTON') return;
                
                console.log('[强制修复] 一次性点击监听器被触发');
                
                // 移除本监听器
                gameScreen.removeEventListener('click', onceClickHandler);
                
                // 如果处于文本打字状态，直接完成打字
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
                
                // 否则尝试进入下一句对话
                if (this.currentEvent && this.currentEvent.dialogues) {
                    this.currentDialogIndex++;
                    if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                        this.showCurrentDialog();
                    } else {
                        // 对话已全部完成，显示继续按钮
                        this.showContinueButton('继续', () => this.endEvent());
                    }
                }
            };
            
            // 添加一次性监听器
            gameScreen.addEventListener('click', onceClickHandler);
        }
    }

    /**
     * 使用独立的面板展示事件总结
     */
    showEventSummaryUI(summary) {
        // 移除旧的总结面板，确保重新创建并入场动画
        const oldPanel = document.getElementById('summary-panel');
        if (oldPanel) oldPanel.remove();
        // 创建新的总结面板
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
        // 触发淡入动画
        requestAnimationFrame(() => { panel.style.opacity = '1'; });
        // 清空内容并重建
        panel.innerHTML = '';
        // 随机选择Aether头像
        const imgs = [
            'Aether_warning.png','Aether_toy.png','Aether_thinking.png',
            'Aether_smile.png','Aether_relaxed.png','Aether_proud.png',
            'Aether_neutral.png','Aether_gentle.png','Aether_concerned.png'
        ];
        const chosen = imgs[Math.floor(Math.random()*imgs.length)];
        const imgElem = document.createElement('img');
        imgElem.src = `/static/images/characters/${chosen}`;
        imgElem.style.cssText = 'position:absolute; top:-260px; left:50%; transform:translateX(-50%); width:320px; height:320px; border-radius:50%; border:8px solid #fff; box-shadow:0 4px 20px rgba(0,0,0,0.5); object-fit:contain;';
        panel.appendChild(imgElem);
        // Aether 名称
        const speaker = document.createElement('div');
        speaker.textContent = 'How shoud I do?';
        speaker.style.cssText = 'font-size:28px; font-weight:bold; text-align:center; margin-top:100px; margin-bottom:20px; text-shadow:1px 1px 2px #000;';
        panel.appendChild(speaker);
        // 总结文本
        const txt = document.createElement('div');
        txt.textContent = summary;
        txt.style.cssText = 'font-size:20px; line-height:1.6; text-align:center; padding:0 10px;';
        panel.appendChild(txt);
        // 继续按钮
        const btn = document.createElement('button');
        btn.textContent = '继续';
        btn.className = 'choice-button';
        btn.style.cssText = 'display:block; margin:30px auto 0; padding:10px 30px; font-size:18px; background-color:#3498db; border:none; border-radius:8px; cursor:pointer;';
        // 按钮锁定1秒
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 1000);
        btn.addEventListener('click', e => {
            e.stopPropagation();
            // 出场淡出
            panel.style.transition = 'opacity 0.2s ease-in';
            panel.style.opacity = '0';
            panel.addEventListener('transitionend', () => {
                panel.remove();
                this.clearAllChoices();
                // 调用新的方法处理下一步
                this.handleNextEventSteps();
            }, { once: true });
        }, { once: true });
        panel.appendChild(btn);
    }

    /**
     * 加载下一个事件
     */
    async loadNextEvent() {
        this.debug('加载下一个事件');
        
        // 清除所有选项
        this.clearAllChoices();
        
        // 如果当前事件不是早晨事件，直接开始新的一天
        if (!this.currentEvent || this.currentEvent.type !== 'morning') {
            this.debug('loadNextEvent: 非晨间事件，直接开始新一天');
            setTimeout(() => this.startNewDay(), 200);
            return;
        }
        
        try {
            if (!this.currentEvent || !this.currentEvent.type) {
                console.error('当前事件类型无效:', this.currentEvent);
                setTimeout(() => this.startNewDay(), 200);
                return;
            }

            this.debug(`当前事件类型: ${this.currentEvent.type}`);
            
            // 根据当前事件类型决定下一个事件
            if (this.currentEvent.type === 'morning') {
                // 如果是第十四天或第七天的特殊晨间事件，跳过第二个事件并开始新的一天
                if (this.currentEvent.id === 'MorningEvent-14' || this.currentEvent.id === 'MorningEvent-11') {
                    this.debug('特殊晨间事件，跳过第二个事件并开始新的一天');
                    // 跳过第二个事件并开始新的一天
                    setTimeout(() => this.startNewDay(), 200);
                } else {
                    // 加载家庭或手机事件
                    setTimeout(() => this.loadSecondEvent(), 200);
                }
            } else {
                // 非晨间事件结束，开始新的一天
                setTimeout(() => this.startNewDay(), 200);
            }
        } catch (error) {
            console.error('加载下一个事件失败:', error);
            setTimeout(() => this.startNewDay(), 200);
        }
    }

    /**
     * 加载第二个事件 - 优先尝试加载 phone 事件，没有可用的再尝试 home 事件
     */
    async loadSecondEvent() {
        this.debug('加载第二个事件: 优先尝试手机事件');
        try {
            // 首先尝试加载手机事件
            const phoneResponse = await fetch(`/get_event/phone?t=${Date.now()}`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (phoneResponse.ok) {
                const phoneEvent = await phoneResponse.json();
                
                // 检查是否有可用的手机事件
                if (!phoneEvent.error) {
                    this.debug('成功加载手机事件: ' + phoneEvent.id);
                    phoneEvent.type = 'phone';
                    this.currentEvent = phoneEvent;
                    this.currentDialogIndex = 0;
                    this.hasEventEnded = false;
                    this.isEventEnding = false;
                    // 重新绑定点击监听
                    document.removeEventListener('click', this.boundHandleClick);
                    document.addEventListener('click', this.boundHandleClick);
                    // 显示事件对话
                    this.showCurrentDialog();
                    return;
                }
            }
            
            // 如果手机事件加载失败，尝试加载家庭事件
            this.debug('没有可用的手机事件，尝试加载家庭事件');
            await this.loadSpecificEvent('home');
        } catch (error) {
            console.error('加载第二个事件失败:', error);
            this.startNewDay();
        }
    }

    /**
     * 统一加载指定类型事件
     */
    async loadSpecificEvent(type) {
        this.debug(`加载事件类型: ${type}`);
        try {
            const response = await fetch(`/get_event/${type}?t=${Date.now()}`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
            const event = await response.json();
            if (event.error) {
                this.debug(`事件返回错误: ${event.error}`);
                return this.startNewDay();
            }
            // 初始化事件
            event.type = type;
            this.currentEvent = event;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            
            // 播放对应事件类型的背景音乐
            this.playEventMusic(type);
            
            // 重新绑定点击监听
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            // 显示事件对话
            this.showCurrentDialog();
        } catch (err) {
            console.error('加载指定事件失败:', err);
            this.startNewDay();
        }
    }

    /**
     * 显示答题界面
     */
    showQuizQuestion() {
        this.debug('显示答题界面');
        
        // 开始答题前移除对话点击监听
        document.removeEventListener('click', this.boundHandleClick);
        
        // 设置答题状态
        this.hasStartedQuiz = true;
        this.quizQuestions = this.currentEvent.quiz.questions || [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        // 切换到周末事件答题阶段的背景音乐
        if (this.currentEvent.type === 'weekend') {
            this.playEventMusic('weekend', true);
        }
        
        // 如果有quiz背景，则更新背景
        if (this.currentEvent.quiz.background) {
            const bgPath = `/static/images/${this.currentEvent.quiz.background}`;
            this.debug(`加载答题背景: ${bgPath}`);
            
            // 预加载图片确保存在
            const img = new Image();
            img.onload = () => {
                this.debug('答题背景图片加载成功');
                this.elements.background.style.backgroundImage = `url(${bgPath})`;
                
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
     * 从showQuizQuestion中拆分出来的辅助方法
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
        this.elements.characterLeft.style.opacity = '0.5';
        this.elements.characterRight.style.opacity = '0.5';
        
        this.debug('答题UI显示完成，开始加载第一题');
        
        // 加载第一个问题
        this.displayQuizQuestion();
    }

    /**
     * 渲染当前答题
     */
    displayQuizQuestion() {
        console.log(`[DEBUG] 渲染第 ${this.currentQuizIndex + 1} 题`);
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

    /**
     * 处理下一题或结束
     */
    nextQuizQuestion() {
        clearInterval(this.quizQuestionTimer);
        this.currentQuizIndex++;
        if (this.currentQuizIndex < this.quizQuestions.length) {
            this.displayQuizQuestion();
        } else {
            this.hasCompletedQuiz = true;
            // 隐藏答题界面
            document.getElementById('quiz-timer-bar-container').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'none';
            // 重新绑定全局点击监听
            document.addEventListener('click', this.boundHandleClick);
            // 结束事件，展示总结面板
            this.endEvent();
        }
    }

    /**
     * 开始新的一天，保存状态并跳转到新游戏页面
     */
    async startNewDay() {
        this.debug('开始新的一天');
        
        // 停止当前背景音乐
        this.stopBackgroundMusic();
        
        // 重置当天事件完成标记
        this.gameState.daily_event_completed = false;
        
        // 更新天数和章节
        const currentDay = this.gameState.day || 0;
        this.gameState.day = currentDay + 1;
        this.gameState.chapter = Math.floor((this.gameState.day - 1) / 7) + 1;
        
        try {
            // 保存当前游戏状态到后端
            await this.saveGameState();
            
            this.debug(`进入新的一天：第 ${this.gameState.day} 天，第 ${this.gameState.chapter} 章`);
            
            // 清理当前事件状态
            this.currentEvent = null;
            this.currentDialogIndex = 0;
            this.hasEventEnded = false;
            this.isEventEnding = false;
            this.hasStartedQuiz = false;
            this.hasCompletedQuiz = false;
            this.hasProcessedBranches = false;
            this.isProcessingBranchDialogues = false;
            
            // 跳转到新游戏页面，保留状态（使用时间戳避免缓存）
            window.location.href = '/new_game?t=' + Date.now();
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            // 即使出错也尝试跳转
            window.location.href = '/new_game?t=' + Date.now();
        }
    }

    /**
     * 使用 summary-panel 样式展示游戏规则，并在点击按钮后执行回调
     * @param {string[]} rulesLines 规则条目数组
     * @param {Function} callback 点击继续时的回调
     */
    showRulesPanel(rulesLines, callback) {
        // 移除旧的 summary-panel
        const old = document.getElementById('summary-panel');
        if (old) old.remove();
        // 创建面板
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
        // 标题
        const title = document.createElement('div');
        title.textContent = '游戏规则';
        title.style.cssText = 'font-size:24px; font-weight:bold; text-align:center; margin-bottom:20px;';
        panel.appendChild(title);
        // 规则条目
        rulesLines.forEach(line => {
            const div = document.createElement('div');
            div.textContent = line;
            div.style.cssText = 'font-size:18px; line-height:1.6; text-align:left; margin:0 0 10px;';
            panel.appendChild(div);
        });
        // 按钮
        const btn = document.createElement('button');
        btn.textContent = '开始答题';
        btn.className = 'choice-button';
        btn.style.cssText = 'display:block; margin:30px auto 0; padding:10px 30px; font-size:18px; background-color:#3498db; border:none; border-radius:8px; cursor:pointer;';
        btn.disabled = true; 
        setTimeout(() => { btn.disabled = false; }, 1000);
        btn.addEventListener('click', e => {
            e.stopPropagation();
            // 淡出
            panel.style.transition = 'opacity 0.2s ease-in';
            panel.style.opacity = '0';
            panel.addEventListener('transitionend', () => {
                panel.remove();
                try { callback(); } catch(e) { console.error('规则回调出错', e); }
            }, { once: true });
        }, { once: true });
        panel.appendChild(btn);
    }

    /**
     * 显示悲惨结局（Bad End）
     */
    async showBadEnd() {
        // 创建全屏覆盖层
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundImage: 'url(/static/images/badend1.png)',
            opacity: '1', transition: 'filter 2s ease, opacity 3s ease',
            filter: 'none', zIndex: '3000', display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none'
        });
        document.body.appendChild(overlay);
        // 对话文本容器
        const textBox = document.createElement('div');
        Object.assign(textBox.style, {
            color: '#fff', fontSize: '20px', textAlign: 'center',
            marginBottom: '100px', padding: '0 20px', lineHeight: '1.6',
            textShadow: '0 0 8px rgba(0,0,0,0.8)'
        });
        overlay.appendChild(textBox);
        // 第一段对白
        const lines1 = [
            `It was late at night. Only a small lamp was still on in the room.`,
            `Zack sat on the edge of his bed, holding Aether tightly. Tears were still on his face.`,
            `He didn't say anything. He didn't turn on the computer again. All the excitement he once had felt far away now.`
        ];
        for (let line of lines1) {
            textBox.textContent = line;
            await new Promise(res => setTimeout(res, 3000));
        }
        // 模糊并切换背景
        overlay.style.filter = 'blur(8px)';
        await new Promise(res => setTimeout(res, 2000));
        overlay.style.backgroundImage = 'url(/static/images/badend2.png)';
        overlay.style.filter = 'none';
        // 第二段对白
        const lines2 = [
            `No one watched his livestreams.`,
            `No one understood what he was going through.`,
            `No one saw how he was slowly losing confidence.`,
            `This time... he couldn't protect himself.`,
            `The world outside the screen was still full of noise.`,
            `But in this room, there was only quiet breathing left.`
        ];
        for (let line of lines2) {
            textBox.textContent = line;
            await new Promise(res => setTimeout(res, 3000));
        }
        // 渐变至黑屏
        overlay.style.transition = 'opacity 3s ease';
        overlay.style.opacity = '0';
        await new Promise(res => setTimeout(res, 3000));
        // 显示大字 Bad end
        const badText = document.createElement('div');
        badText.textContent = 'Bad end';
        Object.assign(badText.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            color: '#fff', fontSize: '80px', fontWeight: 'bold', zIndex: '3001', opacity: '0',
            transition: 'opacity 1s ease'
        });
        document.body.appendChild(badText);
        requestAnimationFrame(() => badText.style.opacity = '1');
        // 等待10秒后重置到首页
        await new Promise(res => setTimeout(res, 10000));
        window.location.href = '/';
    }
}

// 初始化全局游戏实例
// 在页面加载完成后创建 Game 对象并赋给 window.currentGame，触发游戏初始化流程
document.addEventListener('DOMContentLoaded', () => {
    window.currentGame = new Game();
});

// 在文件末尾添加自动启动代码
console.log('[GameFix] 加载游戏修复补丁...');

// 确保只在main窗口中运行，避免在iframe中重复初始化
if (window === window.top || window.location.pathname.includes('/new_game')) {
    console.log('[GameFix] 检测到新游戏页面，准备游戏修复...');
    
    // 修复点击处理器
    const originalHandleClick = Game.prototype.handleClick;
    Game.prototype.handleClick = function(e) {
        console.log('[GameFix] 点击事件处理开始:', e.target);
        
        try {
            // 如果对话框中没有可见文本，强制显示当前对话
            if (this.elements.dialogText && this.elements.dialogText.textContent.trim() === '') {
                console.log('[GameFix] 强制显示对话内容');
                this.showCurrentDialog();
                return;
            }
            
            return originalHandleClick.call(this, e);
        } catch (err) {
            console.error('[GameFix] 点击处理出错:', err);
            // 尝试恢复
            this.showCurrentDialog();
        }
    };
    
    // 确保forceEnableClickHandler方法被增强
    const originalForceEnable = Game.prototype.forceEnableClickHandler;
    Game.prototype.forceEnableClickHandler = function() {
        console.log('[GameFix] 增强型强制启用点击处理');
        
        // 先调用原方法
        if (originalForceEnable) {
            originalForceEnable.call(this);
        }
        
        // 确保boundHandleClick已定义
        if (!this.boundHandleClick) {
            this.boundHandleClick = this.handleClick.bind(this);
        }
        
        // 移除现有监听器并重新添加
        document.removeEventListener('click', this.boundHandleClick);
        setTimeout(() => {
            document.addEventListener('click', this.boundHandleClick);
            console.log('[GameFix] 点击处理器已重置');
        }, 100);
    };
    
    console.log('[GameFix] 游戏修复补丁加载完成，等待游戏实例化...');
}

// 在游戏开始时检查静态资源路径
document.addEventListener('DOMContentLoaded', function() {
    // 定义需要监听的资源类型
    const resourceTypes = {
        'image': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
        'audio': ['.mp3', '.wav', '.ogg'],
        'other': ['.json', '.csv']
    };
    
    // 重写资源加载函数
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // 修复静态资源URL
        if (typeof url === 'string') {
            // 将/static/替换为/game-static/
            if (url.includes('/static/')) {
                url = url.replace('/static/', '/game-static/');
                console.log('[资源修复] 修复资源URL:', url);
            }
        }
        return originalFetch.call(this, url, options);
    };
    
    // 监听所有图片错误
    document.addEventListener('error', function(e) {
        const target = e.target;
        if (target.tagName === 'IMG') {
            console.warn('[资源修复] 图片加载失败:', target.src);
            
            // 尝试修复图片路径
            if (target.src.includes('/static/')) {
                target.src = target.src.replace('/static/', '/game-static/');
                console.log('[资源修复] 尝试修复图片路径:', target.src);
            }
        }
    }, true);
});