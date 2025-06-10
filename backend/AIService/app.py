from flask import Flask, request, jsonify
import os, requests
from dotenv import load_dotenv
import google.generativeai as genai
import PyPDF2
import firebase_admin
from firebase_admin import credentials, firestore
from flask_cors import CORS
import re

# --- Chargement variables d’environnement ---
load_dotenv()

# --- Config Flask ---
app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Initialisation Firebase ---
cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
print("Firebase initialisé")

# --- Config Gemini ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# --- Téléchargement du CV via CVService ---
def download_cv_from_cvservice(filename):
    url = f"http://localhost:5001/cv/download/{filename}"
    local_path = os.path.join(UPLOAD_FOLDER, filename)
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(response.content)
            return local_path
        print("Erreur HTTP:", response.status_code)
        return None
    except Exception as e:
        print("Erreur téléchargement:", e)
        return None

# --- Extraction texte PDF ---
def extract_text_from_pdf(filepath):
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return ''.join(page.extract_text() or '' for page in reader.pages).strip()
    except Exception as e:
        print("Erreur PDF:", e)
        return ""

# --- Appel Gemini ---
def analyze_with_ai(cv_text):
    prompt = f"""
Analyse le CV ci-dessous et retourne les informations dans ce format EXACT :

=== Compétences ===
- Python
- JavaScript
- Django
...

=== Expérience ===
X années d'expérience dans le domaine Y.

=== Résumé ===
Court résumé du profil du candidat en 3 à 5 phrases.

Voici le CV :
{cv_text}
"""
    try:
        response = model.generate_content(prompt)
        return {'analysis': getattr(response, 'text', 'Aucune réponse')}
    except Exception as e:
        return {'error': str(e)}

# --- Parsing du texte Gemini ---
def parse_analysis(raw_text):
    print("RAW TEXT FROM GEMINI:\n", raw_text)

    skills = re.findall(r"=== Compétences ===\n(.+?)\n=== ", raw_text, re.DOTALL)
    experience = re.search(r"=== Expérience ===\n(.+?)\n=== ", raw_text, re.DOTALL)
    summary = re.search(r"=== Résumé ===\n(.+)", raw_text, re.DOTALL)

    skill_list = []
    if skills:
        lines = skills[0].splitlines()
        for line in lines:
            line = line.strip("-• ").strip()
            if line:
                skill_list.append(line)

    return {
        "skills": skill_list[:10] if skill_list else ["Aucune détectée"],
        "experience": experience.group(1).strip() if experience else "Non précisé",
        "summary": " ".join(summary.group(1).splitlines()).strip() if summary else "Résumé non trouvé"
    }

# --- Route principale ---
@app.route('/analyze-from-cvservice', methods=['POST'])
def analyze_from_cvservice():
    data = request.json
    filename = data.get("filename")
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400

    local_path = download_cv_from_cvservice(filename)
    if not local_path:
        return jsonify({'error': 'Download failed'}), 500

    cv_text = extract_text_from_pdf(local_path)
    if not cv_text:
        return jsonify({'error': 'PDF text extraction failed'}), 400

    result = analyze_with_ai(cv_text)
    raw_text = result.get("analysis", result.get("error"))
    parsed = parse_analysis(raw_text)

    cv_id = filename.split("_")[0]
    parsed["cv_id"] = cv_id
    db.collection("cv_analysis").document(cv_id).set(parsed)

    return jsonify({
        'filename': filename,
        'cv_id': cv_id,
        'parsed_analysis': parsed
    })

@app.route('/get-analysis/<cv_id>', methods=['GET'])
def get_analysis(cv_id):
    try:
        doc_ref = db.collection("cv_analysis").document(cv_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({'error': 'CV analysis not found'}), 404
            
        data = doc.to_dict()
        return jsonify({
            'skills': data.get('skills', []),
            'summary': data.get('summary', 'Résumé non disponible')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Lancement ---
if __name__ == '__main__':
    app.run(port=5003, debug=True)