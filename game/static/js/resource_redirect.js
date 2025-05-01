/**
 * 资源重定向脚本
 * 用于确保所有静态资源请求都被正确重定向到game-static路径
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[资源重定向] 脚本加载中...');
    
    // 劫持Audio构造函数
    const originalAudio = window.Audio;
    window.Audio = function(src) {
        // 如果提供了src参数，检查并修复路径
        if (src && typeof src === 'string' && src.includes('/static/')) {
            const newSrc = src.replace('/static/', '/game-static/');
            console.log('[资源重定向] 音频路径修复:', src, '->', newSrc);
            src = newSrc;
        }
        return new originalAudio(src);
    };
    
    // 继承原型
    window.Audio.prototype = originalAudio.prototype;
    
    // 劫持createElement方法，处理图片和音频元素创建
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        
        // 处理创建的图片和音频元素
        if (tagName.toLowerCase() === 'img' || tagName.toLowerCase() === 'audio') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                // 检查src属性
                if (name === 'src' && typeof value === 'string' && value.includes('/static/')) {
                    value = value.replace('/static/', '/game-static/');
                    console.log(`[资源重定向] ${tagName} src属性修复:`, value);
                }
                return originalSetAttribute.call(this, name, value);
            };
            
            // 直接添加监听器处理src直接赋值的情况
            Object.defineProperty(element, 'src', {
                set: function(value) {
                    if (typeof value === 'string' && value.includes('/static/')) {
                        value = value.replace('/static/', '/game-static/');
                        console.log(`[资源重定向] ${tagName} src属性修复(直接赋值):`, value);
                    }
                    // 使用原始的setAttribute方法设置
                    originalSetAttribute.call(this, 'src', value);
                },
                get: function() {
                    return this.getAttribute('src');
                }
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
                    if (typeof value === 'string' && value.includes('/static/')) {
                        value = value.replace('/static/', '/game-static/');
                        console.log('[资源重定向] Image src属性修复:', value);
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
        if (typeof url === 'string' && url.includes('/static/')) {
            url = url.replace('/static/', '/game-static/');
            console.log('[资源重定向] XHR请求URL修复:', url);
        }
        return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    // 创建一个专门处理continue.png的图片元素
    const preloadContinue = new Image();
    preloadContinue.onload = function() {
        console.log('[资源重定向] continue.png预加载成功');
        window.continueButtonImage = this;
    };
    preloadContinue.onerror = function() {
        console.error('[资源重定向] continue.png预加载失败，尝试备用路径');
        this.src = '/game-static/images/continue.png';
    };
    preloadContinue.src = '/game-static/images/continue.png';
    
    console.log('[资源重定向] 脚本加载完成');
}); 