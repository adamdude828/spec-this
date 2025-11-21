#!/bin/bash

# MCP Service Manager for macOS
# Manages multiple MCP server projects as launchd services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${SCRIPT_DIR}/projects.json"
TEMPLATE_FILE="${SCRIPT_DIR}/com.specthis.mcp.plist.template"

# Parse command line options
VERBOSE=false
LOG_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -l|--log)
            LOG_FILE="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

# Export variables for child scripts
export VERBOSE
export LOG_FILE

# Initialize log file if specified
if [ -n "$LOG_FILE" ]; then
    echo "=== MCP Service Manager Log - $(date) ===" > "$LOG_FILE"
fi

# Source modular scripts
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/plist.sh"
source "$SCRIPT_DIR/lib/service.sh"

# Show usage
usage() {
    cat << EOF
MCP Service Manager for macOS

Usage: $0 [options] <command> [project-name] [args]

Options:
    -v, --verbose          Enable verbose output
    -l, --log <file>       Write log to file

Commands:
    install [project]      Install service(s) - all enabled if no project specified
    uninstall [project]    Uninstall service(s) - all if no project specified
    start <project>        Start a service
    stop <project>         Stop a service
    restart <project>      Restart a service
    status [project]       Show status of service(s) - all if no project specified
    logs <project> [-f]    Show logs for a service (-f to follow)
    list                   List all configured projects
    help                   Show this help message

Examples:
    $0 install                 # Install all enabled projects
    $0 -v install spec-this    # Install spec-this with verbose output
    $0 status                  # Show status of all projects
    $0 status spec-this        # Show status of spec-this
    $0 logs spec-this -f       # Follow logs for spec-this
    $0 restart spec-this       # Restart spec-this

Configuration:
    Edit launchd/projects.json to add or configure projects

EOF
}

# Main command dispatcher
main() {
    local command="${1:-}"
    local project="${2:-}"
    local option="${3:-}"

    print_debug "Command: $command"
    print_debug "Project: $project"
    print_debug "Option: $option"
    print_debug "Verbose: $VERBOSE"
    print_debug "Log file: ${LOG_FILE:-none}"

    # Check dependencies first
    if ! command_exists jq; then
        print_error "jq is required but not installed"
        print_info "Install with: brew install jq"
        exit 1
    fi

    # Check if running on macOS (except for list/help commands)
    if [ "$command" != "list" ] && [ "$command" != "help" ] && [ "$command" != "--help" ] && [ "$command" != "-h" ]; then
        check_macos
    fi

    # Ensure LaunchAgents directory exists
    ensure_launchd_dir

    case "$command" in
        install)
            if [ -n "$project" ]; then
                install_project "$CONFIG_FILE" "$TEMPLATE_FILE" "$project"
            else
                install_all "$CONFIG_FILE" "$TEMPLATE_FILE"
            fi
            ;;
        uninstall)
            if [ -n "$project" ]; then
                uninstall_project "$CONFIG_FILE" "$project"
            else
                uninstall_all "$CONFIG_FILE"
            fi
            ;;
        start)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            start_project "$CONFIG_FILE" "$project"
            ;;
        stop)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            stop_project "$CONFIG_FILE" "$project"
            ;;
        restart)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            restart_project "$CONFIG_FILE" "$project"
            ;;
        status)
            if [ -n "$project" ]; then
                status_project "$CONFIG_FILE" "$project"
            else
                status_all "$CONFIG_FILE"
            fi
            ;;
        logs)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            if [ "$option" = "-f" ]; then
                logs_project "$CONFIG_FILE" "$project" true
            else
                logs_project "$CONFIG_FILE" "$project" false
            fi
            ;;
        list)
            list_projects "$CONFIG_FILE"
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main
main "$@"
