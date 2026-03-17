#!/usr/bin/env bash
# =============================================================================
# Directory SaaS Task Runner — Orchestrates Claude Code sessions per task
#
# Usage:
#   ./scripts/task-runner.sh                  # Resume from where we left off
#   ./scripts/task-runner.sh --task 03        # Start/resume specific task
#   ./scripts/task-runner.sh --all            # Run ALL pending tasks
#   ./scripts/task-runner.sh --status         # Show progress summary
#   ./scripts/task-runner.sh --reset 05       # Reset a task to pending
#   ./scripts/task-runner.sh --skip 02        # Skip a task
# =============================================================================

set -euo pipefail

# Allow launching Claude from within a Claude session
unset CLAUDECODE 2>/dev/null || true

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASKS_DIR="$PROJECT_ROOT/docs/tasks"
PROGRESS_FILE="$TASKS_DIR/progress.json"
LOG_DIR="$PROJECT_ROOT/logs/tasks"
PROMPT_DIR="$PROJECT_ROOT/scripts/prompts"

# Ensure directories exist
mkdir -p "$LOG_DIR" "$PROMPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── Helpers ─────────────────────────────────────────────────────────────────

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_task()  { echo -e "${CYAN}[TASK]${NC}  $*"; }

# Read a field from progress.json using python
progress_get() {
    python3 -c "
import json, sys
with open('$PROGRESS_FILE') as f:
    data = json.load(f)
keys = '$1'.split('.')
obj = data
for k in keys:
    obj = obj[k]
print(obj if obj is not None else '')
" 2>/dev/null || echo ""
}

# Update progress.json using python
progress_set() {
    local key_path="$1"
    local value="$2"
    python3 -c "
import json, datetime
with open('$PROGRESS_FILE') as f:
    data = json.load(f)

keys = '$key_path'.split('.')
obj = data
for k in keys[:-1]:
    obj = obj[k]

val = '$value'
if val in ('null', 'None', ''):
    obj[keys[-1]] = None
elif val in ('true', 'false'):
    obj[keys[-1]] = val == 'true'
else:
    try:
        obj[keys[-1]] = json.loads(val)
    except:
        obj[keys[-1]] = val

data['last_updated'] = datetime.datetime.now(datetime.timezone.utc).isoformat()

with open('$PROGRESS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
"
}

# Get ordered list of task IDs
get_task_ids() {
    python3 -c "
import json
with open('$PROGRESS_FILE') as f:
    data = json.load(f)
for tid in sorted(data['tasks'].keys()):
    print(tid)
"
}

# Get task status
get_task_status() {
    progress_get "tasks.$1.status"
}

# Show progress summary
show_status() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Habesha Hub — Task Progress"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    local total=0 pending=0 running=0 done=0 skipped=0 failed=0

    for tid in $(get_task_ids); do
        local status
        status=$(get_task_status "$tid")
        local title
        title=$(progress_get "tasks.$tid.title")

        total=$((total + 1))

        case "$status" in
            pending)
                echo -e "  ${YELLOW}○${NC}  $tid — $title"
                pending=$((pending + 1))
                ;;
            in_progress)
                echo -e "  ${BLUE}◉${NC}  $tid — $title ${BLUE}(in progress)${NC}"
                running=$((running + 1))
                ;;
            completed)
                echo -e "  ${GREEN}●${NC}  $tid — $title"
                done=$((done + 1))
                ;;
            skipped)
                echo -e "  ${YELLOW}⊘${NC}  $tid — $title ${YELLOW}(skipped)${NC}"
                skipped=$((skipped + 1))
                ;;
            failed)
                echo -e "  ${RED}✗${NC}  $tid — $title ${RED}(failed)${NC}"
                failed=$((failed + 1))
                ;;
        esac
    done

    echo ""
    echo "───────────────────────────────────────────────────────────────"
    echo -e "  Total: $total  ${GREEN}Done: $done${NC}  ${BLUE}Running: $running${NC}  ${YELLOW}Pending: $pending${NC}  ${RED}Failed: $failed${NC}  Skipped: $skipped"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# Find next pending task
