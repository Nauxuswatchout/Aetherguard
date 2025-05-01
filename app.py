from flask import Flask, render_template, jsonify, request, redirect, url_for, session, abort, send_from_directory, render_template_string
import mysql.connector
from typing import List
# import pymysql
import os
import datetime
import time
from game.app import load_events as game_load_events, init_game_state as game_init_state, is_event_available as game_is_event_available, map_stat_key as game_map_stat_key

app = Flask(__name__)
app.secret_key = 'TRUST-IT-07-secret-key'  

# Force cookies to not be permanent
app.config['SESSION_PERMANENT'] = False
# Set cookie to secure and httponly
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
# Set very short session lifetime
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(seconds=10000)

PASSWORD = "TA07"

# Database configuration
db_config = {
    'host': 'trustitdata.mysql.database.azure.com',
    'user': 'at07data',
    'password': 'trustit07data?',
    'database': 'build_trust_in_it',
    'ssl_ca': os.path.join(os.path.dirname(__file__), 'DigiCertGlobalRootG2.crt.pem'),
    'ssl_verify_cert': True
}
 
def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection

"""
conn = pymysql.connect(
     host="localhost",       
     user="root",        
     password="", # replace with the connection string
     database="build_trust_in_it",
     cursorclass=pymysql.cursors.DictCursor
 )
 """



def login_required(route_function):
    def wrapper(*args, **kwargs):
        # Check if user is authenticated
        if 'authenticated' in session and session['authenticated']:
            return route_function(*args, **kwargs)
        else:
            # Clear any existing session data
            session.clear()
            return redirect(url_for('login'))
    wrapper.__name__ = route_function.__name__
    return wrapper


@app.route('/')
def login():
    # Force login on root access
    session.clear()
    return render_template('login.html')

@app.route('/verify', methods=['POST'])
def verify_password():
    password = request.form.get('password')
    if password == PASSWORD:
        # Create session data
        session.clear()
        session['authenticated'] = True
        session['login_time'] = time.time()
        session['from_homepage'] = False  # 初始化标志
        return redirect(url_for('home'))
    else:
        return render_template('login.html', error="Incorrect password. Access denied.")

@app.route('/matrix-test')
def matrix_test():
    return render_template('matrix-test.html')

@app.route('/matrix-simple')
def matrix_simple():
    return render_template('matrix-simple.html')

@app.route('/home')
@login_required
def home():
    # 设置标志表示用户已经访问过主页
    session['from_homepage'] = True
    return render_template('index.html', title='Home')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/parents')
@login_required
def parents():
    return render_template('parents.html', title='For Parents')

@app.route('/children')
@login_required
def children():
    return render_template('children.html', title='For Children')

@app.route('/parents/internet-guidelines')
@login_required
def internet_guidelines():
    return render_template('parents/internet_guidelines.html', title='Internet Guidelines')

@app.route('/parents/learn_dangers')
@login_required
def learn_dangers():
    return render_template('parents/learn_dangers.html', title='Learn the Dangers')

@app.route('/parents/questionnaire')
@login_required
def questionnaire():
    return render_template('parents/questionnaire.html', title='Safety Questionnaire')

# Individual dangers pages
@app.route('/dangers/cyberbullying')
@login_required
def cyberbullying():
    return render_template('dangers/cyberbullying.html', title='Cyberbullying')

@app.route('/dangers/online-predators')
@login_required
def online_predators():
    return render_template('dangers/online_predators.html', title='Online Predators')

@app.route('/dangers/phishing-scams')
@login_required
def phishing_scams():
    return render_template('dangers/phishing_scams.html', title='Phishing & Scams')

@app.route('/dangers/inappropriate-content')
@login_required
def inappropriate_content():
    return render_template('dangers/inappropriate_content.html', title='Inappropriate Content')

@app.route('/dangers/virus-malware')
@login_required
def virus_malware():
    return render_template('dangers/virus_malware.html', title='Social Media Pressure')

@app.route('/dangers/online-addiction')
@login_required
def online_addiction():
    return render_template('dangers/online_addiction.html', title='Online Addiction')


