"""Shared per-context activity store for live polling.

Thread-safe storage of A2A activity logs keyed by context_id.
The a2a_client writes entries as they happen, and the /activity endpoint reads them.
"""

from __future__ import annotations

import threading
import time
from copy import deepcopy


class ActivityStore:
    """Thread-safe store mapping context_id → list of activity entries."""

    def __init__(self):
        self._store: dict[str, list[dict]] = {}
        self._lock = threading.Lock()

    def init_context(self, context_id: str):
        """Initialize an empty activity log for a context."""
        with self._lock:
            self._store[context_id] = []

    def append(self, context_id: str, entry: dict):
        """Add an activity entry for a context."""
        entry['timestamp'] = time.strftime('%H:%M:%S')
        with self._lock:
            if context_id not in self._store:
                self._store[context_id] = []
            self._store[context_id].append(entry)

    def update_by_query(self, context_id: str, skill_query: str, updates: dict):
        """Update a specific entry by its skill_query (thread-safe match)."""
        updates['timestamp'] = time.strftime('%H:%M:%S')
        with self._lock:
            entries = self._store.get(context_id, [])
            for entry in entries:
                if entry.get('skill_query') == skill_query:
                    entry.update(updates)
                    return
            # Fallback: update last if no match found
            if entries:
                entries[-1].update(updates)

    def get(self, context_id: str) -> list[dict]:
        """Get a snapshot of the activity log for a context (does NOT clear)."""
        with self._lock:
            return deepcopy(self._store.get(context_id, []))

    def clear(self, context_id: str) -> list[dict]:
        """Get and clear the activity log for a context."""
        with self._lock:
            entries = self._store.pop(context_id, [])
            return deepcopy(entries)


# Module-level singleton
_store = ActivityStore()


def get_activity_store() -> ActivityStore:
    return _store
