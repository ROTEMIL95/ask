# Development Setup

## Quick Start

### Option 1: Use the development script
```bash
node dev-start.js
```

### Option 2: Manual setup

#### 1. Start the Backend
```bash
cd Backend
python app.py
```
Backend will run on: http://localhost:5000

#### 2. Start the Frontend
```bash
cd Frontend
npm run dev
```
Frontend will run on: http://localhost:5173

## Environment Configuration

The frontend automatically detects development mode and uses:
- **Development**: `http://localhost:5000` (local backend)
- **Production**: `https://askapi-tuir.onrender.com` (deployed backend)

## Backend Dependencies

Make sure you have the required Python packages installed:
```bash
cd Backend
pip install -r requirements.txt
```

## Frontend Dependencies

Make sure you have Node.js dependencies installed:
```bash
cd Frontend
npm install
```

## Testing

### Test Backend Endpoints
```bash
python test_existing_endpoints.py
```

### Test File Processing
```bash
python test_file_to_text.py
```

## Development Notes

- The backend uses `pdfplumber` for PDF processing
- The backend uses Google Cloud Vision API for image OCR
- CORS is configured to allow localhost connections
- Rate limiting is enabled on endpoints 