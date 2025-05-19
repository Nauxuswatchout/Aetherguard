document.addEventListener('DOMContentLoaded', () => {
  const audioMap = {
    tilly: '/static/audio/tilly.wav',
    lulu:  '/static/audio/lulu.wav'
  };

  document.querySelectorAll('.child-wrapper').forEach(wrapper => {
    const buddy    = wrapper.dataset.buddy;
    const audioSrc = audioMap[buddy];
    let hoverAudio;

    // Preload audio for Tilly and Lulu
    if (audioSrc) {
      hoverAudio = new Audio(audioSrc);
      hoverAudio.preload = 'auto';
    }

    // Click → navigate
    wrapper.addEventListener('click', () => {
      if (buddy === 'tilly') {
        window.location.href = '/children/children_tilly';
      } else if (buddy === 'lulu') {
        window.location.href = '/children/children_lulu';
      }
    });

    // Mouse enter → play audio
    wrapper.addEventListener('mouseenter', () => {
      if (hoverAudio) {
        hoverAudio.currentTime = 0;
        hoverAudio.play().catch(() => {});
      }
    });

    // Mouse leave → stop audio
    wrapper.addEventListener('mouseleave', () => {
      if (hoverAudio) {
        hoverAudio.pause();
        hoverAudio.currentTime = 0;
      }
    });
  });
});