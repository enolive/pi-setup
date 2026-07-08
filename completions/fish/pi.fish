# fish completions for pi
# Generated from `pi --help` / package command help for @earendil-works/pi-coding-agent 0.80.x.

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
    printf '%s\t%s\n' \
        'npm:' 'npm package source' \
        'git:' 'git package source' \
        'https://' 'HTTPS package source' \
        'ssh://' 'SSH package source' \
        './' 'local package path'
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

# Top-level package/config commands.
complete -c pi -f -n '__fish_pi_needs_command' -a install -d 'Install package and add it to settings'
complete -c pi -f -n '__fish_pi_needs_command' -a remove -d 'Remove package and source from settings'
complete -c pi -f -n '__fish_pi_needs_command' -a uninstall -d 'Alias for remove'
complete -c pi -f -n '__fish_pi_needs_command' -a update -d 'Update pi and installed packages'
complete -c pi -f -n '__fish_pi_needs_command' -a list -d 'List installed packages'
complete -c pi -f -n '__fish_pi_needs_command' -a config -d 'Enable/disable package resources'

# Main pi options. Use -o for pi's multi-character single-dash aliases (-nt, -nbt, -xt, ...).
complete -c pi -n '__fish_pi_needs_command' -l provider -r -d 'Provider name'
complete -c pi -n '__fish_pi_needs_command' -l model -r -d 'Model pattern or ID'
complete -c pi -n '__fish_pi_needs_command' -l api-key -r -d 'API key'
complete -c pi -n '__fish_pi_needs_command' -l system-prompt -r -d 'Replace system prompt'
complete -c pi -n '__fish_pi_needs_command' -l append-system-prompt -r -d 'Append to system prompt'
complete -c pi -n '__fish_pi_needs_command' -l mode -r -f -a 'text json rpc' -d 'Output mode'
complete -c pi -n '__fish_pi_needs_command' -l print -s p -d 'Non-interactive mode'
complete -c pi -n '__fish_pi_needs_command' -l continue -s c -d 'Continue previous session'
complete -c pi -n '__fish_pi_needs_command' -l resume -s r -d 'Select session to resume'
complete -c pi -n '__fish_pi_needs_command' -l session -r -d 'Use session path or ID'
complete -c pi -n '__fish_pi_needs_command' -l session-id -r -d 'Use exact project session ID'
complete -c pi -n '__fish_pi_needs_command' -l fork -r -d 'Fork session path or ID'
complete -c pi -n '__fish_pi_needs_command' -l session-dir -r -d 'Directory for session storage'
complete -c pi -n '__fish_pi_needs_command' -l no-session -d 'Do not save session'
complete -c pi -n '__fish_pi_needs_command' -l name -s n -r -d 'Set session display name'
complete -c pi -n '__fish_pi_needs_command' -l models -r -d 'Comma-separated scoped model patterns'
complete -c pi -n '__fish_pi_needs_command' -l no-tools -o nt -d 'Disable all tools'
complete -c pi -n '__fish_pi_needs_command' -l no-builtin-tools -o nbt -d 'Disable built-in tools'
complete -c pi -n '__fish_pi_needs_command' -l tools -s t -r -d 'Comma-separated tool allowlist'
complete -c pi -n '__fish_pi_needs_command' -l exclude-tools -o xt -r -d 'Comma-separated tool denylist'
complete -c pi -n '__fish_pi_needs_command' -l thinking -r -f -a 'off minimal low medium high xhigh' -d 'Thinking level'
complete -c pi -n '__fish_pi_needs_command' -l extension -s e -r -d 'Load extension file/package'
complete -c pi -n '__fish_pi_needs_command' -l no-extensions -o ne -d 'Disable extension discovery'
complete -c pi -n '__fish_pi_needs_command' -l skill -r -d 'Load skill file or directory'
complete -c pi -n '__fish_pi_needs_command' -l no-skills -o ns -d 'Disable skill discovery'
complete -c pi -n '__fish_pi_needs_command' -l prompt-template -r -d 'Load prompt template file or directory'
complete -c pi -n '__fish_pi_needs_command' -l no-prompt-templates -o np -d 'Disable prompt template discovery'
complete -c pi -n '__fish_pi_needs_command' -l theme -r -d 'Load theme file or directory'
complete -c pi -n '__fish_pi_needs_command' -l no-themes -d 'Disable theme discovery'
complete -c pi -n '__fish_pi_needs_command' -l no-context-files -o nc -d 'Disable AGENTS.md/CLAUDE.md discovery'
complete -c pi -n '__fish_pi_needs_command' -l export -r -d 'Export session to HTML'
complete -c pi -n '__fish_pi_needs_command' -l list-models -r -d 'List available models'
complete -c pi -n '__fish_pi_needs_command' -l verbose -d 'Force verbose startup'
complete -c pi -n '__fish_pi_needs_command' -l approve -s a -d 'Trust project-local files'
complete -c pi -n '__fish_pi_needs_command' -l no-approve -o na -d 'Ignore project-local files'
complete -c pi -n '__fish_pi_needs_command' -l offline -d 'Disable startup network operations'
complete -c pi -n '__fish_pi_needs_command' -l help -s h -d 'Show help'
complete -c pi -n '__fish_pi_needs_command' -l version -s v -d 'Show version'

