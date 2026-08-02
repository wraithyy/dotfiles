---
description: Log a workflow friction event to the cc-evolution evidence store
---

Log a friction event — a moment of workflow pain the user wants remembered as
evidence for future config evolution. Argument: free-text description of the
pain. If empty, ask one short question: "Co bolelo?"

Append ONE line to `~/Development/cc-evolution/data/friction.jsonl`:

```bash
printf '%s\n' '{"ts":"<ISO-8601 now>","cwd":"<current working dir>","text":"<the description, JSON-escaped>"}' >> ~/Development/cc-evolution/data/friction.jsonl
```

Rules:
- One line, valid JSON, no extra fields.
- Do not editorialize or expand the user's text; store it verbatim.
- Confirm with a single short line, then return to whatever was in progress.
- If the file/directory does not exist, create it (`mkdir -p`).
