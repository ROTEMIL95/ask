# בעיה עם Tranzila REST API v1

## הבעיה
```
error_code: 20004
message: "Json does not match validation schema"
keyword: "additionalProperties"
```

Tranzila מוסיף אוטומטית שדות עם `None` שגורמים לשגיאת validation.

## הסיבה
אנחנו משתמשים ב-**REST API v1** של Tranzila שהוא מורכב מאוד ודורש schema מדויק.

## הפתרון המומלץ

### אפשרות 1: צור קשר עם Tranzila Support ✅ מומלץ
**פנה לתמיכה של Tranzila** (03-7630000 או support@tranzila.com) ו:
1. הסבר שאתה מקבל שגיאה 20004
2. בקש דוגמה מדויקת של JSON payload ל-v1 API
3. או בקש לעבור ל-**Direct POST API** הפשוט יותר

### אפשרות 2: השתמש ב-Tranzila CGI Endpoint ✅ מיושם
Tranzila מספק CGI endpoint פשוט יותר שעובד עם form-data:

```python
url = "https://secure5.tranzila.com/cgi-bin/tranzila31.cgi"

data = {
    'supplier': supplier,
    'sum': '0.10',
    'currency': '1',  # ILS
    'ccno': card_number,
    'expmonth': '09',  # MM
    'expyear': '2031',  # YYYY
    'mycvv': cvv,
    'cred_type': '1',
    'tranmode': 'AK',  # Authorization + Capture
}

response = requests.post(url, data=data)
```

הresponse חוזר בפורמט `key=value`:
```
Response=000
index=123456
ConfirmationCode=123
TranzilaTranzilaToken=abc123
```

### אפשרות 3: נסה להסיר עוד שדות
נסה payload מינימלי לחלוטין:
```json
{
  "terminal_name": "fxpsharon333",
  "txn_type": "debit",
  "card_number": "4580561309427921",
  "expire_month": 9,
  "expire_year": 2031,
  "items": [{
    "name": "Subscription",
    "unit_price": 0.10
  }]
}
```

## מה עכשיו?

1. **הכי טוב**: צור קשר עם Tranzila Support
2. **חלופה**: אני יכול לשנות את הקוד להשתמש ב-Direct POST API (פשוט יותר)
3. **זמני**: נסה Postman עם payload מינימלי לראות מה עובד

**בחר את האפשרות שמתאימה לך ואני ממשיך!**
