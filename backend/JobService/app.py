from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore, auth  # Correction ici
import uuid
from flask_cors import CORS
import logging
from functools import wraps

# Initialisation Firebase
cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True
    }
})

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Décorateur verify_token corrigé
def verify_token(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(token)
            
            # Récupération sécurisée de l'UID
            uid = decoded_token.get('uid')  # Firebase utilise 'uid' par défaut
            if not uid:
                logger.error("UID non trouvé dans le token")
                return jsonify({'error': 'Authentification invalide'}), 401
            
            request.user = {'uid': uid}
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erreur token: {str(e)}")
            return jsonify({'error': 'Token invalide'}), 401
    return wrapper

def is_recruiter(uid):
    try:
        # 1. Vérifiez d'abord les claims du token
        user = auth.get_user(uid)
        if user.custom_claims and user.custom_claims.get('role') == 'recruiter':
            return True
            
        # 2. Fallback: vérifiez Firestore
        user_doc = db.collection('users').document(uid).get()
        if user_doc.exists:
            return user_doc.to_dict().get('role') == 'recruiter'
            
        return False
    except Exception as e:
        logger.error(f"Erreur vérification rôle: {e}")
        return False

def recruiter_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not hasattr(request, 'user'):
            return jsonify({'error': 'Authentification requise'}), 401
            
        uid = request.user.get('uid')
        if not uid:
            return jsonify({'error': 'UID utilisateur manquant'}), 401
            
        if not is_recruiter(uid):
            return jsonify({'error': 'Accès réservé aux recruteurs'}), 403
            
        return f(*args, **kwargs)
    return wrapper

@app.route('/jobs', methods=['POST'])
@verify_token
@recruiter_required
def create_job():
    try:
        data = request.get_json()
        uid = request.user['uid']
        
        # Validation des données
        required_fields = ['title', 'company', 'description']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis manquants'}), 400

        job_id = str(uuid.uuid4())
        job_data = {
            'id': job_id,
            'title': data['title'],
            'description': data['description'],
            'company': data['company'],
            'location': data.get('location', ''),
            'skills': data.get('skills', []),
            'recruiter_id': uid,
            'created_at': firestore.SERVER_TIMESTAMP
        }

        # Sauvegarde dans Firestore
        db.collection('jobs').document(job_id).set(job_data)

        # Récupère le document avec les champs résolus (ex: created_at)
        saved_job = db.collection('jobs').document(job_id).get().to_dict()

        logger.info(f"Job créé avec succès: {job_id}")
        return jsonify(saved_job), 201

    except Exception as e:
        logger.error(f"Erreur création job: {e}")
        return jsonify({'error': str(e)}), 500

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