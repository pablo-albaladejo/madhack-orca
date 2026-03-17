import streamlit as st
import requests
import os

CONSUMER_URL = os.getenv('CONSUMER_URL', 'http://localhost:8000')

st.set_page_config(page_title='Weekend Escape Planner', layout='wide', page_icon='✈️')

# Sidebar: A2A activity log
with st.sidebar:
    st.header('A2A Activity Log')
    st.caption('Shows agent-to-agent communication in real time')
    if 'activity_log' in st.session_state and st.session_state.activity_log:
        for entry in st.session_state.activity_log:
            status = entry.get('status', 'unknown')
            skill = entry.get('skill_query', entry.get('skill', '?'))
            if status == 'completed':
                st.success(f'{skill}', icon='✅')
            elif status == 'error':
                st.error(f'{skill}', icon='❌')
            else:
                st.info(f'{skill}', icon='⏳')
    else:
        st.info('No A2A calls yet. Send a message to start.', icon='💬')

# Main chat
st.title('✈️ Weekend Escape Planner')
st.caption('Plan your perfect weekend getaway — powered by A2A agents')

# Init session state
if 'messages' not in st.session_state:
    st.session_state.messages = []
    st.session_state.context_id = None
    st.session_state.activity_log = []

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg['role']):
        st.markdown(msg['content'])

# Chat input
if prompt := st.chat_input('Where do you want to go? (e.g., "Plan a weekend in Barcelona")'):
    # Add user message
    st.session_state.messages.append({'role': 'user', 'content': prompt})
    with st.chat_message('user'):
        st.markdown(prompt)

    # Call consumer agent
    with st.chat_message('assistant'):
        with st.spinner('Planning your trip... (calling travel skills via A2A)'):
            try:
                resp = requests.post(
                    f'{CONSUMER_URL}/message',
                    json={
                        'text': prompt,
                        'context_id': st.session_state.context_id,
                    },
                    timeout=120,
                )
                resp.raise_for_status()
                data = resp.json()

                response_text = data.get('response', 'No response received')
                st.markdown(response_text)

                # Update state
                st.session_state.context_id = data.get('context_id')
                st.session_state.activity_log = data.get('activity_log', [])
                st.session_state.messages.append({
                    'role': 'assistant',
                    'content': response_text,
                })

            except requests.exceptions.ConnectionError:
                error_msg = '⚠️ Cannot connect to the consumer agent. Make sure it\'s running on port 8000.'
                st.error(error_msg)
                st.session_state.messages.append({
                    'role': 'assistant',
                    'content': error_msg,
                })
            except Exception as e:
                error_msg = f'⚠️ Error: {str(e)}'
                st.error(error_msg)
                st.session_state.messages.append({
                    'role': 'assistant',
                    'content': error_msg,
                })

    st.rerun()
