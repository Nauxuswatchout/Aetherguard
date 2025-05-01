document.addEventListener('DOMContentLoaded', () => {
    const scrollButtons = document.querySelectorAll('.scroll-btn');
  
    scrollButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const scrollContainer = document.getElementById(targetId);
  
        if (button.classList.contains('left')) {
          scrollContainer.scrollBy({
            left: -300,
            behavior: 'smooth'
          });
        } else {
          scrollContainer.scrollBy({
            left: 300,
            behavior: 'smooth'
          });
        }
      });
    });
  });
  