"""LangChain tools that delegate to the travel provider agent via A2A."""

from __future__ import annotations

import os

from langchain_core.tools import tool

from a2a_client import TravelProviderClient

# Shared client instance
_client: TravelProviderClient | None = None


def get_client() -> TravelProviderClient:
    """Get or create the shared TravelProviderClient."""
    global _client
    if _client is None:
        base_url = os.environ.get('PROVIDER_URL', 'http://localhost:3000')
        _client = TravelProviderClient(base_url=base_url)
    return _client


def _compact(text: str) -> str:
    """Strip excessive whitespace from provider responses to save tokens."""
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
    return '\n'.join(lines)


@tool
async def search_weather(query: str) -> str:
    """Search weather forecast for a destination. Include city name in your query."""
    client = get_client()
    result = await client.send(f'weather {query}')
    return _compact(result['text'])


@tool
async def search_flights(query: str) -> str:
    """Search flights between cities. Include origin, destination, and date."""
    client = get_client()
    result = await client.send(f'flights {query}')
    return _compact(result['text'])


@tool
async def search_hotels(query: str) -> str:
    """Search hotels in a destination. Include city name."""
    client = get_client()
    result = await client.send(f'hotels {query}')
    return _compact(result['text'])


@tool
async def book_hotel(query: str) -> str:
    """Book a specific hotel. Include hotel name and city."""
    client = get_client()
    result = await client.send(f'book hotel {query}')
    return _compact(result['text'])


@tool
async def search_restaurants(query: str) -> str:
    """Search restaurants in a destination. Include city name."""
    client = get_client()
    result = await client.send(f'restaurants {query}')
    return _compact(result['text'])


@tool
async def search_activities(query: str) -> str:
    """Search activities and attractions in a destination. Include city name."""
    client = get_client()
    result = await client.send(f'activities {query}')
    return _compact(result['text'])


ALL_TOOLS = [
    search_weather,
    search_flights,
    search_hotels,
    book_hotel,
    search_restaurants,
    search_activities,
]
