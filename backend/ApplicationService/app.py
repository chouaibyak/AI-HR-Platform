from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from flask_cors import CORS
import uuid
from datetime import datetime

cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)
CORS(app)

# POST: un candidat postule à une offre
@app.route('/applications', methods=['POST'])
def apply_to_job():
    try:
        data = request.get_json()
        
        # Validation des données requises
        required_fields = ['job_id', 'job_title', 'candidate_id', 'candidate_name', 'cv_url']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Données manquantes'}), 400

        # Vérifier si le job existe
        job_ref = db.collection('jobs').document(data['job_id'])
        job = job_ref.get()
        
        if not job.exists:
            return jsonify({'error': 'Job non trouvé'}), 404
            
        job_data = job.to_dict()
        
        # Vérification des IDs
        if 'recruiter_id' not in job_data:
            return jsonify({'error': 'Job invalide: aucun recruteur associé'}), 400

        # Création de la candidature avec des champs bien séparés
        application = {
            'id': str(uuid.uuid4()),
            'job': {  # Sous-objet pour les infos du job
                'id': data['job_id'],
                'title': data['job_title'],
                'recruiter_id': job_data['recruiter_id'],
                'recruiter_name': job_data.get('recruiter_name', ''),
                'company': job_data.get('company', '')
            },
            'candidate': {  # Sous-objet pour les infos du candidat
                'id': data['candidate_id'],
                'name': data['candidate_name']
            },
            'cv_url': data['cv_url'],
            'created_at': datetime.utcnow().isoformat(),
            'status': 'pending',
            'match_score': data.get('match_score', 0)
        }
        
        db.collection('applications').document(application['id']).set(application)

        # Création de la notification pour le recruteur
        notification_id = str(uuid.uuid4())
        notification = {
            'id': notification_id,
            'userId': job_data['recruiter_id'],
            'type': 'NEW_APPLICATION',
            'applicationId': application['id'],
            'jobId': data['job_id'],
            'jobTitle': data['job_title'],
            'candidateName': data['candidate_name'],
            'message': f"Nouvelle candidature pour {data['job_title']}",
            'read': False,
            'createdAt': datetime.utcnow()
        }
        
        db.collection('notifications').document(notification_id).set(notification)
        

        return jsonify(application), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET: récupérer toutes les candidatures pour un candidat
@app.route('/applications/candidate/<candidate_id>', methods=['GET'])
def get_candidate_applications(candidate_id):
    try:
        # Version optimisée avec jointure
        apps_ref = db.collection('applications')
        query = apps_ref.where('candidate.id', '==', candidate_id).stream()
        
        applications = []
        for doc in query:
            app_data = doc.to_dict()
            # Assurez-vous que la structure correspond au frontend
            application = {
                'id': doc.id,
                'job': {
                    'id': app_data.get('job', {}).get('id'),
                    'title': app_data.get('job', {}).get('title'),
                    'company': app_data.get('job', {}).get('company')
                },
                'candidate': {
                    'id': app_data.get('candidate', {}).get('id'),
                    'name': app_data.get('candidate', {}).get('name')
                },
                'status': app_data.get('status', 'pending'),
                'cv_url': app_data.get('cv_url', ''),
                'created_at': app_data.get('created_at', firestore.SERVER_TIMESTAMP)
            }
            applications.append(application)
        
        return jsonify(applications), 200
        
    except Exception as e:
        print(f"Error in get_candidate_applications: {str(e)}")
        return jsonify({'error': str(e)}), 500

