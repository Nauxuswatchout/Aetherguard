from flask import Flask, render_template, jsonify, request, session
import json
import os
from datetime import datetime
import time

app = Flask(__name__)
app.secret_key = 'zacks_digital_journey_secret_key'  # 用于session加密

# 添加模板上下文处理器
@app.context_processor
def inject_now():
    return {'now': datetime.now}

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
        'morning': ['js/morning-events.json'],
        'home':    ['js/home-events.json'],
        'phone':   ['js/phone-events.json'],
        'weekend': ['js/weekend-events.json', 'js/weekend-events-2.json']
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

# 初始化游戏状态
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
        'daily_event_completed': False  # 添加标记，记录当天是否已完成第二个事件
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_game')
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
def load_game():
    # TODO: 实现存档读取功能
    if 'game_state' not in session:
        session['game_state'] = init_game_state()
    return render_template('game.html')

@app.route('/get_game_state')
def get_game_state():
    return jsonify(session.get('game_state', init_game_state()))

@app.route('/update_game_state', methods=['POST'])
def update_game_state():
    try:
        game_state = request.json
        if game_state:
            session['game_state'] = game_state
            print(f"更新游戏状态: 天数={game_state.get('day')}, 完成事件数={len(game_state.get('completed_events', []))}")
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

@app.route('/get_event/<event_type>')
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
            has_day_condition = 'conditions' in event and 'day' in event['conditions'] and event['conditions']['day'] == game_state['day']
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
                    print(f"事件 {event['id']} 的状态条件不满足: {mapped_stat} 需要 {required_value}, 当前 {game_state[mapped_stat]}")
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
    app.run(debug=True) 