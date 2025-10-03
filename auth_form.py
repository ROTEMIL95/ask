from flask import Flask, render_template_string, request
from auth_helper import detect_auth_type, generate_auth_headers

app = Flask(__name__)

HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>API Auth Helper</title>
</head>
<body>
    <h2>🔐 מחולל headers ל־API</h2>
    <form method="POST">
        <label>טקסט מתוך הדוקומנטציה:</label><br>
        <textarea name="doc_text" rows="10" cols="80">{{ doc_text }}</textarea><br><br>
        <label>המפתח שלך (API Key / Bearer Token):</label><br>
        <input type="text" name="api_key" size="60" value="{{ api_key }}"><br><br>
        <input type="submit" value="צור headers">
    </form>

    {% if headers %}
    <h3>✅ Headers מוכנים להעתקה:</h3>
    <pre>{{ headers }}</pre>
    {% endif %}
</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def index():
    headers = None
    doc_text = ""
    api_key = ""

    if request.method == "POST":
        doc_text = request.form["doc_text"]
        api_key = request.form["api_key"]

        auth_type = detect_auth_type(doc_text)
        headers = generate_auth_headers(auth_type, api_key)

    return render_template_string(HTML, headers=headers, doc_text=doc_text, api_key=api_key)

if __name__ == "__main__":
    app.run(debug=True)
