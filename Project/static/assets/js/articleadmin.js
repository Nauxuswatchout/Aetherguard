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

function switchContent(section) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.switch-button').forEach(b => b.classList.remove('active'));
    document.getElementById(section + '-section').classList.add('active');
    document.querySelector(`.switch-button[onclick="switchContent('${section}')"]`).classList.add('active');
}

// Handle article form submission
function submitArticleForm() {
    const form = document.getElementById('article-form');
    const formData = new FormData(form);
    const statusDiv = document.getElementById('submit-status');
    
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<p style="color: blue;">Submitting article...</p>';
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            statusDiv.innerHTML = '<p style="color: green;">Article uploaded successfully! Refreshing page...</p>';
            setTimeout(() => {
                window.location.reload(true); // Force reload from server
            }, 1500);
            return false;
        } else {
            throw new Error('Article upload failed');
        }
    })
    .catch(error => {
        statusDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        console.error('Error:', error);
    });
    
    return false; // Prevent traditional form submission
}

// Add new link field function
function addLinkField() {
    const linksContainer = document.getElementById('links-container');
    const newLinkGroup = document.createElement('div');
    newLinkGroup.className = 'link-group';
    newLinkGroup.innerHTML = `
        <input type="text" name="links[]" placeholder="https://example.com">
        <button type="button" class="remove-link-button" onclick="removeLink(this)">Remove</button>
    `;
    linksContainer.appendChild(newLinkGroup);
}

// Remove link field function
function removeLink(button) {
    const linkGroup = button.parentElement;
    linkGroup.remove();
}

function addOption(button) {
    const optionGroup = button.parentElement;
    const newOptionGroup = document.createElement('div');
    newOptionGroup.className = 'option-group';
    newOptionGroup.innerHTML = `
        <input type="text" name="options[]" placeholder="Option text" required>
        <select name="option_scores[]">
            <option value="-5">-5</option>
            <option value="-4">-4</option>
            <option value="-3">-3</option>
            <option value="-2">-2</option>
            <option value="-1">-1</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
        </select>
    `;
    optionGroup.insertBefore(newOptionGroup, button);
}

function addQuestion() {
    const questionsContainer = document.getElementById('questions-container');
    const newQuestionForm = document.createElement('div');
    newQuestionForm.className = 'question-form';
    newQuestionForm.innerHTML = `
        <div class="form-group">
            <label for="question">Question:</label>
            <input type="text" name="questions[]" required>
        </div>
        <div class="form-group">
            <label for="question_type">Question Type:</label>
            <select name="question_types[]" required>
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
            </select>
        </div>
        <div class="form-group">
            <label for="question_image">Question Image:</label>
            <input type="file" name="question_images[]" accept="image/*">
        </div>
        <div class="form-group">
            <label>Options:</label>
            <div class="option-group">
                <input type="text" name="options[]" placeholder="Option text" required>
                <select name="option_scores[]">
                    <option value="-5">-5</option>
                    <option value="-4">-4</option>
                    <option value="-3">-3</option>
                    <option value="-2">-2</option>
                    <option value="-1">-1</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            <button type="button" class="add-option" onclick="addOption(this)">Add Option</button>
        </div>
        <div class="form-group">
            <label for="correct_answer">Correct Answer:</label>
            <input type="text" name="correct_answers[]" required>
        </div>
    `;
    questionsContainer.appendChild(newQuestionForm);
}

// Handle quiz form submission
function submitQuizForm() {
    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    const statusDiv = document.getElementById('quiz-submit-status');
    
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<p style="color: blue;">Submitting quiz...</p>';
    
    fetch('/upload_quiz', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            statusDiv.innerHTML = '<p style="color: green;">Quiz uploaded successfully! Refreshing page...</p>';
            setTimeout(() => {
                window.location.reload(true); // Force reload from server
            }, 1500);
            return false;
        } else {
            throw new Error('Quiz upload failed');
        }
    })
    .catch(error => {
        statusDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        console.error('Error:', error);
    });
    
    return false; // Prevent traditional form submission
} 