#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"
source_file="${repo_root}/completions/fish/pi.fish"

if [[ ! -f "${source_file}" ]]; then
  echo "error: completion file not found: ${source_file}" >&2
  exit 1
fi

fish_config_dir="${XDG_CONFIG_HOME:-${HOME}/.config}/fish"
target_dir="${fish_config_dir}/completions"
target_file="${target_dir}/pi.fish"
backup_file="${target_file}.bak.$(date +%Y%m%d%H%M%S)"

mkdir -p "${target_dir}"

if [[ -e "${target_file}" && ! -L "${target_file}" ]]; then
  cp "${target_file}" "${backup_file}"
  echo "Backed up existing completion to ${backup_file}"
fi

cp "${source_file}" "${target_file}"
echo "Installed fish completions to ${target_file}"

if command -v fish >/dev/null 2>&1; then
  fish -n "${target_file}"
  echo "Syntax check passed. Start a new fish shell or run:"
  echo "  source ${target_file}"
else
  echo "fish not found on PATH; skipped syntax check."
fi
