"""Shared Notion API authentication helpers.

Set NOTION_TOKEN in your environment before running scripts in this folder.
"""
import os


TOKEN = os.environ.get("NOTION_TOKEN")

if not TOKEN:
    raise RuntimeError(
        "NOTION_TOKEN environment variable is required. "
        "Set it before running this script."
    )


