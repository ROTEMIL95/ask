import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

load_dotenv()

# Load config (reads all ENV keys)
from config import Config

# Blueprints (must exist in Backend/routes/)
from routes.api_routes import api_bp
from routes.proxy_routes import proxy_bp
from routes.file_routes import file_bp
from routes.auth_routes import auth_bp
from routes.payment_routes import payment_bp
from routes.payment_complete import payment_complete_bp
from routes.payments_webhook import payments_webhook_bp
from routes.ocr_routes import ocr_bp

# Optional: rate limiter (if you use it in your project)
try:
    from limiter_config import get_limiter
    USE_LIMITER = True
except Exception:
    USE_LIMITER = False


# -------- App Factory --------
def create_app() -> Flask:
    app = Flask(__name__)

    # Logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    app.logger.info("Booting TalkAPI backend...")

    # CORS - Dynamic configuration based on environment
    # Default production origins
    allowed_origins = ["https://talkapi.ai"]
    
    # Add configured origins from environment
    if Config.ALLOWED_ORIGINS:
        allowed_origins.extend(Config.ALLOWED_ORIGINS)
    
    # Add localhost for development (detect if in development mode)
    is_development = (
        Config.DEVELOPMENT_MODE or 
        os.getenv("FLASK_ENV") == "development" or 
        os.getenv("NODE_ENV") == "development" or 
        not os.getenv("RENDER")
    )
    
    if is_development:
        localhost_origins = [
            "http://localhost:3000",    # React default
            "http://localhost:5173",    # Vite default  
            "http://localhost:5000",    # Flask default
            "http://localhost:8080",    # Common dev port
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173", 
            "http://127.0.0.1:5000",
            "http://127.0.0.1:8080"
        ]
        allowed_origins.extend(localhost_origins)
        app.logger.info("Development mode detected - adding localhost origins")
    
    # Remove duplicates while preserving order
    allowed_origins = list(dict.fromkeys(allowed_origins))
    
    CORS(app, 
         resources={
             r"/*": {
                 "origins": allowed_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": [
                     "Content-Type",
                     "Authorization", 
                     "X-API-Key",
                     "X-User-Id",
                     "Origin",
                     "Accept",
                     "X-Requested-With"
                 ],
                 "expose_headers": ["Content-Type"],
                 "supports_credentials": True,
                 "send_wildcard": False,
                 "max_age": 3600
             }
         })
    
    app.logger.info(f"CORS configured for origins: {allowed_origins}")

    # Rate limiter
    if USE_LIMITER:
        try:
            limiter = get_limiter(app)
            app.logger.info("Rate limiter attached.")
        except Exception as e:
            app.logger.warning(f"Rate limiter not attached: {e}")

    # ---- Root ----
    @app.get("/")
    def home():
        return jsonify({"ok": True, "message": "TalkAPI backend is running. See /status"}), 200

    # ---- Health/Status ----
    @app.get("/status")
    def status():
        return jsonify({
            "ok": True,
            "time": datetime.utcnow().isoformat() + "Z",
            "model": Config.LLM_MODEL,
            "supabase_url": Config.SUPABASE_URL,
            "allowed_origins": Config.ALLOWED_ORIGINS,
            "allowed_proxy_domains": Config.ALLOWED_PROXY_DOMAINS,
        })

    # ---- Error handlers ----
    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        return jsonify({"success": False, "error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_error(err):
        app.logger.exception("Unhandled error")
        return jsonify({"success": False, "error": "internal server error"}), 500

    # ---- Register Blueprints ----
    app.register_blueprint(api_bp)
    app.register_blueprint(proxy_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(payment_complete_bp)
    app.register_blueprint(payments_webhook_bp)
    app.register_blueprint(ocr_bp)

    # ---- Optional: Google Vision init from base64 key ----
    try:
        from google.cloud import vision  # type: ignore
        import base64, tempfile

        if Config.VISION_KEY_B64:
            data = base64.b64decode(Config.VISION_KEY_B64)
            fd, path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, "wb") as f:
                f.write(data)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = path
            _ = vision.ImageAnnotatorClient()
            app.logger.info("Google Vision client initialized from VISION_KEY_B64.")
        else:
            app.logger.info("VISION_KEY_B64 not set; OCR will use default credentials (if any).")
    except Exception as e:
        app.logger.warning(f"OCR init skipped: {e}")

    app.logger.info("TalkAPI backend is ready.")
    return app


# -------- Entry Point --------
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
