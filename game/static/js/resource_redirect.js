/**
 * 资源重定向脚本
 * 用于确保所有静态资源请求都被正确重定向到game-static路径
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[资源重定向] 脚本加载中...');
    
    // 检测当前环境
    const isAzure = window.location.hostname.includes('azure') || 
                   window.location.hostname.includes('azurewebsites.net');
    console.log('[资源重定向] 当前环境:', isAzure ? 'Azure' : '本地开发');
    
    // 检测是否为游戏页面
    const isGamePage = window.location.pathname.includes('/game') || 
                      window.location.pathname.includes('/new_game') || 
                      window.location.pathname.includes('/load_game');
    console.log('[资源重定向] 页面类型:', isGamePage ? '游戏页面' : '网站页面');
    
    // 非游戏页面不进行资源重定向
    if (!isGamePage) {
        console.log('[资源重定向] 非游戏页面，不进行资源重定向');
        return;
    }
    
    // 劫持Audio构造函数
    const originalAudio = window.Audio;
    window.Audio = function(src) {
        // 如果提供了src参数，检查并修复路径
        if (src && typeof src === 'string') {
            if (isAzure) {
                // Azure环境
                if (src.includes('/game-static/')) {
                    const newSrc = src.replace('/game-static/', '/static/');
                    console.log('[资源重定向] 音频路径修复:', src, '->', newSrc);
                    src = newSrc;
                }
            } else {
                // 本地环境
                if (src.includes('/static/')) {
                    const newSrc = src.replace('/static/', '/game-static/');
                    console.log('[资源重定向] 音频路径修复:', src, '->', newSrc);
                    src = newSrc;
                }
            }
        }
        return new originalAudio(src);
    };
    
    // 继承原型
    window.Audio.prototype = originalAudio.prototype;
    
    // 劫持createElement方法，处理图片和音频元素创建
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        // 处理图片元素
        if (tagName.toLowerCase() === 'img') {
            const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
            
            // 修改src属性setter
            Object.defineProperty(element, 'src', {
                set: function(value) {
                    if (typeof value === 'string') {
                        if (isAzure) {
                            // Azure环境
                            if (value.includes('/game-static/')) {
                                value = value.replace('/game-static/', '/static/');
                                console.log('[资源重定向] 图片src修复:', value);
                            }
                        } else {
                            // 本地环境
                            if (value.includes('/static/')) {
                                value = value.replace('/static/', '/game-static/');
                                console.log('[资源重定向] 图片src修复:', value);
                            }
                        }
                    }
                    originalSrcSetter.call(this, value);
                },
                get: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').get
            });
        }
        
        return element;
    };
    
    // 拦截Image构造函数
    if (window.Image) {
        const originalImage = window.Image;
        window.Image = function(width, height) {
            const img = new originalImage(width, height);
            const originalImageSrcSetter = Object.getOwnPropertyDescriptor(originalImage.prototype, 'src').set;
            
            // 覆盖src属性的setter
            Object.defineProperty(img, 'src', {
                set: function(value) {
                    if (typeof value === 'string') {
                        if (isAzure) {
                            // Azure环境
                            if (value.includes('/game-static/')) {
                                value = value.replace('/game-static/', '/static/');
                                console.log('[资源重定向] Image src属性修复:', value);
                            }
                        } else {
                            // 本地环境
                            if (value.includes('/static/')) {
                                value = value.replace('/static/', '/game-static/');
                                console.log('[资源重定向] Image src属性修复:', value);
                            }
                        }
                    }
                    originalImageSrcSetter.call(this, value);
                }
            });
            
            return img;
        };
        window.Image.prototype = originalImage.prototype;
    }
    
    // 拦截XMLHttpRequest以修复请求URLs
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        if (typeof url === 'string') {
            if (isAzure) {
                // Azure环境
                if (url.includes('/game-static/')) {
                    url = url.replace('/game-static/', '/static/');
                    console.log('[资源重定向] XHR请求URL修复:', url);
                }
            } else {
                // 本地环境
                if (url.includes('/static/')) {
                    url = url.replace('/static/', '/game-static/');
                    console.log('[资源重定向] XHR请求URL修复:', url);
                }
            }
        }
        return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    // 预加载常用游戏资源
    if (isGamePage) {
        // 创建一个专门处理continue.png的图片元素
        const preloadContinue = new Image();
        preloadContinue.onload = function() {
            console.log('[资源重定向] continue.png预加载成功');
            window.continueButtonImage = this;
        };
        preloadContinue.onerror = function() {
            console.error('[资源重定向] continue.png预加载失败，尝试备用路径');
            // 根据环境选择不同路径
            this.src = isAzure ? '/static/images/continue.png' : '/game-static/images/continue.png';
        };
        preloadContinue.src = isAzure ? '/static/images/continue.png' : '/game-static/images/continue.png';
        
        // 预加载角色默认图片
        const preloadDefault = new Image();
        preloadDefault.src = isAzure ? '/static/images/characters/default.png' : '/game-static/images/characters/default.png';
    }
    
    console.log('[资源重定向] 脚本加载完成');
}); 