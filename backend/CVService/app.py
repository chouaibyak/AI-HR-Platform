from flask import Flask, Blueprint, request, jsonify, send_from_directory
import os
import uuid
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime


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
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'message': 'Fichier supprimé avec succès'}), 200
    else:
        return jsonify({'error': 'Fichier introuvable'}), 404


# Configuration de l'application Flask
app = Flask(__name__)
CORS(app)  # 👈 active le CORS

app.register_blueprint(cv_bp, url_prefix='/cv')

if __name__ == '__main__':
    app.run(debug=True, port=5001)