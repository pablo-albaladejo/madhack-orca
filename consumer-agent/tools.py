from uuid import uuid4

import httpx
from a2a.client import A2ACardResolver, A2AClient
from a2a.types import MessageSendParams, SendMessageRequest
from langchain_core.tools import tool

from logging_middleware import log_outgoing, log_incoming, log_error, log_discovery

_client: A2AClient | None = None
_agent_name: str = 'unknown'


async def discover_provider(base_url: str) -> None:
    global _client, _agent_name
    httpx_client = httpx.AsyncClient()
    resolver = A2ACardResolver(httpx_client=httpx_client, base_url=base_url)
    card = await resolver.get_agent_card()
    _client = A2AClient(httpx_client=httpx_client, agent_card=card)
    _agent_name = card.name
    skills = [s.id for s in card.skills] if card.skills else []
    log_discovery(_agent_name, skills)


@tool
async def send_to_agent(message: str) -> str:
    """Send a task to the travel provider agent. Be specific about what you need:
    weather, restaurants, flights, hotels, or booking for a destination."""
    if not _client:
        return 'Error: Provider agent not discovered yet.'

    log_outgoing(message)

    try:
        payload = {
            'message': {
                'role': 'user',
                'parts': [{'kind': 'text', 'text': message}],
                'messageId': uuid4().hex,
            },
        }
        request = SendMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(**payload),
        )
        response = await _client.send_message(request)
        result = response.root.result

        text = _extract_text(result)
        log_incoming('completed', text[:80])
        return text

    except Exception as e:
        log_error(str(e))
        return f'Error communicating with provider: {e}'


def _extract_text(result: object) -> str:
    if hasattr(result, 'artifacts') and result.artifacts:
        texts = []
        for artifact in result.artifacts:
            for part in artifact.parts:
                if hasattr(part, 'root') and hasattr(part.root, 'text'):
                    texts.append(part.root.text)
                elif hasattr(part, 'text'):
                    texts.append(part.text)
        if texts:
            return '\n'.join(texts)

    if hasattr(result, 'status') and result.status and result.status.message:
        msg = result.status.message
        parts = msg.parts if hasattr(msg, 'parts') else []
        texts = []
        for p in parts:
            if hasattr(p, 'root') and hasattr(p.root, 'text'):
                texts.append(p.root.text)
            elif hasattr(p, 'text'):
                texts.append(p.text)
        if texts:
            return '\n'.join(texts)

    return str(result)
