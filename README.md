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
- **fox-status** — Show a fox-themed status in the terminal
- **user-bash-fish** — Use fish as the shell for ! and !! commands if it is installed

### Skills

Various skills organized in `fun` and `serious` categories.

for instance,

- `elevator-pitch`: summarize the motivation for something in a short essay
- `git-gud`: state that the user has skill issues and it is not your problem in the style of the Dark Souls community
- `market-research`: use the web to research if there are already existing products or services that solve the same problem
- `plan`: opinionated way of writing and performing a plan
- `web-search`: web search using the Brave API. Clone of https://github.com/badlogic/pi-skills/tree/main/brave-search

`rage-mode` is kind of an exception here. While it was initially meant solely for fun, it is actually quite useful to generate rants
or getting honest reviews. If the worst this skill finds about your work are typos, consider the work being pretty good. 

### Shell completions

Fish completions for the `pi` CLI live in `completions/fish/pi.fish`.

Install them with:

```bash
./scripts/install-fish-completions.sh
```

The script copies the file to `${XDG_CONFIG_HOME:-~/.config}/fish/completions/pi.fish`, backs up an existing non-symlink file, and runs `fish -n` when fish is available.

### Themes

- `enolive` opinionated own theme
