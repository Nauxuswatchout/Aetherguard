function toggleCollapse(tipId) {
    const tipBox = document.getElementById(tipId);
    if (tipBox.style.display === 'none' || tipBox.style.display === '') {
        tipBox.style.display = 'block';
    } else {
        tipBox.style.display = 'none';
    }
}