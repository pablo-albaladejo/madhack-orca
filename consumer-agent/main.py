"""FastAPI server exposing the travel planning consumer agent."""

from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

# Load .env from project root (parent of consumer-agent/)
_env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import invoke_agent

app = FastAPI(title='Travel Consumer Agent', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class MessageRequest(BaseModel):
    text: str
    context_id: str | None = None


class MessageResponse(BaseModel):
    response: str
    context_id: str
    activity_log: list


@app.post('/message', response_model=MessageResponse)
async def handle_message(req: MessageRequest):
    context_id = req.context_id or uuid4().hex
    result = await invoke_agent(req.text, context_id)
    return MessageResponse(
        response=result['response'],
        context_id=context_id,
        activity_log=result['activity_log'],
    )


@app.get('/health')
async def health():
    return {'status': 'ok'}


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', '8000'))
    uvicorn.run('main:app', host='0.0.0.0', port=port, reload=True)
