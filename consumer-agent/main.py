import asyncio
import sys

from tools import discover_provider
from agent import agent

PROVIDER_URL = 'http://localhost:3000'


async def run_agent(user_input: str, thread_id: str) -> str:
    config = {'configurable': {'thread_id': thread_id}}
    inputs = {'messages': [('user', user_input)]}

    result = await agent.ainvoke(inputs, config)
    last_message = result['messages'][-1]
    return last_message.content


async def main() -> None:
    print('Discovering provider agent...')
    try:
        await discover_provider(PROVIDER_URL)
    except Exception as e:
        print(f'Failed to discover provider at {PROVIDER_URL}: {e}')
        print('Make sure the provider agent is running.')
        sys.exit(1)

    print('\nTravel Planning Assistant (type "quit" to exit)')
    print('=' * 50)

    thread_id = 'session-1'

    while True:
        try:
            user_input = input('\nYou: ').strip()
        except (EOFError, KeyboardInterrupt):
            print('\nGoodbye!')
            break

        if not user_input:
            continue
        if user_input.lower() in ('quit', 'exit', 'q'):
            print('Goodbye!')
            break

        print()
        try:
            response = await run_agent(user_input, thread_id)
            print(f'\nAssistant: {response}')
        except Exception as e:
            print(f'\nError: {e}')


if __name__ == '__main__':
    asyncio.run(main())
