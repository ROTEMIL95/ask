from auth_helper import detect_auth_type, generate_auth_headers

# דוגמה של טקסט מתוך מסמך API
doc_text = """
To authenticate, use the following:
Authorization: Bearer {your_token}
"""

# זיהוי שיטת ההתחברות
auth_type = detect_auth_type(doc_text)
print(f"שיטת ההתחברות שזוהתה: {auth_type}")

# הדבקת מפתח (או בקשת קלט)
user_key = input("הדבק/י את המפתח שלך: ")

# יצירת headers מוכנים
headers = generate_auth_headers(auth_type, user_key)

print("🔐 הנה headers לשימוש:")
print(headers)
