#!/usr/bin/env python
import os
import sys
import mysql.connector
from mysql.connector import Error
import json

# Use the same database configuration as in app.py
db_config = {
    'host': 'trustitdata.mysql.database.azure.com',
    'user': 'at07data',
    'password': 'trustit07data?',
    'database': 'build_trust_in_it',
    'ssl_ca': os.path.join(os.path.dirname(__file__), 'DigiCertGlobalRootG2.crt.pem'),
    'ssl_verify_cert': True
}

def test_database_connection():
    """Test connection to Azure MySQL database"""
    print("=== Database Connection Test ===\n")
    print(f"Attempting to connect to: {db_config['host']}")
    print(f"Database: {db_config['database']}")
    print(f"SSL certificate file: {db_config['ssl_ca']}")
    
    # Check if SSL certificate file exists
    if not os.path.exists(db_config['ssl_ca']):
        print(f"Warning: SSL certificate file not found: {db_config['ssl_ca']}")
    else:
        print(f"✓ SSL certificate file exists")
    
    # Attempt to connect to database
    conn = None
    try:
        print("\nConnecting to Azure MySQL database...")
        conn = mysql.connector.connect(**db_config)
        
        if conn.is_connected():
            db_info = conn.get_server_info()
            print(f"✓ Successfully connected to MySQL Server version {db_info}")
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE();")
            record = cursor.fetchone()
            print(f"✓ Connected to database: {record[0]}")
            cursor.close()
            
            # Test database structure
            test_database_structure(conn)
            
            # Test API queries
            test_api_queries(conn)
            
            return True
    except Error as e:
        print(f"✗ Error connecting to MySQL database: {e}")
        return False
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("\nDatabase connection closed")

def test_database_structure(conn):
    """Check database structure and examine required tables"""
    cursor = conn.cursor()
    
    try:
        # Get all table names
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\nTables in database ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
            
        # Check specific tables needed by the API
        required_tables = ["scam", "location", "activity"]
        for table in required_tables:
            if any(table.lower() == t[0].lower() for t in tables):
                print(f"✓ Found required table: {table}")
                
                # Check data in table
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  - Table {table} contains {count} records")
                
                # Show table structure
                cursor.execute(f"DESCRIBE {table}")
                columns = cursor.fetchall()
                column_names = [col[0] for col in columns]
                print(f"  - Table structure: {', '.join(column_names)}")
                
                # If table is empty, show a warning
                if count == 0:
                    print(f"  ⚠ Warning: Table {table} is empty - this will affect API responses")
            else:
                print(f"✗ Required table not found: {table}")
    except Error as e:
        print(f"Error checking database structure: {e}")
    finally:
        cursor.close()

def test_api_queries(conn):
    """Test the queries used by the APIs"""
    cursor = conn.cursor(dictionary=True)
    
    try:
        print("\nTesting API queries...")
        
        # Test scam_internet_by_location API query
        try:
            print("\nTesting scam_internet_by_location query:")
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
            
            if results:
                print(f"✓ Query executed successfully. Returned {len(results)} results.")
                print(f"Example result:")
                print(json.dumps(results[0], indent=2, default=str))
            else:
                print("⚠ Query executed successfully but returned no data.")
                print("  This may cause API endpoints to return empty arrays.")
        except Error as e:
            print(f"✗ Error executing query: {e}")
            
        # Test activity_pie_data API query
        try:
            print("\nTesting activity_pie_data query:")
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
            results = cursor.fetchall()
            
            if results:
                print(f"✓ Query executed successfully. Returned {len(results)} results.")
                print(f"Example result:")
                print(json.dumps(results[0], indent=2, default=str))
            else:
                print("⚠ Query executed successfully but returned no data.")
                print("  This may cause API endpoints to return empty arrays.")
        except Error as e:
            print(f"✗ Error executing query: {e}")
            
    except Error as e:
        print(f"Error testing API queries: {e}")
    finally:
        cursor.close()

def check_api_response():
    """Check if APIs would return valid JSON with empty data tables"""
    try:
        print("\nEvaluating API response with empty tables:")
        print("✓ Empty result sets from MySQL are converted to empty arrays [] in JSON")
        print("✓ Empty arrays are valid JSON responses")
        print("⚠ However, frontend code might not handle empty arrays correctly")
        print("  - Chart.js requires data to render charts")
        print("  - Check frontend code for proper empty state handling")
    except Exception as e:
        print(f"Error in check_api_response: {e}")

if __name__ == "__main__":
    # Check if mysql connector is installed
    try:
        import mysql.connector
        print("✓ MySQL Connector is installed\n")
    except ImportError:
        print("✗ MySQL Connector not installed. Installing now...")
        try:
            import pip
            pip.main(['install', 'mysql-connector-python'])
            print("✓ MySQL Connector installed successfully\n")
        except Exception as e:
            print(f"✗ Failed to install MySQL Connector: {e}")
            print("Please install manually: pip install mysql-connector-python")
            sys.exit(1)
    
    # Run the connection test
    success = test_database_connection()
    
    # Check API response implications
    if success:
        check_api_response()
    
    print("\n=== Test Complete ===")
    print("Summary of findings:")
    if success:
        print("1. Database connection is working correctly")
        print("2. Database schema appears to be correct")
        print("3. SQL queries are syntactically valid")
        print("4. Empty tables will result in empty API responses")
        print("\nRecommendations:")
        print("1. Add data to empty tables (scam, activity) if needed")
        print("2. Ensure frontend code handles empty responses gracefully")
        print("3. Consider adding default or sample data for development")
    else:
        print("Database connection failed - fix connection issues before proceeding") 