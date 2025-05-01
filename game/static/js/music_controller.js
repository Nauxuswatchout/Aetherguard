/**
 * 音乐控制器脚本
 * 自动检测事件类型并播放对应背景音乐
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[音乐控制] 音乐控制器脚本加载中...');
    
    // 检测当前环境
    const isAzure = window.location.hostname.includes('azure') || 
                   window.location.hostname.includes('azurewebsites.net');
    console.log('[音乐控制] 当前环境:', isAzure ? 'Azure' : '本地开发');
    
    // 记录音乐播放状态，防止重复播放
    let isPlayingMusic = false;
    let pendingMusicPlay = null; // 存储待播放的音乐路径
    let currentPlayingMusic = ''; // 当前正在播放的音乐路径
    let allAudioElements = []; // 存储所有创建的音频元素
    
    // 修复音乐路径
    const fixMusicPath = (path) => {
        if (!path) return path;
        
        // 确保路径以/开头
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        if (isAzure) {
            // Azure环境确保使用/static/
            if (path.startsWith('/game-static/')) {
                path = path.replace('/game-static/', '/static/');
            }
            // 如果路径既不是/static/也不是/game/static/，添加/static/
            if (!path.startsWith('/static/') && !path.startsWith('/game/static/')) {
                path = '/static' + path;
            }
        } else {
            // 本地环境使用/game-static/
            if (path.startsWith('/static/')) {
                path = path.replace('/static/', '/game-static/');
            }
            // 如果路径不是/game-static/，添加/game-static/
            else if (!path.startsWith('/game-static/')) {
                path = '/game-static' + path;
            }
        }
        
        return path;
    };
    
    // 强制停止所有音频的函数
    const forceStopAllAudio = () => {
        console.log('[音乐控制] 强制停止所有音频');
        
        // 停止所有已跟踪的音频元素
        allAudioElements.forEach(audio => {
            try {
                audio.pause();
                audio.currentTime = 0;
                // 尝试从DOM中移除
                if (audio.parentNode) {
                    audio.parentNode.removeChild(audio);
                }
            } catch (e) {
                console.error('[音乐控制] 停止音频失败:', e);
            }
        });
        
        // 清空数组
        allAudioElements = [];
        
        // 停止页面上所有音频元素
        document.querySelectorAll('audio').forEach(audio => {
            try {
                audio.pause();
                audio.currentTime = 0;
                // 尝试从DOM中移除
                if (audio.parentNode) {
                    audio.parentNode.removeChild(audio);
                }
            } catch (e) {
                console.error('[音乐控制] 停止页面音频失败:', e);
            }
        });
        
        // 重置状态
        isPlayingMusic = false;
        currentPlayingMusic = '';
        pendingMusicPlay = null;
    };

    // 记录上一个事件类型
    let lastEventType = '';
    let musicCheckInterval = null;
    
    // 检查音乐文件是否可访问
    const checkMusicFiles = async () => {
        console.log('[音乐控制] 检查音乐文件可访问性...');
        
        const musicFiles = [
            isAzure ? '/static/music/home.mp3' : '/game-static/music/home.mp3',
            isAzure ? '/static/music/school.mp3' : '/game-static/music/school.mp3',
            isAzure ? '/static/music/live.mp3' : '/game-static/music/live.mp3'
        ];
        
        for (const file of musicFiles) {
            try {
                const response = await fetch(file, { method: 'HEAD' });
                console.log(`[音乐控制] 音乐文件检查: ${file} - ${response.ok ? '可访问' : '不可访问'}`);
            } catch (e) {
                console.error(`[音乐控制] 音乐文件检查失败: ${file}`, e);
            }
        }
    };
    
    // 尝试执行音乐文件检查
    checkMusicFiles().catch(e => console.error('[音乐控制] 音乐文件检查出错:', e));
    
    // 初始化音乐控制器
    const initMusicController = () => {
        // 确保Game实例已创建
        if (!window.currentGame) {
            console.log('[音乐控制] 等待Game实例初始化...');
            setTimeout(initMusicController, 100);
            return;
        }
        
        console.log('[音乐控制] 初始化音乐控制器');
        
        // 检查是否已经有音乐控制方法
        if (window.currentGame.playBackgroundMusic && window.currentGame.stopBackgroundMusic) {
            console.log('[音乐控制] 音乐控制方法已存在，进行扩展');
            
            // 保存原始方法引用
            const originalPlayBGM = window.currentGame.playBackgroundMusic;
            const originalStopBGM = window.currentGame.stopBackgroundMusic;
            
            // 替换播放背景音乐方法
            window.currentGame.playBackgroundMusic = function(musicPath) {
                // 修复音乐路径
                musicPath = fixMusicPath(musicPath);
                
                console.log(`[音乐控制] 准备播放音乐: ${musicPath}`);
                
                // 如果是相同的音乐且正在播放，则不重复播放
                if (currentPlayingMusic === musicPath && this.backgroundMusic && !this.backgroundMusic.paused) {
                    console.log(`[音乐控制] 音乐 ${musicPath} 已经在播放中，跳过`);
                    return;
                }
                
                // 先强制停止所有音频
                forceStopAllAudio();
                
                // 延迟创建新的音频元素，确保旧的完全停止
                setTimeout(() => {
                    try {
                        // 创建新的音频元素
                        const newAudio = new Audio(musicPath);
                        newAudio.volume = 0.5; // 默认音量
                        newAudio.loop = true;  // 循环播放
                        
                        // 存储到Game实例和跟踪数组
                        this.backgroundMusic = newAudio;
                        this.currentMusicPath = musicPath;
                        allAudioElements.push(newAudio);
                        
                        // 标记开始播放状态
                        isPlayingMusic = true;
                        currentPlayingMusic = musicPath;
                        
                        // 播放音乐
                        const playPromise = newAudio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(err => {
                                console.error('[音乐控制] 播放音乐失败:', err);
                                isPlayingMusic = false;
                                currentPlayingMusic = '';
                            });
                        }
                        
                        // 监听播放结束事件
                        newAudio.onended = () => {
                            if (!newAudio.loop) { // 只有在非循环模式下才触发
                                console.log(`[音乐控制] 音乐播放结束: ${musicPath}`);
                                isPlayingMusic = false;
                                currentPlayingMusic = '';
                            }
                        };
                        
                        console.log(`[音乐控制] 开始播放音乐: ${musicPath}`);
                    } catch (err) {
                        console.error('[音乐控制] 创建音频元素失败:', err);
                    }
                }, 100);
            };
            
            // 替换停止背景音乐方法
            window.currentGame.stopBackgroundMusic = function() {
                console.log('[音乐控制] 停止背景音乐');
                
                if (this.backgroundMusic) {
                    try {
                        this.backgroundMusic.pause();
                        this.backgroundMusic.currentTime = 0;
                        this.currentMusicPath = '';
                    } catch (e) {
                        console.error('[音乐控制] 停止背景音乐失败:', e);
                    }
                }
                
                // 更新状态
                isPlayingMusic = false;
                currentPlayingMusic = '';
                pendingMusicPlay = null;
            };
            
            // 添加强制停止所有音频的方法
            window.currentGame.stopAllAudio = function() {
                forceStopAllAudio();
            };
            
            // 添加事件音乐播放方法
            window.currentGame.playEventMusic = function(eventType, isQuizPhase = false) {
                // 如果没有提供事件类型，使用当前事件类型
                if (!eventType && this.currentEvent && this.currentEvent.type) {
                    eventType = this.currentEvent.type;
                }
                
                // 如果事件类型无效，不操作
                if (!eventType) {
                    console.log('[音乐控制] 无效的事件类型，跳过音乐播放');
                    return;
                }
                
                // 生成音乐路径
                let musicPath = '';
                const musicPrefix = isAzure ? '/static/music/' : '/game-static/music/';
                
                switch (eventType) {
                    case 'morning':
                        musicPath = musicPrefix + 'school.mp3';
                        break;
                    case 'home':
                    case 'phone':
                        musicPath = musicPrefix + 'home.mp3';
                        break;
                    case 'weekend':
                        // 周末事件答题阶段播放live.mp3，其他阶段播放home.mp3
                        musicPath = isQuizPhase ? musicPrefix + 'live.mp3' : musicPrefix + 'home.mp3';
                        break;
                    default:
                        // 默认音乐
                        musicPath = musicPrefix + 'home.mp3';
                }
                
                console.log(`[音乐控制] 事件类型 ${eventType}${isQuizPhase ? ' (答题阶段)' : ''} 准备切换音乐: ${musicPath}`);
                
                // 记录上一次播放的事件类型音乐
                this._lastEventMusicType = eventType;
                this._lastQuizPhase = isQuizPhase;
                
                // 先停止所有音频，然后播放新音乐
                forceStopAllAudio();
                
                // 延迟播放新音乐，确保旧音乐完全停止
                setTimeout(() => {
                    this.playBackgroundMusic(musicPath);
                }, 150);
            };
            
            // 重写原始Game类的音频相关方法，确保音频管理统一
            if (window.Game && window.Game.prototype) {
                // 重写原型方法
                const originalGameProtoPlayBGM = window.Game.prototype.playBackgroundMusic;
                if (originalGameProtoPlayBGM) {
                    window.Game.prototype.playBackgroundMusic = function(musicPath) {
                        // 使用我们增强的方法
                        if (window.currentGame && window.currentGame.playBackgroundMusic) {
                            return window.currentGame.playBackgroundMusic(musicPath);
                        } else {
                            return originalGameProtoPlayBGM.call(this, musicPath);
                        }
                    };
                }
                
                // 重写停止音乐方法
                const originalGameProtoStopBGM = window.Game.prototype.stopBackgroundMusic;
                if (originalGameProtoStopBGM) {
                    window.Game.prototype.stopBackgroundMusic = function() {
                        forceStopAllAudio();
                        return originalGameProtoStopBGM.call(this);
                    };
                }
            }
        }
        
        // 添加音乐自动播放监听器 - 只执行一次
        const initAudio = function() {
            // 如果当前没有播放音乐，根据当前事件类型播放对应音乐
            if (window.currentGame && window.currentGame.currentEvent && 
                (!window.currentGame.backgroundMusic || window.currentGame.backgroundMusic.paused)) {
                
                const eventType = window.currentGame.currentEvent.type;
                if (eventType) {
                    const isQuizPhase = window.currentGame.hasStartedQuiz && 
                                       !window.currentGame.hasCompletedQuiz && 
                                       eventType === 'weekend';
                    
                    // 先停止所有可能存在的音频
                    forceStopAllAudio();
                    
                    // 延迟播放新音乐
                    setTimeout(() => {
                        window.currentGame.playEventMusic(eventType, isQuizPhase);
                    }, 100);
                    
                    console.log(`[音乐控制] 初始化音频: 自动播放 ${eventType} 事件音乐，答题阶段: ${isQuizPhase}`);
                }
            }
        };
        
        // 添加一次性点击事件监听器
        document.addEventListener('click', initAudio, { once: true });
        
        // 添加事件类型监控，监听事件加载完成
        const checkEventTypeChange = () => {
            // 确保游戏实例和当前事件存在
            if (!window.currentGame || !window.currentGame.currentEvent) {
                return;
            }
            
            const currentEventType = window.currentGame.currentEvent.type;
            
            // 如果没有事件类型，不处理
            if (!currentEventType) {
                return;
            }
            
            const isQuizPhase = window.currentGame.hasStartedQuiz && 
                               !window.currentGame.hasCompletedQuiz && 
                               currentEventType === 'weekend';
            
            // 检查事件类型是否变化
            if (currentEventType && currentEventType !== lastEventType) {
                console.log(`[音乐控制] 检测到事件类型变化: ${lastEventType} -> ${currentEventType}`);
                
                // 更新上一个事件类型
                lastEventType = currentEventType;
                
                // 先强制停止所有音频
                forceStopAllAudio();
                
                // 延迟播放新音乐，确保旧音乐完全停止
                setTimeout(() => {
                    window.currentGame.playEventMusic(currentEventType, isQuizPhase);
                }, 200);
            } else if (currentEventType === 'weekend') {
                // 特殊检查：如果是周末事件答题状态变化，需要切换音乐
                if (window.currentGame.hasStartedQuiz && 
                    !window.currentGame.hasCompletedQuiz && 
                    (!window.currentGame.backgroundMusic || 
                     !window.currentGame.backgroundMusic.src.includes('live.mp3'))) {
                    console.log('[音乐控制] 检测到周末事件进入答题阶段，切换音乐');
                    
                    // 先强制停止所有音频
                    forceStopAllAudio();
                    
                    // 延迟播放新音乐
                    setTimeout(() => {
                        window.currentGame.playEventMusic('weekend', true);
                    }, 200);
                } else if (window.currentGame.hasCompletedQuiz && 
                          window.currentGame.backgroundMusic && 
                          window.currentGame.backgroundMusic.src.includes('live.mp3')) {
                    console.log('[音乐控制] 检测到周末事件答题完成，切换音乐');
                    
                    // 先强制停止所有音频
                    forceStopAllAudio();
                    
                    // 延迟播放新音乐
                    setTimeout(() => {
                        window.currentGame.playEventMusic('weekend', false);
                    }, 200);
                }
            }
        };
        
        // 添加主动拦截事件加载完成的函数
        const originalLoadSpecificEvent = window.currentGame.loadSpecificEvent;
        if (originalLoadSpecificEvent) {
            window.currentGame.loadSpecificEvent = async function(type) {
                console.log(`[音乐控制] 准备加载事件类型 ${type}，先停止当前音乐`);
                
                // 先强制停止所有音频
                forceStopAllAudio();
                
                // 调用原始方法
                await originalLoadSpecificEvent.apply(this, arguments);
                
                // 确保当前事件类型正确设置
                if (this.currentEvent) {
                    this.currentEvent.type = type;
                }
                
                // 事件加载完成后，延迟播放音乐
                console.log(`[音乐控制] 事件 ${type} 加载完成，准备延迟切换音乐`);
                
                // 设置延迟播放标志
                setTimeout(() => {
                    const isQuizPhase = this.hasStartedQuiz && !this.hasCompletedQuiz && type === 'weekend';
                    this.playEventMusic(type, isQuizPhase);
                }, 400); // 进一步延长延迟，确保事件完全加载
            };
            
            console.log('[音乐控制] 已拦截事件加载方法，确保事件加载后切换音乐');
        }
        
        // 定期检查事件类型是否变化
        if (musicCheckInterval) {
            clearInterval(musicCheckInterval);
        }
        // 减少检查频率，每3秒检查一次，降低处理负担
        musicCheckInterval = setInterval(checkEventTypeChange, 3000);
        
        // 添加针对endEvent方法的修改，确保事件结束后进入新事件时正确切换音乐
        const originalEndEvent = window.currentGame.endEvent;
        if (originalEndEvent) {
            window.currentGame.endEvent = async function() {
                console.log('[音乐控制] 事件结束，准备进入下一个事件');
                
                // 记录当前事件类型，用于后续比较
                const currentType = this.currentEvent?.type;
                
                // 先强制停止所有音频
                forceStopAllAudio();
                
                // 调用原始方法
                await originalEndEvent.apply(this, arguments);
                
                // 事件结束后，如果事件类型变化，确保切换音乐
                if (this.currentEvent?.type && this.currentEvent.type !== currentType) {
                    console.log(`[音乐控制] 事件类型变化: ${currentType} -> ${this.currentEvent.type}`);
                    
                    // 再次确保所有音频停止
                    forceStopAllAudio();
                    
                    // 延迟执行，确保UI和事件状态更新
                    setTimeout(() => {
                        const isQuizPhase = this.hasStartedQuiz && !this.hasCompletedQuiz && this.currentEvent.type === 'weekend';
                        this.playEventMusic(this.currentEvent.type, isQuizPhase);
                    }, 400);
                }
            };
            
            console.log('[音乐控制] 已拦截事件结束方法，确保事件结束后切换音乐');
        }
        
        // 拦截loadSecondEvent方法，确保加载第二个事件时切换音乐
        const originalLoadSecondEvent = window.currentGame.loadSecondEvent;
        if (originalLoadSecondEvent) {
            window.currentGame.loadSecondEvent = async function() {
                console.log('[音乐控制] 准备加载第二个事件，先停止当前音乐');
                
                // 先强制停止所有音频
                forceStopAllAudio();
                
                // 调用原始方法
                await originalLoadSecondEvent.apply(this, arguments);
                
                // 事件加载完成后，延迟播放音乐
                if (this.currentEvent?.type) {
                    console.log(`[音乐控制] 第二个事件加载完成，准备延迟切换音乐 ${this.currentEvent.type}`);
                    
                    // 再次确保所有音频停止
                    forceStopAllAudio();
                    
                    setTimeout(() => {
                        const isQuizPhase = this.hasStartedQuiz && !this.hasCompletedQuiz && this.currentEvent.type === 'weekend';
                        this.playEventMusic(this.currentEvent.type, isQuizPhase);
                    }, 400);
                }
            };
            
            console.log('[音乐控制] 已拦截第二个事件加载方法，确保事件加载后切换音乐');
        }
        
        // 添加页面卸载处理，确保离开页面时停止所有音频
        window.addEventListener('beforeunload', function() {
            console.log('[音乐控制] 页面卸载，停止所有音频');
            forceStopAllAudio();
        });
        
        // 初始尝试停止所有可能存在的音频
        forceStopAllAudio();
    };
    
    // 尝试初始化音乐控制器
    initMusicController();
    
    console.log('[音乐控制] 音乐控制器脚本加载完成');
}); 