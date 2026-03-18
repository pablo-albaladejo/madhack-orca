from datetime import datetime

GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'


def log_outgoing(message: str) -> None:
    ts = datetime.now().strftime('%H:%M:%S')
    preview = message[:80] + ('...' if len(message) > 80 else '')
    print(f'{GREEN}[{ts}] → Provider  message/send  "{preview}"{RESET}')


def log_incoming(status: str, message: str) -> None:
    ts = datetime.now().strftime('%H:%M:%S')
    preview = message[:80] + ('...' if len(message) > 80 else '')
    print(f'{BLUE}[{ts}] ← Provider  {status}  "{preview}"{RESET}')


def log_error(message: str) -> None:
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'{YELLOW}[{ts}] ✗ Error: {message}{RESET}')


def log_discovery(agent_name: str, skills: list[str]) -> None:
    ts = datetime.now().strftime('%H:%M:%S')
    print(f'{BOLD}[{ts}] ✓ Discovered agent: {agent_name}{RESET}')
    print(f'{BOLD}[{ts}]   Skills: {", ".join(skills)}{RESET}')
