import os
import base64
from google.cloud import vision
from google.oauth2 import service_account

# Set up Google Cloud credentials
credentials = service_account.Credentials.from_service_account_file(
    'gcloud-key.json',
    scopes=['https://www.googleapis.com/auth/cloud-vision']
)

# Initialize the Vision API client
client = vision.ImageAnnotatorClient(credentials=credentials)

def ocr_image(file_path):
    """
    Extract text from an image using Google Cloud Vision API
    """
    try:
        # Read the image file
        with open(file_path, "rb") as f:
            image_data = f.read()

        # Create an image object
        image = vision.Image(content=image_data)

        # Perform document text detection
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            print(f"❌ Error: {response.error.message}")
            return None

        # Extract the text
        text = response.full_text_annotation.text
        
        if text:
            print("✅ Text detected:\n")
            print(text)
            return text
        else:
            print("⚠️ No text found in image")
            return None
            
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return None

def ocr_image_simple(file_path):
    """
    Simple text detection (not document-specific)
    """
    try:
        with open(file_path, "rb") as f:
            image_data = f.read()

        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)
        
        if response.error.message:
            print(f"❌ Error: {response.error.message}")
            return None

        texts = response.text_annotations
        if texts:
            text = texts[0].description
            print("✅ Text detected:\n")
            print(text)
            return text
        else:
            print("⚠️ No text found in image")
            return None
            
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return None

if __name__ == "__main__":
    # Test with a sample image
    test_image = "sample.jpg"  # Change to your image file for testing
    if os.path.exists(test_image):
        print("🔍 Running OCR on image...")
        ocr_image(test_image)
    else:
        print(f"⚠️ File {test_image} not found")
