from fastapi import FastAPI
from google.cloud import vision
from google.oauth2 import service_account
import openai

app = FastAPI()
GOOGLE_VISION_KEY_PATH = "vision-key.json"
openai.api_key = "AIzaSyBbn64fjIOIZ0t1c29yqi0agm7gLgEvTY"

credentials = service_account.Credentials.from_service_account_file()
client = vision.ImageAnnotatorClient(credentials=credentials)

@app.get("/ocr-image")
def read_text_from_image():
    image_uri = "https://raw.githubusercontent.com/ROTEMIL95/askapi/main/images/bookimage.png"
    image = vision.Image()
    image.source.image_uri = image_uri
    response = client.text_detection(image=image)
    text = response.text_annotations[0].description if response.text_annotations else "No text found"
    gpt_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": text}]
    )
    gpt_answer = gpt_response["choices"][0]["message"]["content"]
    return {"ocr_text": text, "gpt_answer": gpt_answer}
