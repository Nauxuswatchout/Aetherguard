import json

from flask import Flask, render_template, jsonify, request, redirect, url_for, session, abort
import mysql.connector
from typing import List
# import pymysql
import os
import datetime
import time

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

def get_db_connection():
    connection = mysql.connector.connect(
        host='trustitdata.mysql.database.azure.com',
        user='at07data',
        password='trustit07data?',
        database='build_trust_in_it',
        ssl_ca=os.path.join(os.path.dirname(__file__), 'DigiCertGlobalRootG2.crt.pem'),
        ssl_verify_cert=True,
        use_pure=True
    )
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
            session.pop('authenticated', None)
            return redirect(url_for('login'))

    wrapper.__name__ = route_function.__name__
    return wrapper


@app.route('/')
def login():
    # Force login on root access
    session.pop('authenticated', None)
    return render_template('login.html')


@app.route('/verify', methods=['POST'])
def verify_password():
    password = request.form.get('password')
    if password == PASSWORD:
        # Create session data
        session.pop('authenticated', None)
        session['authenticated'] = True
        session['login_time'] = time.time()
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
    return render_template('index.html', title='Home')


@app.route('/logout')
def logout():
    session.pop('authenticated', None)
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


# Clear session cookies for every request
@app.before_request
def clear_session_on_root():
    if request.path == '/':
        session.pop('authenticated', None)


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
    return render_template('children/children_lulu.html', title="Interactive Learning for children")


@app.route('/children/children_lulu/cyberbullying')
def children_cyberbullying_page():
    return render_template('children/children_cyberbullying.html', title="Cyberbullying for children")


@app.route('/children/children_lulu/phishing')
def children_phishing_page():
    return render_template('children/children_phishing.html', title="Phishing for children")


@app.route('/children/children_lulu/apps_permissions')
def children_permissions_page():
    return render_template('children/children_permissions.html', title="App pwemissions for children")


ALLOWED_TABLES = ["app_permissions", "cyberbullying", "phishing_data"]


@app.route("/random_records/<table_name>", methods=["GET"])
def get_random_records(table_name: str):
    if table_name not in ALLOWED_TABLES:
        abort(400, description="Invalid table name")
    print("connecting to database...")
    connection = get_db_connection()
    if connection.is_connected():
        cursor = connection.cursor(dictionary=True)
        query = f"SELECT * FROM {table_name} ORDER BY RAND() LIMIT 4;"
        cursor.execute(query)

        # Fetch all the rows from the executed query
        result = cursor.fetchall()

        # Return the result as JSON
        return jsonify(result)
    print("connection is closed")


# 游戏部分

# 加载事件数据
def load_events():
    events = {
        'morning': [],
        'home': [],
        'phone': [],
        'weekend': []  # 支持周末事件
    }

    # 定义事件文件路径，周末事件支持多个文件
    event_files = {
        'morning': ['json/morning-events.json'],
        'home': ['json/home-events.json'],
        'phone': ['json/phone-events.json'],
        'weekend': ['json/weekend-events.json', 'json/weekend-events-2.json']
    }

    for event_type, paths in event_files.items():
        all_events = []
        for file_path in paths:
            try:
                print(f"尝试加载事件文件: {file_path}")
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'events' in data:
                            all_events.extend(data['events'])
                            print(f"成功加载 {event_type} 事件: {len(data['events'])} 个 from {file_path}")
                        else:
                            print(f"错误: {file_path} 中没有 'events' 字段")
                else:
                    print(f"错误: 找不到文件 {file_path}")
            except Exception as e:
                print(f"加载 {event_type} 事件时出错: {e}")
        events[event_type] = all_events

    # 打印加载结果
    print(f"事件加载结果:")
    for event_type, event_list in events.items():
        print(f"  {event_type}: {len(event_list)} 个事件")

    return events


def init_game_state():
    return {
        'day': 1,
        'chapter': 1,
        'fans': 0,
        'health': 100,
        'social': 50,
        'security': 50,
        'completed_events': [],
        'current_event': None,
        'daily_event_completed': False
    }


# 添加模板上下文处理器
@app.context_processor
def inject_now():
    return {'now': datetime.datetime.now}


@app.route('/children/children_zack')
@login_required
def zack_page():
    return render_template('game_index.html', title="Zack's Game")


