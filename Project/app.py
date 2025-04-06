from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import re
import random

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Article data file path
ARTICLES_FILE = 'articles.json'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_articles():
    if os.path.exists(ARTICLES_FILE):
        with open(ARTICLES_FILE, 'r', encoding='utf-8') as f:
            articles = json.load(f)
            # Fix image paths in existing articles
            for article in articles:
                if 'image' in article:
                    article['image'] = article['image'].replace('static/uploads\\', 'uploads/').replace('\\', '/')
                # Randomly assign categories to existing articles
                if 'category' not in article:
                    article['category'] = random.choice(['internet_guidelines', 'learn_dangers'])
            return articles
    return []

def save_articles(articles):
    # Ensure correct image path format
    for article in articles:
        if 'image' in article:
            article['image'] = article['image'].replace('static/uploads\\', 'uploads/').replace('\\', '/')
    
    with open(ARTICLES_FILE, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/parents')
def parents():
    return render_template('parents.html')

@app.route('/article')
def article():
    articles = load_articles()
    internet_guidelines = [a for a in articles if a.get('category') == 'internet_guidelines']
    return render_template('article.html', articles=internet_guidelines)

@app.route('/article2')
def article2():
    articles = load_articles()
    learn_dangers = [a for a in articles if a.get('category') == 'learn_dangers']
    return render_template('article2.html', articles=learn_dangers)

@app.route('/article/access')
def article_admin():
    access_code = request.args.get('whoisyourdaddy8080')
    if access_code == 'whoisyourdaddy8080':
        articles = load_articles()
        return render_template('Articleadmin.html', articles=articles)
    else:
        return redirect(url_for('article'))

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return redirect(request.url)
    file = request.files['image']
    if file.filename == '':
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        content = request.form.get('content')
        video = request.form.get('video')
        show_big = request.form.get('show_big') == 'on'
        chart_description = request.form.get('chart_description')
        category = request.form.get('category')
        
        # Process chart image
        chart = request.files.get('chart')
        chart_filename = None
        if chart and chart.filename != '' and allowed_file(chart.filename):
            chart_filename = secure_filename(chart.filename)
            chart_path = os.path.join(app.config['UPLOAD_FOLDER'], chart_filename)
            chart.save(chart_path)
            chart_filename = 'uploads/' + chart_filename
        
        # Process links
        links = request.form.getlist('links[]')
        links = [link for link in links if link.strip()]  # Remove empty links
        
        # Create article data
        article = {
            'id': str(uuid.uuid4()),
            'title': title,
            'description': description,
            'content': content,
            'image': 'uploads/' + filename,  # Use forward slashes consistently
            'video': video,
            'show_big': show_big,
            'links': links,  # Add links array
            'chart': chart_filename,  # Add chart image path
            'chart_description': chart_description,  # Add chart description
            'category': category  # Add category
        }
        
        # Save article data
        articles = load_articles()
        articles.append(article)
        save_articles(articles)
        
        return redirect(url_for('article'))
    return redirect(request.url)

@app.route('/article/<article_id>')
def article_detail(article_id):
    articles = load_articles()
    article = next((a for a in articles if a['id'] == article_id), None)
    if article:
        return render_template('article_detail.html', article=article)
    return redirect(url_for('article'))

@app.route('/delete_article/<article_id>', methods=['POST'])
def delete_article(article_id):
    articles = load_articles()
    # Find the article to delete
    for article in articles:
        if article['id'] == article_id:
            # Delete image file
            if os.path.exists(article['image']):
                os.remove(article['image'])
            # Remove from list
            articles.remove(article)
            break
    save_articles(articles)
    return redirect(url_for('article_admin', whoisyourdaddy8080='whoisyourdaddy8080'))

@app.route('/question')
def question():
    return render_template('question.html', articles=load_articles(), quizzes=load_quizzes())

@app.route('/quiz/<quiz_id>')
def quiz_detail(quiz_id):
    quizzes = load_quizzes()
    quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    if quiz:
        return render_template('quiz_detail.html', quiz=quiz)
    return redirect(url_for('question'))

@app.route('/upload_quiz', methods=['POST'])
def upload_quiz():
    if 'quiz_image' in request.files:
        quiz_image = request.files['quiz_image']
        if quiz_image.filename != '':
            filename = secure_filename(quiz_image.filename)
            quiz_image_path = os.path.join('static', 'uploads', filename)
            quiz_image.save(quiz_image_path)
        else:
            quiz_image_path = None
    else:
        quiz_image_path = None

    quiz_title = request.form.get('quiz_title')
    questions = request.form.getlist('questions[]')
    question_types = request.form.getlist('question_types[]')
    question_images = request.files.getlist('question_images[]')
    options = request.form.getlist('options[]')
    option_scores = request.form.getlist('option_scores[]')
    correct_answers = request.form.getlist('correct_answers[]')

    # Process question images
    question_image_paths = []
    for image in question_images:
        if image.filename != '':
            filename = secure_filename(image.filename)
            image_path = os.path.join('static', 'uploads', filename)
            image.save(image_path)
            question_image_paths.append(image_path)
        else:
            question_image_paths.append(None)

    # Create quiz data structure
    quiz = {
        'id': str(uuid.uuid4()),
        'title': quiz_title,
        'image': quiz_image_path,
        'questions': []
    }

    # Process each question
    for i in range(len(questions)):
        question_data = {
            'id': str(uuid.uuid4()),
            'text': questions[i],
            'type': question_types[i],
            'image': question_image_paths[i],
            'options': [],
            'correct_answer': correct_answers[i]
        }

        # Process options
        option_count = len(options) // len(questions)
        start_idx = i * option_count
        end_idx = start_idx + option_count
        for j in range(start_idx, end_idx):
            if j < len(options):
                question_data['options'].append({
                    'text': options[j],
                    'score': int(option_scores[j])
                })

        quiz['questions'].append(question_data)

    # Save quiz data
    quizzes = load_quizzes()
    quizzes.append(quiz)
    save_quizzes(quizzes)

    return redirect(url_for('question'))

def load_quizzes():
    try:
        with open('quizzes.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading quizzes: {e}")
        return []

def save_quizzes(quizzes):
    with open('quizzes.json', 'w', encoding='utf-8') as f:
        json.dump(quizzes, f, indent=4, ensure_ascii=False)

@app.route('/question/access')
def question_access():
    if request.args.get('salticecream6964') == 'salticecream6964':
        return render_template('questionadmin.html')
    else:
        return "Unauthorized", 403

@app.route('/save_question', methods=['POST'])
def save_question():
    try:
        # Process quiz image
        quiz_image = request.files.get('quizImage')
        quiz_image_path = None
        if quiz_image and quiz_image.filename != '':
            filename = secure_filename(quiz_image.filename)
            quiz_image_path = os.path.join('static', 'uploads', filename)
            quiz_image.save(quiz_image_path)
            quiz_image_path = 'uploads/' + filename

        # Get form data
        quiz_title = request.form.get('quizTitle')
        quiz_description = request.form.get('quizDescription')

        # Create quiz data structure
        quiz = {
            'id': str(uuid.uuid4()),
            'title': quiz_title,
            'description': quiz_description,
            'image': quiz_image_path,
            'questions': []
        }

        # Process questions
        question_count = 0
        while True:
            question_count += 1
            question_text = request.form.get(f'question{question_count}')
            if not question_text:
                break

            # Get question hint and description
            question_hint = request.form.get(f'questionHint{question_count}')
            question_description = request.form.get(f'questionDescription{question_count}')

            question_data = {
                'id': str(uuid.uuid4()),
                'text': question_text,
                'hint': question_hint,
                'description': question_description,
                'options': []
            }

            # Process options
            option_count = 0
            while True:
                option_count += 1
                option_text = request.form.get(f'option{question_count}_{option_count}')
                if not option_text:
                    break

                option_data = {
                    'text': option_text,
                    'scores': {
                        'awareness': int(request.form.get(f'awareness{question_count}_{option_count}')),
                        'confidence': int(request.form.get(f'confidence{question_count}_{option_count}')),
                        'habits': int(request.form.get(f'habits{question_count}_{option_count}')),
                        'support': int(request.form.get(f'support{question_count}_{option_count}')),
                        'trust': int(request.form.get(f'trust{question_count}_{option_count}')),
                        'preparedness': int(request.form.get(f'preparedness{question_count}_{option_count}'))
                    }
                }
                question_data['options'].append(option_data)

            quiz['questions'].append(question_data)

        # Save quiz data
        quizzes = load_quizzes()
        quizzes.append(quiz)
        save_quizzes(quizzes)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/get_quizzes', methods=['GET'])
def get_quizzes():
    try:
        quizzes = load_quizzes()
        # Return simplified version of quizzes list, only containing id, title, description and image
        simplified_quizzes = []
        for quiz in quizzes:
            simplified_quizzes.append({
                'id': quiz.get('id', ''),
                'title': quiz.get('title', ''),
                'description': quiz.get('description', ''),
                'image': quiz.get('image', '')
            })
        return jsonify({'success': True, 'quizzes': simplified_quizzes})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/delete_quiz/<quiz_id>', methods=['POST'])
def delete_quiz(quiz_id):
    try:
        quizzes = load_quizzes()
        # Find the quiz to delete
        quiz_to_delete = None
        for quiz in quizzes:
            if quiz.get('id') == quiz_id:
                quiz_to_delete = quiz
                break
        
        if quiz_to_delete:
            # Delete associated images
            if quiz_to_delete.get('image') and os.path.exists(os.path.join('static', quiz_to_delete.get('image'))):
                os.remove(os.path.join('static', quiz_to_delete.get('image')))
            
            # Remove from list
            quizzes.remove(quiz_to_delete)
            save_quizzes(quizzes)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Quiz not found'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    # Ensure upload folder exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
