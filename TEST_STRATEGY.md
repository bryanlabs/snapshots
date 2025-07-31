# Test Strategy - Mag-7 Approach

## Core Testing Principles
- **Focus on business-critical paths** - What breaks the product if it fails?
- **Test contracts, not implementation** - APIs and interfaces matter most
- **Security and reliability over UI polish** - Investors care about robustness
- **Integration over unit tests** - Real-world scenarios matter more

## Essential Test Categories (~100 tests total)

### 1. Critical API Tests (30-35 tests)
**Keep these API tests:**
- `auth-login.test.ts` - Authentication is critical
- `auth-wallet.test.ts` - Wallet auth is unique differentiator
- `download.test.ts` - Core business function
- `snapshots.test.ts` - Core data access
- `bandwidth-status.test.ts` - Tier management
- `health.test.ts` - Operational monitoring
- `metrics.test.ts` - Observability

**Remove these API tests:**
- `avatar.test.ts`, `avatar-simple.test.ts` - Not business critical
- `rum.test.ts` - Nice-to-have monitoring
- `test-error.test.ts` - Development utility
- Duplicate auth tests (keep one comprehensive auth test)

### 2. Integration Tests (15-20 tests)
**Keep:**
- `download-flow.test.ts` - End-to-end critical path
- `auth-flow.test.ts` - User journey
- Core nginx operations tests

**Remove:**
- UI integration tests for non-critical flows

### 3. Security & Infrastructure (20-25 tests)
**Keep:**
- URL signing and validation
- Rate limiting
- Authentication/authorization
- Input validation
- Database operations

### 4. Business Logic (15-20 tests)
**Keep:**
- Bandwidth calculation and enforcement
- Download tracking
- User tier management
- Session management

### 5. Component Tests (10-15 tests)
**Keep only:**
- `DownloadButton.test.tsx` - Core interaction
- `ChainList.test.tsx` - Main navigation
- Auth components that handle security

**Remove all:**
- Skeleton components
- Loading states
- Simple display components
- Layout tests
- Error page tests

## Tests to Remove Immediately

### UI Component Tests (Remove ~30 files)
- `UserAvatar.test.tsx`
- `UserDropdown.test.tsx`
- `MobileMenu.test.tsx`
- `Header.test.tsx`
- `SnapshotItem.test.tsx`
- `ChainCard.test.tsx`
- `ChainCardSkeleton.test.tsx`
- `FilterChips.test.tsx`
- `CountdownTimer.test.tsx`
- `KeyboardShortcutsModal.test.tsx`
- All layout and loading tests

### Redundant Middleware Tests
- Simple logger tests
- Basic middleware wrappers

### Development Utility Tests
- Error page tests
- Test helper tests
- Mock tests

## What Investors Care About

1. **Security** - Are user downloads protected? Is authentication solid?
2. **Reliability** - Does the core download flow work consistently?
3. **Performance** - Can it handle load? (Separate load tests)
4. **Monitoring** - Can you detect and respond to issues?
5. **Code Quality** - Is the testing strategic, not just high coverage?

## Coverage Goals
- **Overall**: 70-80% (not 100%)
- **Critical paths**: 95%+
- **UI Components**: 30-40%
- **Business Logic**: 90%+

## Implementation Order
1. Remove all trivial UI component tests
2. Consolidate duplicate API tests
3. Ensure critical paths have integration tests
4. Add any missing security tests
5. Update CI to run only essential tests