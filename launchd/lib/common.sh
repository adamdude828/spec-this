#!/bin/bash
# Common utility functions for MCP service manager

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verbose mode flag (set by parent script)
VERBOSE=${VERBOSE:-false}

# Log file (optional, set by parent script)
LOG_FILE=${LOG_FILE:-}

# Helper functions
print_info() {
    local msg="${BLUE}ℹ${NC} $1"
    echo -e "$msg" >&2
    [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
}

print_success() {
    local msg="${GREEN}✓${NC} $1"
    echo -e "$msg" >&2
    [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
}

print_warning() {
    local msg="${YELLOW}⚠${NC} $1"
    echo -e "$msg" >&2
    [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
}

print_error() {
    local msg="${RED}✗${NC} $1"
    echo -e "$msg" >&2
    [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
}

print_debug() {
    if [ "$VERBOSE" = true ]; then
        local msg="${CYAN}[DEBUG]${NC} $1"
        echo -e "$msg" >&2
        [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
    fi
}

print_command() {
    if [ "$VERBOSE" = true ]; then
        local msg="${CYAN}[CMD]${NC} $1"
        echo -e "$msg" >&2
        [ -n "$LOG_FILE" ] && echo -e "$msg" >> "$LOG_FILE" || true
    fi
}

# Expand tilde in paths
expand_path() {
    local path="$1"
    echo "${path/#\~/$HOME}"
}

# Get node path
get_node_path() {
    local node_path=$(which node 2>/dev/null)
    if [ -z "$node_path" ]; then
        print_error "Node.js not found in PATH"
        exit 1
    fi
    print_debug "Found Node.js at: $node_path"
    echo "$node_path"
}

# Check if running on macOS
check_macos() {
    if [ "$(uname)" != "Darwin" ]; then
        print_error "This script only works on macOS"
        print_info "Current OS: $(uname)"
        exit 1
    fi
    print_debug "Running on macOS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Run command with timeout (macOS compatible)
run_with_timeout() {
    local timeout_spec=$1
    shift
    local cmd="$@"

    # Strip 's' suffix if present (e.g., "10s" -> "10")
    local timeout_sec="${timeout_spec%s}"

    print_command "$cmd"
    print_debug "Timeout: ${timeout_sec}s"

    # Run in background and kill if it takes too long
    bash -c "$cmd" &
    local pid=$!

    # Wait for the command with timeout (check every 0.5 seconds)
    local iterations=$((timeout_sec * 2))  # 0.5 seconds per iteration
    local count=0

    while kill -0 "$pid" 2>/dev/null && [ $count -lt $iterations ]; do
        sleep 0.5
        count=$((count + 1))
    done

    # If still running after timeout, kill it
    if kill -0 "$pid" 2>/dev/null; then
        print_debug "Command timed out after ${timeout_sec}s, killing process $pid"
        kill -TERM "$pid" 2>/dev/null || true
        sleep 0.5
        kill -KILL "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        return 124  # Standard timeout exit code
    fi

    # Get exit code
    wait "$pid" 2>/dev/null
    local exit_code=$?
    return $exit_code
}
