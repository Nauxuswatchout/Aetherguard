/**
 * 常规事件专用处理器
 * 与周末事件完全分离，处理常规事件（morning/home/phone）的逻辑
 */

class RegularEventHandler {
    constructor(gameInstance) {
        // 保存对游戏主实例的引用
        this.game = gameInstance;
        
        // 状态标志
        this.isProcessingChoice = false; // 正在处理选择
        this.secondEventLoaded = false; // 是否已加载第二个事件
        this.currentEventType = null; // 当前事件类型
        this.specialDays = [7, 14]; // 特殊天数，这些天只有一个事件
        this.choicesVisibilityTimer = null; // 选项可见性检查计时器
        
        // 事件监听器
        this.boundHandleClick = this.handleClick.bind(this);
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化方法
     */
    init() {
        console.log('[常规事件] 初始化常规事件处理器');
        
        // 保存对话框的原始位置信息
        this.saveDialogBoxOriginalPosition();
        
        // 设置定期检查对话框位置的计时器
        setInterval(() => this.fixDialogBoxPosition(), 1000);
    }
    
    /**
     * 保存对话框的原始位置信息，用于后续恢复
     */
    saveDialogBoxOriginalPosition() {
        const dialogBox = document.querySelector('.dialog-box');
        if (!dialogBox) return;
        
        // 获取对话框的原始样式
        const computedStyle = window.getComputedStyle(dialogBox);
        
        // 保存原始位置和样式相关属性
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
        
        // 测量并保存初始高度，便于后续比较
        this.dialogBoxOriginalHeight = dialogBox.offsetHeight;
        
        console.log('[常规事件] 已保存对话框原始位置:', this.dialogBoxOriginalPosition);
    }
    
    /**
     * 修复对话框位置，恢复到原始状态
     */
    fixDialogBoxPosition() {
        if (!this.dialogBoxOriginalPosition) {
            this.saveDialogBoxOriginalPosition();
            return;
        }
        
        const dialogBox = document.querySelector('.dialog-box');
        if (!dialogBox) return;
        
        // 获取当前样式
        const currentStyle = window.getComputedStyle(dialogBox);
        
        // 检查位置是否发生变化
        const isPositionChanged = 
            this.checkStyleChanged(currentStyle.top, this.dialogBoxOriginalPosition.top) ||
            this.checkStyleChanged(currentStyle.bottom, this.dialogBoxOriginalPosition.bottom) ||
            this.checkStyleChanged(currentStyle.transform, this.dialogBoxOriginalPosition.transform);
        
        // 如果显示选项时，跳过位置修复，让对话框保持扩展状态
        if (this.game.currentEvent && this.game.currentEvent.choices && 
            this.game.currentEvent.choices.length > 0 && 
            this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1) {
            // 仅确保z-index正确
            dialogBox.style.zIndex = '999';
            return;
        }
        
        if (isPositionChanged) {
            console.log('[常规事件] 检测到对话框位置异常，正在恢复...');
            
            // 恢复原始位置属性
            Object.keys(this.dialogBoxOriginalPosition).forEach(key => {
                dialogBox.style[key] = this.dialogBoxOriginalPosition[key];
            });
            
            // 确保z-index保持较高值以显示在上层
            dialogBox.style.zIndex = '999';
            
            // 检查并修复游戏屏幕容器的位置
            const gameScreen = document.querySelector('.game-screen');
            if (gameScreen) {
                gameScreen.style.transform = 'none';
                
                // 移除任何可能导致位置异常的内联样式
                gameScreen.style.position = '';
                gameScreen.style.top = '';
                gameScreen.style.bottom = '';
            }
            
            console.log('[常规事件] 对话框位置已恢复');
        }
    }
    
    /**
     * 检查样式属性是否发生变化
     * @param {string} current 当前样式值
     * @param {string} original 原始样式值
     * @returns {boolean} 是否发生变化
     */
    checkStyleChanged(current, original) {
        // 处理transform属性的特殊情况
        if (current.includes('matrix') || original.includes('matrix')) {
            return current !== original;
        }
        
        // 处理px单位的值
        if (current.includes('px') && original.includes('px')) {
            const currentVal = parseFloat(current);
            const originalVal = parseFloat(original);
            return Math.abs(currentVal - originalVal) > 5; // 允许5px的误差
        }
        
        // 其他情况直接比较
        return current !== original && current !== 'auto' && original !== 'auto';
    }
    
    /**
     * 调试日志
     */
    debug(message) {
        if (this.game.debugMode) {
            const details = ` (事件类型:${this.currentEventType}, 对白索引:${this.game.currentDialogIndex}, 总对白:${this.game.currentEvent?.dialogues?.length || 0})`;
            console.log(`[REGULAR] ${message}${details}`);
        }
    }
    
    /**
     * 加载早晨事件
     */
    async loadMorningEvent() {
        this.debug('加载早晨事件');
        this.currentEventType = 'morning';
        this.secondEventLoaded = false;
        
        try {
            const response = await fetch('/get_event/morning');
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            this.game.currentEvent = await response.json();
            
            // 确保事件有类型属性
            if (this.game.currentEvent && !this.game.currentEvent.error) {
                this.game.currentEvent.type = 'morning';
                this.game.currentDialogIndex = 0;
                this.game.hasEventEnded = false;
                this.game.isEventEnding = false;
                this.debug('成功加载早晨事件:' + this.game.currentEvent.id);
                
                // 重新绑定点击事件，使用常规事件专用的处理器
                document.removeEventListener('click', this.game.boundHandleClick);
                document.removeEventListener('click', this.boundHandleClick);
                
                // 使用setTimeout确保移除操作完成后再添加
                setTimeout(() => {
                    document.addEventListener('click', this.boundHandleClick);
                    this.debug('绑定常规事件专用点击监听器');
                    
                    // 显示事件对话
                    this.showCurrentDialog();
                }, 50);
            } else {
                console.error('无可用的早晨事件', this.game.currentEvent);
                this.game.elements.dialogText.textContent = '今天没有特别的事情发生...';
                this.game.elements.speakerName.textContent = '旁白';
                this.game.showContinueButton('继续', () => this.game.startNewDay());
            }
        } catch (error) {
            console.error('加载早晨事件失败:', error);
            this.game.elements.dialogText.textContent = '加载事件时出现错误...';
            this.game.elements.speakerName.textContent = '错误';
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
                    this.game.currentEvent = phoneEvent;
                    this.game.currentDialogIndex = 0;
                    this.game.hasEventEnded = false;
                    this.game.isEventEnding = false;
                    this.currentEventType = 'phone';
                    this.secondEventLoaded = true;
                    
                    // 重新绑定点击监听
                    document.removeEventListener('click', this.boundHandleClick);
                    document.addEventListener('click', this.boundHandleClick);
                    
                    // 显示事件对话
                    this.showCurrentDialog();
                    return true;
                }
            }
            
            // 如果手机事件加载失败，尝试加载家庭事件
            this.debug('没有可用的手机事件，尝试加载家庭事件');
            return await this.loadSpecificEvent('home');
        } catch (error) {
            console.error('加载第二个事件失败:', error);
            this.game.startNewDay();
            return false;
        }
    }
    
    /**
     * 加载指定类型事件
     */
    async loadSpecificEvent(type) {
        this.debug(`加载事件类型: ${type}`);
        
        try {
            const response = await fetch(`/get_event/${type}?t=${Date.now()}`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const event = await response.json();
            
            if (event.error) {
                this.debug(`事件返回错误: ${event.error}`);
                return false;
            }
            
            // 初始化事件
            event.type = type;
            this.game.currentEvent = event;
            this.game.currentDialogIndex = 0;
            this.game.hasEventEnded = false;
            this.game.isEventEnding = false;
            this.currentEventType = type;
            this.secondEventLoaded = true;
            
            // 重新绑定点击监听
            document.removeEventListener('click', this.boundHandleClick);
            document.addEventListener('click', this.boundHandleClick);
            
            // 显示事件对话
            this.showCurrentDialog();
            
            return true;
        } catch (err) {
            console.error('加载指定事件失败:', err);
            this.game.startNewDay();
            return false;
        }
    }
    
    /**
     * 强制清除旧选项并显示全屏弹窗选项
     */
    forceClearAndShowChoices(choices) {
        // 清理可能残留的旧覆盖层
        const oldOverlay = document.querySelector('.choice-overlay');
        if (oldOverlay) {
            oldOverlay.remove();
        }
        this.game.elements.choices = null;

        // 创建全屏遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'choice-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0)', transition: 'background-color 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '10000'
        });
        document.body.appendChild(overlay);
        // 遮罩层渐变
        setTimeout(() => overlay.style.backgroundColor = 'rgba(0,0,0,0.5)', 10);

        // 创建弹窗容器
        const popup = document.createElement('div');
        popup.className = 'choice-popup';
        Object.assign(popup.style, {
            backgroundColor: '#111', color: '#fff', padding: '20px', borderRadius: '10px',
            maxWidth: '90%', width: '400px', boxSizing: 'border-box',
            transform: 'translateY(100vh)', transition: 'transform 0.3s ease',
            display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center'
        });
        overlay.appendChild(popup);
        // 弹窗上升动画
        setTimeout(() => popup.style.transform = 'translateY(0)', 10);

        // 创建选项按钮
        choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'popup-choice-button';
            btn.textContent = choice.text;
            Object.assign(btn.style, {
                fontSize: '1.2em', padding: '15px', backgroundColor: '#3498db',
                color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer',
                transition: 'background-color 0.2s'
            });
            btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2980b9');
            btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#3498db');

            btn.addEventListener('click', () => {
                if (this.isProcessingChoice) return;
                this.isProcessingChoice = true;
                // 弹窗滑出动画
                popup.style.transform = 'translateY(-100vh)';
                overlay.style.backgroundColor = 'rgba(0,0,0,0)';
                // 延迟移除并处理选择
                setTimeout(() => {
                    overlay.remove();
                    this.handleChoice(index);
                }, 300);
            }, { once: true });

            popup.appendChild(btn);
        });

        return overlay;
    }
    
    /**
     * 确保元素可见但不改变位置
     * @param {HTMLElement} element 要确保可见的元素
     */
    ensureElementVisible(element, shouldScroll = false) {
        if (!element) return;
        
        // 只修改z-index属性，不改变位置相关属性
        element.style.zIndex = '1000';
        
        // 确保display属性正确
        if (window.getComputedStyle(element).display === 'none') {
            element.style.display = element.tagName.toLowerCase() === 'div' ? 'block' : 'flex';
        }
    }
    
    /**
     * 显示当前对话
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
        
        // 先清除选项区域
        this.game.clearAllChoices();
        
        // 处理最后一句对话的选项或继续按钮
        if (isLastDialog) {
            // 检查是否有选项
            if (this.game.currentEvent.choices && this.game.currentEvent.choices.length > 0) {
                // 使用较长的延迟，确保打字效果完成
                setTimeout(() => {
                    this.debug('强制显示选项');
                    // 使用强制方法确保选项显示
                    this.forceClearAndShowChoices(this.game.currentEvent.choices);
                    
                    // 设置一个持续检查选项可见性的计时器
                    this.startChoicesVisibilityCheck();
                }, 500); // 使用更长的延迟确保文本显示完成
            } else {
                // 展示继续按钮，结束当前事件
                setTimeout(() => {
                    this.game.showContinueButton('继续', () => {
                        this.debug('点击继续按钮，结束事件');
                        this.endEvent();
                    });
                }, 100);
            }
        }
        
        // 确保对话框位置正确
        this.fixDialogBoxPosition();
    }
    
    /**
     * 开始持续检查选项可见性
     */
    startChoicesVisibilityCheck() {
        // 清除可能存在的旧计时器
        if (this.choicesVisibilityTimer) {
            clearInterval(this.choicesVisibilityTimer);
            this.choicesVisibilityTimer = null;
        }
        
        // 创建新的检查计时器
        this.choicesVisibilityTimer = setInterval(() => {
            // 检查选项容器
            const choicesContainer = document.querySelector('.choices');
            if (!choicesContainer) {
                clearInterval(this.choicesVisibilityTimer);
                this.choicesVisibilityTimer = null;
                return;
            }
            
            // 获取对话框元素
            const dialogBox = document.querySelector('.dialog-box');
            if (!dialogBox) return;
            
            // 确保对话框的z-index设置正确
            dialogBox.style.zIndex = '999';
            
            // 确保对话框的flexDirection设置正确，以便选项显示在上方
            if (dialogBox.style.flexDirection !== 'column-reverse') {
                dialogBox.style.flexDirection = 'column-reverse';
            }
            
            // 确保对话框的最大高度设置正确
            if (dialogBox.style.maxHeight !== '80vh') {
                dialogBox.style.maxHeight = '80vh';
            }
            
            // 确保对话框的overflow设置正确，允许滚动
            if (dialogBox.style.overflowY !== 'auto') {
                dialogBox.style.overflowY = 'auto';
            }
            
            // 确保选项容器可见
            setTimeout(() => {
                dialogBox.scrollTop = 0;
            }, 10);
            
        }, 500); // 每半秒检查一次
        
        // 5秒后自动停止检查
        setTimeout(() => {
            if (this.choicesVisibilityTimer) {
                clearInterval(this.choicesVisibilityTimer);
                this.choicesVisibilityTimer = null;
            }
        }, 5000);
    }
    
    /**
     * 处理点击事件
     */
    handleClick(e) {
        // 如果事件已结束，不处理点击
        if (this.game.hasEventEnded || this.game.isEventEnding) {
            this.debug('事件已结束或正在结束，忽略点击');
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
        
        // 检查当前对话是否是最后一个且有选项
        const isLastDialog = (this.game.currentDialogIndex === this.game.currentEvent.dialogues.length - 1);
        const hasChoices = this.game.currentEvent.choices && this.game.currentEvent.choices.length > 0;
        
        // 如果是最后一个对话且有选项，且选项已经显示出来了，忽略点击
        if (isLastDialog && hasChoices && document.querySelector('.choices') && 
            document.querySelector('.choices').children.length > 0) {
            this.debug('已显示选项，忽略对话框点击');
            return;
        }
        
        // 如果是最后一个对话且有选项，不进入下一句，而是直接显示选项
        if (isLastDialog && hasChoices) {
            this.debug('当前是最后一个对话且有选项，强制显示选项');
            // 使用强制方法确保选项显示
            this.forceClearAndShowChoices(this.game.currentEvent.choices);
            return;
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
            
            // 检查是否有选项
            if (hasChoices) {
                // 强制显示选项
                this.debug('对话结束后强制显示选项');
                this.forceClearAndShowChoices(this.game.currentEvent.choices);
            } else {
                // 延迟显示继续按钮
                setTimeout(() => {
                    this.game.showContinueButton('继续', () => {
                        this.debug('点击继续按钮，结束事件');
                        this.endEvent();
                    });
                }, 100);
            }
        }
    }
    
    /**
     * 处理选择事件
     */
    async handleChoice(choiceIndex) {
        try {
            // 检查选择是否有效
            if (!this.game.currentEvent || !this.game.currentEvent.choices || choiceIndex >= this.game.currentEvent.choices.length) {
                console.error('无效的选择索引或选项不存在');
                this.isProcessingChoice = false;
                return;
            }
            
            const choice = this.game.currentEvent.choices[choiceIndex];
            this.debug(`选择了选项: ${choiceIndex}, 内容: ${choice.text}`);
            
            // 更新游戏状态
            if (choice.outcome && choice.outcome.stats) {
                this.debug(`更新游戏状态: ${JSON.stringify(choice.outcome.stats)}`);
                Object.keys(choice.outcome.stats).forEach(key => {
                    // 将stats中的键映射到gameState中的键
                    const gameStateKey = this.game.mapStatKey(key);
                    if (gameStateKey) {
                        this.game.gameState[gameStateKey] += choice.outcome.stats[key];
                        this.debug(`更新 ${gameStateKey}: ${this.game.gameState[gameStateKey]}`);
                    }
                });
                this.game.updateStatusBar();
                await this.game.saveGameState();
            }

            // 清除之前的所有选项和事件监听器
            this.game.clearAllChoices();
            document.removeEventListener('click', this.boundHandleClick);
            
            // 处理选择后的对话
            if (choice.outcome && choice.outcome.dialogues && choice.outcome.dialogues.length > 0) {
                this.debug(`显示选择后的对话，数量: ${choice.outcome.dialogues.length}`);
                
                // 更新当前事件的对话为选择后的对话
                this.game.currentEvent.dialogues = choice.outcome.dialogues;
                this.game.currentDialogIndex = 0;
                
                // 重置选项处理标记
                this.isProcessingChoice = false;
                
                // 创建一个专用的事件处理函数来处理选择后的对话点击
                const handleOutcomeDialogs = (e) => {
                    // 忽略来自按钮的点击
                    if (e.target.tagName === 'BUTTON') {
                        return;
                    }
                    
                    // 处理打字机效果加速
                    if (this.game.isTyping) {
                        this.debug('加速显示文本');
                        this.game.isTyping = false;
                        if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                            this.game.elements.dialogText.textContent = this.game.currentEvent.dialogues[this.game.currentDialogIndex].text;
                        }
                        return;
                    }
                    
                    // 进入下一句对话
                    this.debug('点击继续对话');
                    this.game.currentDialogIndex++;
                    
                    // 检查是否还有更多对话
                    if (this.game.currentDialogIndex < this.game.currentEvent.dialogues.length) {
                        // 显示下一句
                        const dialog = this.game.currentEvent.dialogues[this.game.currentDialogIndex];
                        
                        // 更新角色
                        this.game.updateCharacters(dialog);
                        
                        // 显示说话人名字
                        const speakerName = dialog.character.split('_')[0];
                        this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                        
                        // 打字机效果显示对话
                        this.game.typeText(dialog.text);
                    } else {
                        // 对话完成，结束事件
                        this.debug('选择后的对话结束');
                        
                        // 移除事件监听器
                        document.removeEventListener('click', handleOutcomeDialogs);
                        
                        // 延迟显示继续按钮
                        this.game.clearAllChoices();
                        setTimeout(() => {
                            this.game.showContinueButton('继续', () => {
                                this.debug('点击继续按钮，结束事件');
                                this.endEvent();
                            });
                        }, 100);
                    }
                };
                
                // 添加新的点击事件监听器
                document.addEventListener('click', handleOutcomeDialogs);
                
                // 显示第一句选择后的对话
                const dialog = this.game.currentEvent.dialogues[0];
                
                // 更新角色
                this.game.updateCharacters(dialog);
                
                // 显示说话人名字
                const speakerName = dialog.character.split('_')[0];
                this.game.elements.speakerName.textContent = this.game.formatSpeakerName(speakerName);
                
                // 打字机效果显示对话
                this.game.typeText(dialog.text);
            } else {
                // 没有后续对话，直接结束事件
                this.debug('选择没有后续对话，直接结束事件');
                this.isProcessingChoice = false; // 确保重置标记
                this.endEvent();
            }
        } catch (error) {
            console.error('处理选择时出错:', error);
            this.isProcessingChoice = false; // 确保错误时也重置标记
        }
    }
    
    /**
     * 结束当前事件
     */
    async endEvent() {
        this.debug('结束事件');
        
        // 设置事件结束标志
        this.game.hasEventEnded = true;
        this.game.isEventEnding = true;
        
        // 恢复对话框原始样式
        const dialogBox = document.querySelector('.dialog-box');
        if (dialogBox) {
            // 恢复对话框原始样式
            dialogBox.style.flexDirection = 'column';
            dialogBox.style.height = 'auto';
            dialogBox.style.maxHeight = 'none';
            dialogBox.style.overflowY = 'visible';
            
            // 如果有原始位置信息，恢复原始位置
            if (this.dialogBoxOriginalPosition) {
                Object.keys(this.dialogBoxOriginalPosition).forEach(key => {
                    dialogBox.style[key] = this.dialogBoxOriginalPosition[key];
                });
            }
        }
        
        // 清除所有选项与可能的继续按钮
        this.game.clearAllChoices();
        const existing = document.getElementById('continue-overlay');
        if (existing) existing.remove();
        
        try {
            // 将事件标记为已完成并保存状态
            if (this.game.currentEvent && this.game.currentEvent.id) {
                if (!this.game.gameState.completed_events.includes(this.game.currentEvent.id)) {
                    this.game.gameState.completed_events.push(this.game.currentEvent.id);
                    this.debug(`已完成事件列表: ${this.game.gameState.completed_events.join(', ')}`);
                }
                await this.game.saveGameState();
            }
            
            // 如果事件有 summary，展示事件总结
            if (this.game.currentEvent && this.game.currentEvent.summary && this.game.currentEvent.summary.trim() !== '') {
                this.debug(`显示事件总结: ${this.game.currentEvent.summary}`);
                
                // 半透明角色提示
                this.game.elements.characterLeft.style.opacity = '0.5';
                this.game.elements.characterRight.style.opacity = '0.5';
                
                // 确保弹出总结面板前已清除所有可能的遮罩层
                const summaryOverlay = document.getElementById('summary-panel');
                if (summaryOverlay) summaryOverlay.remove();
                
                // 显示事件总结
                this.game.showEventSummaryUI(this.game.currentEvent.summary);
                return;
            }
            
            // 根据当前事件类型和游戏天数决定下一步操作
            if (this.currentEventType === 'morning') {
                // 判断当前是否是特殊天数（只有一个事件的天数）
                const isSpecialDay = this.specialDays.includes(this.game.gameState.day);
                
                if (isSpecialDay) {
                    this.debug(`特殊天数 ${this.game.gameState.day}，只有一个事件，直接开始新的一天`);
                    setTimeout(() => this.game.startNewDay(), 200);
                } else {
                    // 非特殊天数，加载第二个事件
                    this.debug('早晨事件结束，加载第二个事件');
                    setTimeout(() => this.loadSecondEvent(), 200);
                }
            } else {
                // 非晨间事件结束，开始新的一天
                this.debug('非晨间事件结束，开始新的一天');
                setTimeout(() => this.game.startNewDay(), 200);
            }
        } catch (error) {
            console.error('结束事件出错:', error);
            // 出错时也直接进入新的一天
            setTimeout(() => this.game.startNewDay(), 200);
        }
    }
    
    /**
     * 清理资源方法，防止内存泄漏
     */
    cleanup() {
        // 清除事件监听器
        document.removeEventListener('click', this.boundHandleClick);
        
        // 清除计时器
        if (this.choicesVisibilityTimer) {
            clearInterval(this.choicesVisibilityTimer);
            this.choicesVisibilityTimer = null;
        }
        
        console.log('[常规事件] 已清理资源');
    }
}

