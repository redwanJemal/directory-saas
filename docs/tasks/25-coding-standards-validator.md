# Task 25: Coding Standards Validator Script

## Summary
Create an automated script that validates code against the project's coding standards. Run after each task to catch violations.

## Current State
- Coding standards document exists (`scripts/coding-standards.md`).
- ESLint + Prettier configured (Task 01).

## Required Changes

### 25.1 Validator Script

**File**: `scripts/validate-standards.sh`

Checks:
1. **File naming**: kebab-case for all source files
2. **Module structure**: Each module has controller, service, module, dto/
3. **DTO pattern**: Uses Zod schemas (no class-validator imports)
4. **Service pattern**: Returns `ServiceResult<T>` (no raw throws)
5. **Controller pattern**: Uses `@ApiTags`, explicit `@HttpCode`
6. **Database**: All models have `@@map`, `@map`, timestamps
7. **Tests**: Every service has a `.spec.ts` file
8. **Imports**: No circular dependencies
9. **Security**: No `$queryRawUnsafe` usage
10. **Env**: No hardcoded secrets or connection strings

### 25.2 Output Format

```
[PASS] File naming: all files are kebab-case
[FAIL] Module structure: modules/tenants missing dto/ directory
[WARN] Tests: modules/audit/audit.service.spec.ts not found
[PASS] Security: no $queryRawUnsafe usage found
```

Color-coded, with summary at end:
```
Results: 8 passed, 1 failed, 1 warning
```

### 25.3 Integration

- Called by task-runner after each task completion
- Exit code 0 if all pass (warnings OK), 1 if any failures
- Can be run standalone: `./scripts/validate-standards.sh`

## Acceptance Criteria

1. Script checks all 10 categories
2. Color-coded output with pass/fail/warn
3. Exit code reflects pass/fail
4. Integrates with task-runner
