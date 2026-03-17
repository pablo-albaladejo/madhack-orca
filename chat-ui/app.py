import streamlit as st
import requests
import os
import time
from concurrent.futures import ThreadPoolExecutor, Future

CONSUMER_URL = os.getenv('CONSUMER_URL', 'http://localhost:8000')

st.set_page_config(page_title='Weekend Escape Planner', layout='wide', page_icon='✈️')

# Main chat area
st.title('✈️ Weekend Escape Planner')
st.caption('Plan your perfect weekend getaway — powered by A2A agents')

# Init session state
if 'messages' not in st.session_state:
    st.session_state.messages = []
    st.session_state.context_id = None
    st.session_state.activity_log = []

# Sidebar: A2A activity log (final state after response)
with st.sidebar:
    st.header('A2A Activity Log')
    st.caption('Agent-to-agent communication')
    if st.session_state.activity_log:
        for entry in st.session_state.activity_log:
            status = entry.get('status', 'unknown')
            skill = entry.get('skill_query', '?')
            ts = entry.get('timestamp', '')
            label = f'[{ts}] {skill}' if ts else skill
            if status == 'completed':
                st.success(label, icon='✅')
            elif status == 'error':
                st.error(label, icon='❌')
            else:
                st.info(label, icon='⏳')
    else:
        st.info('No A2A calls yet. Send a message to start.', icon='💬')

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg['role']):
        st.markdown(msg['content'])


def _call_consumer(text: str, context_id: str | None) -> dict:
    """Blocking call to consumer /message endpoint. Runs in background thread."""
    resp = requests.post(
        f'{CONSUMER_URL}/message',
        json={'text': text, 'context_id': context_id},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def _poll_activity(context_id: str) -> list[dict]:
    """Poll the /activity endpoint for live progress."""
    try:
        resp = requests.get(f'{CONSUMER_URL}/activity/{context_id}', timeout=5)
        if resp.ok:
            return resp.json()
    except Exception:
        pass
    return []


# Chat input
if prompt := st.chat_input('Where do you want to go? (e.g., "Plan a weekend in Barcelona")'):
    # Add user message
    st.session_state.messages.append({'role': 'user', 'content': prompt})
    with st.chat_message('user'):
        st.markdown(prompt)

    # Generate context_id upfront for polling
    if st.session_state.context_id is None:
        import uuid
        st.session_state.context_id = uuid.uuid4().hex

    context_id = st.session_state.context_id

    # Launch consumer call in background thread
    executor = ThreadPoolExecutor(max_workers=1)
    future: Future = executor.submit(_call_consumer, prompt, context_id)

    # Progress area at TOP LEVEL (not inside chat_message) — this flushes properly
    progress_area = st.empty()
    progress_area.markdown('**🔄 A2A Pipeline** — consumer agent is analyzing your request...')

    # Poll for activity while waiting
    while not future.done():
        activity = _poll_activity(context_id)
        if activity:
            st.session_state.activity_log = activity
            completed = sum(1 for e in activity if e.get('status') == 'completed')
            total = len(activity)

            lines = []
            for entry in activity:
                s = entry.get('status', '?')
                skill = entry.get('skill_query', '?')
                ts = entry.get('timestamp', '')
                preview = entry.get('response_preview', '')
                if s == 'completed':
                    # Show first line of response as preview
                    short = preview.split('\n')[0][:80] if preview else ''
                    detail = f'  \n  ↳ *{short}*' if short else ''
                    lines.append(f'✅ `{skill}` [{ts}]{detail}')
                elif s == 'error':
                    lines.append(f'❌ `{skill}` — error')
                else:
                    lines.append(f'⏳ `{skill}`')

            if completed == total and total > 0:
                header = f'**🔄 A2A Pipeline** — all {total} skills done, composing itinerary...\n\n'
                progress_area.markdown(header + '  \n'.join(lines))
                break
            else:
                header = f'**🔄 A2A Pipeline** ({completed}/{total} skills done)\n\n'
                progress_area.markdown(header + '  \n'.join(lines))

        time.sleep(0.3)

    # Wait for result
    try:
        data = future.result(timeout=120)
        progress_area.empty()

        response_text = data.get('response', 'No response received')
        with st.chat_message('assistant'):
            st.markdown(response_text)

        # Final state update
        st.session_state.context_id = data.get('context_id')
        st.session_state.activity_log = data.get('activity_log', [])
        st.session_state.messages.append({
            'role': 'assistant',
            'content': response_text,
        })

    except requests.exceptions.ConnectionError:
        progress_area.empty()
        error_msg = '⚠️ Cannot connect to the consumer agent. Make sure it\'s running on port 8000.'
        with st.chat_message('assistant'):
            st.error(error_msg)
        st.session_state.messages.append({'role': 'assistant', 'content': error_msg})
    except Exception as e:
        progress_area.empty()
        error_msg = f'⚠️ Error: {str(e)}'
        with st.chat_message('assistant'):
            st.error(error_msg)
        st.session_state.messages.append({'role': 'assistant', 'content': error_msg})

    executor.shutdown(wait=False)
    st.rerun()
