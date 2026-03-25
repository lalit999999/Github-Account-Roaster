/\*\*

- Error Mapping Documentation
-
- This document explains how errors are handled across the frontend and backend.
  \*/

# Error Mapping Architecture

## Overview

The GitHub Roast Tool has a robust error handling system that maps backend error types to frontend error displays.

## Files Involved

### Backend Side

- `server/errors.js` - Documents all backend error types and mappings
- Backend services return errors with a `type` field (e.g., `USER_NOT_FOUND`)

### Frontend Side

- `src/app/utils/errors.ts` - Frontend ErrorType enum and error messages
- `src/app/utils/sharedErrors.ts` - List of all valid backend error types
- `src/app/utils/errorMapping.ts` - Mapping logic from backend to frontend types
- `src/app/api/schemas.ts` - Zod schemas that validate error responses
- `src/app/App.tsx` - Uses error mapping when processing API responses

## Error Flow

### When an error occurs:

1. **Backend** returns error response with `error.type` (e.g., `"USER_NOT_FOUND"`)

2. **API Response Validation** (`src/app/api/schemas.ts`)
   - Validates error response structure with Zod
   - Ensures required fields exist

3. **Error Mapping** (`src/app/utils/errorMapping.ts`)
   - Maps backend error type → frontend ErrorType
   - `USER_NOT_FOUND` → `ErrorType.USER_NOT_FOUND`
   - `INVALID_INPUT` → `ErrorType.INVALID_USERNAME`
   - Unknown types → `ErrorType.UNKNOWN_ERROR`

4. **Frontend Display** (`src/app/utils/errors.ts`)
   - Looks up error message in `ERROR_MESSAGES` map
   - Shows title and description to user

## Example Flows

### Scenario 1: User Not Found

```
Backend throws: { error: { type: 'USER_NOT_FOUND' } }
         ↓
Frontend validates schema
         ↓
Maps: USER_NOT_FOUND → ErrorType.USER_NOT_FOUND
         ↓
Displays: "User Not Found" / "This GitHub user doesn't exist..."
```

### Scenario 2: Rate Limit

```
Backend throws: { error: { type: 'RATE_LIMIT_EXCEEDED' } }
         ↓
Frontend validates schema
         ↓
Maps: RATE_LIMIT_EXCEEDED → ErrorType.RATE_LIMIT_EXCEEDED
         ↓
Displays: "Rate Limit Exceeded" / "GitHub API rate limit exceeded..."
```

### Scenario 3: Unknown Error Type

```
Backend throws: { error: { type: 'NEW_ERROR_TYPE' } }
         ↓
Frontend validates schema (passes - it's a string)
         ↓
processBackendError() sees unknown type
         ↓
Logs warning and maps to: ErrorType.UNKNOWN_ERROR
         ↓
Displays: "Oops! Something went wrong"
```

## Adding New Error Types

When the backend adds a new error type:

### Step 1: Declare the type

Update `server/errors.js` with the new error type and write documentation about when it occurs.

### Step 2: Update frontend mapping

Add entry to `src/app/utils/sharedErrors.ts`:

```typescript
IT_WILL_BREAK: "IT_WILL_BREAK",
```

### Step 3: Add error mapping

Add entry to `src/app/utils/errorMapping.ts`:

```typescript
IT_WILL_BREAK: ErrorType.APPROPRIATE_FRONTEND_TYPE,
```

If you need a new frontend error type, first add it to `src/app/utils/errors.ts`:

```typescript
export enum ErrorType {
  // ... existing types
  NEW_ERROR = "NEW_ERROR",
}

export const ERROR_MESSAGES: Record<ErrorType, ...> = {
  // ... existing messages
  [ErrorType.NEW_ERROR]: {
    title: "User-Friendly Title",
    description: "User-friendly description of what went wrong",
  },
}
```

### Step 4: Test

The frontend will now automatically handle the new error type with proper logging.

## Type Safety

The system provides type safety through:

1. **Zod Schemas** - Validates API response structure at runtime
2. **Type Guards** - `isBackendErrorType()` checks if string is valid backend type
3. **Exhaustive Mapping** - TypeScript Record requires all backend types to be mapped
4. **Logging** - Unknown types are logged for debugging

## Benefits

✅ Single source of truth for error types (shared across backend and frontend)
✅ Type-safe error handling with no strings being cast
✅ Easy to extend - adding new errors is straightforward
✅ Clear error messaging for users
✅ Debugging support - unknown errors are logged
✅ No fragile string matching - removed hardcoded mapping from App.tsx
