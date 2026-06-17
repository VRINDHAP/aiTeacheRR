import os
import uuid
import json
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import our services
from services.doc_processor import process_file
from services.gemini_service import generate_chat_response, generate_quiz

app = Flask(__name__)
# Enable CORS for all routes (development frontend runs on port 5173 by default)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
METADATA_FILE = os.path.join(UPLOAD_FOLDER, 'metadata.json')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {}
    try:
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading metadata.json: {e}")
        return {}

def save_metadata(metadata):
    try:
        with open(METADATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Error saving metadata.json: {e}")

@app.route('/api/health', methods=['GET'])
def health():
    has_key = bool(os.getenv("GEMINI_API_KEY"))
    return jsonify({
        "status": "healthy", 
        "time": str(datetime.datetime.now()),
        "gemini_api_key_configured": has_key
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        original_filename = secure_filename(file.filename)
        doc_id = str(uuid.uuid4())
        _, ext = os.path.splitext(original_filename)
        saved_filename = f"{doc_id}{ext}"
        saved_filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        
        # Save original file
        file.save(saved_filepath)
        
        # Process and extract text
        extracted_text = process_file(saved_filepath)
        
        # Save extracted text to a .txt file
        text_filename = f"{doc_id}.txt"
        text_filepath = os.path.join(app.config['UPLOAD_FOLDER'], text_filename)
        with open(text_filepath, 'w', encoding='utf-8') as f:
            f.write(extracted_text)
            
        # Update metadata
        metadata = load_metadata()
        metadata[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "saved_filename": saved_filename,
            "text_filename": text_filename,
            "size": os.path.getsize(saved_filepath),
            "text_len": len(extracted_text),
            "upload_time": datetime.datetime.now().isoformat()
        }
        save_metadata(metadata)
        
        return jsonify({
            "message": "File uploaded and processed successfully",
            "document": metadata[doc_id]
        })
        
    except Exception as e:
        print(f"Error uploading file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents', methods=['GET'])
def get_documents():
    metadata = load_metadata()
    return jsonify(list(metadata.values()))

@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    metadata = load_metadata()
    if doc_id not in metadata:
        return jsonify({"error": "Document not found"}), 404
        
    doc = metadata[doc_id]
    
    # Remove files
    try:
        saved_path = os.path.join(app.config['UPLOAD_FOLDER'], doc['saved_filename'])
        if os.path.exists(saved_path):
            os.remove(saved_path)
            
        text_path = os.path.join(app.config['UPLOAD_FOLDER'], doc['text_filename'])
        if os.path.exists(text_path):
            os.remove(text_path)
    except Exception as e:
        print(f"Error deleting file on disk: {e}")
        
    # Remove from metadata
    del metadata[doc_id]
    save_metadata(metadata)
    
    return jsonify({"message": "Document deleted successfully", "id": doc_id})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    user_prompt = data.get("prompt", "")
    history = data.get("history", [])
    selected_doc_ids = data.get("selected_doc_ids", [])
    
    # Grab API key from headers or env
    api_key = request.headers.get("X-Gemini-API-Key")
    
    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400
        
    # Build context from selected documents
    context_parts = []
    metadata = load_metadata()
    
    for doc_id in selected_doc_ids:
        if doc_id in metadata:
            text_filename = metadata[doc_id]['text_filename']
            text_filepath = os.path.join(app.config['UPLOAD_FOLDER'], text_filename)
            if os.path.exists(text_filepath):
                try:
                    with open(text_filepath, 'r', encoding='utf-8') as f:
                        doc_text = f.read()
                    context_parts.append(f"Document '{metadata[doc_id]['filename']}':\n{doc_text}")
                except Exception as e:
                    print(f"Error reading document text for {doc_id}: {e}")
                    
    combined_context = "\n\n".join(context_parts) if context_parts else None
    
    try:
        response_text = generate_chat_response(
            api_key=api_key,
            prompt=user_prompt,
            history=history,
            context=combined_context
        )
        return jsonify({"response": response_text})
    except Exception as e:
        print(f"Error in chat request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quiz', methods=['POST'])
def get_quiz():
    data = request.json or {}
    topic = data.get("topic", "")
    selected_doc_ids = data.get("selected_doc_ids", [])
    count = data.get("count", 5)
    
    api_key = request.headers.get("X-Gemini-API-Key")
    
    # Build text content reference
    quiz_context = ""
    if selected_doc_ids:
        metadata = load_metadata()
        context_parts = []
        for doc_id in selected_doc_ids:
            if doc_id in metadata:
                text_filepath = os.path.join(app.config['UPLOAD_FOLDER'], metadata[doc_id]['text_filename'])
                if os.path.exists(text_filepath):
                    try:
                        with open(text_filepath, 'r', encoding='utf-8') as f:
                            context_parts.append(f"Content from '{metadata[doc_id]['filename']}':\n{f.read()}")
                    except Exception as e:
                        print(f"Error reading file: {e}")
        quiz_context = "\n\n".join(context_parts)
        
    # If a topic was also provided, append it
    if topic:
        if quiz_context:
            quiz_context = f"Topic to focus on: {topic}\n\nSource Materials:\n{quiz_context}"
        else:
            quiz_context = topic
            
    if not quiz_context:
        return jsonify({"error": "Please provide a topic or select documents to generate a quiz."}), 400
        
    try:
        quiz_json = generate_quiz(api_key=api_key, topic_or_context=quiz_context, count=count)
        return jsonify(quiz_json)
    except Exception as e:
        print(f"Error in quiz generation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
