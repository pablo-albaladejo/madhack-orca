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
from tools import get_client

app = FastAPI(title='Travel Consumer Agent', version='1.0.0')


@app.on_event('startup')
async def _check_provider():
    """Verify provider is reachable at startup. Warns but does not block."""
    provider_url = os.environ.get('PROVIDER_URL', 'http://localhost:3000')
    try:
        skills = await get_client().discover()
        skill_names = [s['name'] for s in skills]
        print(f'\n  Provider connected: {provider_url}')
        print(f'  Skills discovered: {", ".join(skill_names)}\n')
    except Exception as e:
        print(f'\n  WARNING: Provider not reachable at {provider_url}: {e}')
        print(f'  Start the provider first: cd provider-agent && npm run dev\n')

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
    """Health check that also verifies provider connectivity."""
    provider_url = os.environ.get('PROVIDER_URL', 'http://localhost:3000')
    try:
        skills = await get_client().discover()
        return {
            'status': 'ok',
            'provider': provider_url,
            'provider_status': 'connected',
            'skills': len(skills),
        }
    except Exception:
        return {
            'status': 'degraded',
            'provider': provider_url,
            'provider_status': 'unreachable',
            'skills': 0,
        }


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', '8000'))
    uvicorn.run('main:app', host='0.0.0.0', port=port, reload=True)
