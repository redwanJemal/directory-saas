#!/usr/bin/env bash
# Coding Standards Validator Script
# Validates code against the project's coding standards.
# Exit 0 if all pass (warnings OK), exit 1 if any failures.

set -uo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Counters ──────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_SRC="$PROJECT_ROOT/backend/src"
MODULES_DIR="$BACKEND_SRC/modules"
PRISMA_SCHEMA="$PROJECT_ROOT/backend/prisma/schema.prisma"
APPS_DIR="$PROJECT_ROOT/apps"

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() {
  echo -e "  ${GREEN}[PASS]${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "  ${RED}[FAIL]${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
  echo -e "  ${YELLOW}[WARN]${NC} $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

section() {
  echo ""
  echo -e "${CYAN}${BOLD}── $1 ──${NC}"
}

# ══════════════════════════════════════════════════════════════════════════════
# 1. File Naming: kebab-case for all source files
# ══════════════════════════════════════════════════════════════════════════════
check_file_naming() {
  section "1. File Naming (kebab-case)"

  local violations=()

  # Check backend source files (excluding node_modules, dist, .prisma)
  while IFS= read -r file; do
    local basename
    basename="$(basename "$file")"
    # Skip index.ts, app.module.ts, main.ts, and hidden files
    [[ "$basename" == "index.ts" ]] && continue
    # Check: filename should be lowercase kebab-case with dots for type suffix
    # Valid: foo-bar.service.ts, create-tenant.dto.ts, app.module.ts
    # Invalid: fooBar.service.ts, FooBar.ts, foo_bar.ts
    if [[ "$basename" =~ [A-Z] ]] || [[ "$basename" =~ _ && ! "$basename" =~ \.d\.ts$ ]]; then
      violations+=("$file")
    fi
  done < <(find "$BACKEND_SRC" -type f -name "*.ts" ! -path "*/node_modules/*" ! -path "*/dist/*" 2>/dev/null)

  # Check frontend app source files
  for app_dir in "$APPS_DIR"/*/; do
    [ -d "${app_dir}src" ] || continue
    while IFS= read -r file; do
      local basename
      basename="$(basename "$file")"
      [[ "$basename" == "index.ts" || "$basename" == "index.tsx" ]] && continue
      # Allow PascalCase for React components (.tsx) — that's standard React convention
      [[ "$basename" =~ \.tsx$ ]] && continue
      if [[ "$basename" =~ [A-Z] ]] || [[ "$basename" =~ _ && ! "$basename" =~ \.d\.ts$ ]]; then
        violations+=("$file")
      fi
    done < <(find "${app_dir}src" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/dist/*" 2>/dev/null)
  done

  if [ ${#violations[@]} -eq 0 ]; then
    pass "File naming: all source files are kebab-case"
  else
    fail "File naming: ${#violations[@]} file(s) violate kebab-case naming"
    for v in "${violations[@]}"; do
      echo -e "       ${RED}→${NC} $(realpath --relative-to="$PROJECT_ROOT" "$v")"
    done
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 2. Module Structure: each module has controller, service, module, dto/
# ══════════════════════════════════════════════════════════════════════════════
check_module_structure() {
  section "2. Module Structure"

  local all_good=true

  # Modules that are infrastructure and may not follow the standard CRUD pattern
  local infra_modules=("events" "health" "jobs")

  for module_dir in "$MODULES_DIR"/*/; do
    local module_name
    module_name="$(basename "$module_dir")"
    local is_infra=false
    for infra in "${infra_modules[@]}"; do
      [[ "$module_name" == "$infra" ]] && is_infra=true && break
    done

    # Check for .module.ts (required for all)
    if ! ls "$module_dir"*.module.ts &>/dev/null; then
      fail "Module structure: modules/$module_name missing .module.ts"
      all_good=false
      continue
    fi

    if [ "$is_infra" = true ]; then
      continue
    fi

    # Check for .controller.ts
    if ! ls "$module_dir"*.controller.ts &>/dev/null; then
      warn "Module structure: modules/$module_name missing .controller.ts"
      all_good=false
    fi

    # Check for .service.ts
    if ! ls "$module_dir"*.service.ts &>/dev/null; then
      warn "Module structure: modules/$module_name missing .service.ts"
      all_good=false
    fi

    # Check for dto/ directory (only for modules with controllers)
    if ls "$module_dir"*.controller.ts &>/dev/null && [ ! -d "${module_dir}dto" ]; then
      warn "Module structure: modules/$module_name missing dto/ directory"
      all_good=false
    fi
  done

  if [ "$all_good" = true ]; then
    pass "Module structure: all modules have required files"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 3. DTO Pattern: Uses Zod schemas (no class-validator imports)
# ══════════════════════════════════════════════════════════════════════════════
check_dto_pattern() {
  section "3. DTO Pattern (Zod, no class-validator)"

  # Check for class-validator imports anywhere in backend source
  local cv_files
  cv_files=$(grep -rl "from 'class-validator'" "$BACKEND_SRC" 2>/dev/null || true)
  cv_files+=$(grep -rl 'from "class-validator"' "$BACKEND_SRC" 2>/dev/null || true)

  if [ -z "$cv_files" ]; then
    pass "DTO pattern: no class-validator imports found"
  else
    fail "DTO pattern: class-validator imports found"
    while IFS= read -r f; do
      [ -n "$f" ] && echo -e "       ${RED}→${NC} $(realpath --relative-to="$PROJECT_ROOT" "$f")"
    done <<< "$cv_files"
  fi

  # Check for class-transformer imports
  local ct_files
  ct_files=$(grep -rl "from 'class-transformer'" "$BACKEND_SRC" 2>/dev/null || true)
  ct_files+=$(grep -rl 'from "class-transformer"' "$BACKEND_SRC" 2>/dev/null || true)

  if [ -z "$ct_files" ]; then
    pass "DTO pattern: no class-transformer imports found"
  else
    warn "DTO pattern: class-transformer imports found"
    while IFS= read -r f; do
      [ -n "$f" ] && echo -e "       ${YELLOW}→${NC} $(realpath --relative-to="$PROJECT_ROOT" "$f")"
    done <<< "$ct_files"
  fi

  # Verify DTOs use Zod
  local dto_files_count=0
  local zod_dto_count=0
  while IFS= read -r dto_file; do
    dto_files_count=$((dto_files_count + 1))
    if grep -q "from 'zod'\|from \"zod\"\|z\.object\|z\.string\|z\.enum" "$dto_file" 2>/dev/null; then
      zod_dto_count=$((zod_dto_count + 1))
    fi
  done < <(find "$BACKEND_SRC" -type f -name "*.dto.ts" ! -name "index.ts" 2>/dev/null)

  if [ "$dto_files_count" -eq 0 ]; then
    warn "DTO pattern: no DTO files found"
  elif [ "$dto_files_count" -eq "$zod_dto_count" ]; then
    pass "DTO pattern: all $dto_files_count DTO files use Zod schemas"
  else
    local missing=$((dto_files_count - zod_dto_count))
    warn "DTO pattern: $missing of $dto_files_count DTO files may not use Zod schemas"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 4. Service Pattern: Returns ServiceResult<T> (no raw throws)
# ══════════════════════════════════════════════════════════════════════════════
check_service_pattern() {
  section "4. Service Pattern (ServiceResult, no raw throws)"

  local throw_violations=()

  while IFS= read -r service_file; do
    local basename
    basename="$(basename "$service_file")"
    # Skip spec files and non-service files
    [[ "$basename" =~ \.spec\.ts$ ]] && continue
    [[ ! "$basename" =~ \.service\.ts$ ]] && continue

    # Check for raw throw statements (excluding throw result.toHttpException)
    # Services should return ServiceResult, not throw
    if grep -n "throw new\|throw Error\|throw new Error\|throw new Http" "$service_file" 2>/dev/null | grep -v "\.spec\.ts" | grep -v "// allowed" > /dev/null 2>&1; then
      throw_violations+=("$(realpath --relative-to="$PROJECT_ROOT" "$service_file")")
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null)

  if [ ${#throw_violations[@]} -eq 0 ]; then
    pass "Service pattern: no raw throw statements in service files"
  else
    warn "Service pattern: ${#throw_violations[@]} service file(s) contain throw statements"
    for v in "${throw_violations[@]}"; do
      echo -e "       ${YELLOW}→${NC} $v"
    done
  fi

  # Check that services import/use ServiceResult
  local service_count=0
  local sr_count=0
  while IFS= read -r service_file; do
    service_count=$((service_count + 1))
    if grep -q "ServiceResult" "$service_file" 2>/dev/null; then
      sr_count=$((sr_count + 1))
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null)

  if [ "$service_count" -eq 0 ]; then
    warn "Service pattern: no service files found"
  elif [ "$sr_count" -eq "$service_count" ]; then
    pass "Service pattern: all $service_count services use ServiceResult"
  else
    local missing=$((service_count - sr_count))
    warn "Service pattern: $missing of $service_count services don't reference ServiceResult"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 5. Controller Pattern: @ApiTags, explicit @HttpCode
# ══════════════════════════════════════════════════════════════════════════════
check_controller_pattern() {
  section "5. Controller Pattern (@ApiTags, @HttpCode)"

  local missing_apitags=()
  local missing_httpcode=()

  while IFS= read -r ctrl_file; do
    local basename
    basename="$(basename "$ctrl_file")"
    [[ "$basename" =~ \.spec\.ts$ ]] && continue

    local rel_path
    rel_path="$(realpath --relative-to="$PROJECT_ROOT" "$ctrl_file")"

    # Check for @ApiTags
    if ! grep -q "@ApiTags" "$ctrl_file" 2>/dev/null; then
      missing_apitags+=("$rel_path")
    fi

    # Check for @HttpCode on @Post methods
    if grep -q "@Post" "$ctrl_file" 2>/dev/null; then
      if ! grep -q "@HttpCode\|HttpCode" "$ctrl_file" 2>/dev/null; then
        missing_httpcode+=("$rel_path")
      fi
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.controller.ts" ! -name "*.spec.ts" 2>/dev/null)

  if [ ${#missing_apitags[@]} -eq 0 ]; then
    pass "Controller pattern: all controllers have @ApiTags"
  else
    warn "Controller pattern: ${#missing_apitags[@]} controller(s) missing @ApiTags"
    for v in "${missing_apitags[@]}"; do
      echo -e "       ${YELLOW}→${NC} $v"
    done
  fi

  if [ ${#missing_httpcode[@]} -eq 0 ]; then
    pass "Controller pattern: all controllers with @Post use @HttpCode"
  else
    warn "Controller pattern: ${#missing_httpcode[@]} controller(s) with @Post missing @HttpCode"
    for v in "${missing_httpcode[@]}"; do
      echo -e "       ${YELLOW}→${NC} $v"
    done
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 6. Database: All models have @@map, @map, timestamps
# ══════════════════════════════════════════════════════════════════════════════
check_database_schema() {
  section "6. Database Schema (@@map, @map, timestamps)"

  if [ ! -f "$PRISMA_SCHEMA" ]; then
    fail "Database: schema.prisma not found at $PRISMA_SCHEMA"
    return
  fi

  local all_good=true

  # Extract model names
  local models
  models=$(grep -oP '(?<=^model )\w+' "$PRISMA_SCHEMA" 2>/dev/null || true)

  if [ -z "$models" ]; then
    warn "Database: no models found in schema.prisma"
    return
  fi

  # Check each model for @@map
  while IFS= read -r model; do
    [ -z "$model" ] && continue

    # Extract the model block
    local model_block
    model_block=$(sed -n "/^model ${model} {/,/^}/p" "$PRISMA_SCHEMA")

    # Check for @@map
    if ! echo "$model_block" | grep -q '@@map(' 2>/dev/null; then
      fail "Database: model $model missing @@map() table mapping"
      all_good=false
    fi

    # Check for createdAt with @map
    if ! echo "$model_block" | grep -q 'createdAt.*@map(' 2>/dev/null; then
      warn "Database: model $model missing createdAt with @map"
      all_good=false
    fi

    # Check for updatedAt with @map
    if ! echo "$model_block" | grep -q 'updatedAt.*@map(' 2>/dev/null; then
      warn "Database: model $model missing updatedAt with @map"
      all_good=false
    fi
  done <<< "$models"

  if [ "$all_good" = true ]; then
    pass "Database: all models have @@map, @map, and timestamps"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 7. Tests: Every service has a .spec.ts file
# ══════════════════════════════════════════════════════════════════════════════
check_tests() {
  section "7. Test Coverage (spec files)"

  local missing_specs=()

  while IFS= read -r service_file; do
    local basename
    basename="$(basename "$service_file")"
    [[ "$basename" =~ \.spec\.ts$ ]] && continue

    local spec_file="${service_file%.ts}.spec.ts"
    if [ ! -f "$spec_file" ]; then
      missing_specs+=("$(realpath --relative-to="$PROJECT_ROOT" "$service_file")")
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null)

  # Also check controllers
  while IFS= read -r ctrl_file; do
    local basename
    basename="$(basename "$ctrl_file")"
    [[ "$basename" =~ \.spec\.ts$ ]] && continue

    local spec_file="${ctrl_file%.ts}.spec.ts"
    if [ ! -f "$spec_file" ]; then
      missing_specs+=("$(realpath --relative-to="$PROJECT_ROOT" "$ctrl_file")")
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.controller.ts" ! -name "*.spec.ts" 2>/dev/null)

  if [ ${#missing_specs[@]} -eq 0 ]; then
    pass "Tests: all services and controllers have .spec.ts files"
  else
    warn "Tests: ${#missing_specs[@]} file(s) missing .spec.ts"
    for v in "${missing_specs[@]}"; do
      echo -e "       ${YELLOW}→${NC} $v"
    done
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 8. Imports: No circular dependencies (heuristic check)
# ══════════════════════════════════════════════════════════════════════════════
check_circular_imports() {
  section "8. Circular Dependencies"

  # Check for forwardRef usage (indicates circular deps that were resolved)
  local forward_refs
  forward_refs=$(grep -rl "forwardRef" "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" || true)

  if [ -z "$forward_refs" ]; then
    pass "Circular dependencies: no forwardRef usage found (no circular deps)"
  else
    local count
    count=$(echo "$forward_refs" | wc -l)
    warn "Circular dependencies: $count file(s) use forwardRef (resolved circular deps)"
    while IFS= read -r f; do
      [ -n "$f" ] && echo -e "       ${YELLOW}→${NC} $(realpath --relative-to="$PROJECT_ROOT" "$f")"
    done <<< "$forward_refs"
  fi

  # Check for cross-module service imports that might indicate tight coupling
  local cross_imports=0
  while IFS= read -r ts_file; do
    local module_name
    module_name="$(basename "$(dirname "$ts_file")")"
    # Count imports from other modules
    local other_module_imports
    other_module_imports=$(grep -c "from.*modules/" "$ts_file" 2>/dev/null || true)
    if [ "$other_module_imports" -gt 3 ]; then
      cross_imports=$((cross_imports + 1))
    fi
  done < <(find "$BACKEND_SRC/modules" -type f -name "*.service.ts" ! -name "*.spec.ts" 2>/dev/null)

  if [ "$cross_imports" -eq 0 ]; then
    pass "Circular dependencies: no excessive cross-module imports detected"
  else
    warn "Circular dependencies: $cross_imports service(s) import from >3 other modules"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 9. Security: No $queryRawUnsafe usage
# ══════════════════════════════════════════════════════════════════════════════
check_security() {
  section "9. Security"

  # Check for $queryRawUnsafe
  local unsafe_query
  unsafe_query=$(grep -rl '\$queryRawUnsafe\|\$executeRawUnsafe' "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" || true)

  if [ -z "$unsafe_query" ]; then
    pass "Security: no \$queryRawUnsafe or \$executeRawUnsafe usage found"
  else
    fail "Security: unsafe raw query methods found"
    while IFS= read -r f; do
      [ -n "$f" ] && echo -e "       ${RED}→${NC} $(realpath --relative-to="$PROJECT_ROOT" "$f")"
    done <<< "$unsafe_query"
  fi

  # Check for console.log with sensitive terms
  local sensitive_logs
  sensitive_logs=$(grep -rn "console\.log.*\(password\|secret\|token\|apiKey\|api_key\)" "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" || true)

  if [ -z "$sensitive_logs" ]; then
    pass "Security: no sensitive data in console.log statements"
  else
    fail "Security: potential sensitive data logging found"
    while IFS= read -r line; do
      [ -n "$line" ] && echo -e "       ${RED}→${NC} $line"
    done <<< "$sensitive_logs"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# 10. Environment: No hardcoded secrets or connection strings
# ══════════════════════════════════════════════════════════════════════════════
check_env_secrets() {
  section "10. Environment (no hardcoded secrets)"

  local violations=()

  # Check for hardcoded connection strings
  while IFS= read -r match; do
    [ -n "$match" ] && violations+=("$match")
  done < <(grep -rn "postgresql://\|redis://\|mongodb://\|mysql://" "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" | grep -v "\.example" | grep -v "\.md" || true)

  # Check for hardcoded JWT secrets or API keys (common patterns)
  while IFS= read -r match; do
    [ -n "$match" ] && violations+=("$match")
  done < <(grep -rn "sk-[a-zA-Z0-9]\{20,\}\|sk_live_\|pk_live_\|AKIA[A-Z0-9]\{16\}" "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" || true)

  # Check for hardcoded passwords in source (not env/config files)
  while IFS= read -r match; do
    [ -n "$match" ] && violations+=("$match")
  done < <(grep -rn "password.*=.*['\"].\{8,\}['\"]" "$BACKEND_SRC" 2>/dev/null | grep -v node_modules | grep -v "\.spec\.ts" | grep -v "\.dto\." | grep -v "schema" | grep -v "\.example" | grep -v "validation\|validator\|min(\|max(\|regex\|Zod\|zod" || true)

  if [ ${#violations[@]} -eq 0 ]; then
    pass "Environment: no hardcoded secrets or connection strings found"
  else
    fail "Environment: ${#violations[@]} potential hardcoded secret(s) found"
    for v in "${violations[@]}"; do
      echo -e "       ${RED}→${NC} $v"
    done
  fi

  # Check that .env files are gitignored
  if grep -q "^\.env$\|^\.env\.\*\|^\.env\.local" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    pass "Environment: .env files are in .gitignore"
  else
    warn "Environment: .env may not be properly gitignored"
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════
main() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║          Coding Standards Validator                         ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"

  check_file_naming
  check_module_structure
  check_dto_pattern
  check_service_pattern
  check_controller_pattern
  check_database_schema
  check_tests
  check_circular_imports
  check_security
  check_env_secrets

  # ── Summary ───────────────────────────────────────────────────────────────
  echo ""
  echo -e "${BOLD}──────────────────────────────────────────────────────────────${NC}"
  echo -e "  ${GREEN}Passed:${NC}   $PASS_COUNT"
  echo -e "  ${RED}Failed:${NC}   $FAIL_COUNT"
  echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
  echo -e "${BOLD}──────────────────────────────────────────────────────────────${NC}"

  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "  ${RED}${BOLD}Result: FAIL${NC} ($FAIL_COUNT failure(s) found)"
    echo ""
    exit 1
  else
    echo -e "  ${GREEN}${BOLD}Result: PASS${NC} (warnings are advisory)"
    echo ""
    exit 0
  fi
}

main "$@"
