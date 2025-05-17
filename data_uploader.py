#!/usr/bin/env python
import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
import sys

# Database configuration - same as in app.py
db_config = {
    'host': 'trustitdata.mysql.database.azure.com',
    'user': 'at07data',
    'password': 'trustit07data?',
    'database': 'build_trust_in_it',
    'ssl_ca': os.path.join(os.path.dirname(__file__), 'DigiCertGlobalRootG2.crt.pem'),
    'ssl_verify_cert': True
}

def get_db_connection():
    """Get database connection using the same method as app.py"""
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        sys.exit(1)

def upload_activity_data(conn, csv_file):
    """Upload activity data from CSV to the database"""
    try:
        print(f"Reading activity data from {csv_file}...")
        activity_df = pd.read_csv(csv_file)
        
        # Get location data for mapping
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM location")
        location_data = cursor.fetchall()
        location_df = pd.DataFrame(location_data)
        
        # Merge dataframes to get location_id
        merged_df = activity_df.merge(location_df, how='left', left_on='state', right_on='location_name')
        
        # Check if any locations weren't matched
        if merged_df['location_id'].isnull().any():
            missing_states = merged_df[merged_df['location_id'].isnull()]['state'].unique()
            print(f"Warning: The following states could not be matched to locations: {', '.join(missing_states)}")
            print("These records will be skipped.")
            merged_df = merged_df.dropna(subset=['location_id'])
        
        # Prepare data for insertion
        cursor = conn.cursor()
        
        # Clear existing data if needed
        cursor.execute("DELETE FROM activity")
        conn.commit()
        print("Cleared existing activity data")
        
        # Insert records
        insert_query = """
        INSERT INTO activity (
            location_id, year_range, creative_activities, 
            screen_activities, reading_pleasure, gender
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        count = 0
        for _, row in merged_df.iterrows():
            values = (
                int(row['location_id']),
                row['year_range'],
                float(row['creative_activities']),
                float(row['screen_activities']),
                float(row['reading_pleasure']),
                row['gender']
            )
            cursor.execute(insert_query, values)
            count += 1
        
        conn.commit()
        cursor.close()
        print(f"Successfully inserted {count} activity records")
        return True
        
    except Exception as e:
        print(f"Error uploading activity data: {e}")
        return False

def upload_scam_data(conn, csv_file):
    """Upload scam data from CSV to the database"""
    try:
        print(f"Reading scam data from {csv_file}...")
        scam_df = pd.read_csv(csv_file)
        
        # Get location data for mapping
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM location")
        location_data = cursor.fetchall()
        location_df = pd.DataFrame(location_data)
        
        # Check for location_id column in original dataframe
        if 'location_id' in scam_df.columns:
            print("Warning: 'location_id' column already exists in scam data.")
            print("Renaming original column to avoid conflicts.")
            scam_df.rename(columns={'location_id': 'original_location_id'}, inplace=True)
        
        # Merge dataframes to get location_id
        merged_df = scam_df.merge(location_df, how='left', left_on='Address_State', right_on='location_name')
        
        # Check if any locations weren't matched
        if merged_df['location_id'].isnull().any():
            missing_states = merged_df[merged_df['location_id'].isnull()]['Address_State'].unique()
            print(f"Warning: The following states could not be matched to locations: {', '.join(map(str, missing_states))}")
            print("These records will be skipped.")
            merged_df = merged_df.dropna(subset=['location_id'])
        
        # Prepare data for insertion
        cursor = conn.cursor()
        
        # Clear existing data if needed
        cursor.execute("DELETE FROM scam")
        conn.commit()
        print("Cleared existing scam data")
        
        # Get column information
        # This is needed because we don't know the exact scam table structure
        cursor.execute("DESCRIBE scam")
        table_columns = [column[0] for column in cursor.fetchall()]
        print(f"Scam table columns: {', '.join(table_columns)}")
        
        # Prepare column string and placeholders for SQL
        # Exclude columns that shouldn't be in the INSERT
        excluded_columns = ['Address_State', 'location_name', 'StartOfMonth', 'original_location_id']
        valid_columns = []
        
        # Get all available columns from the merged dataframe
        for col in merged_df.columns:
            if col in table_columns and col not in excluded_columns and col != 'location_id':
                valid_columns.append(col)
        
        # Add location_id as the final column
        valid_columns.append('location_id')
        
        print(f"Columns for insertion: {', '.join(valid_columns)}")
        
        insert_query = f"""
        INSERT INTO scam ({', '.join(valid_columns)})
        VALUES ({', '.join(['%s'] * len(valid_columns))})
        """
        
        count = 0
        for _, row in merged_df.iterrows():
            values = []
            for col in valid_columns:
                if col == 'location_id':
                    values.append(int(row[col]))
                else:
                    values.append(row[col])
            
            cursor.execute(insert_query, tuple(values))
            count += 1
            
            # Print progress for large datasets
            if count % 100 == 0:
                print(f"Inserted {count} records...")
        
        conn.commit()
        cursor.close()
        print(f"Successfully inserted {count} scam records")
        return True
        
    except Exception as e:
        print(f"Error uploading scam data: {e}")
        conn.rollback()  # Rollback transaction on error
        return False

def main():
    print("Database Data Uploader")
    print("======================")
    
    # Check if CSV files exist
    activity_file = 'activity_refined.csv'
    scam_file = 'scam_data_refined.csv'
    
    if not os.path.exists(activity_file):
        print(f"Error: Activity data file '{activity_file}' not found!")
        return False
    
    if not os.path.exists(scam_file):
        print(f"Error: Scam data file '{scam_file}' not found!")
        return False
    
    # Connect to database
    print("Connecting to database...")
    conn = get_db_connection()
    if not conn:
        return False
    
    print("Connection successful!")
    
    # Upload data
    activity_success = upload_activity_data(conn, activity_file)
    scam_success = upload_scam_data(conn, scam_file)
    
    # Close connection
    conn.close()
    
    # Summary
    print("\nUpload Summary:")
    print(f"Activity data: {'SUCCESS' if activity_success else 'FAILED'}")
    print(f"Scam data: {'SUCCESS' if scam_success else 'FAILED'}")
    
    return activity_success and scam_success

if __name__ == "__main__":
    main() 