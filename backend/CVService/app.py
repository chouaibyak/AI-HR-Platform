from flask import Flask, Blueprint, request, jsonify, send_from_directory, send_file
import os
import uuid
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from urllib.parse import unquote

# Initialiser Firebase une seule fois
cred = credentials.Certificate("../../firebase/firebase_admin_key.json") 
firebase_admin.initialize_app(cred)
db = firestore.client()

# Création du blueprint
cv_bp = Blueprint('cv', __name__)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')

# S'assurer que le dossier existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Route pour uploader un CV
@cv_bp.route('/upload', methods=['POST'])
def upload_cv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    print(f"Received file: {file.filename}")
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    #enregistrement dans firestore
    doc_ref = db.collection('cvs').document()
    doc_ref.set({
        'original_filename': file.filename,
        'saved_filename': filename,
        'upload_time': datetime.utcnow().isoformat() + 'Z',
        'user_id': request.form.get('user_id') 
    })

    return jsonify({'message': 'Upload successful', 'filename': filename}), 200

# Route pour récupérer un fichier
@cv_bp.route('/download/<filename>', methods=['GET'])
def download_cv(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

#Route pour supprimer un fichier
@cv_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_cv(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Supprimer le fichier du système de fichiers
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Supprimer le document Firestore correspondant
        docs = db.collection('cvs').where('saved_filename', '==', filename).stream()
        for doc in docs:
            doc.reference.delete()
        
        return jsonify({'message': 'Fichier supprimé avec succès'}), 200
    except Exception as e:
        print(f"Erreur lors de la suppression: {str(e)}")
        return jsonify({'error': str(e)}), 500

#view CV
@cv_bp.route('/view/<uuid_part>', methods=['GET'])
def view_cv(uuid_part):
    try:
        # Cherche le fichier qui commence par l'UUID fourni
        matching_files = [f for f in os.listdir(UPLOAD_FOLDER) 
                        if f.startswith(uuid_part)]
        
        if not matching_files:
            return jsonify({
                'error': 'File not found',
                'debug_info': {
                    'requested_uuid': uuid_part,
                    'available_files': os.listdir(UPLOAD_FOLDER)
                }
            }), 404

        if len(matching_files) > 1:
            print(f"Attention : plusieurs fichiers correspondent à l'UUID {uuid_part}")

        filepath = os.path.join(UPLOAD_FOLDER, matching_files[0])
        return send_file(filepath, mimetype='application/pdf', as_attachment=False)
        
    except Exception as e:
        print(f"Erreur : {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_bp.route('/list', methods=['GET'])
def list_cvs():
    try:
        # Récupérer tous les CVs de Firestore
        docs = db.collection('cvs').stream()
        cvs = []
        
        for doc in docs:
            cv_data = doc.to_dict()
            cv_data['id'] = doc.id  # Ajouter l'ID du document
            cvs.append(cv_data)
            
        return jsonify({'cvs': cvs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cv_bp.route('/get/<cv_id>', methods=['GET'])
def get_cv(cv_id):
    try:
        doc_ref = db.collection('cvs').document(cv_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'CV not found'}), 404
            
        return jsonify(doc.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Configuration de l'application Flask
app = Flask(__name__)
CORS(app, resources={
    r"/cv/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

app.register_blueprint(cv_bp, url_prefix='/cv')

if __name__ == '__main__':
    app.run(debug=True, port=5001)