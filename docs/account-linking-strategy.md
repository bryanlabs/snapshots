# Account Linking Strategy

## Overview
Account linking allows users to connect multiple authentication methods (email/password, OAuth providers, wallet) to a single user account. This provides flexibility and prevents duplicate accounts.

## Current State
- Users can sign up with email/password OR Cosmos wallet
- Each creates a separate user account
- No way to link accounts after creation
- Risk of duplicate accounts if user forgets which method they used

## Proposed Solution

### Database Schema Changes
Already implemented in our schema:
- `User` table has fields for multiple auth methods:
  - `email` (for email/password auth)
  - `walletAddress` (for Cosmos wallet auth)
  - OAuth would use the existing NextAuth `Account` table

### Implementation Strategy

#### Phase 1: Basic Account Linking (Recommended)
1. **Add "Link Account" section to Account Settings page**
   - Show connected authentication methods
   - Allow linking additional methods
   - Require current session authentication before linking

2. **Prevent Duplicate Accounts**
   - When signing in with a new method, check if email matches existing account
   - Prompt user to link accounts instead of creating new one
   - Use email as the primary identifier for matching

3. **Security Considerations**
   - Always require current authentication before linking
   - Send email notification when new method is linked
   - Allow unlinking methods (but keep at least one)

#### Phase 2: Advanced Features (Future)
- Social login (Google, GitHub) integration
- Multiple wallets per account
- Account recovery options
- Merge existing duplicate accounts

### Code Implementation Example

```typescript
// In auth.ts - Modified authorize function
async authorize(credentials) {
  // For email/password login
  const { email, password } = credentials;
  
  // Check if user exists with this email
  let user = await prisma.user.findUnique({
    where: { email }
  });
  
  // If no user with email, check if wallet user wants to add email
  if (!user && session?.user?.walletAddress) {
    // Link email to existing wallet account
    user = await prisma.user.update({
      where: { walletAddress: session.user.walletAddress },
      data: { 
        email,
        // Hash and store password
      }
    });
  }
  
  return user;
}
```

### API Endpoints Needed

1. **GET /api/account/auth-methods**
   - Returns list of connected auth methods

2. **POST /api/account/link-email**
   - Link email/password to existing account

3. **POST /api/account/link-wallet**
   - Link Cosmos wallet to existing account

4. **DELETE /api/account/unlink**
   - Remove an auth method (if more than one exists)

## Recommendation

For a snapshot download service, implementing full account linking might be overkill. However, a simplified version would improve UX:

### Minimal Implementation (Recommended)
1. **Use email as primary identifier**
   - When user signs in with wallet, prompt for optional email
   - When user signs in with OAuth, use their email to check for existing account
   
2. **Simple account recovery**
   - Allow password reset via email
   - Show wallet address on account page for wallet users

3. **Prevent duplicates**
   - Check email during all signup flows
   - Prompt to sign in if account exists

### Benefits
- Prevents accidental duplicate accounts
- Provides account recovery options
- Maintains simplicity for users
- Minimal development effort

### Drawbacks of Full Implementation
- Complex state management
- More security considerations
- Additional UI complexity
- More testing required
- May confuse users who expect separate accounts

## Decision
For this project, I recommend the **Minimal Implementation** approach. It provides the key benefits (preventing duplicates, account recovery) without the complexity of full account linking. This can be enhanced later if user feedback indicates a need for more sophisticated account management.