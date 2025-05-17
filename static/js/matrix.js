// Global variables to control the animation
let matrixInterval = null;
let activeCanvas = null;
let matrixCtx = null;
let matrixDrops = [];
let matrixColumns = 0;
let isMatrixRunning = false;
const fontSize = 14;
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789¥€£¢§±@#$%&*()[]{}|/\\<>!?+=~^¡¿Ææ文字デジタル字符ﾊｶﾀｻﾅﾏﾔﾗﾜｦｲｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ♠♥♦♣★☆✓✗';
const matrix = letters.split('');

// Function to initialize the matrix effect
function initMatrix(canvas) {
  // If matrix is already running, don't start again
  if (isMatrixRunning && activeCanvas) {
    return;
  }
  
  // Stop any existing animation
  stopMatrix();
  
  if (!canvas) {
    canvas = document.getElementById('matrix') || document.getElementById('matrix-background');
    if (!canvas) return;
  }
  
  activeCanvas = canvas;
  matrixCtx = canvas.getContext('2d');
  
  // Setup canvas dimensions
  resizeMatrixCanvas();
  
  // Fill initial background
  matrixCtx.fillStyle = 'black';
  matrixCtx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
  
  // Initialize drops
  initMatrixDrops();
  
  // Start animation
  isMatrixRunning = true;
  matrixInterval = setInterval(drawMatrix, 33); // ~30 FPS
  
  // Handle fade-in effect for login page
  if (canvas.id === 'matrix' && !canvas.classList.contains('visible')) {
    canvas.style.display = 'block';
    // Small delay to ensure display: block has taken effect
    setTimeout(() => {
      canvas.classList.add('visible');
    }, 10);
  }
}

// Function to stop the matrix effect
function stopMatrix() {
  if (!isMatrixRunning) return;
  
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }
  
  if (activeCanvas && matrixCtx) {
    // Clear the canvas
    matrixCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  }
  
  isMatrixRunning = false;
  activeCanvas = null;
  matrixCtx = null;
}

// Function to resize the canvas
function resizeMatrixCanvas() {
  if (!activeCanvas) return;
  
  activeCanvas.width = window.innerWidth;
  activeCanvas.height = window.innerHeight;
  
  // Recalculate columns after resize
  matrixColumns = Math.ceil(activeCanvas.width / fontSize);
  initMatrixDrops();
}

// Initialize drops array
function initMatrixDrops() {
  matrixDrops = [];
  for (let i = 0; i < matrixColumns; i++) {
    matrixDrops[i] = 1;
  }
}

// Draw the matrix effect
function drawMatrix() {
  if (!activeCanvas || !matrixCtx || !isMatrixRunning) return;
  
  // Add semi-transparent black layer for fade effect
  matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  matrixCtx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
  
  // Loop through drops
  for (let i = 0; i < matrixDrops.length; i++) {
    // Random character
    const text = matrix[Math.floor(Math.random() * matrix.length)];
    
    // Vary character brightness for better visual effect
    if (Math.random() > 0.8) {
      matrixCtx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    } else {
      matrixCtx.fillStyle = 'rgba(0, 200, 0, 0.5)';
    }
    
    // Draw character
    matrixCtx.font = `${fontSize}px monospace`;
    matrixCtx.fillText(text, i * fontSize, matrixDrops[i] * fontSize);
    
    // Reset drop to top with random condition
    if (matrixDrops[i] * fontSize > activeCanvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }
    
    // Move drop down
    matrixDrops[i]++;
  }
}

// Register resize event listener
window.addEventListener('resize', resizeMatrixCanvas);

// Make functions globally available
window.initMatrix = initMatrix;
window.stopMatrix = stopMatrix;

// Initialize on DOM load - for login page
document.addEventListener('DOMContentLoaded', function() {
  // Check for login page matrix canvas (id="matrix")
  const matrixCanvas = document.getElementById('matrix');
  if (matrixCanvas) {
    // If on login page, initialize with fade-in
    initMatrix(matrixCanvas);
    
    // Apply CSS classes for fade-in effect
    if (!matrixCanvas.classList.contains('visible')) {
      matrixCanvas.style.display = 'block';
      // Small delay to ensure display: block has taken effect
      setTimeout(() => {
        matrixCanvas.classList.add('visible');
      }, 10);
    }
  }
});
