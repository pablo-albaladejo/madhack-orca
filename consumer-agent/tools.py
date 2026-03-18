"""LangChain tools that delegate to the travel provider agent via A2A."""

from __future__ import annotations

import os

from langchain_core.tools import tool

from a2a_client import TravelProviderClient

# Shared client instance
_client: TravelProviderClient | None = None

# Current conversation context_id (set before invoking agent)
_context_id: str | None = None


def get_client() -> TravelProviderClient:
    """Get or create the shared TravelProviderClient."""
    global _client
    if _client is None:
        base_url = os.environ.get('PROVIDER_URL', 'http://localhost:3000')
        _client = TravelProviderClient(base_url=base_url)
    return _client


def set_context_id(context_id: str | None):
    """Set the A2A contextId for the current conversation."""
    global _context_id
    _context_id = context_id
    client = get_client()
    client.context_id = context_id


def _compact(text: str) -> str:
    """Strip excessive whitespace from provider responses to save tokens."""
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
    return '\n'.join(lines)


@tool
async def search_weather(query: str) -> str:
    """Search weather forecast. Input: '{city} this weekend'. Example: 'Barcelona this weekend'. Returns 3-day forecast with temperature and conditions."""
    client = get_client()
    result = await client.send(f'weather {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def search_flights(query: str) -> str:
    """Search flights. Input: 'from {origin} to {destination} on {day}'. Example: 'from Madrid to Barcelona on Friday'. Returns flights with prices and times."""
    client = get_client()
    result = await client.send(f'flights {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def search_hotels(query: str) -> str:
    """Search hotels. Input: '{city}'. Example: 'Barcelona'. Returns hotels with prices, stars, and neighborhoods."""
    client = get_client()
    result = await client.send(f'hotels {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def book_hotel(query: str) -> str:
    """Book a hotel. Input: '{hotel name} in {city}'. Example: 'Hotel Gotic in Barcelona'. Returns booking confirmation number."""
    client = get_client()
    result = await client.send(f'book hotel {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def cancel_hotel(confirmation_code: str) -> str:
    """Cancel a hotel booking. Input: the confirmation code. Example: 'HTL-20260318-BJ6V'. Returns cancellation confirmation."""
    client = get_client()
    result = await client.send(f'cancel hotel {confirmation_code}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def search_restaurants(query: str) -> str:
    """Search restaurants. Input: '{city}'. Example: 'Barcelona'. Returns restaurants with ratings, prices, and addresses."""
    client = get_client()
    result = await client.send(f'restaurants {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def search_activities(query: str) -> str:
    """Search activities and attractions. Input: '{city}'. Example: 'Barcelona'. Returns museums, attractions, and tours with ratings."""
    client = get_client()
    result = await client.send(f'activities {query}', context_id=_context_id)
    return _compact(result['text'])


@tool
async def search_events(query: str) -> str:
    """Search events and shows this weekend. Input: '{city}'. Example: 'Barcelona'. Returns concerts, sports, theatre with dates, venues, and prices."""
    client = get_client()
    result = await client.send(f'events {query}', context_id=_context_id)
    return _compact(result['text'])


ALL_TOOLS = [
    search_weather,
    search_flights,
    search_hotels,
    book_hotel,
    cancel_hotel,
    search_restaurants,
    search_activities,
    search_events,
]
