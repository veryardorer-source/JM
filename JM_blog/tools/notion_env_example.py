"""
Safe Notion token loading example.

Use this pattern instead of hard-coding the token in scripts.
"""

import os

TOKEN = os.environ.get("NOTION_TOKEN")

if not TOKEN:
    raise RuntimeError("NOTION_TOKEN environment variable is not set.")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

