
#!/usr/bin/env python3
import subprocess
import sys
import os
import time
import signal
import requests

def install_dependencies():
    """Install required packages"""
    required_packages = ['fastapi', 'uvicorn', 'python-dotenv', 'openai', 'requests']
    
    print("📦 Проверка зависимостей...")
    for package in required_packages:
        try:
            if package == 'python-dotenv':
                import dotenv
            else:
                __import__(package)
            print(f"✅ {package} установлен")
        except ImportError:
            print(f"❌ Устанавливаю {package}...")
            result = subprocess.run([sys.executable, "-m", "pip", "install", package], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ {package} успешно установлен")
            else:
                print(f"❌ Ошибка установки {package}: {result.stderr}")

def check_port(port=8001):
    """Check if port is available"""
    try:
        response = requests.get(f"http://127.0.0.1:{port}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def kill_existing_process():
    """Kill any existing FastAPI process on port 8001"""
    try:
        # Try to find and kill existing process
        result = subprocess.run(['lsof', '-ti', ':8001'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"🔪 Останавливаю процесс на порту 8001 (PID: {pid})")
                    os.kill(int(pid), signal.SIGTERM)
                    time.sleep(1)
    except:
        pass

def main():
    print("🚀 Запуск FastAPI прокси сервера...")
    
    # Kill existing processes
    kill_existing_process()
    
    # Install dependencies
    install_dependencies()
    
    # Check environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  OPENAI_API_KEY не найден!")
        print("   Добавьте ваш API ключ в Secrets")
        print("   Сервер запустится, но без OpenAI интеграции")
    else:
        print("✅ OPENAI_API_KEY найден")
    
    # Change to server directory
    server_dir = os.path.join(os.path.dirname(__file__), "server")
    if os.path.exists(server_dir):
        original_dir = os.getcwd()
        os.chdir(server_dir)
        print(f"📁 Работаю в директории: {server_dir}")
        
        try:
            print("🔄 Запускаю FastAPI сервер...")
            print("📡 Сервер будет доступен на http://127.0.0.1:8001")
            
            # Run the server
            subprocess.run([sys.executable, "fastapi_proxy.py"], check=True)
            
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен пользователем")
        except subprocess.CalledProcessError as e:
            print(f"❌ Ошибка запуска сервера: {e}")
        except Exception as e:
            print(f"❌ Неожиданная ошибка: {e}")
        finally:
            os.chdir(original_dir)
    else:
        print(f"❌ Директория {server_dir} не найдена")
        # Try to run from current directory
        try:
            print("🔄 Пытаюсь запустить из текущей директории...")
            subprocess.run([sys.executable, "server/fastapi_proxy.py"], check=True)
        except Exception as e:
            print(f"❌ Не удалось запустить сервер: {e}")

if __name__ == "__main__":
    main()
