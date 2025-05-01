/**
 * 周末事件修复脚本
 * 用于解决第六天周末事件可能卡住的问题
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[修复] 周末事件修复脚本加载中...');
    
    // 等待游戏实例初始化
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[修复] 游戏实例已找到，开始增强功能');
            
            // 存储原始方法的引用
            const originalHandleClick = window.currentGame.handleClick;
            const originalShowCurrentDialog = window.currentGame.showCurrentDialog;
            
            // 增强showCurrentDialog方法，确保分支对话能正确显示
            window.currentGame.showCurrentDialog = function() {
                try {
                    // 检查是否是周末事件分支对话
                    const isWeekendBranchDialog = this.currentEvent && 
                        this.currentEvent.type === 'weekend' && 
                        this.hasCompletedQuiz && 
                        this.isProcessingBranchDialogues;
                    
                    if (isWeekendBranchDialog) {
                        console.log(`[修复] 显示周末分支对话: ${this.currentDialogIndex + 1}/${this.currentEvent.dialogues.length}`);
                        
                        // 确保绑定了点击事件监听器
                        if (!this.boundHandleClick) {
                            this.boundHandleClick = this.handleClick.bind(this);
                        }
                        document.removeEventListener('click', this.boundHandleClick);
                        document.addEventListener('click', this.boundHandleClick);
                    }
                } catch (err) {
                    console.error('[修复] showCurrentDialog增强处理出错:', err);
                }
                
                // 调用原始方法
                return originalShowCurrentDialog.apply(this, arguments);
            };
            
            // 增强handleClick方法，让周末事件能够响应点击
            window.currentGame.handleClick = function(e) {
                try {
                    // 仅处理周末事件，不干扰常规事件
                    if (this.currentEvent && this.currentEvent.type === 'weekend') {
                        // 检查是否是分支对话
                        const isWeekendBranchDialog = this.hasCompletedQuiz && this.isProcessingBranchDialogues;
                        
                        if (isWeekendBranchDialog) {
                            console.log('[修复] 处理周末事件分支对话点击');
                            
                            // 如果事件已结束或正在结束，不处理点击
                            if (this.hasEventEnded || this.isEventEnding) {
                                console.log('[修复] 事件已结束或正在结束，忽略点击');
                                return;
                            }
                            
                            // 忽略来自按钮和遮罩层的点击
                            if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
                                console.log('[修复] 忽略按钮或遮罩层点击');
                                return;
                            }
                            
                            // 如果正在打字，点击会直接显示完整文本
                            if (this.isTyping) {
                                console.log('[修复] 加速显示文本');
                                // 取消当前打字会话，防止旧的超时回调干扰
                                this.currentTypingId = null;
                                this.isTyping = false;
                                if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                    // 直接显示完整文本
                                    this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                                }
                                return;
                            }
                            
                            console.log('[修复] 周末事件分支对话点击进入下一对话', this.currentDialogIndex);
                            
                            // 进入下一句对话
                            this.currentDialogIndex++;
                            
                            // 检查是否还有更多对话
                            if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                // 还有更多对话，显示下一句
                                this.showCurrentDialog();
                            } else {
                                // 分支对话全部完成，准备结束事件
                                console.log('[修复] 周末事件分支对话完成，准备结束事件');
                                
                                // 重置分支对话处理标志
                                this.isProcessingBranchDialogues = false;
                                
                                // 设置已处理分支标记，防止再次进入分支选择
                                this.hasProcessedBranches = true;
                                
                                // 显示继续按钮，结束事件
                                this.showContinueButton('继续', () => {
                                    this.endEvent();
                                });
                            }
                            return;
                        } else {
                            // 普通周末事件处理
                            console.log('[修复] 处理普通周末事件点击');
                            
                            // 如果事件已结束或正在结束，不处理点击
                            if (this.hasEventEnded || this.isEventEnding) {
                                console.log('[修复] 事件已结束或正在结束，忽略点击');
                                return;
                            }
                            
                            // 如果正在答题阶段，不处理点击事件
                            if (this.hasStartedQuiz) {
                                console.log('[修复] 答题阶段，忽略点击事件');
                                return;
                            }
                            
                            // 忽略来自按钮和遮罩层的点击
                            if (e.target.tagName === 'BUTTON' || e.target.id === 'continue-overlay' || e.target.closest('#continue-overlay')) {
                                console.log('[修复] 忽略按钮或遮罩层点击');
                                return;
                            }
                            
                            // 如果正在打字，点击会直接显示完整文本
                            if (this.isTyping) {
                                console.log('[修复] 加速显示文本');
                                // 取消当前打字会话，防止旧的超时回调干扰
                                this.currentTypingId = null;
                                this.isTyping = false;
                                if (this.currentEvent && this.currentEvent.dialogues && this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                    // 直接显示完整文本
                                    this.elements.dialogText.textContent = this.currentEvent.dialogues[this.currentDialogIndex].text;
                                }
                                return;
                            }
                            
                            console.log('[修复] 周末事件点击进入下一对话', this.currentDialogIndex);
                            
                            // 进入下一句对话
                            this.currentDialogIndex++;
                            
                            // 检查是否还有更多对话
                            if (this.currentDialogIndex < this.currentEvent.dialogues.length) {
                                // 还有更多对话，显示下一句
                                this.showCurrentDialog();
                            } else {
                                // 对话全部完成，处理特殊逻辑
                                console.log('[修复] 周末事件对话完成，准备进入答题环节');
                                
                                if (this.currentEvent.quiz && !this.hasCompletedQuiz) {
                                    // 显示继续按钮，进入答题环节
                                    this.showContinueButton('开始答题', () => {
                                        this.showQuizQuestion();
                                    });
                                } else {
                                    // 没有答题，显示继续按钮结束事件
                                    this.showContinueButton('继续', () => {
                                        this.endEvent();
                                    });
                                }
                            }
                            return;
                        }
                    }
                } catch (err) {
                    console.error('[修复] handleClick增强处理出错:', err);
                }
                
                // 对于非周末事件，调用原始方法
                return originalHandleClick.apply(this, arguments);
            };
            
            console.log('[修复] 周末事件修复脚本已完成增强');
        }
    }, 100);
});

// 添加一个额外的全局点击处理器，仅处理周末分支对话点击
document.addEventListener('DOMContentLoaded', function() {
    // 等待一段时间确保游戏已完全加载
    setTimeout(() => {
        // 获取游戏区域
        const gameScreen = document.querySelector('.game-screen');
        
        if (gameScreen) {
            // 添加点击处理
            gameScreen.addEventListener('click', function(event) {
                // 确保游戏实例存在
                if (!window.currentGame) return;
                
                // 检查是否是周末事件的分支对话
                const isInBranchDialog = window.currentGame.currentEvent && 
                                        window.currentGame.currentEvent.type === 'weekend' && 
                                        window.currentGame.hasCompletedQuiz && 
                                        window.currentGame.isProcessingBranchDialogues;
                
                if (isInBranchDialog) {
                    // 忽略按钮点击
                    if (event.target.tagName === 'BUTTON' || 
                        event.target.id === 'continue-overlay' || 
                        event.target.closest('#continue-overlay')) {
                        return;
                    }
                    
                    console.log('[直接点击] 检测到分支对话点击');
                    
                    // 如果正在打字，直接显示完整文本
                    if (window.currentGame.isTyping) {
                        console.log('[直接点击] 加速文字显示');
                        window.currentGame.isTyping = false;
                        window.currentGame.currentTypingId = null;
                        
                        // 显示完整文本
                        if (window.currentGame.currentEvent.dialogues && 
                            window.currentGame.currentDialogIndex < window.currentGame.currentEvent.dialogues.length) {
                            window.currentGame.elements.dialogText.textContent = 
                                window.currentGame.currentEvent.dialogues[window.currentGame.currentDialogIndex].text;
                        }
                        return;
                    }
                    
                    // 防止事件冒泡和重复处理
                    event.stopPropagation();
                    
                    console.log('[直接点击] 处理分支对话点击');
                    
                    // 进入下一句对话
                    window.currentGame.currentDialogIndex++;
                    
                    // 检查是否还有更多对话
                    if (window.currentGame.currentDialogIndex < window.currentGame.currentEvent.dialogues.length) {
                        // 显示下一句
                        window.currentGame.showCurrentDialog();
                    } else {
                        // 对话结束
                        console.log('[直接点击] 分支对话结束，显示继续按钮');
                        window.currentGame.isProcessingBranchDialogues = false;
                        window.currentGame.hasProcessedBranches = true; // 设置已处理标记
                        window.currentGame.showContinueButton('继续', () => {
                            window.currentGame.endEvent();
                        });
                    }
                }
            });
            
            console.log('[修复] 添加了直接的分支对话点击处理器');
        }
    }, 3000);
}); 