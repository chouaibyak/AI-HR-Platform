from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from flask_cors import CORS
import logging

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialiser Firebase
cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)
# Configuration CORS plus permissive
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

#  Créer une offre
@app.route('/jobs', methods=['POST'])
def create_job():
    logger.debug("Requête POST reçue sur /jobs")
    logger.debug(f"Headers: {dict(request.headers)}")
    logger.debug(f"Data: {request.get_json()}")
    
    data = request.get_json()
    job_id = str(uuid.uuid4())
    job_ref = db.collection('jobs').document(job_id)
    job_data = {
        'id': job_id,
        'title': data.get('title'),
        'description': data.get('description'),
        'company': data.get('company'),
        'location': data.get('location'),
        'skills': data.get('skills', []),
        'recruiter_id': data.get('recruiter_id'),
        'created_at': firestore.SERVER_TIMESTAMP
    }
    job_ref.set(job_data)
    logger.debug(f"Job créé avec succès: {job_data}")
    return jsonify(job_data), 201

#  Lire toutes les offres
@app.route('/jobs', methods=['GET'])
def get_all_jobs():
    logger.debug("Requête GET reçue sur /jobs")
    jobs = db.collection('jobs').stream()
    job_list = [doc.to_dict() for doc in jobs]
    logger.debug(f"Nombre d'offres trouvées: {len(job_list)}")
    return jsonify(job_list), 200

#  Lire les offres d'un recruteur
@app.route('/jobs/recruiter/<recruiter_id>', methods=['GET'])
def get_recruiter_jobs(recruiter_id):
    logger.debug(f"Requête GET reçue sur /jobs/recruiter/{recruiter_id}")
    jobs = db.collection('jobs').where('recruiter_id', '==', recruiter_id).stream()
    job_list = [doc.to_dict() for doc in jobs]
    logger.debug(f"Nombre d'offres trouvées pour le recruteur: {len(job_list)}")
    return jsonify(job_list), 200

#  Lire une offre par ID
@app.route('/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    logger.debug(f"Requête GET reçue sur /jobs/{job_id}")
    doc = db.collection('jobs').document(job_id).get()
    if not doc.exists:
        logger.warning(f"Job non trouvé: {job_id}")
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(doc.to_dict()), 200

#  Modifier une offre
@app.route('/jobs/<job_id>', methods=['PUT'])
def update_job(job_id):
    logger.debug(f"Requête PUT reçue sur /jobs/{job_id}")
    doc_ref = db.collection('jobs').document(job_id)
    if not doc_ref.get().exists:
        logger.warning(f"Job non trouvé pour mise à jour: {job_id}")
        return jsonify({'error': 'Job not found'}), 404
    data = request.get_json()
    doc_ref.update(data)
    logger.debug(f"Job mis à jour avec succès: {job_id}")
    return jsonify({'message': 'Job updated'}), 200

#  Supprimer une offre
@app.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    logger.debug(f"Requête DELETE reçue sur /jobs/{job_id}")
    doc_ref = db.collection('jobs').document(job_id)
    if not doc_ref.get().exists:
        logger.warning(f"Job non trouvé pour suppression: {job_id}")
        return jsonify({'error': 'Job not found'}), 404
    doc_ref.delete()
    logger.debug(f"Job supprimé avec succès: {job_id}")
    return jsonify({'message': 'Job deleted'}), 200

# Lancer le microservice
if __name__ == '__main__':
    logger.info("Démarrage du serveur sur le port 5002...")
    app.run(port=5002, debug=True)