// 当页面加载完成后，增强Game类
document.addEventListener('DOMContentLoaded', function() {
    // 等待游戏实例初始化
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[常规事件] 游戏实例已找到，准备注入常规事件处理器');
            
            // 扩展Game类，增加常规事件处理器
            enhanceGameWithRegularHandler();
        }
    }, 100);
});

/**
 * 增强Game类，注入常规事件处理功能
 */
function enhanceGameWithRegularHandler() {
    // 确保game实例存在且已正确初始化
    if (!window.currentGame) {
        console.error('[常规事件] 游戏实例未初始化，无法注入处理器');
        // 延迟重试
        setTimeout(enhanceGameWithRegularHandler, 500);
        return;
    }
    
    // 确保关键方法存在
    if (!window.currentGame.clearAllChoices || !window.currentGame.createChoicesContainer) {
        console.error('[常规事件] 游戏实例缺少关键方法，等待初始化完成');
        // 延迟重试
        setTimeout(enhanceGameWithRegularHandler, 500);
        return;
    }
    
    // 如果已经存在处理器，先清理资源
    if (window.currentGame.regularHandler) {
        console.log('[常规事件] 清理旧的处理器资源');
        try {
            window.currentGame.regularHandler.cleanup();
        } catch(e) {
            console.error('[常规事件] 清理旧处理器出错:', e);
        }
    }
    
    // 创建常规事件处理器
    window.currentGame.regularHandler = new RegularEventHandler(window.currentGame);
    
    // 保存原始方法
    const originalLoadMorningEvent = window.currentGame.loadMorningEvent;
    const originalLoadNextEvent = window.currentGame.loadNextEvent;
    const originalLoadSecondEvent = window.currentGame.loadSecondEvent;
    
    // 替换加载早晨事件的方法
    window.currentGame.loadMorningEvent = async function() {
        console.log('[常规事件] 使用专用处理器加载早晨事件');
        try {
            return await window.currentGame.regularHandler.loadMorningEvent();
        } catch (error) {
            console.error('[常规事件] 加载早晨事件失败，使用原始方法:', error);
            // 出错时尝试使用原始方法
            if (originalLoadMorningEvent) {
                return await originalLoadMorningEvent.call(this);
            }
        }
    };
    
    // 修改loadNextEvent方法，确保正确处理第二个事件
    window.currentGame.loadNextEvent = async function() {
        console.log('[常规事件] 使用专用处理器加载下一个事件');
        
        try {
            // 清除所有选项
            this.clearAllChoices();
            
            // 如果当前事件不是早晨事件，直接开始新的一天
            if (!this.currentEvent || this.currentEvent.type !== 'morning') {
                console.log('[常规事件] 非晨间事件，直接开始新一天');
                setTimeout(() => this.startNewDay(), 200);
                return;
            }
            
            // 使用常规事件处理器加载第二个事件
            return await window.currentGame.regularHandler.loadSecondEvent();
        } catch (error) {
            console.error('[常规事件] 加载下一个事件失败，使用原始方法:', error);
            // 出错时尝试使用原始方法
            if (originalLoadNextEvent) {
                return await originalLoadNextEvent.call(this);
            }
        }
    };
    
    // 修改loadSecondEvent方法
    window.currentGame.loadSecondEvent = async function() {
        console.log('[常规事件] 使用专用处理器加载第二个事件');
        try {
            return await window.currentGame.regularHandler.loadSecondEvent();
        } catch (error) {
            console.error('[常规事件] 加载第二个事件失败，使用原始方法:', error);
            // 出错时尝试使用原始方法
            if (originalLoadSecondEvent) {
                return await originalLoadSecondEvent.call(this);
            }
        }
    };
    
    // 添加全局错误处理，确保选项显示正常
    window.addEventListener('error', function(event) {
        // 检查是否是与常规事件相关的错误
        if (event.error && event.error.message && (
            event.error.message.includes('choices') || 
            event.error.message.includes('选项') ||
            event.error.message.includes('dialog')
        )) {
            console.error('[常规事件] 捕获到与选项或对话相关的错误:', event.error);
            
            // 尝试修复选项显示
            try {
                if (window.currentGame && window.currentGame.regularHandler && 
                    window.currentGame.currentEvent && 
                    window.currentGame.currentEvent.choices && 
                    window.currentGame.currentEvent.choices.length > 0) {
                    
                    console.log('[常规事件] 尝试修复选项显示');
                    window.currentGame.regularHandler.forceClearAndShowChoices(
                        window.currentGame.currentEvent.choices
                    );
                }
            } catch (e) {
                console.error('[常规事件] 修复选项显示失败:', e);
            }
        }
    });
    
    // 添加页面卸载时的清理
    window.addEventListener('beforeunload', function() {
        if (window.currentGame && window.currentGame.regularHandler) {
            try {
                window.currentGame.regularHandler.cleanup();
            } catch(e) {
                console.error('[常规事件] 页面卸载时清理资源出错:', e);
            }
        }
    });
    
    console.log('[常规事件] 常规事件处理器注入完成');
} 