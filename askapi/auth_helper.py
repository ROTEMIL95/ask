
def detect_auth_type(text):
    if "Authorization: Bearer" in text:
        return "bearer"
    elif "API key" in text.lower():
        return "api_key"
    elif "X-API-KEY" in text.upper():
        return "x-api-key"
    else:
        return "unknown"

def generate_auth_headers(auth_type, key):
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {key}"}
    elif auth_type == "api_key":
        return {"api_key": key}
    elif auth_type == "x-api-key":
        return {"X-API-KEY": key}
    else:
        return {}
