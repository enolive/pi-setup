---
name: management-slide-deck
description: Use when creating or revising a concise management-facing slide deck, especially in presenterm/Markdown format.
---

# Management Slide Deck Skill

Use this skill when the user wants a presentation for managers, executives, or a board-style audience.

## Human reception rules

- Keep each slide focused on one idea.
- Use only a few statements per slide.
- Prefer short lines over paragraphs.
- Avoid dense bullet lists.
- If a slide feels like documentation, split it.
- Assume the audience is busy and will run away from death by PowerPoint.

## Suggested structure

A simple decision deck can use:

1. Problem
2. Why it matters
3. Solution
4. Current state
5. Future state
6. Why not leave it as-is?
7. Why build instead of buy?
8. What we build
9. The ask

Adjust the structure, but keep the flow from pain → value → decision.

## Presenterm style

For Presenterm Markdown:

- Use `<!-- end_slide -->` to end each slide.
- Do not include “Slide 1”, “Slide 2”, etc. in headings.
- Use setext headings for slide titles:

```md
The problem
===========
```

- A simple title/banner slide can be custom Markdown instead of front matter:

```md
Project Name
============

## Short subtitle.

![banner](slide-banner.png)

<!-- end_slide -->
```

- include a banner only if the user provides it to you.
- Keep image paths relative to the presentation file.

## Slide density guideline

Aim for no more than five visible content units per slide, including the title.
For example:

```md
Future state
============

A small standalone adapter package.

Tested event mapping and guard conditions.

Opt-in debug logging for real-session soak testing.
```

## How to convert from a verbose draft

- Remove slide numbers.
- Split current state and future state if they compete.
- Replace paragraphs with short statements.
- Collapse long bullet lists into one sentence when possible.
- Move research detail into a separate research document.
- Keep a separate real elevator pitch if the user needs something spoken.

## Common mistake

Do not confuse a management slide deck with an elevator pitch.

- Elevator pitch: 30-60 seconds, spoken, 3 short paragraphs.
- Management slide deck: visual discussion aid, multiple simple slides.
