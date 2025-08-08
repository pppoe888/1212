
#!/usr/bin/env python3
import requests
import json
import sys

def test_fastapi():
    base_url = "http://127.0.0.1:8001"
    
    print("🧪 Тестирование FastAPI сервера...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check прошел успешно")
            print(f"   Status: {data.get('status')}")
            print(f"   OpenAI configured: {data.get('openai_configured')}")
            print(f"   API key present: {data.get('api_key_present')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Не удалось подключиться к FastAPI: {e}")
        return False
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Root endpoint работает")
        else:
            print(f"❌ Root endpoint error: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    # Test chat endpoint (if OpenAI is configured)
    try:
        test_request = {
            "messages": [
                {"role": "user", "content": "Привет!"}
            ],
            "project_context": {}
        }
        
        response = requests.post(
            f"{base_url}/ai/chat", 
            json=test_request,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Chat endpoint работает")
        elif response.status_code == 500:
            print("⚠️ Chat endpoint доступен, но OpenAI не настроен")
        else:
            print(f"❌ Chat endpoint error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
    
    print("\n🎉 Тестирование завершено!")
    return True

if __name__ == "__main__":
    test_fastapi()