@app.route('/new_game')
@login_required
def new_game():
    # 如果URL中带有时间戳参数，表示是从startNewDay跳转过来的，保留现有状态
    # 否则是全新游戏，初始化状态
    if request.args.get('t'):
        print("通过时间戳跳转，保留现有游戏状态")
        if 'game_state' not in session:
            print("错误: 会话中没有游戏状态，初始化新状态")
            session['game_state'] = init_game_state()
    else:
        print("开始全新游戏，初始化游戏状态")
        session['game_state'] = init_game_state()

    return render_template('game.html')

@app.route('/load_game')
@login_required
def load_game():
    if 'game_state' not in session:
        session['game_state'] = init_game_state()
    return render_template('game.html')


@app.route('/get_game_state')
@login_required
def get_game_state():
    return jsonify(session.get('game_state', init_game_state()))


@app.route('/update_game_state', methods=['POST'])
@login_required
def update_game_state():
    try:
        game_state = request.json
        if game_state:
            session['game_state'] = game_state
            print(
                f"更新游戏状态: 天数={game_state.get('day')}, 完成事件数={len(game_state.get('completed_events', []))}")
            return jsonify({
                'status': 'success',
                'state': game_state
            })
        else:
            print("错误: 请求中没有游戏状态数据")
            return jsonify({'status': 'error', 'message': 'No game state data in request'}), 400
    except Exception as e:
        print(f"更新游戏状态时出错: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# 调试事件
@app.route('/get_event/<event_type>')
@login_required
def get_event(event_type):
    print(f"请求事件类型: {event_type}")
    events = load_events()

    # 检查事件类型是否有效
    if event_type not in events:
        print(f"无效的事件类型: {event_type}")
        return jsonify({'error': 'Invalid event type', 'type': event_type})

    # 检查是否有此类型的事件
    if not events[event_type]:
        print(f"没有加载到任何 {event_type} 类型的事件")
        return jsonify({
            'error': 'No events of this type loaded',
            'type': event_type
        })

    # 获取游戏状态
    game_state = session.get('game_state', init_game_state())
    available_events = []

    # 根据条件筛选可用事件
    for event in events[event_type]:
        # 检查事件是否有ID
        if 'id' not in event:
            print(f"警告: 发现没有ID的事件，跳过")
            continue

        # 检查事件是否可用
        if is_event_available(event, game_state):
            # 特别标记具有当天日期条件的事件
            has_day_condition = 'conditions' in event and 'day' in event['conditions'] and event['conditions']['day'] == \
                                game_state['day']
            available_events.append({
                'event': event,
                'has_day_condition': has_day_condition
            })
            print(f"找到可用事件: {event['id']}" + (" (匹配当天日期)" if has_day_condition else ""))

    # 检查是否有可用事件
    if available_events:
        # 优先选择匹配当前天数的事件
        day_matching_events = [e['event'] for e in available_events if e['has_day_condition']]

        if day_matching_events:
            # 有匹配当天日期的事件，优先选择
            selected_event = day_matching_events[0]
            print(f"选择了匹配当天 (Day {game_state['day']}) 的事件: {selected_event['id']}")
        else:
            # 没有匹配的日期，选择第一个可用事件
            selected_event = available_events[0]['event']
            print(f"无匹配当天的事件，选择首个可用事件: {selected_event['id']}")

        # 确保事件有type属性
        selected_event['type'] = event_type
        print(f"返回事件: {selected_event['id']}, 类型: {event_type}")

        # 确保事件有必要的字段
        if 'dialogues' not in selected_event and 'dialogs' in selected_event:
            selected_event['dialogues'] = selected_event['dialogs']

        # 打印完整事件结构以便调试
        print(f"事件结构: {list(selected_event.keys())}")

        return jsonify(selected_event)
    else:
        # 如果没有可用事件，返回特殊标记
        print(f"没有可用的 {event_type} 事件")
        return jsonify({
            'error': 'No available events',
            'type': event_type,
            'day': game_state['day']
        })


def is_event_available(event, game_state):
    """
    检查事件是否可用，考虑完成状态、天数和章节条件
    返回值: (bool, int) - 是否可用，优先级（数字越小优先级越高）
    """
    # 检查事件是否已完成
    if event['id'] in game_state.get('completed_events', []):
        print(f"事件 {event['id']} 已完成，不可用")
        return False

    # 检查事件条件
    priority = 100  # 默认优先级
    has_day_condition = False

    # 检查是否有条件
    if 'conditions' in event:
        conditions = event['conditions']

        # 检查天数条件，这是最高优先级
        if 'day' in conditions:
            has_day_condition = True
            if conditions['day'] != game_state['day']:
                print(f"事件 {event['id']} 的天数条件不满足: 需要 {conditions['day']}, 当前 {game_state['day']}")
                return False
            else:
                # 如果天数匹配，优先级设为最高
                priority = 1
                print(f"事件 {event['id']} 天数条件匹配: {game_state['day']}")

        # 检查章节条件
        if 'chapter' in conditions and conditions['chapter'] != game_state['chapter']:
            print(f"事件 {event['id']} 的章节条件不满足: 需要 {conditions['chapter']}, 当前 {game_state['chapter']}")
            return False

        # 检查状态条件
        if 'stats' in conditions:
            for stat, required_value in conditions['stats'].items():
                mapped_stat = map_stat_key(stat)
                if mapped_stat in game_state and game_state[mapped_stat] < required_value:
                    print(
                        f"事件 {event['id']} 的状态条件不满足: {mapped_stat} 需要 {required_value}, 当前 {game_state[mapped_stat]}")
                    return False

    # 为明确天数条件的事件设置更高优先级
    if has_day_condition:
        print(f"事件 {event['id']} 有天数条件 [{game_state['day']}]，优先级 [1]")
    else:
        print(f"事件 {event['id']} 没有天数条件，普通优先级")

    print(f"事件 {event['id']} 符合所有条件，可用")
    return True


def map_stat_key(stat_key):
    # 映射事件文件中的状态键到游戏状态键
    mapping = {
        'privacy': 'security',
        'safety_awareness': 'security',
        'privacy_awareness': 'security',
        'mental_health': 'health',
        'social_awareness': 'social',
        'tech_savvy': 'security',
        'reputation': 'fans'
    }
    return mapping.get(stat_key, stat_key)


@app.route('/test_events')
@login_required
def test_events():
    """测试路由，用于显示所有可用事件的基本信息"""
    events = load_events()
    event_summary = {}

    for event_type, event_list in events.items():
        event_summary[event_type] = []
        for event in event_list:
            event_info = {
                'id': event.get('id', 'unknown'),
                'title': event.get('title', 'No Title'),
                'conditions': event.get('conditions', {}),
                'dialogues_count': len(event.get('dialogues', event.get('dialogs', [])))
            }
            event_summary[event_type].append(event_info)

    return jsonify({
        'event_counts': {k: len(v) for k, v in events.items()},
        'events': event_summary
    })


@app.route('/test_next_event/<current_event_type>')
def test_next_event(current_event_type):
    """测试路由，用于直接测试从一种事件类型转跳到下一种事件类型"""
    print(f"测试从 {current_event_type} 转跳到下一个事件")

    if current_event_type == 'morning':
        # 从早晨事件转跳到家庭或手机事件
        event_type = 'home'  # 固定使用home事件进行测试
        print(f"测试转跳到 {event_type} 事件")

        events = load_events()
        if event_type in events and events[event_type]:
            selected_event = events[event_type][0]
            selected_event['type'] = event_type
            print(f"测试返回事件: {selected_event['id']}, 类型: {event_type}")
            return jsonify(selected_event)
        else:
            return jsonify({'error': 'No test events available'})
    else:
        return jsonify({'error': 'Invalid current event type for testing'})


@app.route('/force_next_event')
def force_next_event():
    """强制加载下一个事件的页面"""
    return render_template('force_next.html')


@app.route('/force_event')
def force_event():
    """强制加载特定类型的事件"""
    event_type = request.args.get('type', 'home')
    print(f"强制加载事件类型: {event_type}")

    # 保存到session中，以便在game.js中使用
    game_state = session.get('game_state', init_game_state())

    # 直接从事件列表中获取第一个可用事件
    events = load_events()
    if event_type in events and events[event_type]:
        # 获取第一个事件
        for event in events[event_type]:
            # 跳过已完成的事件
            if event['id'] in game_state.get('completed_events', []):
                continue

            # 找到了可用事件
            game_state['force_event_type'] = event_type
            game_state['force_event_id'] = event['id']
            session['game_state'] = game_state

            print(f"找到可用事件: {event['id']}")
            break
    else:
        print(f"没有找到 {event_type} 类型的事件")

    return render_template('game.html')


@app.route('/force_quiz')
def force_quiz():
    """强制进入答题环节（用于调试）"""
    try:
        print(f"强制进入答题环节")
        return render_template('game.html', now=lambda: int(time.time()))
    except Exception as e:
        print(f"强制进入答题环节失败: {e}")
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    # Use HTTPS in production
    app.run(debug=False, host='0.0.0.0')
