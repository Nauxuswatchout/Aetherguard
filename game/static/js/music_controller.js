/**
 * 游戏音乐控制器脚本
 * 用于确保音乐正常播放和加载
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[音乐控制] 音乐控制器脚本加载中...');
    
    // 预加载音乐文件
    const musicFiles = [
        '/game-static/music/school.mp3',
        '/game-static/music/home.mp3',
        '/game-static/music/live.mp3'
    ];
    
    // 记录上一个事件类型，用于检测事件切换
    let lastEventType = '';
    
    // 检查音乐文件是否存在
    const checkMusicFiles = async () => {
        for (const file of musicFiles) {
            try {
                const response = await fetch(file, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`[音乐控制] 音乐文件存在: ${file}`);
                } else {
                    console.error(`[音乐控制] 音乐文件不存在或无法访问: ${file}`);
                }
            } catch (err) {
                console.error(`[音乐控制] 检查音乐文件时出错: ${file}`, err);
            }
        }
    };
    
    // 当游戏实例创建后，检查并修复音乐播放功能
    const initMusicController = () => {
        // 等待游戏实例创建
        if (window.currentGame) {
            console.log('[音乐控制] 检测到游戏实例，开始初始化音乐控制功能');
            
            // 确保游戏实例有音乐播放方法
            if (!window.currentGame.playBackgroundMusic) {
                console.warn('[音乐控制] 游戏实例缺少音乐播放方法，添加默认实现');
                
                // 添加音乐属性
                window.currentGame.backgroundMusic = null;
                window.currentGame.currentMusicPath = '';
                window.currentGame.musicVolume = 0.5;
                
                // 添加音乐方法
                window.currentGame.playBackgroundMusic = function(musicPath) {
                    console.log(`[音乐控制] 播放背景音乐: ${musicPath}`);
                    
                    // 确保先停止所有正在播放的音频元素
                    if (this.backgroundMusic) {
                        // 记录当前音乐是否是相同的音乐，如果是则不重新加载
                        const isSameMusic = this.currentMusicPath === musicPath;
                        
                        // 无论如何先停止当前音乐
                        this.backgroundMusic.pause();
                        this.backgroundMusic.currentTime = 0;
                        
                        // 如果是相同的音乐且不需要重新加载，则直接播放
                        if (isSameMusic) {
                            console.log(`[音乐控制] 继续播放相同音乐: ${musicPath}`);
                            this.backgroundMusic.play().catch(err => {
                                console.error('[音乐控制] 恢复播放失败:', err);
                            });
                            return;
                        }
                    }
                    
                    // 查找页面上所有音频元素并停止它们
                    document.querySelectorAll('audio').forEach(audio => {
                        try {
                            audio.pause();
                            audio.currentTime = 0;
                        } catch (e) {
                            console.error('[音乐控制] 停止页面音频失败:', e);
                        }
                    });
                    
                    // 创建新的音频元素
                    this.backgroundMusic = new Audio(musicPath);
                    this.backgroundMusic.volume = this.musicVolume;
                    this.backgroundMusic.loop = true;
                    
                    // 记录当前音乐路径
                    this.currentMusicPath = musicPath;
                    
                    // 播放音乐
                    this.backgroundMusic.play().catch(err => {
                        console.error('[音乐控制] 播放音乐失败:', err);
                    });
                };
                
                // 添加停止音乐方法
                window.currentGame.stopBackgroundMusic = function() {
                    console.log('[音乐控制] 停止背景音乐');
                    // 停止当前游戏实例背景音乐
                    if (this.backgroundMusic) {
                        this.backgroundMusic.pause();
                        this.backgroundMusic.currentTime = 0;
                        this.currentMusicPath = '';
                    }
                    
                    // 停止页面上所有音频元素
                    this.stopAllAudio();
                };
                
                // 添加停止所有音频的方法
                window.currentGame.stopAllAudio = function() {
                    console.log('[音乐控制] 停止所有音频');
                    // 停止页面上所有音频元素
                    document.querySelectorAll('audio').forEach(audio => {
                        try {
                            audio.pause();
                            audio.currentTime = 0;
                        } catch (e) {
                            console.error('[音乐控制] 停止页面音频失败:', e);
                        }
                    });
                };
                
                // 添加事件音乐播放方法
                window.currentGame.playEventMusic = function(eventType, isQuizPhase = false) {
                    let musicPath = '';
                    
                    // 如果没有提供事件类型，使用当前事件类型
                    if (!eventType && this.currentEvent && this.currentEvent.type) {
                        eventType = this.currentEvent.type;
                        console.log(`[音乐控制] 使用当前事件类型: ${eventType}`);
                    }
                    
                    // 记录上一次播放的事件类型音乐
                    const lastEventType = this._lastEventMusicType || '';
                    const lastIsQuizPhase = this._lastQuizPhase || false;
                    
                    // 如果事件类型和答题阶段都没有变化，不重新加载音乐
                    if (lastEventType === eventType && lastIsQuizPhase === isQuizPhase && this.backgroundMusic && !this.backgroundMusic.paused) {
                        console.log(`[音乐控制] 事件类型和状态未变化，保持当前音乐`);
                        return;
                    }
                    
                    // 更新记录
                    this._lastEventMusicType = eventType;
                    this._lastQuizPhase = isQuizPhase;
                    
                    // 根据事件类型选择音乐
                    switch (eventType) {
                        case 'morning':
                            musicPath = '/game-static/music/school.mp3';
                            break;
                        case 'home':
                        case 'phone':
                            musicPath = '/game-static/music/home.mp3';
                            break;
                        case 'weekend':
                            // 周末事件答题阶段播放live.mp3，其他阶段播放home.mp3
                            musicPath = isQuizPhase ? '/game-static/music/live.mp3' : '/game-static/music/home.mp3';
                            break;
                        default:
                            // 默认音乐
                            musicPath = '/game-static/music/home.mp3';
                    }
                    
                    console.log(`[音乐控制] 事件类型 ${eventType}${isQuizPhase ? ' (答题阶段)' : ''} 切换音乐: ${musicPath}`);
                    
                    // 播放选定的音乐
                    if (musicPath) {
                        this.playBackgroundMusic(musicPath);
                    }
                };
            }
            
            // 添加音乐自动播放监听器
            document.addEventListener('click', function initAudio() {
                // 如果当前没有播放音乐，根据当前事件类型播放对应音乐
                if (window.currentGame && window.currentGame.currentEvent && 
                    (!window.currentGame.backgroundMusic || window.currentGame.backgroundMusic.paused)) {
                    
                    const eventType = window.currentGame.currentEvent.type;
                    const isQuizPhase = window.currentGame.hasStartedQuiz && 
                                       !window.currentGame.hasCompletedQuiz && 
                                       eventType === 'weekend';
                    
                    window.currentGame.playEventMusic(eventType, isQuizPhase);
                    console.log(`[音乐控制] 自动播放 ${eventType} 事件音乐，答题阶段: ${isQuizPhase}`);
                }
                
                // 移除监听器，避免重复触发
                document.removeEventListener('click', initAudio);
            }, { once: false });
            
            // 添加事件类型监控，监听事件加载完成
            const checkEventTypeChange = () => {
                if (window.currentGame && window.currentGame.currentEvent) {
                    const currentEventType = window.currentGame.currentEvent.type;
                    const isQuizPhase = window.currentGame.hasStartedQuiz && 
                                      !window.currentGame.hasCompletedQuiz && 
                                      currentEventType === 'weekend';
                    
                    // 检查事件类型是否变化
                    if (currentEventType && currentEventType !== lastEventType) {
                        console.log(`[音乐控制] 检测到事件类型变化: ${lastEventType} -> ${currentEventType}`);
                        
                        // 先完全停止所有音频
                        window.currentGame.stopAllAudio();
                        
                        // 短暂延迟后更新音乐，确保前一个音频完全停止
                        setTimeout(() => {
                            // 更新音乐
                            window.currentGame.playEventMusic(currentEventType, isQuizPhase);
                            
                            // 更新上一个事件类型
                            lastEventType = currentEventType;
                        }, 100);
                    }
                    
                    // 特殊检查：如果是周末事件且答题状态变化，也需要切换音乐
                    if (currentEventType === 'weekend' && lastEventType === 'weekend') {
                        if (window.currentGame.hasStartedQuiz && 
                            window.currentGame.backgroundMusic && 
                            !window.currentGame.backgroundMusic.src.includes('live.mp3')) {
                            console.log('[音乐控制] 检测到周末事件进入答题阶段，切换音乐');
                            window.currentGame.playEventMusic('weekend', true);
                        } else if (!window.currentGame.hasStartedQuiz && 
                                  window.currentGame.hasCompletedQuiz && 
                                  window.currentGame.backgroundMusic && 
                                  window.currentGame.backgroundMusic.src.includes('live.mp3')) {
                            console.log('[音乐控制] 检测到周末事件答题完成，切换音乐');
                            window.currentGame.playEventMusic('weekend', false);
                        }
                    }
                }
            };
            
            // 添加主动拦截事件加载完成的函数
            const originalLoadSpecificEvent = window.currentGame.loadSpecificEvent;
            if (originalLoadSpecificEvent) {
                window.currentGame.loadSpecificEvent = async function(type) {
                    console.log(`[音乐控制] 准备加载事件类型 ${type}，先停止当前音乐`);
                    
                    // 先完全停止所有音频
                    this.stopAllAudio();
                    
                    // 调用原始方法
                    await originalLoadSpecificEvent.apply(this, arguments);
                    
                    // 事件加载完成后，检查是否需要切换音乐
                    console.log(`[音乐控制] 事件 ${type} 加载完成，准备切换音乐`);
                    
                    // 确保当前事件类型正确设置
                    if (this.currentEvent) {
                        this.currentEvent.type = type;
                    }
                    
                    // 延迟一小段时间再播放音乐，确保事件完全加载
                    setTimeout(() => {
                        const isQuizPhase = this.hasStartedQuiz && !this.hasCompletedQuiz && type === 'weekend';
                        this.playEventMusic(type, isQuizPhase);
                    }, 200);
                };
                
                console.log('[音乐控制] 已拦截事件加载方法，确保事件加载后切换音乐');
            }
            
            // 定期检查事件类型是否变化
            setInterval(checkEventTypeChange, 1000);
            
            // 添加针对endEvent方法的修改，确保事件结束后进入新事件时正确切换音乐
            const originalEndEvent = window.currentGame.endEvent;
            if (originalEndEvent) {
                window.currentGame.endEvent = async function() {
                    console.log('[音乐控制] 事件结束，准备进入下一个事件');
                    
                    // 记录当前事件类型，用于后续比较
                    const currentType = this.currentEvent?.type;
                    
                    // 调用原始方法
                    await originalEndEvent.apply(this, arguments);
                    
                    // 事件结束后，如果事件类型变化，确保切换音乐
                    if (this.currentEvent?.type && this.currentEvent.type !== currentType) {
                        console.log(`[音乐控制] 事件类型变化: ${currentType} -> ${this.currentEvent.type}`);
                        const isQuizPhase = this.hasStartedQuiz && !this.hasCompletedQuiz && this.currentEvent.type === 'weekend';
                        this.playEventMusic(this.currentEvent.type, isQuizPhase);
                    }
                };
                
                console.log('[音乐控制] 已拦截事件结束方法，确保事件结束后切换音乐');
            }
            
            // 拦截loadSecondEvent方法，确保加载第二个事件时切换音乐
            const originalLoadSecondEvent = window.currentGame.loadSecondEvent;
            if (originalLoadSecondEvent) {
                window.currentGame.loadSecondEvent = async function() {
                    console.log('[音乐控制] 准备加载第二个事件，先停止当前音乐');
                    
                    // 停止所有音频
                    this.stopAllAudio();
                    
                    // 记录当前事件类型
                    const currentType = this.currentEvent?.type;
                    
                    // 调用原始方法
                    await originalLoadSecondEvent.apply(this, arguments);
                    
                    // 检查事件类型是否变化
                    if (this.currentEvent?.type && this.currentEvent.type !== currentType) {
                        console.log(`[音乐控制] 第二个事件加载完成，类型变化: ${currentType} -> ${this.currentEvent.type}`);
                        
                        // 延迟一小段时间再播放音乐，确保事件UI完全加载
                        setTimeout(() => {
                            this.playEventMusic(this.currentEvent.type);
                        }, 300);
                    }
                };
                
                console.log('[音乐控制] 已拦截loadSecondEvent方法，确保第二个事件加载时切换音乐');
            }
            
            // 拦截loadNextEvent方法，确保加载下一个事件时切换音乐
            const originalLoadNextEvent = window.currentGame.loadNextEvent;
            if (originalLoadNextEvent) {
                window.currentGame.loadNextEvent = async function() {
                    console.log('[音乐控制] 准备加载下一个事件，先停止当前音乐');
                    
                    // 停止所有音频
                    this.stopAllAudio();
                    
                    // 记录当前事件类型
                    const currentType = this.currentEvent?.type;
                    
                    // 调用原始方法
                    await originalLoadNextEvent.apply(this, arguments);
                    
                    // 延迟检查，确保新事件已加载
                    setTimeout(() => {
                        // 检查事件类型是否变化
                        if (this.currentEvent?.type && this.currentEvent.type !== currentType) {
                            console.log(`[音乐控制] 下一个事件加载完成，类型变化: ${currentType} -> ${this.currentEvent.type}`);
                            this.playEventMusic(this.currentEvent.type);
                        }
                    }, 500);
                };
                
                console.log('[音乐控制] 已拦截loadNextEvent方法，确保下一个事件加载时切换音乐');
            }
            
            console.log('[音乐控制] 音乐控制器初始化完成');
        } else {
            console.warn('[音乐控制] 未检测到游戏实例，将重试');
            setTimeout(initMusicController, 500);
        }
    };
    
    // 执行初始化
    checkMusicFiles();
    setTimeout(initMusicController, 1000);
    
    console.log('[音乐控制] 音乐控制器脚本加载完成');
}); 