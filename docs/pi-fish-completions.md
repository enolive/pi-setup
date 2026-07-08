# Draft fish completions for `pi`

This is a draft `fish` completion file for the `pi` CLI. It is not currently part of upstream pi; it is written down here as a possible contribution/reference.

Install location for fish completions:

```fish
~/.config/fish/completions/pi.fish
```

After writing the file, reload with:

```fish
source ~/.config/fish/completions/pi.fish
```

or start a new fish shell.

## Draft `pi.fish`

```fish
# fish completions for pi
# Generated from `pi --help` / docs for @earendil-works/pi-coding-agent 0.80.x.

function __fish_pi_needs_command
    set -l cmd (commandline -opc)
    set -e cmd[1]

    for token in $cmd
        switch $token
            case install remove uninstall update list config
                return 1
        end
    end

    return 0
end

function __fish_pi_using_command
    set -l wanted $argv[1]
    set -l cmd (commandline -opc)
    contains -- $wanted $cmd
end

function __fish_pi_complete_package_sources
    # Static prefixes for package sources accepted by `pi install/remove/uninstall`.
    # A richer completion could inspect `pi list` for installed packages.
    printf '%s\t%s\n' \
        'npm:' 'npm package source' \
        'git:' 'git package source' \
        'https://' 'HTTPS package source' \
        'ssh://' 'SSH package source'
end

function __fish_pi_complete_tools
    printf '%s\t%s\n' \
        read 'Read file contents' \
        bash 'Execute bash commands' \
        edit 'Edit files with find/replace' \
        write 'Write files' \
        grep 'Search file contents' \
        find 'Find files by glob pattern' \
        ls 'List directory contents'
end

# Top-level commands.
complete -c pi -f -n '__fish_pi_needs_command' -a install -d 'Install pi package'
complete -c pi -f -n '__fish_pi_needs_command' -a remove -d 'Remove pi package'
complete -c pi -f -n '__fish_pi_needs_command' -a uninstall -d 'Alias for remove'
complete -c pi -f -n '__fish_pi_needs_command' -a update -d 'Update pi or packages'
complete -c pi -f -n '__fish_pi_needs_command' -a list -d 'List installed packages'
complete -c pi -f -n '__fish_pi_needs_command' -a config -d 'Enable/disable package resources'

# General options.
complete -c pi -l provider -r -d 'Provider name'
complete -c pi -l model -r -d 'Model pattern or ID'
complete -c pi -l api-key -r -d 'API key'
complete -c pi -l system-prompt -r -d 'Replace system prompt'
complete -c pi -l append-system-prompt -r -d 'Append to system prompt'
complete -c pi -l mode -r -f -a 'text json rpc' -d 'Output mode'
complete -c pi -l print -s p -d 'Non-interactive mode'
complete -c pi -l continue -s c -d 'Continue previous session'
complete -c pi -l resume -s r -d 'Select session to resume'
complete -c pi -l session -r -d 'Use session path or ID'
complete -c pi -l session-id -r -d 'Use exact project session ID'
complete -c pi -l fork -r -d 'Fork session path or ID'
complete -c pi -l session-dir -r -d 'Directory for session storage'
complete -c pi -l no-session -d 'Do not save session'
complete -c pi -l name -s n -r -d 'Set session display name'
complete -c pi -l models -r -d 'Comma-separated scoped model patterns'
complete -c pi -l no-tools -s nt -d 'Disable all tools'
complete -c pi -l no-builtin-tools -s nbt -d 'Disable built-in tools'
complete -c pi -l tools -s t -r -d 'Comma-separated tool allowlist'
complete -c pi -l exclude-tools -s xt -r -d 'Comma-separated tool denylist'
complete -c pi -l thinking -r -f -a 'off minimal low medium high xhigh' -d 'Thinking level'
complete -c pi -l extension -s e -r -d 'Load extension file/package'
complete -c pi -l no-extensions -s ne -d 'Disable extension discovery'
complete -c pi -l skill -r -d 'Load skill file or directory'
complete -c pi -l no-skills -s ns -d 'Disable skill discovery'
complete -c pi -l prompt-template -r -d 'Load prompt template file or directory'
complete -c pi -l no-prompt-templates -s np -d 'Disable prompt template discovery'
complete -c pi -l theme -r -d 'Load theme file or directory'
complete -c pi -l no-themes -d 'Disable theme discovery'
complete -c pi -l no-context-files -s nc -d 'Disable AGENTS.md/CLAUDE.md discovery'
complete -c pi -l export -r -d 'Export session to HTML'
complete -c pi -l list-models -r -d 'List available models'
complete -c pi -l verbose -d 'Force verbose startup'
complete -c pi -l approve -s a -d 'Trust project-local files'
complete -c pi -l no-approve -s na -d 'Ignore project-local files'
complete -c pi -l offline -d 'Disable startup network operations'
complete -c pi -l help -s h -d 'Show help'
complete -c pi -l version -s v -d 'Show version'

# Values for constrained options.
complete -c pi -n '__fish_seen_argument -l mode' -f -a 'text json rpc' -d 'Output mode'
complete -c pi -n '__fish_seen_argument -l thinking' -f -a 'off minimal low medium high xhigh' -d 'Thinking level'
complete -c pi -n '__fish_seen_argument -l tools -s t' -f -a '(__fish_pi_complete_tools)'
complete -c pi -n '__fish_seen_argument -l exclude-tools -s xt' -f -a '(__fish_pi_complete_tools)'

# Package command flags.
complete -c pi -n '__fish_pi_using_command install' -s l -d 'Install project-local package'
complete -c pi -n '__fish_pi_using_command remove' -s l -d 'Remove project-local package'
complete -c pi -n '__fish_pi_using_command uninstall' -s l -d 'Remove project-local package'
complete -c pi -n '__fish_pi_using_command install' -l approve -s a -d 'Trust project-local files'
complete -c pi -n '__fish_pi_using_command install' -l no-approve -s na -d 'Ignore project-local files'
complete -c pi -n '__fish_pi_using_command remove' -l approve -s a -d 'Trust project-local files'
complete -c pi -n '__fish_pi_using_command remove' -l no-approve -s na -d 'Ignore project-local files'
complete -c pi -n '__fish_pi_using_command uninstall' -l approve -s a -d 'Trust project-local files'
complete -c pi -n '__fish_pi_using_command uninstall' -l no-approve -s na -d 'Ignore project-local files'
complete -c pi -n '__fish_pi_using_command config' -l approve -s a -d 'Trust project-local files'
complete -c pi -n '__fish_pi_using_command config' -l no-approve -s na -d 'Ignore project-local files'

# Package source prefixes for install/remove/uninstall.
complete -c pi -f -n '__fish_pi_using_command install' -a '(__fish_pi_complete_package_sources)'
complete -c pi -f -n '__fish_pi_using_command remove' -a '(__fish_pi_complete_package_sources)'
complete -c pi -f -n '__fish_pi_using_command uninstall' -a '(__fish_pi_complete_package_sources)'

# Update command targets/options.
complete -c pi -f -n '__fish_pi_using_command update' -a self -d 'Update pi itself'
complete -c pi -f -n '__fish_pi_using_command update' -a pi -d 'Update pi itself'
complete -c pi -n '__fish_pi_using_command update' -l all -d 'Update pi and packages'
complete -c pi -n '__fish_pi_using_command update' -l extensions -d 'Update packages only'
complete -c pi -n '__fish_pi_using_command update' -l self -d 'Update pi only'
complete -c pi -n '__fish_pi_using_command update' -l force -d 'Reinstall even if current'
complete -c pi -n '__fish_pi_using_command update' -l extension -r -d 'Update one package source'

# Package command help.
complete -c pi -n '__fish_pi_using_command install' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_using_command remove' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_using_command uninstall' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_using_command update' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_using_command list' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_using_command config' -l help -s h -d 'Show help'
```

## Possible improvements before contributing

- Add dynamic package completion for `remove`, `uninstall`, and `update --extension` by parsing `pi list` output.
- Add dynamic model/provider completion from `pi --list-models`, if the command is fast and side-effect free enough for completion use.
- Add smarter comma-separated completion for `--tools`, `--exclude-tools`, and `--models`.
- Add `@file` argument completion for pi's file-reference syntax.
- Verify subcommand-specific flags against `pi <command> --help` for the target upstream version.
- Consider generating fish/bash/zsh completion files from a single option schema in pi itself, instead of maintaining separate static files.
