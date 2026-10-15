---
name: context7
description: "Fetch current library/framework/SDK/CLI docs via the Context7 CLI (ctx7). Use whenever the user asks about a library, framework, SDK, API, CLI tool or cloud service (React, Next.js, Prisma, Tailwind, ...): API syntax, config, version migration, setup, library-specific debugging. Use even when you think you know the answer. Not for refactoring, scripts from scratch, business-logic debugging or general concepts."
---

# Context7 docs lookup

Training data goes stale; fetch docs before answering library questions.

1. Resolve the library ID (skip if the user gave an exact `/org/project` ID):

   ```bash
   npx -y ctx7@0.5.12 library <name> "<what you need to look up>"
   ```

   Pick by exact name match, description relevance, snippet count, source
   reputation (High/Medium) and benchmark score. Use a version-specific ID when
   the user names a version. Bad results: retry with another name
   (`next.js`, not `nextjs`) or rephrase.

2. Query docs, one concept per call:

   ```bash
   npx -y ctx7@0.5.12 docs /org/project "<single-topic question>"
   ```

   Several distinct concepts (routing + auth + caching) mean one call each,
   unless the question is how they interact. Pipe long output through
   `head -80`, or run it via `ctx_execute` so it stays out of context.

3. Answer from the fetched docs and name the library ID you used.
