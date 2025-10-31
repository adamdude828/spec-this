#!/bin/bash
# Configuration management for MCP service manager
# This module is sourced by the main script - do not run directly

# Check if config file exists
check_config() {
    local config_file="$1"

    print_debug "Checking config file: $config_file"

    if [ ! -f "$config_file" ]; then
        print_error "Configuration file not found: $config_file"
        print_info "Copy projects.json.example to projects.json and configure your projects"
        exit 1
    fi

    print_debug "Config file exists"

    # Validate JSON syntax
    if ! jq empty "$config_file" 2>/dev/null; then
        print_error "Invalid JSON in configuration file: $config_file"
        exit 1
    fi

    print_debug "Config file is valid JSON"
}

# Read projects from config
read_projects() {
    local config_file="$1"
    check_config "$config_file"
    cat "$config_file"
}

# Get project by name
get_project() {
    local config_file="$1"
    local project_name="$2"

    print_debug "Looking for project: $project_name"

    local project=$(read_projects "$config_file" | jq -r ".projects[] | select(.name == \"$project_name\")")

    if [ -z "$project" ]; then
        print_debug "Project not found: $project_name"
    else
        print_debug "Found project: $project_name"
    fi

    echo "$project"
}

# Get all enabled projects
get_enabled_projects() {
    local config_file="$1"

    print_debug "Getting enabled projects"

    read_projects "$config_file" | jq -r '.projects[] | select(.enabled == true) | .name'
}

# Get all project names
get_all_projects() {
    local config_file="$1"

    print_debug "Getting all projects"

    read_projects "$config_file" | jq -r '.projects[].name'
}

# Validate project configuration
validate_project() {
    local project="$1"
    local project_name="$2"

    print_debug "Validating project configuration for: $project_name"

    # Check required fields
    local label=$(echo "$project" | jq -r '.label // empty')
    local project_path=$(echo "$project" | jq -r '.projectPath // empty')

    if [ -z "$label" ]; then
        print_error "Project $project_name is missing 'label' field"
        return 1
    fi

    if [ -z "$project_path" ]; then
        print_error "Project $project_name is missing 'projectPath' field"
        return 1
    fi

    local expanded_path=$(expand_path "$project_path")
    if [ ! -d "$expanded_path" ]; then
        print_error "Project path does not exist: $expanded_path"
        return 1
    fi

    print_debug "Project configuration is valid"
    return 0
}
