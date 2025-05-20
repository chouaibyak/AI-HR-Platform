from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import requests

# Init Firebase
cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)
CORS(app)

# Scoring simple basé sur les compétences
def calculate_score(candidate_skills, job_skills):
    if not candidate_skills or not job_skills:
        return 0
    match_count = len(set(candidate_skills) & set(job_skills))
    return round((match_count / len(job_skills)) * 100, 2)

# Route pour matcher un candidat à une offre
@app.route('/match/<cv_id>/<job_id>', methods=['GET'])
def match_candidate(cv_id, job_id):
    try:
        # --- 1. Récupération des données du CV analysé (via Firestore ou AIService)
        cv_doc = db.collection('cv_analysis').document(cv_id).get()
        if not cv_doc.exists:
            return jsonify({'error': 'CV not found'}), 404
        cv_data = cv_doc.to_dict()
        candidate_skills = cv_data.get("skills", [])

        # --- 2. Récupération de l’offre (depuis JobService via Firestore)
        job_doc = db.collection('jobs').document(job_id).get()
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        job_data = job_doc.to_dict()
        job_skills = job_data.get("skills", [])

        # --- 3. Calcul du score de compatibilité
        score = calculate_score(candidate_skills, job_skills)

        # --- 4. Enregistrement du score dans Firestore
        match_data = {
            'cv_id': cv_id,
            'job_id': job_id,
            'candidate_skills': candidate_skills,
            'job_skills': job_skills,
            'match_score': score
        }
        
        # Ajouter les résultats dans la collection 'match_results'
        db.collection('match_results').document(f'{cv_id}_{job_id}').set(match_data)

        return jsonify({
            'cv_id': cv_id,
            'job_id': job_id,
            'candidate_skills': candidate_skills,
            'job_skills': job_skills,
            'match_score': score
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/match_all_jobs/<cv_id>', methods=['GET'])
def match_all_jobs(cv_id):
    try:
        # --- 1. Récupérer les compétences extraites du CV analysé
        cv_doc = db.collection('cv_analysis').document(cv_id).get()
        if not cv_doc.exists:
            return jsonify({'error': 'CV not found'}), 404
        cv_data = cv_doc.to_dict()
        candidate_skills = cv_data.get("skills", [])

        # --- 2. Récupérer toutes les offres d’emploi
        jobs_ref = db.collection('jobs').stream()
        results = []

        for job_doc in jobs_ref:
            job_data = job_doc.to_dict()
            job_id = job_doc.id
            job_skills = job_data.get("skills", [])

            score = calculate_score(candidate_skills, job_skills)

            match_data = {
                'cv_id': cv_id,
                'job_id': job_id,
                'candidate_skills': candidate_skills,
                'job_skills': job_skills,
                'match_score': score
            }

            # Enregistrer le score dans Firestore
            db.collection('match_results').document(f'{cv_id}_{job_id}').set(match_data)

            results.append(match_data)

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5004, debug=True)