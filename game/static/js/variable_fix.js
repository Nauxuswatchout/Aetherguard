/**
 * 变量修复脚本 
 * 用于确保关键变量定义正确
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[变量修复] 脚本加载中...');
    
    // 确保游戏变量初始化
    window.ensureGameVariables = function() {
        // 确保全局游戏实例存在
        if (!window.currentGame) {
            console.log('[变量修复] 创建临时游戏实例');
            window.currentGame = {
                debug: function(msg) { console.log('[游戏调试]', msg); },
                isTyping: false,
                currentDialogIndex: 0,
                hasCompletedQuiz: false,
                isProcessingBranchDialogues: false,
                currentTypingId: null,
                hasEventEnded: false,
                isEventEnding: false,
                hasProcessedBranches: false,
                hasStartedQuiz: false
            };
        }
        
        // 检查并确保周末事件分支对话处理标志正确设置
        if (window.currentGame) {
            if (window.currentGame.currentEvent && 
                window.currentGame.currentEvent.type === 'weekend' && 
                window.currentGame.hasCompletedQuiz && 
                typeof window.currentGame.isProcessingBranchDialogues === 'undefined') {
                console.log('[变量修复] 设置isProcessingBranchDialogues默认值');
                window.currentGame.isProcessingBranchDialogues = true;
            }
        }
    };
    
    // 初始状态下执行一次变量检查
    setTimeout(function() {
        window.ensureGameVariables();
    }, 1000);
    
    // 定期检查并确保变量存在
    setInterval(function() {
        window.ensureGameVariables();
    }, 5000);
    
    // 在全局空间中定义可能缺失的函数
    if (typeof window.isWeekendBranchDialog === 'undefined') {
        window.isWeekendBranchDialog = function() {
            if (!window.currentGame) return false;
            
            return window.currentGame.currentEvent && 
                   window.currentGame.currentEvent.type === 'weekend' && 
                   window.currentGame.hasCompletedQuiz && 
                   window.currentGame.isProcessingBranchDialogues;
        };
        console.log('[变量修复] 添加全局isWeekendBranchDialog函数');
    }
    
    console.log('[变量修复] 脚本加载完成');
}); 