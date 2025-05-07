document.addEventListener('DOMContentLoaded', function() {
    const wrappers = document.querySelectorAll('.child-wrapper');
  
    wrappers.forEach(wrapper => {
      wrapper.addEventListener('click', function() {
        const buddy = this.getAttribute('data-buddy');
        if (buddy === 'tilly') {
          window.location.href = '/children/children_tilly';
        } else if (buddy === 'lulu') {
          window.location.href = '/children/children_lulu';
        } else if (buddy === 'zack') {
          window.location.href = '/children/children_zack';
        }
      });
    });
  });
