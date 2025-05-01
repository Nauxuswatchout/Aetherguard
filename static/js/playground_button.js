document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('playground-button');
    let popInterval;
    
    // Debug log to make sure the button is found
    console.log('Playground button found:', button);
    
    if (button) {
        // Change the href to point to children page
        button.href = '/children';
        
        // Clear button content
        while (button.firstChild) {
            button.removeChild(button.firstChild);
        }
        
        // Set button styles
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.style.height = '400px';
        button.style.width = '100%';
        button.style.borderRadius = '10px';
        button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        button.style.transition = 'transform 0.3s ease-out';
        button.style.transformOrigin = 'center center';
        button.style.zIndex = '10';
        
        // Create image container for smooth transitions
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;';
        button.appendChild(imageContainer);
        
        // Create first image element (default visible)
        const firstImage = document.createElement('img');
        firstImage.id = 'playground-image1';
        firstImage.src = '/static/images/rgb/1121.png';
        firstImage.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; display: block; transition: opacity 0.1s ease;';
        firstImage.alt = '';
        imageContainer.appendChild(firstImage);
        
        // Create second image element (initially hidden)
        const secondImage = document.createElement('img');
        secondImage.id = 'playground-image2';
        secondImage.src = '/static/images/rgb/1123.png';
        secondImage.style.cssText = 'position: absolute; top: 100%; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; display: block; transition: transform 0.3s ease-out, opacity 0.1s ease;';
        secondImage.alt = '';
        secondImage.style.opacity = '0';
        imageContainer.appendChild(secondImage);
        
        // Create radial blur overlay for the second image
        const blurOverlay = document.createElement('div');
        blurOverlay.id = 'blur-overlay';
        blurOverlay.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.3s ease-out, opacity 0.3s ease-in;
            background: radial-gradient(
                circle at center,
                transparent 30%,
                rgba(255, 255, 255, 0.1) 60%,
                rgba(255, 255, 255, 0.2) 70%,
                rgba(255, 255, 255, 0.3) 80%
            );
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            mask-image: radial-gradient(
                circle at center,
                transparent 30%,
                black 80%
            );
            -webkit-mask-image: radial-gradient(
                circle at center,
                transparent 30%,
                black 80%
            );
        `;
        imageContainer.appendChild(blurOverlay);
        
        // Add title overlay at the bottom
        const titleOverlay = document.createElement('div');
        titleOverlay.style.cssText = 'position: absolute; bottom: 0; left: 0; width: 100%; background-color: rgba(255, 255, 255, 0.9); color: #2c3e50; margin: 0; padding: 15px; text-align: center; z-index: 3; transition: transform 0.3s ease;';
        button.appendChild(titleOverlay);
        
        // Add title text
        const titleText = document.createElement('h2');
        titleText.textContent = 'Interactive Playground';
        titleText.style.cssText = 'margin: 0; font-size: 1.5rem; font-weight: 600;';
        titleOverlay.appendChild(titleText);
        
        // Add glow effect layer - positioned on top
        const glowElement = document.createElement('div');
        glowElement.className = 'glow-element';
        glowElement.style.cssText = 'position: absolute; top: -40%; left: -40%; width: 180%; height: 180%; background: conic-gradient(from 0deg, #ff00cc, #3333ff, #00ffee, #ffcc00, #ff00cc); border-radius: 10px; z-index: 2; opacity: 0; filter: blur(25px); transition: opacity 0.1s ease; mask-image: radial-gradient(farthest-side at center, transparent 45%, black 100%); -webkit-mask-image: radial-gradient(farthest-side at center, transparent 45%, black 100%); clip-path: inset(0 round 10px); transform-origin: center center; pointer-events: none;';
        button.appendChild(glowElement);
        
        console.log('Button setup complete with constant rotation effect');
        
        // Mouse enter event
        button.addEventListener('mouseenter', function() {
            console.log('Mouse entered - image rising animation in 0.3s');
            
            // Scale up button to 1.2x its original size
            button.style.transform = 'scale(1.2)';
            button.style.zIndex = '100';
            console.log('Button scaled up to 1.2x size');
            
            // Animate second image from bottom
            const image1 = document.getElementById('playground-image1');
            const image2 = document.getElementById('playground-image2');
            const blurOverlay = document.getElementById('blur-overlay');
            
            if (image1 && image2) {
                // Fade out first image instantly
                image1.style.opacity = '0';
                
                // Move second image up in 0.3s and fade in quickly
                image2.style.transform = 'translateY(-100%)';
                image2.style.opacity = '1';
                
                // Show blur overlay with a slight delay
                setTimeout(() => {
                    if (blurOverlay) {
                        blurOverlay.style.transform = 'translateY(-100%)';
                        blurOverlay.style.opacity = '1';
                        console.log('Applied radial blur effect to image');
                    }
                }, 300);
            }
            
            // Hide title on hover
            titleOverlay.style.transform = 'translateY(100%)';
            
            // Activate glow effect with constant speed (1 rotation per second)
            glowElement.style.opacity = '1';
            glowElement.style.animation = 'rotate 1s linear infinite';
            console.log('RGB effect activated at constant speed: 1 rotation per second');
            
            // Create pop image effect
            popInterval = setInterval(function() {
                const popImage = document.createElement('div');
                popImage.classList.add('pop-image');
                document.body.appendChild(popImage);
                
                const images = ['/static/images/rgb/gif.png', '/static/images/rgb/sun.png', '/static/images/rgb/ice.png', '/static/images/rgb/dog.png'];
                const randomImage = images[Math.floor(Math.random() * images.length)];
                popImage.style.backgroundImage = `url('${randomImage}')`;
                
                // Get button position
                const buttonRect = button.getBoundingClientRect();
                
                // Random start position
                const startX = buttonRect.left + Math.random() * buttonRect.width;
                const startY = buttonRect.top + Math.random() * buttonRect.height;
                
                // Set image initial position
                popImage.style.left = startX + 'px';
                popImage.style.top = startY + 'px';
                
                // Random horizontal movement direction and distance
                const moveX = (Math.random() - 0.5) * 400;
                
                // Random vertical movement distance
                const moveY = 300 + Math.random() * 100;
                
                // Random rotation
                const rotation = Math.random() * 720 - 360;
                
                // Set CSS variables
                popImage.style.setProperty('--moveX', moveX + 'px');
                popImage.style.setProperty('--moveY', moveY + 'px');
                popImage.style.setProperty('--rotation', rotation + 'deg');
                
                // Remove element after animation end
                popImage.addEventListener('animationend', function() {
                    popImage.remove();
                });
            }, 150);
        });
        
        // Mouse leave event
        button.addEventListener('mouseleave', function() {
            console.log('Mouse left - returning to original state in 0.3s');
            
            // Reset button scale
            button.style.transform = 'scale(1)';
            button.style.zIndex = '10';
            console.log('Button scale reset to normal size');
            
            // Reverse animation
            const image1 = document.getElementById('playground-image1');
            const image2 = document.getElementById('playground-image2');
            const blurOverlay = document.getElementById('blur-overlay');
            
            if (image1 && image2) {
                // Fade in first image instantly
                image1.style.opacity = '1';
                
                // Move second image back down and fade out quickly
                image2.style.transform = 'translateY(0)';
                image2.style.opacity = '0';
                
                // Hide blur overlay
                if (blurOverlay) {
                    blurOverlay.style.transform = 'translateY(0)';
                    blurOverlay.style.opacity = '0';
                }
            }
            
            // Show title again
            titleOverlay.style.transform = 'translateY(0)';
            
            // Stop glow effect
            glowElement.style.opacity = '0';
            glowElement.style.animation = 'none';
            
            // Clear pop image interval
            clearInterval(popInterval);
        });
        
        // Set up image error handler
        const image = document.getElementById('playground-image');
        if (image) {
            image.onerror = function() {
                console.error('Image loading failed:', this.src);
                // Try fallback image
                this.src = '/static/images/questionnaire.jpeg';
            };
            
            image.onload = function() {
                console.log('Image loaded successfully:', this.src);
            };
        }
    } else {
        console.error('Playground button not found!');
    }
}); 