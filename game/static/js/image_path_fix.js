/**
 * 图片路径修复脚本
 * 用于解决图片404问题
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Image Fix] 图片路径修复脚本加载中...');
    
    // 检测当前环境
    const isAzure = window.location.hostname.includes('azure') || 
                   window.location.hostname.includes('azurewebsites.net');
    console.log('[Image Fix] 当前环境:', isAzure ? 'Azure' : '本地开发');
    
    // 定义图片路径修复函数
    window.fixImagePath = function(path) {
        if (!path) return path;
        
        // 调试输出
        console.log('[Image Fix] 原始路径:', path);
        
        // 确保路径正确格式化
        // 1. 确保路径以/开头
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        if (!isAzure) {
            // 本地环境下的处理方式
            // 2. 替换/static/为/game-static/
            if (path.startsWith('/static/')) {
                path = path.replace('/static/', '/game-static/');
            }
            // 如果没有以/static/开头，则添加/game-static/前缀
            else if (!path.startsWith('/game-static/')) {
                path = '/game-static' + path;
            }
        } else {
            // Azure环境下的处理方式
            // 确保使用/static/
            if (path.startsWith('/game-static/')) {
                path = path.replace('/game-static/', '/static/');
            }
            // 如果没有以/static/开头，添加/static/前缀
            if (!path.startsWith('/static/') && !path.startsWith('/game/static/')) {
                path = '/static' + path;
            }
        }
        
        // 3. 修复可能的大小写问题
        // 注意：JavaScript在浏览器中无法直接访问文件系统检查文件是否存在
        // 但我们可以统一使用小写路径，因为许多服务器是大小写敏感的
        path = path.toLowerCase();
        
        // 4. 替换可能存在问题的特殊字符
        path = path.replace(/\s+/g, '_');
        
        console.log('[Image Fix] 修复后路径:', path);
        return path;
    };
    
    // 定义图片加载错误处理函数
    window.handleImageError = function(element, defaultImage) {
        console.warn('[Image Fix] 图片加载失败, 使用默认图片:', defaultImage);
        
        if (!element) return;
        
        // 标记错误状态
        element.classList.add('error');
        
        // 应用默认图片
        if (defaultImage) {
            defaultImage = window.fixImagePath(defaultImage);
            element.style.backgroundImage = `url(${defaultImage})`;
        } else {
            // 如果没有指定默认图片，使用内置的默认图片
            element.style.backgroundImage = '';
            element.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        }
    };
    
    // 测试图片服务器连接
    console.log('[Image Fix] 测试图片服务器连接...');
    const testImage = new Image();
    testImage.onload = function() {
        console.log('[Image Fix] 图片服务器连接正常');
    };
    testImage.onerror = function() {
        console.error('[Image Fix] 图片服务器连接失败，可能需要检查服务器配置');
        // 尝试备用路径
        const backupPath = isAzure ? '/static/images/bedroom.png' : '/game-static/images/bedroom.png';
        this.src = backupPath + '?' + new Date().getTime();
    };
    testImage.src = isAzure ? '/static/images/bedroom.png' : '/game-static/images/bedroom.png';
    testImage.src += '?' + new Date().getTime();
    
    // 添加全局图片错误处理
    window.addEventListener('error', function(event) {
        if (event.target.tagName === 'IMG') {
            console.warn('[Image Fix] 捕获到图片加载错误:', event.target.src);
            
            // 尝试修复路径
            if (isAzure) {
                // Azure环境中修复路径
                if (event.target.src.includes('/game-static/')) {
                    event.target.src = event.target.src.replace('/game-static/', '/static/');
                    console.log('[Image Fix] 尝试修复路径:', event.target.src);
                }
            } else {
                // 本地环境中修复路径
                if (event.target.src.includes('/static/')) {
                    event.target.src = event.target.src.replace('/static/', '/game-static/');
                    console.log('[Image Fix] 尝试修复路径:', event.target.src);
                }
            }
            
            event.target.classList.add('error');
            event.preventDefault(); // 阻止默认错误行为
        }
    }, true);
    
    console.log('[Image Fix] 图片路径修复脚本加载完成');
}); 