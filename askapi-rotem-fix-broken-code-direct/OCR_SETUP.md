# OCR Setup with Google Cloud Vision API

## Overview
This project now uses Google Cloud Vision API for OCR (Optical Character Recognition) functionality with service account authentication.

## Files Updated

### 1. `ocr_service.py`
- Updated to use Google Cloud Vision API client library
- Uses service account authentication from `gcloud-key.json`
- Provides two OCR functions:
  - `ocr_image()`: Document text detection (better for structured documents)
  - `ocr_image_simple()`: Simple text detection (better for general text)

### 2. `ocr_to_gpt.py`
- Updated to use the same Google Cloud Vision API setup
- Maintains GPT integration for document analysis
- Improved error handling

### 3. `gcloud-key.json`
- Service account credentials file
- Contains authentication details for the Google Cloud project

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Verify Credentials
Make sure `gcloud-key.json` is in the project root directory.

### 3. Test the Setup
```bash
python test_ocr.py
```

## Usage Examples

### Basic OCR
```python
from ocr_service import ocr_image

# Extract text from an image
text = ocr_image("path/to/image.jpg")
if text:
    print(f"Extracted text: {text}")
```

### OCR with GPT Analysis
```python
from ocr_to_gpt import ocr_image, ask_gpt

# Extract text and analyze with GPT
text = ocr_image("document.jpg")
if text:
    answer = ask_gpt(text, "What is this document about?")
    print(answer)
```

## Features

### Document Text Detection (`ocr_image`)
- Optimized for structured documents
- Better handling of tables, forms, and complex layouts
- Preserves text formatting and structure

### Simple Text Detection (`ocr_image_simple`)
- General-purpose text extraction
- Good for images with simple text
- Faster processing for basic OCR needs

## Error Handling
- Comprehensive error handling for file operations
- Google Cloud API error reporting
- Graceful fallbacks when text is not detected

## Security Notes
- Service account credentials are stored in `gcloud-key.json`
- Keep this file secure and don't commit it to public repositories
- Consider using environment variables for production deployments

## Troubleshooting

### Common Issues

1. **Missing credentials file**
   - Ensure `gcloud-key.json` is in the project root
   - Verify the file contains valid service account credentials

2. **Authentication errors**
   - Check that the service account has Vision API permissions
   - Verify the project ID matches your Google Cloud project

3. **Image format issues**
   - Supported formats: JPEG, PNG, GIF, BMP, WEBP
   - Maximum file size: 10MB

4. **No text detected**
   - Try both `ocr_image()` and `ocr_image_simple()`
   - Ensure the image has clear, readable text 