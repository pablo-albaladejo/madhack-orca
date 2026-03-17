"""A2A client wrapper for communicating with the travel provider agent."""

from __future__ import annotations

import httpx
from uuid import uuid4

from a2a.client import A2ACardResolver, A2AClient
from a2a.types import MessageSendParams, SendMessageRequest


class TravelProviderClient:
    """Wraps A2A protocol communication with the travel provider agent.

    Caches the agent card to avoid re-resolving on every call.
    Creates a fresh httpx.AsyncClient per send() for thread safety.
    """

    def __init__(self, base_url: str = 'http://localhost:3000'):
        self.base_url = base_url
        self._skills: list[dict] = []
        self._agent_card = None
        self.activity_log: list[dict] = []
        self.context_id: str | None = None

    async def _get_agent_card(self, http: httpx.AsyncClient):
        """Fetch or return cached agent card."""
        if self._agent_card is None:
            resolver = A2ACardResolver(
                httpx_client=http,
                base_url=self.base_url,
            )
            self._agent_card = await resolver.get_agent_card()
        return self._agent_card

    async def discover(self) -> list[dict]:
        """Fetch agent card and return available skills."""
        async with httpx.AsyncClient(timeout=15.0) as http:
            card = await self._get_agent_card(http)
            self._skills = [
                {'id': s.id, 'name': s.name, 'description': s.description}
                for s in card.skills
            ]
            return self._skills

    async def send(self, text: str, context_id: str | None = None) -> dict:
        """Send a message to the provider via A2A message/send.

        Uses cached agent card. Creates fresh httpx client for thread safety.
        """
        # Use provided context_id, or fall back to stored one
        ctx = context_id or self.context_id
        self.activity_log.append({'skill_query': text, 'status': 'sending'})

        try:
            async with httpx.AsyncClient(timeout=15.0) as http:
                card = await self._get_agent_card(http)
                client = A2AClient(httpx_client=http, agent_card=card)

                message_id = uuid4().hex
                payload: dict = {
                    'message': {
                        'role': 'user',
                        'parts': [{'kind': 'text', 'text': text}],
                        'messageId': message_id,
                    },
                }
                if ctx:
                    payload['message']['contextId'] = ctx

                request = SendMessageRequest(
                    id=str(uuid4()),
                    params=MessageSendParams(**payload),
                )

                response = await client.send_message(request=request)
                result = self._parse_response(response)

                # Store context_id from provider for subsequent calls
                if result.get('context_id'):
                    self.context_id = result['context_id']

                self.activity_log[-1]['status'] = 'completed'
                self.activity_log[-1]['response_preview'] = result['text'][:100]
                return result
        except Exception as e:
            self.activity_log[-1]['status'] = 'error'
            self.activity_log[-1]['error'] = str(e)
            return {'text': f'Error communicating with provider: {e}', 'data': {}, 'context_id': None}

    def _parse_response(self, response) -> dict:
        """Extract text and data from A2A Task/Message response."""
        result = response.root.result
        texts: list[str] = []
        data: dict = {}
        context_id: str | None = None

        # Extract context_id
        if hasattr(result, 'contextId'):
            context_id = result.contextId
        elif hasattr(result, 'context_id'):
            context_id = result.context_id

        # Try artifacts first (completed tasks)
        if hasattr(result, 'artifacts') and result.artifacts:
            for artifact in result.artifacts:
                for part in artifact.parts:
                    root = part.root if hasattr(part, 'root') else part
                    if hasattr(root, 'text'):
                        texts.append(root.text)
                    if hasattr(root, 'data'):
                        data.update(root.data if isinstance(root.data, dict) else {})

        # Fall back to status message
        if not texts and hasattr(result, 'status') and result.status and result.status.message:
            msg = result.status.message
            for part in msg.parts:
                root = part.root if hasattr(part, 'root') else part
                if hasattr(root, 'text'):
                    texts.append(root.text)

        # Fall back to history
        if not texts and hasattr(result, 'history') and result.history:
            for msg in reversed(result.history):
                if msg.role == 'agent':
                    for part in msg.parts:
                        root = part.root if hasattr(part, 'root') else part
                        if hasattr(root, 'text'):
                            texts.append(root.text)
                    break

        return {
            'text': '\n'.join(texts) if texts else 'No response from provider',
            'data': data,
            'context_id': context_id,
        }

    def get_activity_log(self) -> list[dict]:
        """Return the activity log and reset it."""
        log = list(self.activity_log)
        self.activity_log.clear()
        return log
