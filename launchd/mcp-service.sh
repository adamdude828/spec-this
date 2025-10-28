#!/bin/bash

# MCP Service Manager for macOS
# Manages multiple MCP server projects as launchd services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="${SCRIPT_DIR}/projects.json"
TEMPLATE_FILE="${SCRIPT_DIR}/com.specthis.mcp.plist.template"
LAUNCHD_DIR="${HOME}/Library/LaunchAgents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if config file exists
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Configuration file not found: $CONFIG_FILE"
        print_info "Copy projects.json.example to projects.json and configure your projects"
        exit 1
    fi
}

# Get node path
get_node_path() {
    local node_path=$(which node)
    if [ -z "$node_path" ]; then
        print_error "Node.js not found in PATH"
        exit 1
    fi
    echo "$node_path"
}

# Expand tilde in paths
expand_path() {
    local path="$1"
    echo "${path/#\~/$HOME}"
}

# Read projects from config
read_projects() {
    check_config
    cat "$CONFIG_FILE"
}

# Get project by name
get_project() {
    local project_name="$1"
    read_projects | jq -r ".projects[] | select(.name == \"$project_name\")"
}

# Get all enabled projects
get_enabled_projects() {
    read_projects | jq -r '.projects[] | select(.enabled == true) | .name'
}

# Generate plist file for a project
generate_plist() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local project_path=$(expand_path "$(echo "$project" | jq -r '.projectPath')")
    local log_dir=$(expand_path "$(read_projects | jq -r '.global.logDirectory')")
    local node_path=$(read_projects | jq -r '.global.nodePath // empty')

    if [ -z "$node_path" ]; then
        node_path=$(get_node_path)
    else
        node_path=$(expand_path "$node_path")
    fi

    # Create log directory
    local project_log_dir="${log_dir}/${project_name}"
    mkdir -p "$project_log_dir"

    # Generate plist from template
    local plist_content=$(cat "$TEMPLATE_FILE")
    plist_content="${plist_content//\{\{LABEL\}\}/$label}"
    plist_content="${plist_content//\{\{NODE_PATH\}\}/$node_path}"
    plist_content="${plist_content//\{\{PROJECT_PATH\}\}/$project_path}"
    plist_content="${plist_content//\{\{LOG_PATH\}\}/$project_log_dir}"

    echo "$plist_content"
}

# Install a project
install_project() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local plist_file="${LAUNCHD_DIR}/${label}.plist"

    print_info "Installing $project_name..."

    # Check if MCP server is built
    local project_path=$(expand_path "$(echo "$project" | jq -r '.projectPath')")
    if [ ! -f "${project_path}/dist/mcp-server.js" ]; then
        print_warning "MCP server not built. Building now..."
        (cd "$project_path" && npm run build:mcp)
    fi

    # Generate and write plist
    generate_plist "$project_name" > "$plist_file"

    # Load the service
    launchctl load "$plist_file" 2>/dev/null || true
    launchctl enable "gui/$(id -u)/${label}"
    launchctl kickstart -k "gui/$(id -u)/${label}" 2>/dev/null || true

    print_success "$project_name installed and started"
    print_info "Plist: $plist_file"
}

# Uninstall a project
uninstall_project() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local plist_file="${LAUNCHD_DIR}/${label}.plist"

    print_info "Uninstalling $project_name..."

    # Stop and unload the service
    launchctl bootout "gui/$(id -u)/${label}" 2>/dev/null || true
    launchctl disable "gui/$(id -u)/${label}" 2>/dev/null || true

    # Remove plist file
    if [ -f "$plist_file" ]; then
        rm "$plist_file"
        print_success "Removed $plist_file"
    fi

    print_success "$project_name uninstalled"
}

# Start a project
start_project() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')

    print_info "Starting $project_name..."
    launchctl kickstart -k "gui/$(id -u)/${label}"
    print_success "$project_name started"
}

# Stop a project
stop_project() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')

    print_info "Stopping $project_name..."
    launchctl kill SIGTERM "gui/$(id -u)/${label}" 2>/dev/null || true
    print_success "$project_name stopped"
}

