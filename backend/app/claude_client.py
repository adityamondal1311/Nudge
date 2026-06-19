import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODEL = "claude-sonnet-4-6"
CATEGORIES = ["IT", "HR", "Finance", "Admin"]

_TOOL = {
    "name": "categorize_ticket",
    "description": "Classify an internal support ticket into a department category.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {"type": "string", "enum": CATEGORIES},
            "confidence": {
                "type": "number",
                "description": "Confidence in this category from 0.0 to 1.0",
            },
            "reasoning": {
                "type": "string",
                "description": "One-line reason for the chosen category, e.g. 'mentions VPN and laptop access'",
            },
        },
        "required": ["category", "confidence", "reasoning"],
    },
}


def categorize_ticket(title: str, description: str) -> dict:
    message = _client.messages.create(
        model=MODEL,
        max_tokens=300,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "categorize_ticket"},
        messages=[
            {
                "role": "user",
                "content": (
                    "Classify this internal support ticket into exactly one department: "
                    f"{', '.join(CATEGORIES)}.\n\n"
                    f"Title: {title}\n"
                    f"Description: {description}"
                ),
            }
        ],
    )
    for block in message.content:
        if block.type == "tool_use" and block.name == "categorize_ticket":
            return block.input
    raise RuntimeError(f"Claude did not return a tool_use block: {message.content!r}")
