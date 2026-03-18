from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic

from tools import send_to_agent

SYSTEM_PROMPT = """You are a travel planning assistant. You help users plan trips by delegating to a travel provider agent.

Available skills via the travel provider:
- weather: Get weather forecast for a city
- restaurants: Find restaurants in a city
- flights: Search flights between cities
- hotels: Search hotels in a city
- booking: Book or cancel flights/hotels (returns confirmation ID)

For trip planning requests, call the relevant skills and combine the results into a helpful travel plan. Always include weather. When the user confirms, book flights/hotels and provide confirmation IDs."""

memory = MemorySaver()

model = ChatAnthropic(model='claude-sonnet-4-20250514')

agent = create_react_agent(
    model,
    tools=[send_to_agent],
    checkpointer=memory,
    prompt=SYSTEM_PROMPT,
)
