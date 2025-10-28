#!/bin/bash
# Service management for MCP service manager
# This module is sourced by the main script - do not run directly

LAUNCHD_DIR="${HOME}/Library/LaunchAgents"
LAUNCHCTL_TIMEOUT=10

# Ensure LaunchAgents directory exists
ensure_launchd_dir() {
    print_debug "Ensuring LaunchAgents directory exists: $LAUNCHD_DIR"
    mkdir -p "$LAUNCHD_DIR"
}

# Install a project
install_project() {
    local config_file="$1"
    local template_file="$2"
    local project_name="$3"

    print_info "Installing $project_name..."
    print_debug "Config: $config_file"
    print_debug "Template: $template_file"

    local project=$(get_project "$config_file" "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local plist_file="${LAUNCHD_DIR}/${label}.plist"
    local project_path=$(expand_path "$(echo "$project" | jq -r '.projectPath')")

    print_debug "Label: $label"
    print_debug "Plist file: $plist_file"
    print_debug "Project path: $project_path"

    # Check if Next.js is built
    print_debug "Checking if Next.js is built..."
    if [ ! -d "${project_path}/.next" ]; then
        print_warning "Next.js not built. Building now..."
        print_debug "Running: cd \"$project_path\" && npm run build"
        (cd "$project_path" && npm run build) || {
            print_error "Build failed"
            return 1
        }
        print_debug "Build completed successfully"
    else
        print_debug "Next.js already built"
    fi

    # Generate and write plist
    print_debug "Generating plist..."
    generate_plist "$config_file" "$template_file" "$project_name" > "$plist_file" || {
        print_error "Failed to generate plist"
        return 1
    }
    print_debug "Plist written to: $plist_file"

    # Load the service
    print_debug "Loading service with launchctl..."

    # Unload first if already loaded
    print_debug "Attempting to unload any existing service..."
    launchctl bootout "gui/$(id -u)/${label}" 2>/dev/null || true

    # Load the new service
    print_command "launchctl load \"$plist_file\""
    if ! run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl load \"$plist_file\" 2>&1"; then
        print_warning "launchctl load timed out or failed (this may be OK)"
    fi

    # Enable the service
    print_command "launchctl enable \"gui/$(id -u)/${label}\""
    if ! run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl enable \"gui/$(id -u)/${label}\" 2>&1"; then
        print_warning "launchctl enable timed out or failed"
    fi

    # Kickstart the service
    print_command "launchctl kickstart -k \"gui/$(id -u)/${label}\""
    if ! run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl kickstart -k \"gui/$(id -u)/${label}\" 2>&1"; then
        print_warning "launchctl kickstart timed out or failed"
    fi

    print_success "$project_name installed and started"
    print_info "Plist: $plist_file"
    print_info "Logs: $(expand_path "$(read_projects "$config_file" | jq -r '.global.logDirectory')")/${project_name}/"
}

# Uninstall a project
uninstall_project() {
    local config_file="$1"
    local project_name="$2"

    print_info "Uninstalling $project_name..."

    local project=$(get_project "$config_file" "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')
    local plist_file="${LAUNCHD_DIR}/${label}.plist"

    print_debug "Label: $label"
    print_debug "Plist file: $plist_file"

    # Stop and unload the service
    print_debug "Stopping and unloading service..."

    print_command "launchctl bootout \"gui/$(id -u)/${label}\""
    run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl bootout \"gui/$(id -u)/${label}\" 2>&1" || true

    print_command "launchctl disable \"gui/$(id -u)/${label}\""
    run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl disable \"gui/$(id -u)/${label}\" 2>&1" || true

    # Remove plist file
    if [ -f "$plist_file" ]; then
        print_debug "Removing plist file: $plist_file"
        rm "$plist_file"
        print_success "Removed $plist_file"
    else
        print_debug "Plist file not found (already removed?)"
    fi

    print_success "$project_name uninstalled"
}

# Start a project
start_project() {
    local config_file="$1"
    local project_name="$2"

    print_info "Starting $project_name..."

    local project=$(get_project "$config_file" "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')

    print_debug "Label: $label"
    print_command "launchctl kickstart -k \"gui/$(id -u)/${label}\""

    if run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl kickstart -k \"gui/$(id -u)/${label}\" 2>&1"; then
        print_success "$project_name started"
    else
        print_error "$project_name failed to start (check logs)"
        return 1
    fi
}

# Stop a project
stop_project() {
    local config_file="$1"
    local project_name="$2"

    print_info "Stopping $project_name..."

    local project=$(get_project "$config_file" "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    local label=$(echo "$project" | jq -r '.label')

    print_debug "Label: $label"
    print_command "launchctl kill SIGTERM \"gui/$(id -u)/${label}\""

    if run_with_timeout "${LAUNCHCTL_TIMEOUT}s" "launchctl kill SIGTERM \"gui/$(id -u)/${label}\" 2>&1" || true; then
        print_success "$project_name stopped"
    else
        print_warning "$project_name may not have stopped cleanly"
    fi
}

# Restart a project
restart_project() {
    local config_file="$1"
    local project_name="$2"

    print_info "Restarting $project_name..."

    stop_project "$config_file" "$project_name"
    sleep 1
    start_project "$config_file" "$project_name"
}

# Show status of a project
status_project() {
    local config_file="$1"
    local project_name="$2"

    local project=$(get_project "$config_file" "$project_name")

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
    print_debug "Checking service status..."
    print_command "launchctl list | grep \"$label\""

    local status=$(launchctl list 2>/dev/null | grep "$label" || true)
    if [ -n "$status" ]; then
        print_success "Service is loaded"
        echo "$status"
    else
        print_warning "Service is not loaded"
    fi
}

# Show status of all projects
status_all() {
    local config_file="$1"

    echo ""
    echo "=== MCP Services Status ==="
    echo ""

    local projects=$(get_all_projects "$config_file")

    for project in $projects; do
        local project_data=$(get_project "$config_file" "$project")
        local label=$(echo "$project_data" | jq -r '.label')
        local enabled=$(echo "$project_data" | jq -r '.enabled')

        printf "%-20s" "$project"

        if [ "$enabled" = "true" ]; then
            local status=$(launchctl list 2>/dev/null | grep "$label" || true)
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
    local config_file="$1"
    local project_name="$2"
    local follow="${3:-false}"

    local log_dir=$(expand_path "$(read_projects "$config_file" | jq -r '.global.logDirectory')")
    local project_log_dir="${log_dir}/${project_name}"

    print_debug "Log directory: $project_log_dir"

    if [ ! -d "$project_log_dir" ]; then
        print_error "Log directory not found: $project_log_dir"
        return 1
    fi

    print_info "Logs for $project_name:"
    print_info "Location: $project_log_dir"
    echo ""

    if [ "$follow" = "true" ]; then
        print_debug "Following logs..."
        tail -f "${project_log_dir}/stdout.log" "${project_log_dir}/stderr.log"
    else
        print_debug "Showing last 50 lines..."
        echo "=== STDOUT ==="
        tail -n 50 "${project_log_dir}/stdout.log" 2>/dev/null || echo "No stdout logs"
        echo ""
        echo "=== STDERR ==="
        tail -n 50 "${project_log_dir}/stderr.log" 2>/dev/null || echo "No stderr logs"
    fi
}

# List all projects
list_projects() {
    local config_file="$1"

    echo ""
    echo "=== Configured Projects ==="
    echo ""
    read_projects "$config_file" | jq -r '.projects[] | "\(.name) - \(.description // "No description") [\(if .enabled then "enabled" else "disabled" end)]"'
    echo ""
}

# Install all enabled projects
install_all() {
    local config_file="$1"
    local template_file="$2"

    local projects=$(get_enabled_projects "$config_file")

    print_info "Installing all enabled projects..."

    for project in $projects; do
        install_project "$config_file" "$template_file" "$project" || {
            print_error "Failed to install $project"
        }
    done
}

# Uninstall all projects
uninstall_all() {
    local config_file="$1"

    local projects=$(get_all_projects "$config_file")

    print_info "Uninstalling all projects..."

    for project in $projects; do
        uninstall_project "$config_file" "$project" || {
            print_warning "Failed to uninstall $project (may not be installed)"
        }
    done
}