@app.route('/api/scam_internet_by_location')
def scam_internet_by_location():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                l.location_name,
                s.Scam_Contact_Mode,
                SUM(s.Number_of_reports) AS total_reports
            FROM scam s
            JOIN location l ON s.location_id = l.location_id
            WHERE s.Scam_Contact_Mode IN (
                'Email', 'Mobile apps', 'Internet', 'Social media/Online forums'
            )
            GROUP BY l.location_name, s.Scam_Contact_Mode
            ORDER BY l.location_name, s.Scam_Contact_Mode;
        """
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/activity_pie_data')
def activity_trends():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
            l.location_name AS state,
            a.year_range,
            ROUND(a.screen_activities, 1) AS screen_participation,
            ROUND(a.reading_pleasure, 1) AS reading_participation,
            ROUND(a.creative_activities, 1) AS creative_participation
            FROM activity a
            JOIN location l ON a.location_id = l.location_id
            ORDER BY a.year_range, a.location_id;
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(result)
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500


@app.before_request
def ensure_game_state():
    # 游戏相关路由需要检查游戏状态
    game_routes = ['/new_game', '/load_game', '/get_game_state', 
                  '/update_game_state', '/get_event']
    
    # 检查当前请求是否与游戏相关
    is_game_route = False
    for route in game_routes:
        if request.path.startswith(route):
            is_game_route = True
            break
    
    # 只有游戏相关路由才需检查游戏状态
    if is_game_route and 'authenticated' in session and session['authenticated']:
        # 如果游戏状态不存在，初始化它
        if 'game_state' not in session:
            print("初始化游戏状态...")
            session['game_state'] = game_init_state()
        elif not isinstance(session['game_state'], dict):
            print("游戏状态类型错误，重新初始化...")
            session['game_state'] = game_init_state()
        elif 'day' not in session['game_state']:  # 检查重要字段是否存在
            print("游戏状态缺少关键字段，重新初始化...")
            session['game_state'] = game_init_state()
        
        # 打印当前游戏状态
        if request.path.startswith('/get_event'):
            print(f"当前游戏状态: 天数={session['game_state'].get('day')}, " + 
                 f"章节={session['game_state'].get('chapter')}, " + 
                 f"已完成事件数={len(session['game_state'].get('completed_events', []))}")

# Clear session cookies for every request
@app.before_request
def clear_session_on_root():
    if request.path == '/':
        session.clear()

@app.route("/resource_hub")
def resource_hub():
    return render_template("resource_hub.html")

@app.route('/children/children_tilly')
def tilly_page():
    return render_template('children/children_tilly.html', title="Library for children")

@app.route('/children/children_tilly/lulu_story')
def lulu_story():
    return render_template('stories/lulu.html', title="Lulu Story")

@app.route('/children/children_tilly/tilly_story')
def tilly_story():
    return render_template('stories/tilly.html', title="Tilly Story")

@app.route('/children/children_tilly/felix_story')
def felix_story():
    return render_template('stories/felix.html', title="Felix Story")

@app.route('/children/children_tilly/bella_story')
def bella_story():
    return render_template('stories/bella.html', title="Bella Story")

@app.route('/children/children_tilly/benny_story')
def benny_story():
    return render_template('stories/benny.html', title="Benny Story")

@app.route('/children/children_lulu')
def lulu_page():
    return render_template('children/children_lulu.html',title="Interactive Learning for children")

@app.route('/children/children_lulu/cyberbullying')
def children_cyberbullying_page():
    return render_template('children/children_cyberbullying.html',title="Cyberbullying for children")

@app.route('/children/children_lulu/phishing')
def children_phishing_page():
    return render_template('children/children_phishing.html',title="Phishing for children")

@app.route('/children/children_lulu/apps_permissions')
def children_permissions_page():
    return render_template('children/children_permissions.html',title="App pwemissions for children")

ALLOWED_TABLES = ["app_permissions", "cyberbullying", "phishing_data"]

@app.route("/random_records/<table_name>", methods=["GET"])
def get_random_records(table_name: str):
    # Check if the provided table_name is valid
    if table_name not in ALLOWED_TABLES:
        abort(400, description="Invalid table name")
        # Connect to the MySQL database using mysql.connector
    connection = get_db_connection()

    if connection.is_connected():
        cursor = connection.cursor(dictionary=True)
        
        # Build the SQL query dynamically
        query = f"SELECT * FROM {table_name} ORDER BY RAND() LIMIT 4;"

        # Execute the query
        cursor.execute(query)

        # Fetch all the rows from the executed query
        result = cursor.fetchall()

        # Return the result as JSON
        return jsonify(result)
    

def render_game_template(template_filename):
    template_path = os.path.join(app.root_path, 'game', 'templates', template_filename)
    with open(template_path, encoding='utf-8') as f:
        content = f.read()
    content = content.replace("url_for('static', filename='", "url_for('game_static', filename='")
    return render_template_string(content, title='Game', now=datetime.datetime.now())

# ---------- 游戏相关路由配置 ----------
# /game 路由显示包含 iframe 的页面
@app.route('/game')
@login_required
def game():
    return render_template('game/iframe.html', title='Game')

# /game-content 路由提供游戏的主页面内容
@app.route('/game-content')
@login_required
def game_content():
    # 直接服务游戏的index.html
    game_index_path = os.path.join(app.root_path, 'game', 'templates', 'index.html')
    with open(game_index_path, encoding='utf-8') as f:
        content = f.read()
    # 替换静态资源路径，确保它们指向正确的位置
    content = content.replace("url_for('static', filename='", "url_for('game_static', filename='")
    return render_template_string(content, 
                                 title='Zack\'s Digital Journey', 
                                 now=datetime.datetime.now())

# 保留原有的/new_game和/load_game路由
@app.route('/new_game')
@login_required
def new_game_main():
    # 检查用户是否先访问了主页
    if not session.get('from_homepage', False):
        # 如果没有访问过主页，重定向到主页
        print("用户未经主页直接访问游戏，重定向到主页")
        return redirect(url_for('home'))
        
    # 检查是否带有reset参数，用于重置游戏
    if request.args.get('reset'):
        print("===== 重置游戏状态 =====")
        session['game_state'] = game_init_state()
        print(f"游戏状态已重置: 天数=1, 章节=1, 已完成事件=0")
    # 检查是否通过时间戳跳转，否则初始化游戏状态
    elif not request.args.get('t'):
        print("初始化游戏状态...")
        session['game_state'] = game_init_state()
        
    game_path = os.path.join(app.root_path, 'game', 'templates', 'game.html')
    with open(game_path, encoding='utf-8') as f:
        content = f.read()
    # 替换静态资源路径，确保它们指向正确的位置
    content = content.replace("url_for('static', filename='", "url_for('game_static', filename='")
    return render_template_string(content, 
                                 title='Zack\'s Digital Journey', 
                                 now=datetime.datetime.now())

@app.route('/load_game')
@login_required
def load_game_main():
    # 检查用户是否先访问了主页
    if not session.get('from_homepage', False):
        # 如果没有访问过主页，重定向到主页
        print("用户未经主页直接访问游戏，重定向到主页")
        return redirect(url_for('home'))
        
    if 'game_state' not in session:
        session['game_state'] = game_init_state()
    game_path = os.path.join(app.root_path, 'game', 'templates', 'game.html')
    with open(game_path, encoding='utf-8') as f:
        content = f.read()
    # 替换静态资源路径，确保它们指向正确的位置
    content = content.replace("url_for('static', filename='", "url_for('game_static', filename='")
    return render_template_string(content, 
                                 title='Zack\'s Digital Journey', 
                                 now=datetime.datetime.now())

# 服务游戏静态资源的路由
@app.route('/game-static/<path:filename>')
def game_static(filename):
    game_static_dir = os.path.join(app.root_path, 'game', 'static')
    print(f"请求游戏静态资源: {filename}, 从目录: {game_static_dir}")
    return send_from_directory(game_static_dir, filename)

# Azure环境中用于支持/game-static路径的端点
@app.route('/static/images/<path:filename>')
def azure_images_redirect(filename):
    # 将/static/images请求重定向到/game-static/images
    return redirect(url_for('game_static', filename=f'images/{filename}'))

# 服务游戏JS文件的路由
@app.route('/game-static/js/<path:filename>')
def game_js_files(filename):
    game_js_dir = os.path.join(app.root_path, 'game', 'static', 'js')
    print(f"请求游戏JS文件: {filename}, 从目录: {game_js_dir}")
    try:
        return send_from_directory(game_js_dir, filename)
    except Exception as e:
        print(f"加载游戏JS文件出错: {e}")
        return jsonify({"error": f"加载JS文件失败: {str(e)}"}), 404

# 添加对新增JS文件的特定路由
@app.route('/debug_tools.js')
def debug_tools_js():
    return redirect(url_for('game_js_files', filename='debug_tools.js'))

@app.route('/game_init.js')
def game_init_js():
    return redirect(url_for('game_js_files', filename='game_init.js'))

# ---------- 游戏API路由 ----------
@app.route('/get_game_state')
@login_required
def get_game_state_main():
    # 确保游戏状态存在
    if 'game_state' not in session:
        session['game_state'] = game_init_state()
    return jsonify(session.get('game_state'))

@app.route('/update_game_state', methods=['POST'])
@login_required
def update_game_state_main():
    game_state = request.json
    if not game_state:
        return jsonify({'status': 'error', 'message': 'No game state data'}), 400
    session['game_state'] = game_state
    return jsonify({'status': 'success', 'state': game_state})

@app.route('/get_event/<event_type>')
@login_required
def get_event_main(event_type):
    print(f"请求事件类型: {event_type}")
    
    # 获取游戏状态
    game_state = session.get('game_state', game_init_state())
    
    # 日志记录
    print(f"===== 事件加载详情 =====")
    print(f"请求类型: {event_type}")
    print(f"当前状态: 天数={game_state['day']}, 章节={game_state['chapter']}")
    print(f"已完成事件: {len(game_state.get('completed_events', []))} 个")
    print(f"已完成事件ID: {', '.join(game_state.get('completed_events', []))}")
    
    # 检查是否是每日首个事件请求
    is_first_daily_event = True
    for event_id in game_state.get('completed_events', []):
        # 检查当天是否已有完成的事件
        if f"MorningEvent-{game_state['day']:02d}" == event_id:
            is_first_daily_event = False
            break
    
    # 特殊处理：如果是每日首个事件请求且非morning类型，强制重定向
    if is_first_daily_event and event_type != 'morning':
        print(f"======== 强制重定向事件类型 ========")
        print(f"原请求类型: {event_type}")
        print(f"当前天数: {game_state['day']}")
        print(f"重定向到: morning 类型")
        event_type = 'morning'
    
    events = load_game_events_abs()
    
    # 检查事件是否存在
    if event_type not in events:
        print(f"找不到事件类型: {event_type}")
        return jsonify({'error': f'事件类型 {event_type} 不存在', 'type': event_type})
    
    # 检查事件列表是否为空
    if not events[event_type]:
        print(f"事件类型存在，但事件列表为空: {event_type}")
        return jsonify({'error': f'没有可用的 {event_type} 事件', 'type': event_type})
    
    available_events = []

    # 遍历事件列表，查找可用事件（优先查找每日特定事件）
    day_specific_events = []
    other_events = []
    
    for event in events[event_type]:
        if 'id' not in event:
            print(f"跳过没有ID的事件")
            continue
            
        # 检查是否有天数条件
        has_day_condition = False
        if 'conditions' in event and 'day' in event['conditions']:
            if event['conditions']['day'] == game_state['day']:
                has_day_condition = True
                day_specific_events.append(event)
        else:
            other_events.append(event)
    
    # 优先处理有天数条件的事件
    print(f"找到 {len(day_specific_events)} 个匹配当前天数的事件")
    for event in day_specific_events:
        try:
            if game_is_event_available(event, game_state):
                print(f"事件 {event['id']} 符合当天日期条件，优先返回")
                
                # 设置事件类型
                event['type'] = event_type
                
                # 确保dialogues字段存在
                if 'dialogues' not in event:
                    if 'dialogs' in event:
                        event['dialogues'] = event['dialogs']
                    else:
                        print(f"警告: 事件 {event['id']} 没有对话字段，创建虚拟对话")
                        event['dialogues'] = [
                            {
                                "character": "System_notification",
                                "text": "事件对话内容缺失，请联系管理员。"
                            }
                        ]
                
                # 验证事件完整性
                for i, dialog in enumerate(event['dialogues']):
                    if 'character' not in dialog:
                        event['dialogues'][i]['character'] = "System_notification"
                    if 'text' not in dialog:
                        event['dialogues'][i]['text'] = "对话文本缺失"
                
                print(f"返回匹配当天的事件: {event['id']}")
                return jsonify(event)
        except Exception as e:
            print(f"检查事件 {event['id']} 可用性时出错: {str(e)}")
    
    # 如果没有匹配当天的事件，处理其他事件
    for event in other_events:
        try:
            if game_is_event_available(event, game_state):
                print(f"事件 {event['id']} 符合所有条件，可用")
                
                # 设置事件类型
                event['type'] = event_type
                
                # 确保dialogues字段存在
                if 'dialogues' not in event:
                    if 'dialogs' in event:
                        event['dialogues'] = event['dialogs']
                    else:
                        print(f"警告: 事件 {event['id']} 没有对话字段，创建虚拟对话")
                        event['dialogues'] = [
                            {
                                "character": "System_notification",
                                "text": "事件对话内容缺失，请联系管理员。"
                            }
                        ]
                
                # 检查dialogues是否为空数组
                if not event['dialogues'] or len(event['dialogues']) == 0:
                    print(f"警告: 事件 {event['id']} 对话列表为空，添加虚拟对话")
                    event['dialogues'] = [
                        {
                            "character": "System_notification",
                            "text": "事件对话内容为空，请联系管理员。"
                        }
                    ]
                
                # 验证事件结构完整性，确保客户端不会出错
                for i, dialog in enumerate(event['dialogues']):
                    if 'character' not in dialog:
                        event['dialogues'][i]['character'] = "System_notification"
                    if 'text' not in dialog:
                        event['dialogues'][i]['text'] = "对话文本缺失"
                
                # 打印完整事件数据用于调试
                import json
                print(f"返回事件数据: {json.dumps(event, ensure_ascii=False)[:200]}...")
                
                return jsonify(event)
            else:
                print(f"事件 {event['id']} 不符合条件，跳过")
                available_events.append(event['id'])
        except Exception as e:
            print(f"检查事件 {event['id']} 可用性时出错: {str(e)}")
            continue
    
    print(f"没有找到可用的 {event_type} 事件，已检查: {available_events}")
    return jsonify({'error': f'没有可用的 {event_type} 事件', 'type': event_type})

# 修改事件加载函数，使用绝对路径指向正确的JSON文件
def load_game_events_abs():
    base_dir = os.path.join(app.root_path, 'game')
    # 定义不同类型事件对应的JSON文件路径
    event_files = {
        'morning': ['js/morning-events.json'],
        'home':    ['js/home-events.json'],
        'phone':   ['js/phone-events.json'],
        'weekend': ['js/weekend-events.json', 'js/weekend-events-2.json']
    }
    
    # 调试信息
    print(f"Base directory for events: {base_dir}")
    for event_type, file_paths in event_files.items():
        for file_path in file_paths:
            full_path = os.path.join(base_dir, file_path)
            print(f"Event file {event_type}: {full_path} (exists: {os.path.exists(full_path)})")
    
    events = {k: [] for k in event_files}
    import json
    
    # 加载每种类型的事件
    for etype, paths in event_files.items():
        for rel_path in paths:
            abs_path = os.path.join(base_dir, rel_path)
            if os.path.exists(abs_path):
                try:
                    print(f"正在加载事件文件: {abs_path}")
                    with open(abs_path, encoding='utf-8') as f:
                        data = json.load(f)
                        if 'events' in data:
                            events[etype].extend(data['events'])
                            print(f"成功加载 {len(data['events'])} 个 {etype} 事件")
                        else:
                            print(f"警告: {abs_path} 中没有找到 'events' 字段")
                except Exception as e:
                    print(f'加载事件出错 {abs_path}: {e}')
            else:
                print(f"事件文件不存在: {abs_path}")
    
    # 打印加载的事件数量总结
    for event_type, event_list in events.items():
        print(f"事件类型 {event_type}: 加载了 {len(event_list)} 个事件")
    
    return events

# 游戏资源重定向路由 - 将/static路径下的请求重定向到/game-static路径
@app.route('/static/<path:filename>')
def game_static_redirect(filename):
    # 检查文件是否存在于游戏静态资源目录中
    game_static_dir = os.path.join(app.root_path, 'game', 'static')
    target_path = os.path.join(game_static_dir, filename)
    
    # 调试日志
    print(f"静态资源请求: /static/{filename}")
    print(f"检查路径: {target_path} (存在: {os.path.exists(target_path)})")
    
    if os.path.exists(target_path) or filename.startswith('images/'):
        # 如果文件存在于游戏静态资源目录中，或是图片路径，则重定向到/game-static路径
        print(f"找到游戏资源或图片路径，重定向到: /game-static/{filename}")
        return redirect(url_for('game_static', filename=filename))
    else:
        # 否则使用Flask默认的static路由
        print(f"使用默认静态路由: /static/{filename}")
        return send_from_directory(app.static_folder, filename)
        
# 保留原有的游戏事件JSON文件路由
@app.route('/game-events/<path:filename>')
def game_events_json(filename):
    events_dir = os.path.join(app.root_path, 'game', 'js')
    print(f"请求事件JSON文件: {filename}, 从目录: {events_dir}")
    try:
        return send_from_directory(events_dir, filename)
    except Exception as e:
        print(f"加载事件JSON文件出错: {e}")
        return jsonify({"error": f"加载事件失败: {str(e)}"}), 404
        
# 增加一个直接下载游戏静态资源的路由，处理JS和其他资源文件的引用问题
@app.route('/game-js/events/<path:filename>')
def game_events_json_direct(filename):
    events_dir = os.path.join(app.root_path, 'game', 'js')
    print(f"直接请求事件JSON文件: {filename}, 从目录: {events_dir}")
    try:
        return send_from_directory(events_dir, filename)
    except Exception as e:
        print(f"直接加载事件JSON文件出错: {e}")
        return jsonify({"error": f"直接加载事件失败: {str(e)}"}), 404

if __name__ == '__main__':
    # Use HTTPS in production
    app.run(debug=False, host='0.0.0.0')
