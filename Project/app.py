from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/parents')
def parents():
    return render_template('parents.html')

if __name__ == '__main__':
    app.run(debug=True)
