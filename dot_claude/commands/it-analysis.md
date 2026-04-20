---
description: Analyze business/project materials, ask clarifying questions, produce structured analysis document and Jira-ready task breakdown. Source of truth for developers.
---

# IT Analysis Command

This command invokes the **it-analyst** agent to perform comprehensive IT/business analysis of provided materials.

## What This Command Does

1. **Reads & analyzes** all provided materials (documents, specs, emails, notes)
2. **Asks clarifying questions** iteratively — every ambiguity, business decision, architectural choice
3. **Produces structured analysis** — the single source of truth for development
4. **Generates Jira task breakdown** — ready for sprint planning

## When to Use

Use `/it-analysis` when:
- You have business requirements that need to be translated for developers
- You received specs, wireframes, or meeting notes that need structuring
- Starting a new project or feature and need a clear requirements document
- You want a traceable link between business rules and development tasks

## How It Works

### Phase 1: Material Intake

The analyst reads all provided materials and creates an initial understanding map.

Provide materials by:
- Pasting text directly
- Pointing to files in the repo
- Providing URLs to documents
- Describing the feature verbally

### Phase 2: Clarifying Questions (Iterative)

The analyst asks categorized questions:
- **[BUSINESS]** — Business context, rules, stakeholders, KPIs
- **[UX]** — User flows, screen states, validation, feedback
- **[TECHNICAL]** — Systems, APIs, data models, performance
- **[DATA]** — Sources, formats, validation, privacy
- **[EDGE CASE]** — Error handling, race conditions, scale

**CRITICAL**: The analyst will NOT proceed until you confirm all questions are answered. Expect multiple rounds of questions.

### Phase 3: Structured Output

Two documents are generated:

1. **Analysis Document** (`docs/analysis/[name]-analysis.md`)
   - Executive summary
   - Business context & rules (BR-XXX)
   - Functional requirements (FR-XXX) with acceptance criteria
   - Non-functional requirements (NFR-XXX)
   - Data model & rules
   - User flows (happy path + alternatives + errors)
   - Integration points
   - Architectural decisions (AD-XXX)
   - Open questions, risks, glossary

2. **Jira Task Breakdown** (`docs/analysis/[name]-jira-tasks.md`)
   - Epics, stories, tasks with estimates
   - Acceptance criteria per story
   - Technical notes for developers
   - Dependencies between tasks
   - Traceability back to requirements (FR-XXX, BR-XXX)

## Example Usage

```
User: /it-analysis Here are the requirements for our new invoicing module...

Analyst: I've read through the materials. Before I create the analysis, I have
         several questions organized by category:

         [BUSINESS]
         1. Who approves invoices — is there a multi-level approval workflow?
         2. What are the payment terms (net 30, net 60, custom)?
         ...

         [UX]
         3. What happens when a user tries to edit an already-sent invoice?
         ...

         [EDGE CASE]
         7. What if the recipient's email bounces?
         ...

User: [answers questions]

Analyst: Thank you. A few follow-up questions:
         ...

User: [answers again] That covers everything.

Analyst: [Generates analysis document + Jira tasks]
```

## Output Location

Files are written to `docs/analysis/` in the project root:
- `[feature-name]-analysis.md` — Full analysis document
- `[feature-name]-jira-tasks.md` — Jira-ready task breakdown

## Integration with Other Commands

After analysis:
- Use `/plan` to create an implementation plan from the analysis
- Use `/tdd` to implement features following the requirements
- Use `/orchestrate feature` for full implementation workflow

## Related Agents

This command invokes the `it-analyst` agent located at:
`~/.claude/agents/it-analyst.md`

## Arguments

$ARGUMENTS:
- Provide materials inline, as file paths, or as URLs
- Optionally specify output directory: `--output docs/specs/`
- Optionally specify language: `--lang cs` (default: auto-detect from user)