find_next_task() {
    # First check if there's an in_progress task (resume it)
    for tid in $(get_task_ids); do
        if [ "$(get_task_status "$tid")" = "in_progress" ]; then
            echo "$tid"
            return
        fi
    done

    # Otherwise find first pending
    for tid in $(get_task_ids); do
        if [ "$(get_task_status "$tid")" = "pending" ]; then
            echo "$tid"
            return
        fi
    done
}

# Build the prompt for a given task
build_prompt() {
    local task_id="$1"
    local task_file="$TASKS_DIR/${task_id}.md"
    local task_content
    task_content=$(cat "$task_file")

    local task_title
    task_title=$(progress_get "tasks.$task_id.title")

    local task_notes
    task_notes=$(progress_get "tasks.$task_id.notes")

    # Check which subtasks are already done
    local subtask_status
    subtask_status=$(python3 -c "
import json
with open('$PROGRESS_FILE') as f:
    data = json.load(f)
subs = data['tasks']['$task_id'].get('subtasks', {})
for k, v in subs.items():
    print(f'  - {k}: {v}')
")

    # Load coding standards
    local standards_file="$PROJECT_ROOT/scripts/coding-standards.md"
    local coding_standards=""
    if [ -f "$standards_file" ]; then
        coding_standards=$(cat "$standards_file")
    fi

    # Load known issues
    local known_issues_file="$PROJECT_ROOT/scripts/known-issues.md"
    local known_issues=""
    if [ -f "$known_issues_file" ]; then
        known_issues=$(cat "$known_issues_file")
    fi

    # Build the full prompt
    cat <<PROMPT_EOF
You are implementing task "$task_title" for the Habesha Hub project (Ethiopian Business Directory for the Middle East).

## PROJECT CONTEXT

This is a TypeScript full-stack SaaS boilerplate with:
- Backend: NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis 7
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Three frontend apps: apps/web (end clients), apps/provider-portal (providers), apps/admin (platform admin)
- Mobile: Expo (placeholder, future phase)
- Auth: JWT + refresh tokens, 3 user types (AdminUser, TenantUser, ClientUser)
- Multi-tenancy: Subdomain + header resolution, PostgreSQL RLS
- Validation: Zod end-to-end (NO class-validator)
- State: TanStack Query (server) + Zustand (client)

Project root: $PROJECT_ROOT

Key directories:
- backend/src/common/     — Shared infrastructure (guards, interceptors, middleware, pipes, decorators)
- backend/src/modules/    — Domain modules (auth, tenants, users, roles, subscriptions, etc.)
- backend/src/prisma/     — Prisma module + service
- backend/src/config/     — Configuration schemas + loader
- backend/prisma/         — Schema + migrations + seed
- apps/web/               — End client SPA
- apps/provider-portal/   — Provider dashboard SPA
- apps/admin/             — Platform admin SPA
- docker/                 — Docker Compose + Dockerfiles
- scripts/                — Task runner, coding standards, validators

## CODING STANDARDS (MANDATORY — follow these exactly)

$coding_standards

## SUBTASK PROGRESS

These subtasks have already been tracked:
$subtask_status

${task_notes:+Previous notes: $task_notes}

## TASK SPECIFICATION

$task_content

## KNOWN ISSUES & SOLUTIONS (check FIRST before debugging)

$known_issues

## ERROR HANDLING POLICY (CRITICAL — NO WORKAROUNDS)

- NEVER use workarounds, hacks, or shortcuts to bypass errors
- NEVER use \`// @ts-ignore\`, \`any\` type, \`--no-verify\`, or \`--force\` to make things pass
- NEVER skip a failing step — fix the root cause
- If a build fails, read the FULL error, understand WHY, and fix the source
- If a test fails, fix the code or the test — never delete or skip tests
- If a migration fails, understand the schema mismatch and resolve it
- Take your time. Research the issue. Read relevant source files. Fix it properly.
- After resolving any non-trivial issue, document it in scripts/known-issues.md

## INSTRUCTIONS

1. Read the task specification carefully. Implement ALL items.
2. Follow the coding standards exactly — especially naming, file structure, and patterns.
3. Write tests as specified in the task (unit + e2e where applicable).
4. After completing the implementation, verify by:
   - Running: cd backend && npm run build (must succeed with 0 errors)
   - Running: cd backend && npm test (tests must pass)
   - If either fails, FIX the errors — do not proceed with a broken build
5. After ALL work is done, update the progress file at docs/tasks/progress.json:
   - Set tasks.${task_id}.status to "completed"
   - Set each subtask to "completed" as you finish them
   - Set tasks.${task_id}.completed_at to current ISO timestamp
   - Add any important notes to tasks.${task_id}.notes
6. Finally, create a git commit with message: "feat: implement ${task_id} — ${task_title}"

DO NOT skip any part of the task. Implement everything listed in the spec.
If you encounter a blocker, update progress.json notes field with the issue and set status to "failed".
PROMPT_EOF
}

# Run a single task via claude
run_task() {
    local task_id="$1"
    local task_file="$TASKS_DIR/${task_id}.md"
    local log_file="$LOG_DIR/${task_id}-$(date +%Y%m%d-%H%M%S).log"
    local prompt_file="$PROMPT_DIR/${task_id}.md"

    if [ ! -f "$task_file" ]; then
        log_error "Task file not found: $task_file"
        return 1
    fi

    local task_title
    task_title=$(progress_get "tasks.$task_id.title")

    log_task "════════════════════════════════════════════════════════════"
    log_task "Starting: $task_id — $task_title"
    log_task "════════════════════════════════════════════════════════════"

    # Update progress
    progress_set "tasks.$task_id.status" "in_progress"
    progress_set "tasks.$task_id.started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    progress_set "current_task" "$task_id"

    # Build and save prompt
    build_prompt "$task_id" > "$prompt_file"
    log_info "Prompt saved to: $prompt_file"
    log_info "Log file: $log_file"

    # Run claude with the prompt
    log_info "Launching Claude Code session..."
    echo ""

    local exit_code=0
    cat "$prompt_file" | claude -p \
        --dangerously-skip-permissions \
        --verbose \
        2>&1 | tee "$log_file" || exit_code=$?

    echo ""

    if [ $exit_code -ne 0 ]; then
        log_error "Claude session exited with code $exit_code"
        if grep -q "context window" "$log_file" 2>/dev/null || grep -q "too long" "$log_file" 2>/dev/null; then
            log_warn "Possible context window exhaustion. Task will resume on next run."
            progress_set "tasks.$task_id.notes" "Context window exhausted — needs continuation"
        else
            progress_set "tasks.$task_id.status" "failed"
            progress_set "tasks.$task_id.notes" "Exited with code $exit_code — check log: $log_file"
        fi
        return 1
    fi

    # Check if claude marked it as completed
    local final_status
    final_status=$(get_task_status "$task_id")

    if [ "$final_status" = "completed" ]; then
        log_ok "Task $task_id completed successfully!"

        # Run coding standards validation if available
        if [ -x "$PROJECT_ROOT/scripts/validate-standards.sh" ]; then
            log_info "Running coding standards validation..."
            if "$PROJECT_ROOT/scripts/validate-standards.sh" 2>&1 | tee -a "$log_file"; then
                log_ok "Coding standards validation passed"
            else
                log_warn "Coding standards validation found issues (see above)"
                local current_notes
                current_notes=$(progress_get "tasks.$task_id.notes")
                progress_set "tasks.$task_id.notes" "${current_notes} | Standards validation warnings"
            fi
        fi
    elif [ "$final_status" = "failed" ]; then
        log_error "Task $task_id was marked as failed. Check notes."
        return 1
    else
        log_warn "Task $task_id session ended but status is: $final_status"
        log_warn "Claude may not have finished. Will resume on next run."
    fi

    progress_set "current_task" "null"
    return 0
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
    cd "$PROJECT_ROOT"

    # Parse arguments
    case "${1:-}" in
        --status|-s)
            show_status
            exit 0
            ;;
        --task|-t)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 --task <task-number>"
                exit 1
            fi
            local target_id=""
            for tid in $(get_task_ids); do
                if [[ "$tid" == "${2}"* ]] || [[ "$tid" == *"-${2}-"* ]] || [[ "$tid" == "${2}" ]]; then
                    target_id="$tid"
                    break
                fi
            done
            if [ -z "$target_id" ]; then
                local padded
                padded=$(printf "%02d" "$2")
                for tid in $(get_task_ids); do
                    if [[ "$tid" == "${padded}-"* ]]; then
                        target_id="$tid"
                        break
                    fi
                done
            fi
            if [ -z "$target_id" ]; then
                log_error "Task not found: $2"
                exit 1
            fi
            run_task "$target_id"
            exit $?
            ;;
        --reset|-r)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 --reset <task-number>"
                exit 1
            fi
            local padded
            padded=$(printf "%02d" "$2")
            for tid in $(get_task_ids); do
                if [[ "$tid" == "${padded}-"* ]]; then
                    progress_set "tasks.$tid.status" "pending"
                    progress_set "tasks.$tid.started_at" "null"
                    progress_set "tasks.$tid.completed_at" "null"
                    progress_set "tasks.$tid.notes" ""
                    log_ok "Reset task: $tid"
                    exit 0
                fi
            done
            log_error "Task not found: $2"
            exit 1
            ;;
        --skip)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 --skip <task-number>"
                exit 1
            fi
            local padded
            padded=$(printf "%02d" "$2")
            for tid in $(get_task_ids); do
                if [[ "$tid" == "${padded}-"* ]]; then
                    progress_set "tasks.$tid.status" "skipped"
                    log_ok "Skipped task: $tid"
                    exit 0
                fi
            done
            log_error "Task not found: $2"
            exit 1
            ;;
        --all|-a)
            log_info "Running ALL pending tasks sequentially..."
            show_status

            while true; do
                local next
                next=$(find_next_task)
                if [ -z "$next" ]; then
                    log_ok "All tasks complete!"
                    break
                fi

                if ! run_task "$next"; then
                    log_error "Task $next failed. Stopping."
                    log_warn "Fix the issue and re-run, or use --skip to skip it."
                    show_status
                    exit 1
                fi

                log_info "Pausing 5s before next task..."
                sleep 5
            done

            show_status
            exit 0
            ;;
        --help|-h)
            echo ""
            echo "Directory SaaS Task Runner"
            echo ""
            echo "Usage:"
            echo "  $0                    Resume from next pending/in-progress task"
            echo "  $0 --all              Run ALL pending tasks sequentially"
            echo "  $0 --task <N>         Run specific task (e.g., --task 03)"
            echo "  $0 --status           Show progress summary"
            echo "  $0 --reset <N>        Reset a task to pending"
            echo "  $0 --skip <N>         Skip a task"
            echo "  $0 --help             Show this help"
            echo ""
            exit 0
            ;;
        "")
            local next
            next=$(find_next_task)
            if [ -z "$next" ]; then
                log_ok "All tasks are complete!"
                show_status
                exit 0
            fi

            show_status
            log_info "Next task: $next"
            echo ""
            read -p "Start task $next? [Y/n] " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                log_info "Aborted."
                exit 0
            fi

            run_task "$next"
            ;;
        *)
            log_error "Unknown option: $1. Use --help for usage."
            exit 1
            ;;
    esac
}

main "$@"
