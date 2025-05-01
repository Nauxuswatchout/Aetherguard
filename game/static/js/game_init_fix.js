/**
 * 游戏初始化修复脚本
 * 用于确保游戏以正确的顺序加载事件
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[初始化修复] 脚本加载中...');
    
    // 等待游戏实例初始化
    const checkGameInstance = setInterval(function() {
        if (window.currentGame) {
            clearInterval(checkGameInstance);
            console.log('[初始化修复] 游戏实例已找到，开始增强初始化逻辑');
            
            // 保存原始init方法引用
            const originalInit = window.currentGame.init;
            
            // 增强init方法，确保正确的事件加载顺序
            window.currentGame.init = async function() {
                console.log('[初始化修复] 增强的init方法执行');
                
                try {
                    // 调用原始初始化方法
                    await originalInit.apply(this, arguments);
                    
                    // 检查游戏状态，确保首先加载morning事件
                    if (this.gameState.day === 1 && this.gameState.completed_events.length === 0) {
                        console.log('[初始化修复] 新游戏检测到，强制加载morning事件');
                        // 重置状态，确保加载morning事件
                        this.gameState.current_event = null;
                        this.gameState.daily_event_completed = false;
                        
                        // 强制加载morning事件
                        await this.loadMorningEvent();
                    }
                } catch (err) {
                    console.error('[初始化修复] 增强init方法出错:', err);
                }
            };
            
            console.log('[初始化修复] 游戏初始化逻辑增强完成');
        }
    }, 100);
    
    console.log('[初始化修复] 脚本加载完成');
}); 