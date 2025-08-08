import os
import logging
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from openai import OpenAI
import uvicorn
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AUTH_TOKEN = os.getenv("AUTH_TOKEN", "default_auth_token")

app = FastAPI(title="TeleBot AI Proxy", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_token(request: Request):
    """Проверка авторизации для обхода ограничений."""
    token = request.headers.get("Authorization")
    if AUTH_TOKEN and AUTH_TOKEN != "default_auth_token" and token != f"Bearer {AUTH_TOKEN}":
        raise HTTPException(status_code=403, detail="Unauthorized")
    return True

# Initialize OpenAI client
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    client = None
    logger.warning("OPENAI_API_KEY not found")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    project_context: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    message: str
    files: Dict[str, str] = {}

class OpenAIRequest(BaseModel):
    model_name: str = "gpt-4o"
    messages: List[Dict[str, str]]
    max_tokens: Optional[int] = 2000
    temperature: Optional[float] = 0.7

class CodeGenerationRequest(BaseModel):
    prompt: str
    context: Dict[str, str] = {}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "TeleBot AI Proxy", 
        "openai_configured": client is not None
    }

@app.post("/api/open_ai_request")
async def open_ai_request(
    openai_request: OpenAIRequest, 
    request: Request,
    token: bool = Depends(verify_token)
):
    """Универсальный эндпоинт для запросов к OpenAI API."""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        response = client.chat.completions.create(
            model=openai_request.model_name,
            messages=openai_request.messages,
            max_tokens=openai_request.max_tokens,
            temperature=openai_request.temperature
        )
        
        return {
            "response": response.choices[0].message.content,
            "model": openai_request.model_name,
            "usage": response.usage.dict() if response.usage else None
        }
        
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, auth_request: Request, token: bool = Depends(verify_token)):
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Prepare system message for Telegram bot context
        system_message = """Ты - опытный разработчик Telegram-ботов на Python. Твоя задача - помогать создавать, редактировать и улучшать Telegram-ботов.

Основные принципы:
1. Используй библиотеку python-telegram-bot (v20+)
2. Всегда предоставляй рабочий, готовый к использованию код
3. Объясняй функционал на русском языке
4. Следи за безопасностью и лучшими практиками
5. Если нужно создать или изменить файлы, четко укажи это

Структура проекта обычно включает:
- bot.py (основной файл бота)
- config.py (конфигурация)
- requirements.txt (зависимости)
- handlers/ (обработчики команд)
- utils/ (вспомогательные функции)

При генерации кода для новых функций, всегда показывай полный рабочий пример."""

        # Convert messages to OpenAI format
        openai_messages = [{"role": "system", "content": system_message}]
        
        for msg in request.messages:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add project context if available
        if request.project_context:
            context_info = "Текущий контекст проекта:\n"
            for filename, content in request.project_context.items():
                context_info += f"\n--- {filename} ---\n{content[:500]}...\n"
            
            openai_messages.append({
                "role": "system", 
                "content": context_info
            })

        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=openai_messages,
            max_tokens=2000,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content or ""

        # Parse response for file creation/modification
        files = {}
        if ai_response and ("```python" in ai_response or "```" in ai_response):
            # Extract code blocks and suggest file names
            import re
            code_blocks = re.findall(r'```(?:python)?\n(.*?)\n```', ai_response, re.DOTALL)
            
            for i, code in enumerate(code_blocks):
                if "def main()" in code or "if __name__ == '__main__'" in code:
                    files["bot.py"] = code.strip()
                elif "BOT_TOKEN" in code or "DATABASE_URL" in code:
                    files["config.py"] = code.strip()
                elif code.strip().startswith("python-telegram-bot"):
                    files["requirements.txt"] = code.strip()

        return ChatResponse(message=ai_response, files=files)

    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/ai/generate-code")
async def generate_code(request: CodeGenerationRequest, auth_request: Request, token: bool = Depends(verify_token)):
    try:
        prompt = f"""Создай код для Telegram-бота на Python со следующими требованиями:

{request.prompt}

Контекст существующего проекта:
{request.context}

Верни готовый к использованию код с комментариями на русском языке."""

        if not client:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
            
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {"role": "system", "content": "Ты эксперт по разработке Telegram-ботов на Python."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )

        return {"code": response.choices[0].message.content or ""}

    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Code generation error: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
