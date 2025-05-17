import json
import random

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

@app.route('/learning_journey')
@login_required
def learning_journey():
    return render_template('learning_journey.html', title='Learning Journey')

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
    return render_template('children/children_permissions.html', title="App permissions for children")


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


# Game part

# Load event data
def load_events():
    events = {
        'morning': [],
        'home': [],
        'phone': [],
        'weekend': [],  # Support weekend events
        'ending': []    # Support ending events
    }

    # Define event file paths, support multiple files for weekend events
    event_files = {
        'morning': ['json/morning-events.json'],
        'home': ['json/home-events.json'],
        'phone': ['json/phone-events.json'],
        'weekend': ['json/weekend-events.json', 'json/weekend-events-2.json'],
        'ending': ['json/ending-events.json']
    }

    for event_type, paths in event_files.items():
        all_events = []
        for file_path in paths:
            try:
                print(f"Trying to load event file: {file_path}")
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'events' in data:
                            all_events.extend(data['events'])
                            print(f"Successfully loaded {event_type} events: {len(data['events'])} from {file_path}")
                        elif event_type == 'ending' and 'dialogues' in data:
                            # Special handling for ending event file format
                            ending_event = data
                            all_events.append(ending_event)
                            print(f"Successfully loaded ending event: {ending_event.get('id', 'unknown')} from {file_path}")
                        else:
                            print(f"Error: No 'events' field in {file_path}")
                else:
                    print(f"Error: File not found {file_path}")
            except Exception as e:
                print(f"Error loading {event_type} events: {e}")
        events[event_type] = all_events

    # Print loading results
    print(f"Event loading results:")
    for event_type, event_list in events.items():
        print(f"  {event_type}: {len(event_list)} events")

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


# Add template context processor
@app.context_processor
def inject_now():
    return {'now': datetime.datetime.now}


@app.route('/children/children_zack')
@login_required
def zack_page():
    return render_template('game_index.html', title="Zack's Game")


@app.route('/reset_game')
@login_required
def reset_game():
    """Clear game state and cache, start a new game"""
    if 'game_state' in session:
        session.pop('game_state')
    # Return with cache control header
    response = redirect(url_for('new_game'))
    # Add cache control header to prevent browser caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/new_game')
