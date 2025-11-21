#!/bin/bash
# Plist generation for MCP service manager
# This module is sourced by the main script - do not run directly

# Generate plist file for a project
generate_plist() {
    local config_file="$1"
    local template_file="$2"
    local project_name="$3"

    print_debug "Generating plist for project: $project_name"

    local project=$(get_project "$config_file" "$project_name")

    if [ -z "$project" ]; then
        print_error "Project not found: $project_name"
        return 1
    fi

    # Validate project
    if ! validate_project "$project" "$project_name"; then
        return 1
    fi

    # Extract project details
    local label=$(echo "$project" | jq -r '.label')
    local project_path=$(expand_path "$(echo "$project" | jq -r '.projectPath')")
    local port=$(echo "$project" | jq -r '.port // "3080"')
    local log_dir=$(expand_path "$(read_projects "$config_file" | jq -r '.global.logDirectory')")
    local node_path=$(read_projects "$config_file" | jq -r '.global.nodePath // empty')

    print_debug "Project details:"
    print_debug "  Label: $label"
    print_debug "  Path: $project_path"
    print_debug "  Port: $port"
    print_debug "  Log dir: $log_dir"

    if [ -z "$node_path" ]; then
        node_path=$(get_node_path)
    else
        node_path=$(expand_path "$node_path")
    fi

    print_debug "  Node path: $node_path"

    # Create log directory
    local project_log_dir="${log_dir}/${project_name}"
    print_debug "Creating log directory: $project_log_dir"
    mkdir -p "$project_log_dir"

    # Check if template exists
    if [ ! -f "$template_file" ]; then
        print_error "Template file not found: $template_file"
        return 1
    fi

    print_debug "Reading template from: $template_file"

    # Generate plist from template
    local plist_content=$(cat "$template_file")
    plist_content="${plist_content//\{\{LABEL\}\}/$label}"
    plist_content="${plist_content//\{\{NODE_PATH\}\}/$node_path}"
    plist_content="${plist_content//\{\{PROJECT_PATH\}\}/$project_path}"
    plist_content="${plist_content//\{\{PORT\}\}/$port}"
    plist_content="${plist_content//\{\{LOG_PATH\}\}/$project_log_dir}"

    print_debug "Plist generated successfully"

    echo "$plist_content"
}
