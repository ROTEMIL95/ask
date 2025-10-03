import os
import base64
import openai
from google.cloud import vision
from google.oauth2 import service_account

# Set up Google Cloud credentials
credentials = service_account.Credentials.from_service_account_file(
    'gcloud-key.json',
    scopes=['https://www.googleapis.com/auth/cloud-vision']
)

# Initialize the Vision API client
client = vision.ImageAnnotatorClient(credentials=credentials)

# 🔑 GPT API Key
GPT_API_KEY = "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"

# 📷 OCR from image
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
            return text
        else:
            print("⚠️ No text found in image")
            return None
            
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return None

# 🤖 Send to GPT with free question
def ask_gpt(docs_text, user_question):
    openai.api_key = GPT_API_KEY
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are an API documentation expert. The following documentation will be provided to you. You should understand it and answer user questions accurately, including JSON examples if required."
            },
            {
                "role": "user",
                "content": f"""📄 Documentation:\n\n{docs_text}\n\n❓ Question:\n{user_question}"""
            }
        ]
    )
    return response["choices"][0]["message"]["content"]

# ▶️ Run
if __name__ == "__main__":
    print("🔍 TalkAPI: Smart understanding of documentation from images")

    path = input("📂 Enter the image file name (e.g., images/tbo_doc.png): ").strip()
    question = input("❓ What do you want to ask about the documentation? ").strip()

    print("\n📤 Running OCR... Please wait...")
    text = ocr_image(path)

    if text:
        print("\n🤖 Asking GPT... Please wait...")
        answer = ask_gpt(text, question)

        print("\n📄 Text detected from image:\n")
        print(text)

        print("\n✅ GPT Answer:\n")
        print(answer)
    else:
        print("❌ Cannot continue without detected text")
