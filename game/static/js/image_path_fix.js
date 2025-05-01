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
    
    // 检测是否在游戏页面
    const isGamePage = window.location.pathname.includes('/game') || 
                      window.location.pathname.includes('/new_game') || 
                      window.location.pathname.includes('/load_game');
    console.log('[Image Fix] 页面类型:', isGamePage ? '游戏页面' : '网站页面');
    
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
        
        // 游戏页面特殊处理
        if (isGamePage) {
            // 本地环境且为游戏页面
            if (!isAzure) {
                // 替换/static/为/game-static/
                if (path.startsWith('/static/')) {
                    path = path.replace('/static/', '/game-static/');
                }
                // 如果没有以/static/开头，则添加/game-static/前缀
                else if (!path.startsWith('/game-static/')) {
                    path = '/game-static' + path;
                }
            } else {
                // 在Azure上，保持/static/路径不变，因为我们有特殊的后端处理
                if (path.startsWith('/game-static/')) {
                    path = path.replace('/game-static/', '/static/');
                }
                if (!path.startsWith('/static/')) {
                    path = '/static' + path;
                }
            }
        } else {
            // 非游戏页面，使用原始的路径处理逻辑
            if (!isAzure) {
                if (path.includes('/static/') && path.includes('/game/')) {
                    path = path.replace('/static/', '/game-static/');
                }
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
        if (isGamePage) {
            // 游戏页面使用角色默认图片测试
            this.src = '/static/images/characters/default.png';
        } else {
            // 主站页面不再重试，避免错误信息泛滥
            console.log('[Image Fix] 非游戏页面，停止图片连接测试');
        }
    };
    
    // 根据页面类型选择适当的测试图片
    if (isGamePage) {
        testImage.src = isAzure ? '/static/images/characters/default.png' : '/game-static/images/characters/default.png';
    } else {
        testImage.src = '/static/images/logo.png'; // 假设主站有logo.png
    }
    
    // 添加全局图片错误处理
    window.addEventListener('error', function(event) {
        if (event.target.tagName === 'IMG') {
            console.warn('[Image Fix] 捕获到图片加载错误:', event.target.src);
            
            // 尝试修复路径
            if (isGamePage) {
                if (isAzure) {
                    // Azure游戏页面 - 如果使用了game-static，改为static
                    if (event.target.src.includes('/game-static/')) {
                        event.target.src = event.target.src.replace('/game-static/', '/static/');
                        console.log('[Image Fix] 尝试修复路径:', event.target.src);
                    }
                } else {
                    // 本地游戏页面 - 如果使用了static，改为game-static
                    if (event.target.src.includes('/static/')) {
                        event.target.src = event.target.src.replace('/static/', '/game-static/');
                        console.log('[Image Fix] 尝试修复路径:', event.target.src);
                    }
                }
            }
            
            event.target.classList.add('error');
            event.preventDefault(); // 阻止默认错误行为
        }
    }, true);
    
    console.log('[Image Fix] 图片路径修复脚本加载完成');
}); 