@login_required
def new_game():
    # 如果URL中带有时间戳参数，表示是从startNewDay跳转过来的，保留现有状态
    # 否则是全新游戏，初始化状态
    if request.args.get('t'):
        print("Redirected with timestamp, preserving existing game state")
        if 'game_state' not in session:
            print("Error: No game state in session, initializing new state")
            session['game_state'] = init_game_state()
    else:
        print("Starting new game, initializing game state")
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
                f"Updated game state: day={game_state.get('day')}, completed events={len(game_state.get('completed_events', []))}")
            return jsonify({
                'status': 'success',
                'state': game_state
            })
        else:
            print("Error: No game state data in request")
            return jsonify({'status': 'error', 'message': 'No game state data in request'}), 400
    except Exception as e:
        print(f"Error updating game state: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# Debug events
@app.route('/get_event/<event_type>')
@login_required
def get_event(event_type):
    print(f"Requested event type: {event_type}")
    
    # Get additional day parameter, for client to explicitly specify current day
    specified_day = request.args.get('day')
    if specified_day:
        try:
            specified_day = int(specified_day)
            print(f"Day specified in request: {specified_day}")
        except ValueError:
            specified_day = None
    
    # Special handling: If the first day request phone event, directly return PhoneEvent-17
    if event_type == 'phone' and (specified_day == 1 or (not specified_day and session.get('game_state', {}).get('day') == 1)):
        print("Detected day 1 phone event request, trying to return PhoneEvent-17 directly")
        
        events = load_events()
        for event in events['phone']:
            if event.get('id') == 'PhoneEvent-17':
                print("Found PhoneEvent-17, returning this event")
                
                # Confirm its conditions
                if 'conditions' in event and 'day' in event['conditions'] and event['conditions']['day'] == 1:
                    print("PhoneEvent-17 day condition matches current day 1")
                    
                    # Check if it has been completed
                    game_state = session.get('game_state', init_game_state())
                    if 'PhoneEvent-17' in game_state.get('completed_events', []):
                        print("PhoneEvent-17 already completed, should not trigger")
                    else:
                        print("PhoneEvent-17 not completed, can trigger")
                        
                        # Directly return PhoneEvent-17
                        event_copy = event.copy()
                        event_copy['type'] = 'phone'
                        print(f"Directly returning PhoneEvent-17, structure: {list(event_copy.keys())}")
                        
                        # Ensure there is a dialogues field
                        if 'dialogues' not in event_copy and 'dialogs' in event_copy:
                            event_copy['dialogues'] = event_copy['dialogs']
                            
                        return jsonify(event_copy)
                else:
                    print("Warning: PhoneEvent-17 does not have correct day condition set")
                    break
        
        print("PhoneEvent-17 not found or event conditions not met")
    
    events = load_events()

    # Check if the event type is valid
    if event_type not in events:
        print(f"Invalid event type: {event_type}")
        return jsonify({'error': 'Invalid event type', 'type': event_type})

    # Check if there is any event of this type
    if not events[event_type]:
        print(f"No events of type {event_type} loaded")
        return jsonify({
            'error': 'No events of this type loaded',
            'type': event_type
        })

    # Get game state
    game_state = session.get('game_state', init_game_state())
    
    # If the URL specifies a day, temporarily use this day to find events
    original_day = game_state['day']
    if specified_day:
        print(f"Using specified day {specified_day} to select events (original day: {original_day})")
        game_state = game_state.copy()  # Create a copy to avoid modifying the original state
        game_state['day'] = specified_day
    
    # Special handling for events of specified day
    day_specific_events = []
    other_available_events = []
    all_events = []  # Store all events that have not been completed
    
    print(f"Starting to check {event_type} type events, current day: {game_state['day']}")
    
    # For phone event type, specially check PhoneEvent-17
    if event_type == 'phone':
        print("Special check for PhoneEvent-17 status:")
        phone17 = next((e for e in events['phone'] if e.get('id') == 'PhoneEvent-17'), None)
        if phone17:
            print(f"Found PhoneEvent-17 event, checking conditions:")
            if 'conditions' in phone17 and 'day' in phone17['conditions']:
                print(f"PhoneEvent-17 day condition: {phone17['conditions']['day']}, current day: {game_state['day']}")
                if phone17['conditions']['day'] == game_state['day']:
                    print("PhoneEvent-17 day condition matches current day!")
                    if phone17['id'] in game_state.get('completed_events', []):
                        print("But PhoneEvent-17 already completed")
                    else:
                        print("PhoneEvent-17 not completed, should be available")
            else:
                print("PhoneEvent-17 has no day condition or conditions field")
        else:
            print("PhoneEvent-17 not found, please check event ID")
    
    # Iterate through all events
    for event in events[event_type]:
        # Check if the event has an ID
        if 'id' not in event:
            print(f"Warning: Found event without ID, skipping")
            continue
        
        # If the event has not been completed, add to all events list
        if event['id'] not in game_state.get('completed_events', []):
            all_events.append(event)
            
            # Check if there is a day condition
            has_day_condition = 'conditions' in event and 'day' in event['conditions']
            if has_day_condition:
                print(f"Event {event['id']} has day condition: {event['conditions']['day']}")
                # If the day condition matches the current day
                if event['conditions']['day'] == game_state['day']:
                    print(f"Event {event['id']} day condition matches current day {game_state['day']}, high priority")
                    day_specific_events.append(event)
                    continue
            
            # Check other conditions of the event
            if is_event_available(event, game_state):
                print(f"Event {event['id']} meets other conditions")
                other_available_events.append(event)
    
    # Restore original day
    if specified_day:
        print(f"Restoring original day: {original_day}")
        game_state['day'] = original_day
    
    # Select event with priority:
    # 1. Day-specific events
    # 2. Other available events (randomly)
    # 3. Any uncompleted events (randomly)
    selected_event = None
    
    if day_specific_events:
        selected_event = day_specific_events[0]
        print(f"Selected day-specific event: {selected_event['id']}")
    elif other_available_events:
        selected_event = random.choice(other_available_events)
        print(f"Selected random available event: {selected_event['id']}")
    elif all_events:
        selected_event = random.choice(all_events)
        print(f"Selected random uncompleted event: {selected_event['id']}")
    else:
        print(f"No available {event_type} events found")
        return jsonify({
            'error': 'No available events',
            'type': event_type
        })
    
    # Ensure the event has a type property
    selected_event['type'] = event_type
    print(f"Returning event: {selected_event['id']}, type: {event_type}")
    
    # Ensure the event has necessary fields
    if 'dialogues' not in selected_event and 'dialogs' in selected_event:
        selected_event['dialogues'] = selected_event['dialogs']
    
    # Print the keys of the event, help debug
    print(f"Event structure: {list(selected_event.keys())}")
    
    return jsonify(selected_event)


def is_event_available(event, game_state):
    """
    Check if the event is available, consider completed status, day and chapter conditions
    """
    # Check if the event has been completed
    if event['id'] in game_state.get('completed_events', []):
        print(f"Event {event['id']} already completed, not available")
        return False

    # Check event conditions
    if 'conditions' in event:
        conditions = event['conditions']

        # Check day condition, this is the highest priority
        if 'day' in conditions:
            # Print detailed information for debugging
            print(f"Event {event['id']} has day condition: day={conditions['day']}, current day={game_state['day']}")
            
            if conditions['day'] != game_state['day']:
                print(f"Event {event['id']} day condition not met: needs {conditions['day']}, current {game_state['day']}")
                return False
            else:
                print(f"Event {event['id']} day condition matches: {game_state['day']}")

        # Check chapter condition
        if 'chapter' in conditions and conditions['chapter'] != game_state['chapter']:
            print(f"Event {event['id']} chapter condition not met: needs {conditions['chapter']}, current {game_state['chapter']}")
            return False

        # Check status condition
        if 'stats' in conditions:
            for stat, required_value in conditions['stats'].items():
                mapped_stat = map_stat_key(stat)
                if mapped_stat in game_state and game_state[mapped_stat] < required_value:
                    print(f"Event {event['id']} stat condition not met: {mapped_stat} needs {required_value}, current {game_state[mapped_stat]}")
                    return False

    # If all checks pass, the event is available
    print(f"Event {event['id']} meets all conditions, available")
    return True


def map_stat_key(stat_key):
    # Map the status keys in event files to game state keys
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
    """Test route, for displaying basic information about all available events"""
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
    """Test route, for directly testing transition from one event type to the next"""
    print(f"Testing transition from {current_event_type} to next event")

    if current_event_type == 'morning':
        # Transition from morning event to home or phone event
        event_type = 'home'  # Fixed to use home event for testing
        print(f"Testing transition to {event_type} event")

        events = load_events()
        if event_type in events and events[event_type]:
            selected_event = events[event_type][0]
            selected_event['type'] = event_type
            print(f"Test returning event: {selected_event['id']}, type: {event_type}")
            return jsonify(selected_event)
        else:
            return jsonify({'error': 'No test events available'})
    else:
        return jsonify({'error': 'Invalid current event type for testing'})


@app.route('/force_next_event')
def force_next_event():
    """Force loading the page of the next event"""
    return render_template('force_next.html')


@app.route('/force_event')
def force_event():
    """Force loading a specific type of event"""
    event_type = request.args.get('type', 'home')
    print(f"Force loading event type: {event_type}")

    # Save to session, so it can be used in game.js
    game_state = session.get('game_state', init_game_state())

    # Get the first available event from the event list
    events = load_events()
    if event_type in events and events[event_type]:
        # Get the first event
        for event in events[event_type]:
            # Skip completed events
            if event['id'] in game_state.get('completed_events', []):
                continue

            # Found an available event
            game_state['force_event_type'] = event_type
            game_state['force_event_id'] = event['id']
            session['game_state'] = game_state

            print(f"Found available event: {event['id']}")
            break
    else:
        print(f"No {event_type} type events found")

    return render_template('game.html')


@app.route('/force_quiz')
def force_quiz():
    """Force entering the quiz"""
    try:
        print(f"Forcing quiz entry")
        return render_template('game.html', now=lambda: int(time.time()))
    except Exception as e:
        print(f"Failed to force quiz entry: {e}")
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    # Use HTTPS in production
    app.run(debug=False, host='0.0.0.0')
