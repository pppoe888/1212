
#!/usr/bin/env python3
import os
import sys
import logging
from typing import List, Dict, Any, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI(
    title="TeleBot AI Proxy",
    version="1.0.0",
    description="AI proxy for Telegram bot development"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# OpenAI client
openai_client = None

def init_openai():
    global openai_client
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI
            openai_client = OpenAI(api_key=OPENAI_API_KEY)
            logger.info("✅ OpenAI client initialized successfully")
            return True
        except ImportError:
            logger.error("❌ OpenAI library not installed")
            return False
    else:
        logger.warning("⚠️ OPENAI_API_KEY not found")
        return False

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    project_context: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    message: str
    files: Optional[Dict[str, str]] = {}

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting FastAPI proxy server...")
    init_openai()

@app.get("/")
async def root():
    return {
        "message": "TeleBot AI Proxy is running",
        "status": "ok",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TeleBot AI Proxy",
        "openai_configured": openai_client is not None,
        "api_key_present": bool(OPENAI_API_KEY)
    }

@app.post("/ai/chat")
async def chat_with_ai(request: ChatRequest):
    logger.info("📨 Received chat request")
    
    if not openai_client:
        logger.error("❌ OpenAI client not configured")
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please add OPENAI_API_KEY to Secrets."
        )

    try:
        # System message
        system_message = """Ты - эксперт по разработке Telegram-ботов на Python. Твоя задача - создавать, редактировать и улучшать Telegram-ботов с использованием библиотеки python-telegram-bot.

Основные принципы:
1. Используй библиотеку python-telegram-bot (v20+)
2. Предоставляй готовый к использованию код
3. Объясняй функционал на русском языке
4. Следи за безопасностью и лучшими практиками
5. Используй асинхронное программирование

При создании кода четко указывай имена файлов и их содержимое."""

        # Prepare messages
        openai_messages = [{"role": "system", "content": system_message}]
        
        for msg in request.messages:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add project context
        if request.project_context:
            context_info = "Текущий контекст проекта:\n"
            for filename, content in request.project_context.items():
                context_info += f"\n--- {filename} ---\n{content[:500]}...\n"
            
            openai_messages.append({
                "role": "system",
                "content": context_info
            })

        logger.info("🤖 Sending request to OpenAI...")
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=openai_messages,
            max_tokens=4000,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content or ""
        logger.info("✅ Received response from OpenAI")

        # Parse files from response
        files = {}
        if ai_response and "```python" in ai_response:
            import re
            code_blocks = re.findall(r'```python\n(.*?)\n```', ai_response, re.DOTALL)
            
            for i, code in enumerate(code_blocks):
                if "def main()" in code or "if __name__ == '__main__'" in code:
                    files["bot.py"] = code.strip()
                elif "BOT_TOKEN" in code or "DATABASE_URL" in code:
                    files["config.py"] = code.strip()
                else:
                    files[f"module_{i+1}.py"] = code.strip()

        return ChatResponse(message=ai_response, files=files)

    except Exception as e:
        logger.error(f"❌ Error in AI chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = asyncio.get_event_loop().time()
    response = await call_next(request)
    process_time = asyncio.get_event_loop().time() - start_time
    logger.info(f"📊 {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s")
    return response

def main():
    # Install dependencies if needed
    try:
        import openai
    except ImportError:
        logger.info("📦 Installing OpenAI...")
        os.system(f"{sys.executable} -m pip install openai")
    
    try:
        import uvicorn
    except ImportError:
        logger.info("📦 Installing uvicorn...")
        os.system(f"{sys.executable} -m pip install uvicorn")

    port = 8001
    host = "0.0.0.0"
    
    logger.info(f"🌐 Starting server on {host}:{port}")
    logger.info(f"🔑 OpenAI API configured: {bool(OPENAI_API_KEY)}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()
