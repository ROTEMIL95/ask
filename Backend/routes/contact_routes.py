"""
Contact Routes - Handle contact form submissions
"""
from flask import Blueprint, request, jsonify
from limiter_config import get_limiter
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

# Create blueprint
contact_bp = Blueprint('contact', __name__)

# Get limiter instance
limiter = get_limiter(None)

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
CONTACT_EMAIL = os.getenv('CONTACT_EMAIL', 'rotemiluz53@gmail.com')

@contact_bp.route('/send-contact-email', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute", methods=["POST"])
def send_contact_email():
    """Send contact form email

    CORS is handled globally by Flask-CORS in app.py
    Rate limiting only applies to POST requests, not OPTIONS preflight
    """
    # OPTIONS requests are handled automatically by Flask-CORS
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request data is required'}), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()

        # Validate required fields
        if not all([name, email, subject, message]):
            return jsonify({'error': 'All fields are required'}), 400

        # Validate email format (basic check)
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400

        # Check if SMTP is configured
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("⚠️ SMTP credentials not configured, using mailto fallback")
            return jsonify({
                'error': 'Email server not configured',
                'fallback': True
            }), 503

        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Contact Form: {subject}"
        msg['From'] = SMTP_USERNAME
        msg['To'] = CONTACT_EMAIL
        msg['Reply-To'] = email

        # Email body
        text_content = f"""
New Contact Form Submission

From: {name}
Email: {email}
Subject: {subject}

Message:
{message}
"""

        html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
    </div>
    <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="margin: 10px 0;"><strong>From:</strong> {name}</p>
        <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
        <p style="margin: 10px 0;"><strong>Subject:</strong> {subject}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
{message}
        </div>
    </div>
</body>
</html>
"""

        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)

            print(f"✅ Contact email sent from {email} (Name: {name})")
            return jsonify({
                'success': True,
                'message': 'Your message has been sent successfully! We will get back to you within 24 hours.'
            })

        except smtplib.SMTPException as smtp_error:
            print(f"❌ SMTP error: {str(smtp_error)}")
            return jsonify({
                'error': 'Failed to send email. Please try again later.',
                'fallback': True
            }), 500

    except Exception as e:
        print(f"❌ Error in /send-contact-email: {str(e)}")
        return jsonify({
            'error': 'An error occurred while sending your message.',
            'fallback': True
        }), 500
