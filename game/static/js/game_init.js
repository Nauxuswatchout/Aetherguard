/**
 * 游戏初始化脚本
 * 负责初始化游戏实例和音频解锁
 */
document.addEventListener('DOMContentLoaded', function() {
    window.gameInitMarker('DOM内容加载完成，准备初始化游戏');
    
    // 创建静音的音频上下文来解锁音频
    const unlockAudio = function() {
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建空白音频节点
        const emptyNode = audioContext.createBufferSource();
        emptyNode.start();
        emptyNode.stop();
        
        // 移除事件监听器
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        
        console.log('[音频] 音频上下文已解锁，可以播放声音');
    };
    
    // 添加事件监听器以解锁音频
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    
    // 确保事件处理器先初始化
    setTimeout(function() {
        try {
            window.gameInitMarker('开始创建游戏实例');
            window.currentGame = new Game();
            window.gameInitMarker('游戏实例创建成功');
            
            // 添加全局点击事件用于调试
            document.body.addEventListener('click', function(e) {
                console.log('[DEBUG] 点击事件被触发', e.target);
                
                // 确保当前事件已加载完成且有音乐控制器时，开始播放音乐
                if (window.currentGame && window.currentGame.currentEvent && 
                    window.currentGame.playEventMusic && 
                    (!window.currentGame.backgroundMusic || window.currentGame.backgroundMusic.paused)) {
                    
                    // 播放当前事件类型的音乐
                    const eventType = window.currentGame.currentEvent.type;
                    const isQuizPhase = window.currentGame.hasStartedQuiz && 
                                      !window.currentGame.hasCompletedQuiz && 
                                      eventType === 'weekend';
                    
                    window.currentGame.playEventMusic(eventType, isQuizPhase);
                    console.log(`[DEBUG] 点击启动音乐播放 - 事件类型: ${eventType}, 答题阶段: ${isQuizPhase}`);
                }
            });
        } catch(e) {
            console.error('游戏初始化失败:', e);
        }
    }, 100);
}); 