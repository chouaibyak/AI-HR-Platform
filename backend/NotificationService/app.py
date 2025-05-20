from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, messaging
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Initialisation de Firebase Admin SDK
cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
firebase_admin.initialize_app(cred)

app = Flask(__name__)

# Route pour envoyer des notifications
@app.route('/send-notification', methods=['POST'])
def send_notification():
    data = request.json
    token = data.get("token")
    title = data.get("title")
    body = data.get("body")

    if not token or not title or not body:
        return jsonify({'error': 'Missing parameters'}), 400

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        token=token,
    )

    try:
        # Envoi de la notification
        response = messaging.send(message)
        return jsonify({'message': 'Notification sent successfully', 'response': response}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5008, debug=True)
