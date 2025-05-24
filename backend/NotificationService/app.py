from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from flask_cors import CORS
import logging
from datetime import datetime

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialisation Firebase
try:
    cred = credentials.Certificate("../../firebase/firebase_admin_key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase Admin SDK initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing Firebase Admin SDK: {e}")
    db = None

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5002", "http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/notify/new-job', methods=['POST'])
def notify_new_job():
    if not db:
        return jsonify({'error': 'Firestore client not initialized'}), 500

    data = request.get_json()
    job_id = data.get('jobId')
    job_title = data.get('jobTitle')
    company = data.get('company')

    if not all([job_id, job_title, company]):
        return jsonify({'error': 'Missing job details in payload'}), 400

    try:
        users_ref = db.collection('users')
        candidates_query = users_ref.where('role', '==', 'candidate').stream()

        notification_count = 0
        for candidate in candidates_query:
            candidate_id = candidate.id
            notification_id = str(uuid.uuid4())
            notification_data = {
                'id': notification_id,
                'userId': candidate_id,
                'type': 'NEW_JOB',
                'jobId': job_id,
                'jobTitle': job_title,
                'company': company,
                'message': f"Une nouvelle offre d'emploi '{job_title}' chez {company} pourrait vous intéresser.",
                'read': False,
                'createdAt': datetime.utcnow(),
                'timestamp': firestore.SERVER_TIMESTAMP
            }

            db.collection('notifications').document(notification_id).set(notification_data)
            notification_count += 1

        return jsonify({
            'message': f'Notifications created for {notification_count} candidates.'
        }), 200

    except Exception as e:
        logger.error(f"Error sending notifications: {e}")
        return jsonify({'error': 'Failed to send notifications'}), 500


@app.route('/notifications/user/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    if not db:
        return jsonify({'error': 'Firestore client not initialized'}), 500

    try:
        notifications_ref = db.collection('notifications') \
            .where('userId', '==', user_id) \
            .order_by('createdAt', direction=firestore.Query.DESCENDING)

        notifications = []
        for doc in notifications_ref.stream():
            notification = doc.to_dict()
            if 'createdAt' in notification and hasattr(notification['createdAt'], 'isoformat'):
                notification['createdAt'] = notification['createdAt'].isoformat()
            notifications.append(notification)

        return jsonify(notifications), 200
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500


@app.route('/notifications/<notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    if not db:
        return jsonify({'error': 'Firestore client not initialized'}), 500

    try:
        notification_ref = db.collection('notifications').document(notification_id)
        if not notification_ref.get().exists:
            return jsonify({'error': 'Notification not found'}), 404

        notification_ref.update({'read': True})
        return jsonify({'message': 'Notification marked as read.'}), 200

    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return jsonify({'error': 'Failed to update notification'}), 500


if __name__ == '__main__':
    if not db:
        logger.critical("Failed to initialize Firestore. NotificationService cannot start.")
    else:
        app.run(port=5008, debug=True)