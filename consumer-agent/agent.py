"""LangGraph ReAct agent for travel planning orchestration."""

from __future__ import annotations

import os

from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from tools import ALL_TOOLS, get_client

SYSTEM_PROMPT = """You are a travel planning assistant. You MUST call tools immediately — NEVER ask clarifying questions.

When the user mentions a destination, IMMEDIATELY call ALL of these tools (do not ask for more details):
- search_weather(destination + "this weekend")
- search_flights("flights from Madrid to {destination} on Friday") — default origin is Madrid
- search_hotels(destination)
- search_restaurants(destination)
- search_activities(destination)

If the user doesn't specify origin city, assume Madrid. If no date, assume this coming weekend.

After gathering results, compose a day-by-day itinerary:
- Outdoor activities on sunny days, indoor (museums, shopping) when rain
- Restaurant suggestions for each meal
- Include prices. Be concise, use bullet points."""

# Checkpointer for multi-turn conversations
memory = MemorySaver()


def create_agent():
    """Create and return the LangGraph ReAct agent."""
    model_name = os.environ.get('MODEL_NAME', 'claude-sonnet-4-20250514')
    model = ChatAnthropic(model=model_name, max_tokens=4096)

    graph = create_react_agent(
        model,
        tools=ALL_TOOLS,
        checkpointer=memory,
        prompt=SYSTEM_PROMPT,
    )
    return graph


# Module-level agent instance
_agent = None


def get_agent():
    """Get or create the agent singleton."""
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent


async def invoke_agent(text: str, context_id: str) -> dict:
    """Invoke the agent with a user message.

    Args:
        text: User message text.
        context_id: Conversation thread ID (maps to LangGraph thread_id).

    Returns:
        dict with 'response' (str) and 'activity_log' (list).
    """
    agent = get_agent()
    config = {'configurable': {'thread_id': context_id}}
    inputs = {'messages': [('user', text)]}

    result = await agent.ainvoke(inputs, config)

    # Extract the final AI message
    last_message = result['messages'][-1]
    response_text = last_message.content if hasattr(last_message, 'content') else str(last_message)

    # If content is a list (Anthropic format), join text blocks
    if isinstance(response_text, list):
        response_text = '\n'.join(
            block['text'] if isinstance(block, dict) else str(block)
            for block in response_text
            if isinstance(block, dict) and block.get('type') == 'text' or isinstance(block, str)
        )

    # Collect activity log from the A2A client
    client = get_client()
    activity_log = client.get_activity_log()

    return {
        'response': response_text,
        'activity_log': activity_log,
    }
