// Menu dropdown control
document.querySelector('.menu-button').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector('.menu-dropdown').classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.menu-button') && !e.target.closest('.menu-dropdown')) {
        document.querySelector('.menu-dropdown').classList.remove('active');
    }
}); 