# Restart a project
restart_project() {
    local project_name="$1"
    stop_project "$project_name"
    sleep 1
    start_project "$project_name"
}

# Show status of a project
status_project() {
    local project_name="$1"
    local project=$(get_project "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local description=$(echo "$project" | jq -r '.description // ""')

    echo ""
    echo "Project: $project_name"
    if [ -n "$description" ]; then
        echo "Description: $description"
    fi
    echo "Label: $label"
    echo ""

    # Check if service is loaded
    local status=$(launchctl list | grep "$label" || true)
    if [ -n "$status" ]; then
        print_success "Service is loaded"
        echo "$status"
    else
        print_warning "Service is not loaded"
    fi
}

# Show status of all projects
status_all() {
    check_config
    local projects=$(read_projects | jq -r '.projects[].name')

    echo ""
    echo "=== MCP Services Status ==="
    echo ""

    for project in $projects; do
        local project_data=$(get_project "$project")
        local label=$(echo "$project_data" | jq -r '.label')
        local enabled=$(echo "$project_data" | jq -r '.enabled')

        printf "%-20s" "$project"

        if [ "$enabled" = "true" ]; then
            local status=$(launchctl list | grep "$label" || true)
            if [ -n "$status" ]; then
                print_success "Running"
            else
                print_warning "Not running"
            fi
        else
            echo -e "${YELLOW}Disabled${NC}"
        fi
    done
    echo ""
}

# Show logs for a project
logs_project() {
    local project_name="$1"
    local follow="${2:-false}"

    local log_dir=$(expand_path "$(read_projects | jq -r '.global.logDirectory')")
    local project_log_dir="${log_dir}/${project_name}"

    if [ ! -d "$project_log_dir" ]; then
        print_error "Log directory not found: $project_log_dir"
        return 1
    fi

    print_info "Logs for $project_name:"
    print_info "Location: $project_log_dir"
    echo ""

    if [ "$follow" = "true" ]; then
        tail -f "${project_log_dir}/stdout.log" "${project_log_dir}/stderr.log"
    else
        echo "=== STDOUT ==="
        tail -n 50 "${project_log_dir}/stdout.log" 2>/dev/null || echo "No stdout logs"
        echo ""
        echo "=== STDERR ==="
        tail -n 50 "${project_log_dir}/stderr.log" 2>/dev/null || echo "No stderr logs"
    fi
}

# List all projects
list_projects() {
    check_config
    echo ""
    echo "=== Configured Projects ==="
    echo ""
    read_projects | jq -r '.projects[] | "\(.name) - \(.description // "No description") [\(if .enabled then "enabled" else "disabled" end)]"'
    echo ""
}

# Install all enabled projects
install_all() {
    local projects=$(get_enabled_projects)
    for project in $projects; do
        install_project "$project"
    done
}

# Uninstall all projects
uninstall_all() {
    check_config
    local projects=$(read_projects | jq -r '.projects[].name')
    for project in $projects; do
        uninstall_project "$project"
    done
}

# Show usage
usage() {
    cat << EOF
MCP Service Manager for macOS

Usage: $0 <command> [project-name] [options]

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
    $0 install spec-this       # Install spec-this project
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

    # Ensure LaunchAgents directory exists
    mkdir -p "$LAUNCHD_DIR"

    case "$command" in
        install)
            if [ -n "$project" ]; then
                install_project "$project"
            else
                install_all
            fi
            ;;
        uninstall)
            if [ -n "$project" ]; then
                uninstall_project "$project"
            else
                uninstall_all
            fi
            ;;
        start)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            start_project "$project"
            ;;
        stop)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            stop_project "$project"
            ;;
        restart)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            restart_project "$project"
            ;;
        status)
            if [ -n "$project" ]; then
                status_project "$project"
            else
                status_all
            fi
            ;;
        logs)
            if [ -z "$project" ]; then
                print_error "Project name required"
                usage
                exit 1
            fi
            if [ "$option" = "-f" ]; then
                logs_project "$project" true
            else
                logs_project "$project" false
            fi
            ;;
        list)
            list_projects
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

# Check dependencies
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed"
    print_info "Install with: brew install jq"
    exit 1
fi

# Run main
main "$@"
