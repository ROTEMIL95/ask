"""
Test script to verify the proxy API endpoint works correctly with OpenWeatherMap
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:5000"

# Test the proxy endpoint
def test_proxy_api():
    print("Testing proxy API endpoint...")
    
    # Prepare the request to OpenWeatherMap API
    proxy_request = {
        "url": "https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=d1f4a5d4c0c7259ecc3371c5c2946d36&units=metric",
        "method": "GET",
        "headers": {}
    }
    
    try:
        # Send request to proxy endpoint
        response = requests.post(
            f"{BACKEND_URL}/proxy-api",
            json=proxy_request,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Proxy API call successful!")
            print(f"Response status from API: {data.get('status')}")
            
            # Check if we got weather data
            if 'data' in data and isinstance(data['data'], dict):
                weather_data = data['data']
                if 'name' in weather_data:
                    print(f"✅ City found: {weather_data['name']}")
                    if 'main' in weather_data:
                        print(f"Temperature: {weather_data['main']['temp']}°C")
                        print(f"Feels like: {weather_data['main']['feels_like']}°C")
                    if 'weather' in weather_data and weather_data['weather']:
                        print(f"Weather: {weather_data['weather'][0]['description']}")
                else:
                    print("❌ City not found in response")
                    print(f"Response: {json.dumps(weather_data, indent=2)}")
            else:
                print("Response data:", json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error making proxy request: {e}")

if __name__ == "__main__":
    test_proxy_api()