# GET: récupérer toutes les candidatures pour un job
@app.route('/applications/job/<job_id>', methods=['GET'])
def get_job_applications(job_id):
    try:
        print(f"\n=== RÉCUPÉRATION DES CANDIDATURES POUR LE JOB {job_id} ===")
        
        # Vérifier si le job existe
        job_ref = db.collection('jobs').document(job_id)
        job = job_ref.get()
        
        if not job.exists:
            print(f"ERREUR: Le job {job_id} n'existe pas")
            return jsonify({'error': 'Job non trouvé'}), 404
            
        job_data = job.to_dict()
        print(f"Job trouvé: {job_data}")
        
        # Récupérer toutes les candidatures pour ce job
        print(f"Recherche des candidatures pour le job {job_id}...")
        applications = db.collection('applications')\
                        .where('job_id', '==', job_id)\
                        .stream()
        
        applications_list = []
        for app in applications:
            app_data = app.to_dict()
            print(f"Candidature trouvée: {app_data}")
            # Vérifier que toutes les données nécessaires sont présentes
            if all(key in app_data for key in ['id', 'job_id', 'candidate_id', 'candidate_name', 'cv_url', 'status']):
                applications_list.append(app_data)
            else:
                print(f"Candidature invalide (données manquantes): {app_data}")
            
        print(f"Nombre total de candidatures trouvées pour le job {job_id}: {len(applications_list)}")
        if applications_list:
            print("Détail des candidatures:")
            for app in applications_list:
                print(f"- ID: {app.get('id')}")
                print(f"  Candidat: {app.get('candidate_name')}")
                print(f"  Statut: {app.get('status')}")
                print(f"  Date: {app.get('created_at')}")
        else:
            print(f"Aucune candidature trouvée pour le job {job_id}")
            
        return jsonify(applications_list), 200
    except Exception as e:
        print(f"Erreur lors de la récupération des candidatures du job: {str(e)}")
        return jsonify({'error': str(e)}), 500

# PUT: mettre à jour le statut d'une candidature
@app.route('/applications/<application_id>/status', methods=['PUT'])
def update_application_status(application_id):
    try:
        print(f"\n=== MISE À JOUR DU STATUT DE LA CANDIDATURE {application_id} ===")
        data = request.get_json()
        new_status = data.get('status')
        print(f"Nouveau statut: {new_status}")
        
        if not new_status:
            return jsonify({'error': 'Le statut est requis'}), 400
            
        if new_status not in ['accepted', 'rejected', 'pending']:
            return jsonify({'error': 'Statut invalide'}), 400

        # Vérifier si la candidature existe
        application_ref = db.collection('applications').document(application_id)
        application = application_ref.get()
        
        if not application.exists:
            print(f"Candidature {application_id} non trouvée")
            return jsonify({'error': 'Candidature non trouvée'}), 404
        
        # Mettre à jour le statut
        application_ref.update({
            'status': new_status,
            'updated_at': datetime.utcnow().isoformat()
        })
        
        print(f"Statut mis à jour avec succès pour la candidature {application_id}")
        return jsonify({
            'message': 'Statut mis à jour avec succès',
            'status': new_status
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la mise à jour du statut: {str(e)}")
        return jsonify({'error': str(e)}), 500

# DELETE: supprimer une candidature
@app.route('/applications/<application_id>', methods=['DELETE'])
def delete_application(application_id):
    try:
        print(f"\n=== SUPPRESSION DE LA CANDIDATURE {application_id} ===")
        # Vérifier si la candidature existe
        application_ref = db.collection('applications').document(application_id)
        application = application_ref.get()
        
        if not application.exists:
            print(f"Candidature {application_id} non trouvée")
            return jsonify({'error': 'Candidature non trouvée'}), 404
        
        # Supprimer la candidature
        application_ref.delete()
        print(f"Candidature {application_id} supprimée avec succès")
        return jsonify({'message': 'Candidature supprimée avec succès'}), 200
    except Exception as e:
        print(f"Erreur lors de la suppression: {str(e)}")
        return jsonify({'error': str(e)}), 500

# GET: récupérer toutes les candidatures pour un recruteur
@app.route('/applications/recruiter/<recruiter_id>', methods=['GET'])
def get_recruiter_applications(recruiter_id):
    try:
        # Solution optimale: Requête avec jointure
        applications_ref = db.collection('applications')
        query = applications_ref.where('job.recruiter_id', '==', recruiter_id).stream()
        
        applications_list = []
        for app in query:
            app_data = app.to_dict()
            # Compléter les données si nécessaire
            app_data['id'] = app.id
            applications_list.append(app_data)
            
        return jsonify(applications_list), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n=== DÉMARRAGE DU SERVICE DES APPLICATIONS ===")
    app.run(port=5005, debug=True)