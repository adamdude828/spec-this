You are executing an epic from the Spec-This MCP server.

## Instructions

1. **Fetch the Epic**: Use the MCP tools to read the specified epic and all its stories and tasks
2. **Create Todo List**: Use TodoWrite to create a comprehensive todo list from all tasks in the epic
3. **Execute Tasks Sequentially**: Work through each task in order:
   - Mark task as `in_progress` before starting
   - Complete the work described in the task
   - Mark task as `completed` when finished
   - Update task's `actualHours` if significantly different from estimate
4. **Update Story Status**: As you complete tasks, update story status appropriately:
   - `in_progress` when first task starts
   - `review` or `completed` when all tasks done
5. **Update Epic Status**: Update epic status as work progresses:
   - `active` when you begin work
   - `completed` when all stories/tasks are done

## Guidelines

- Work on ONE task at a time (only one task should be `in_progress`)
- Follow the `orderIndex` to maintain proper sequence
- If you encounter blockers, mark task as `blocked`, then stop and alert user.
- Test your work after completing related tasks. Only if you have access to tools to facilitate testing.
- Keep the user informed of progress but stay concise
- If a task is too large to complete in one step, break it down into smaller tasks

## Task Execution Pattern

For each task:
1. Read task description and acceptance criteria
2. Mark task `in_progress` using upsert_task
3. Write the code/make the changes
4. Test if applicable
5. Mark task `completed` with actualHours
6. Move to next task

## Communication

- Announce when starting a new story
- Briefly confirm task completion
- Highlight any issues or deviations from the plan
- Show final summary when epic is complete
