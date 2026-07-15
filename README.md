# Hand-crafted pi setup

This is a [pi package](https://pi.dev/packages) containing extensions, skills, and prompts.

> [!WARNING]  
> Review the code before installing. You should **never** trust agentic contents without a prior review.

## Install

```bash
# From local path
pi install ./path/to/pi-setup

# Or from git
pi install git:github.com/enolive/pi-setup
```

## Included

### Extensions

- **avatar** — Displays a fox avatar in terminals that support inline images (Kitty, iTerm2, Ghostty, WezTerm, Warp)

### Skills

- `elevator-pitch` — Summarize the motivation for something in a short essay
- `kaaaarl` — Behave like Carl the llama
- `management-slide-deck` – Create a management slide deck
- `market-research` – Use the web to research if there are already existing products or services that solve the same problem
- `rage-mode` — Enter rage mode for ultimate rants
- `sarcasm` — Passive aggressive sarcasm mode
- `tinfoil` — Full on conspiracies
- `web-search` — Web Search using the Brave API. Clone of https://github.com/badlogic/pi-skills/tree/main/brave-search

### Prompts

- `plan.md` — Planning prompt template

### Shell completions

Fish completions for the `pi` CLI live in `completions/fish/pi.fish`.

Install them with:

```bash
./scripts/install-fish-completions.sh
```

The script copies the file to `${XDG_CONFIG_HOME:-~/.config}/fish/completions/pi.fish`, backs up an existing non-symlink file, and runs `fish -n` when fish is available.

### Themes

- `enolive` opinionated own theme
