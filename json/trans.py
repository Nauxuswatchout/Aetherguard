from json_trans import translate_json_google

translate_json_google(
    input_file="weekend-events-2.json",
    output_file="output.json",
    fields_to_translate=["text", "title"],
    credentials_path="path/to/google_credentials.json"
)