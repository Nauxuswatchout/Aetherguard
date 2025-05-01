/**
 * 游戏调试和图片修复工具
 */

// 全局错误捕获
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.message, 'at', event.filename, ':', event.lineno);
});

// 定义游戏初始化标记函数
window.gameInitMarker = function(message) {
    console.log('[INIT] ' + message);
};

// 在控制台打印警告消息通知用户
console.warn('游戏调试模式已启用，按F12打开控制台查看更多信息');

// 添加图片路径修复函数 - 修改为兼容Azure环境
window.fixImagePath = function(path) {
    if (!path) return path;
    
    console.log('[Image Fix] 原始路径:', path);
    
    // 确保路径以/开头
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    // 如果我们在Azure环境中，保持原始/static/路径
    // 在本地环境中才需要替换为/game-static/
    const isAzure = window.location.hostname.includes('azure') || 
                   window.location.hostname.includes('azurewebsites.net');
    
    if (!isAzure) {
        // 本地环境才进行替换
        if (path.startsWith('/static/')) {
            path = path.replace('/static/', '/game-static/');
        }
        else if (!path.startsWith('/game-static/')) {
            path = '/game-static' + path;
        }
    } else {
        // Azure环境确保使用/static/
        if (path.startsWith('/game-static/')) {
            path = path.replace('/game-static/', '/static/');
        }
        if (!path.startsWith('/static/') && !path.startsWith('/game/static/')) {
            // 如果不是以/static/或/game/static/开头，添加/static/
            path = '/static' + path;
        }
    }
    
    console.log('[Image Fix] 修复后路径:', path);
    return path;
};

// 添加图片加载错误处理 - 改进版本
window.handleImageError = function(element, defaultImage) {
    console.warn('图片加载失败, 使用默认图片', defaultImage);
    if (element) {
        // 先移除之前可能存在的错误类，防止重复添加
        element.classList.remove('error');
        
        // 设置默认图片
        defaultImage = window.fixImagePath(defaultImage);
        element.style.backgroundImage = `url(${defaultImage})`;
        
        // 然后添加错误类标记
        element.classList.add('error');
        
        // 确保在默认图片加载完成后移除背景颜色
        const img = new Image();
        img.onload = function() {
            // 默认图片加载成功后，确保元素样式正确
            element.style.backgroundColor = 'transparent';
        };
        img.onerror = function() {
            // 如果默认图片也加载失败，清除背景图片
            console.error('默认图片也加载失败:', defaultImage);
            element.style.backgroundImage = 'none';
        };
        img.src = defaultImage;
    }
}; 