# Values for constrained main options.
complete -c pi -n '__fish_pi_needs_command; and __fish_seen_argument -l mode' -f -a 'text json rpc' -d 'Output mode'
complete -c pi -n '__fish_pi_needs_command; and __fish_seen_argument -l thinking' -f -a 'off minimal low medium high xhigh' -d 'Thinking level'
complete -c pi -n '__fish_pi_needs_command; and __fish_seen_argument -l tools -s t' -f -a '(__fish_pi_complete_tools)'
complete -c pi -n '__fish_pi_needs_command; and __fish_seen_argument -l exclude-tools -o xt' -f -a '(__fish_pi_complete_tools)'

# install/remove/uninstall options.
complete -c pi -n '__fish_pi_using_command install' -s l -l local -d 'Install project-locally (.pi/settings.json)'
complete -c pi -n '__fish_pi_using_command remove' -s l -l local -d 'Remove from project settings (.pi/settings.json)'
complete -c pi -n '__fish_pi_using_command uninstall' -s l -l local -d 'Remove from project settings (.pi/settings.json)'
complete -c pi -n '__fish_pi_using_command install' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command install' -o na -l no-approve -d 'Ignore project-local files for this command'
complete -c pi -n '__fish_pi_using_command remove' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command remove' -o na -l no-approve -d 'Ignore project-local files for this command'
complete -c pi -n '__fish_pi_using_command uninstall' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command uninstall' -o na -l no-approve -d 'Ignore project-local files for this command'
complete -c pi -n '__fish_pi_using_command install' -s h -l help -d 'Show help'
complete -c pi -n '__fish_pi_using_command remove' -s h -l help -d 'Show help'
complete -c pi -n '__fish_pi_using_command uninstall' -s h -l help -d 'Show help'

# Package source prefixes for install/remove/uninstall.
complete -c pi -f -n '__fish_pi_using_command install' -a '(__fish_pi_complete_package_sources)'
complete -c pi -f -n '__fish_pi_using_command remove' -a '(__fish_pi_complete_package_sources)'
complete -c pi -f -n '__fish_pi_using_command uninstall' -a '(__fish_pi_complete_package_sources)'

# update command targets/options.
complete -c pi -f -n '__fish_pi_using_command update' -a self -d 'Update pi only'
complete -c pi -f -n '__fish_pi_using_command update' -a pi -d 'Update pi only'
complete -c pi -f -n '__fish_pi_using_command update' -a '(__fish_pi_complete_package_sources)'
complete -c pi -n '__fish_pi_using_command update' -l self -d 'Update pi only'
complete -c pi -n '__fish_pi_using_command update' -l extensions -d 'Update installed packages only'
complete -c pi -n '__fish_pi_using_command update' -l all -d 'Update pi and installed packages'
complete -c pi -n '__fish_pi_using_command update' -l extension -r -d 'Update one package only'
complete -c pi -n '__fish_pi_using_command update' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command update' -o na -l no-approve -d 'Ignore project-local files for this command'
complete -c pi -n '__fish_pi_using_command update' -l force -d 'Reinstall pi even if current'
complete -c pi -n '__fish_pi_using_command update' -s h -l help -d 'Show help'

# list command options.
complete -c pi -n '__fish_pi_using_command list' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command list' -o na -l no-approve -d 'Ignore project-local files for this command'
complete -c pi -n '__fish_pi_using_command list' -s h -l help -d 'Show help'

# config command accepts trust overrides, but `pi config --help` currently opens the TUI rather than printing help.
complete -c pi -n '__fish_pi_using_command config' -s a -l approve -d 'Trust project-local files for this command'
complete -c pi -n '__fish_pi_using_command config' -o na -l no-approve -d 'Ignore project-local files for this command'
