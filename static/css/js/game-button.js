document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.game-launch-button');
    const video = document.querySelector('.game-launch-video');
    
    if (button && video) {
        button.addEventListener('mouseenter', function() {
            video.play();
        });
        
        button.addEventListener('mouseleave', function() {
            video.pause();
            video.currentTime = 0;
        });
        
        button.addEventListener('click', function() {
            window.location.href = '/game';
        });
    }
}); 