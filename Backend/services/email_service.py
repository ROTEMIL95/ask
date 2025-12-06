"""
Email Service
Handles sending beautiful HTML emails for payment confirmations, invoices, etc.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_payment_success_email(
    user_email: str,
    user_name: str,
    amount: float,
    plan_type: str,
    transaction_id: str,
    invoice_url: Optional[str] = None,
    daily_limit: int = 100,
    monthly_limit: int = 2000
) -> bool:
    """
    Send a beautiful payment confirmation email to the user

    Args:
        user_email: Customer email address
        user_name: Customer full name
        amount: Amount paid
        plan_type: Plan type (e.g., 'pro')
        transaction_id: Transaction ID from payment gateway
        invoice_url: URL to invoice PDF (optional)
        daily_limit: Daily API request limit
        monthly_limit: Monthly API request limit

    Returns:
        True if email sent successfully, False otherwise
    """
    logger.info(f"📧 Sending payment success email to {user_email}")

    # Validate SMTP configuration
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD]):
        logger.error("❌ SMTP configuration incomplete - cannot send email")
        return False

    try:
        # Create email message
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TalkAPI <{SMTP_USERNAME}>"
        msg["To"] = user_email
        msg["Subject"] = f"🎉 Welcome to TalkAPI {plan_type.upper()} Plan!"

        # Format date
        payment_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")

        # Create beautiful HTML email matching website design
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #e2e8f0;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%);
                    margin: 0;
                    padding: 0;
                }}
                .email-wrapper {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .header {{
                    background: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    opacity: 0.9;
                    color: #cbd5e1;
                }}
                .content {{
                    padding: 40px 30px;
                    background: rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(20px);
                }}
                .greeting {{
                    font-size: 20px;
                    color: #ffffff;
                    margin-bottom: 20px;
                    font-weight: 600;
                }}
                .message {{
                    font-size: 16px;
                    color: #ffffff;
                    margin-bottom: 30px;
                    line-height: 1.8;
                }}
                .plan-details {{
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    border-left: 4px solid #8b5cf6;
                    padding: 25px;
                    margin: 30px 0;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 16px -4px rgba(139, 92, 246, 0.2);
                }}
                .plan-details h2 {{
                    margin: 0 0 20px 0;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 22px;
                    font-weight: 700;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                }}
                .detail-label {{
                    font-weight: 600;
                    color: #ffffff;
                }}
                .detail-value {{
                    color: #ffffff;
                    font-weight: 700;
                }}
                .features {{
                    margin: 30px 0;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    padding: 25px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .features h3 {{
                    color: #ffffff;
                    font-size: 18px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }}
                .feature-item {{
                    padding: 10px 0;
                    padding-left: 30px;
                    position: relative;
                    color: #ffffff;
                }}
                .feature-item:before {{
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #60a5fa;
                    font-weight: bold;
                    font-size: 18px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    color: white;
                    padding: 16px 48px;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    text-align: center;
                    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
                    transition: all 0.3s ease;
                }}
                .invoice-section {{
                    background: rgba(30, 58, 138, 0.2);
                    border: 1px solid rgba(96, 165, 250, 0.2);
                    padding: 25px;
                    border-radius: 12px;
                    margin: 20px 0;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }}
                .invoice-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 16px 40px;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 700;
                    margin-top: 10px;
                    box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-size: 15px;
                }}
                .footer {{
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    padding: 30px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 14px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .footer a {{
                    color: #60a5fa;
                    text-decoration: none;
                }}
                .footer a:hover {{
                    color: #93c5fd;
                }}
                .transaction-id {{
                    font-family: 'Courier New', monospace;
                    background: rgba(139, 92, 246, 0.15);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    color: #c4b5fd;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- Header -->
                <div class="header">
                    <h1>🎉 Payment Successful!</h1>
                    <p>Welcome to TalkAPI {plan_type.upper()}</p>
                </div>

                <!-- Content -->
                <div class="content">
                    <div class="greeting">
                        Hi {user_name},
                    </div>

                    <div class="message">
                        Thank you for upgrading to <strong>TalkAPI {plan_type.upper()}</strong>!
                        Your payment has been processed successfully, and your account has been upgraded.
                    </div>

                    <!-- Plan Details -->
                    <div class="plan-details">
                        <h2>📋 Payment Details</h2>
                        <div class="detail-row">
                            <span class="detail-label">Plan</span>
                            <span class="detail-value">{plan_type.upper()} Plan</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Paid</span>
                            <span class="detail-value">${amount:.2f}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Date</span>
                            <span class="detail-value">{payment_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Transaction ID</span>
                            <span class="detail-value transaction-id">{transaction_id}</span>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="features">
                        <h3>✨ Your {plan_type.upper()} Features</h3>
                        <div class="feature-item">
                            <strong>{daily_limit}</strong> API requests per day
                        </div>
                        <div class="feature-item">
                            <strong>{monthly_limit}</strong> API requests per month
                        </div>
                        <div class="feature-item">
                            API history & favorites
                        </div>
                        <div class="feature-item">
                            Priority email support
                        </div>
                    </div>

                    {f'''
                    <!-- Invoice -->
                    <div class="invoice-section">
                        <h3 style="margin-top: 0; color: #ffffff; font-weight: 600;">📄 Your Invoice</h3>
                        <p style="color: #ffffff; margin-bottom: 15px;">
                            Click below to download your invoice
                        </p>
                        <a href="{invoice_url}" class="invoice-button" target="_blank">
                            📥 Download PDF
                        </a>
                    </div>
                    ''' if invoice_url else ''}

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://talkapi.ai/home" class="cta-button">
                            Start Using TalkAPI →
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p style="margin: 0 0 10px 0;">
                        <strong style="color: #e2e8f0;">TalkAPI</strong> - AI-Powered API Integration
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <a href="https://talkapi.ai">talkapi.ai</a> |
                        <a href="https://talkapi.ai/account">My Account</a> |
                        <a href="mailto:{SMTP_USERNAME}">Support</a>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
                        This email was sent to {user_email} because you made a purchase on TalkAPI.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach HTML body
        msg.attach(MIMEText(html_body, "html"))

        # Send email via SMTP
        logger.info(f"📡 Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)

            logger.info(f"📤 Sending payment success email to: {user_email}")
            server.send_message(msg)

        logger.info(f"✅ Payment success email sent successfully to {user_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed: {e}")
        return False

    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error: {e}")
        return False

    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {e}")
        return False


def send_subscription_cancelled_email(user_email: str, user_name: str) -> bool:
    """
    Send email when user cancels their subscription

    Args:
        user_email: Customer email
        user_name: Customer name

    Returns:
        True if sent successfully
    """
    logger.info(f"📧 Sending cancellation email to {user_email}")

    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD]):
        logger.error("❌ SMTP configuration incomplete")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TalkAPI <{SMTP_USERNAME}>"
        msg["To"] = user_email
        msg["Subject"] = "Your TalkAPI Subscription Has Been Cancelled"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #e2e8f0;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%);
                    margin: 0;
                    padding: 0;
                }}
                .email-wrapper {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .header {{
                    background: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h2 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                    color: #ffffff;
                }}
                .content {{
                    padding: 40px 30px;
                    background: rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(20px);
                    color: #ffffff;
                }}
                .content p {{
                    margin-bottom: 20px;
                    font-size: 16px;
                    line-height: 1.8;
                }}
                .content ul {{
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    border-left: 4px solid #8b5cf6;
                    padding: 20px 20px 20px 40px;
                    margin: 20px 0;
                    border-radius: 12px;
                    list-style: none;
                    box-shadow: 0 8px 16px -4px rgba(139, 92, 246, 0.2);
                }}
                .content ul li {{
                    padding: 8px 0;
                    position: relative;
                    color: #ffffff;
                }}
                .content ul li:before {{
                    content: "•";
                    position: absolute;
                    left: -20px;
                    color: #a78bfa;
                    font-weight: bold;
                    font-size: 20px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    color: white;
                    padding: 16px 40px;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 700;
                    margin-top: 30px;
                    box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-size: 15px;
                }}
                .footer {{
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    padding: 30px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 14px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .footer p {{
                    margin: 5px 0;
                }}
                .footer a {{
                    color: #60a5fa;
                    text-decoration: none;
                }}
                .footer a:hover {{
                    color: #93c5fd;
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="header">
                    <h2>Subscription Cancelled</h2>
                </div>
                <div class="content">
                    <p style="font-size: 18px; font-weight: 600; color: #ffffff;">Hi {user_name},</p>
                    <p>Your TalkAPI Pro subscription has been successfully cancelled.</p>
                    <p>You have been reverted to the <strong style="color: #ffffff;">Free Plan</strong> with the following limits:</p>
                    <ul>
                        <li>50 API requests per day</li>
                        <li>500 API requests per month</li>
                        <li>Basic features</li>
                    </ul>
                    <p>We're sorry to see you go! If you change your mind, you can upgrade again anytime from your account dashboard.</p>
                    <p style="text-align: center;">
                        <a href="https://talkapi.ai/pricing" class="cta-button">
                            View Plans
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p><strong style="color: #e2e8f0;">TalkAPI</strong> - AI-Powered API Integration</p>
                    <p><a href="https://talkapi.ai">talkapi.ai</a> | <a href="mailto:{SMTP_USERNAME}">Support</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Cancellation email sent to {user_email}")
        return True

    except Exception as e:
        logger.error(f"❌ Error sending cancellation email: {e}")
        return False
