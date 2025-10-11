import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from config import Config
import logging

contact_bp = Blueprint("contact", __name__)
logger = logging.getLogger(__name__)


@contact_bp.route("/send-contact-email", methods=["POST"])
def send_contact_email():
    """Send contact form email via SMTP"""
    try:
        data = request.get_json()

        # Validate required fields
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        subject = data.get("subject", "").strip()
        message = data.get("message", "").strip()

        if not all([name, email, subject, message]):
            return jsonify({
                "success": False,
                "error": "All fields are required"
            }), 400

        # Get SMTP configuration from environment
        smtp_server = Config.SMTP_SERVER
        smtp_port = Config.SMTP_PORT
        smtp_username = Config.SMTP_USERNAME
        smtp_password = Config.SMTP_PASSWORD
        contact_email = Config.CONTACT_EMAIL

        if not all([smtp_server, smtp_port, smtp_username, smtp_password, contact_email]):
            logger.error("SMTP configuration incomplete")
            return jsonify({
                "success": False,
                "error": "Email service not configured"
            }), 503

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["From"] = smtp_username
        msg["To"] = contact_email
        msg["Subject"] = f"TalkAPI Contact Form: {subject}"
        msg["Reply-To"] = email

        # Email body (HTML)
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #667eea; }}
                .value {{ margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Contact Form Submission</h2>
                    <p>TalkAPI - https://talkapi.ai</p>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">From:</div>
                        <div class="value">{name}</div>
                    </div>
                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value">{email}</div>
                    </div>
                    <div class="field">
                        <div class="label">Subject:</div>
                        <div class="value">{subject}</div>
                    </div>
                    <div class="field">
                        <div class="label">Message:</div>
                        <div class="value">{message.replace(chr(10), '<br>')}</div>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the TalkAPI contact form.</p>
                        <p>To reply, use: {email}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach HTML body
        msg.attach(MIMEText(html_body, "html"))

        # Send email via SMTP
        logger.info(f"Connecting to SMTP server: {smtp_server}:{smtp_port}")

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.starttls()
            server.ehlo()

            logger.info(f"Logging in with username: {smtp_username}")
            server.login(smtp_username, smtp_password)

            logger.info(f"Sending email to: {contact_email}")
            server.send_message(msg)

        logger.info("Contact email sent successfully")

        return jsonify({
            "success": True,
            "message": "Email sent successfully"
        }), 200

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        return jsonify({
            "success": False,
            "error": "Email authentication failed. Please use the mailto fallback."
        }), 503

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to send email. Please use the mailto fallback."
        }), 503

    except Exception as e:
        logger.error(f"Unexpected error sending email: {e}")
        return jsonify({
            "success": False,
            "error": "An error occurred. Please use the mailto fallback."
        }), 500
