# Tier-Based System Migration

This document outlines the complete migration from a credit-based billing system to a tier-based subscription system for the snapshots service.

## Migration Overview

### What Changed

1. **Removed Credit System**:
   - `credit_balance` field removed from users table
   - Credit-based billing logic replaced with subscription management
   - Credit transaction data archived for audit purposes

2. **Added Subscription Management**:
   - `subscription_status` field: free, active, cancelled, expired, pending
   - `subscription_expires_at` field for managing subscription lifecycle
   - Tier-based access control with automatic downgrade on expiration

3. **Implemented API Rate Limiting**:
   - `api_usage_records` table for tracking hourly API usage
   - Tier-based rate limits: Free (50/h), Premium (500/h), Ultra (2000/h)
   - Automatic cleanup of old usage records

4. **Updated Tier Configurations**:
   - Free: 50 Mbps, daily snapshots (12:00 UTC), 50 API requests/hour
   - Premium: 250 Mbps, twice daily (0:00, 12:00 UTC), 500 API requests/hour
   - Ultra: 500 Mbps, 6-hour snapshots + custom requests, 2000 API requests/hour

## Database Schema Changes

### New Fields in `users` table:
```sql
subscription_status TEXT NOT NULL DEFAULT 'free'
subscription_expires_at DATETIME
```

### New Fields in `tiers` table:
```sql
api_rate_limit_hourly INTEGER NOT NULL DEFAULT 50
```

### New Table `api_usage_records`:
```sql
CREATE TABLE "api_usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "hour_bucket" DATETIME NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "endpoint" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "api_usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

## Migration Files

### Core Migration
- **Prisma Migration**: `prisma/migrations/20250802041227_tier_based_system_migration/`
- **Seed Update**: `prisma/seed.ts` - Updated with new tier configurations

### Scripts
- **Data Archive**: `scripts/archive-credit-data.ts` - Archives credit system data
- **Maintenance**: `scripts/maintenance-tasks.ts` - Periodic cleanup and monitoring
- **Rollback**: `scripts/rollback-migration.ts` - Emergency rollback capability

### Updated Code
- **Types**: `types/user.ts`, `types/next-auth.d.ts` - New TypeScript interfaces
- **Utilities**: `lib/utils/tier.ts`, `lib/utils/subscription.ts` - Tier management
- **Middleware**: `lib/middleware/apiRateLimit.ts` - API rate limiting
- **Auth**: `auth.ts` - Updated session handling

## API Rate Limiting

### How It Works

1. **Hourly Buckets**: Usage tracked in 1-hour windows (e.g., 14:00-15:00)
2. **Tier-Based Limits**: Different limits per tier (50/500/2000 requests/hour)
3. **Automatic Reset**: Counters reset every hour
4. **Graceful Degradation**: Rate limiting errors don't break API functionality

### Usage

```typescript
import { withApiRateLimit } from '@/lib/middleware/apiRateLimit';

export const GET = withApiRateLimit(
  async (request: NextRequest) => {
    // Your API handler logic
    return NextResponse.json({ data: "success" });
  },
  { endpoint: '/api/custom-endpoint' }
);
```

## Subscription Management

### Subscription Statuses

- **free**: Default status, no subscription required
- **active**: Paid subscription, full tier access
- **cancelled**: Cancelled but still active until expiry
- **expired**: Past expiry date, downgraded to free
- **pending**: Payment processing or activation pending

### Key Functions

```typescript
// Check if subscription is currently active
const isActive = isSubscriptionActive(status, expiresAt);

// Get effective tier considering subscription status
const effectiveTier = getEffectiveTier(personalTier, status, expiresAt);

// Update user subscription
await updateUserSubscription(userId, {
  tier: 'premium',
  status: 'active',
  expiresAt: new Date('2025-09-01')
});
```

## Maintenance Tasks

### Automated Cleanup

Run the maintenance script regularly (daily recommended):

```bash
npx tsx scripts/maintenance-tasks.ts
```

This script:
- Cleans up API usage records older than 7 days
- Processes expired subscriptions (downgrades to free tier)
- Generates usage statistics

### Manual Tasks

```bash
# Archive credit data (if reverting)
npx tsx scripts/archive-credit-data.ts

# Analyze rollback requirements
npx tsx scripts/rollback-migration.ts 2025-08-02
```

## Testing the Migration

1. **Verify Database Changes**:
   ```bash
   npx prisma studio
   # Check that users table has subscription fields
   # Check that api_usage_records table exists
   ```

2. **Test API Rate Limiting**:
   ```bash
   # Make multiple API requests and verify rate limiting headers
   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/chains
   ```

3. **Test Subscription Logic**:
   ```typescript
   // Create test user with expired subscription
   const user = await updateUserSubscription(userId, {
     tier: 'premium',
     status: 'active',
     expiresAt: new Date('2024-01-01') // Past date
   });
   
   // Verify they get downgraded to free tier
   const effective = getEffectiveTier(user.personalTier.name, user.subscriptionStatus, user.subscriptionExpiresAt);
   console.log(effective); // Should be 'free'
   ```

## Rollback Procedure

In case of issues, the migration can be rolled back:

1. **Restore Database Schema**:
   ```bash
   # Manually revert schema.prisma to include creditBalance
   # Run migration to restore credit_balance columns
   npx prisma migrate dev --name "restore_credit_system"
   ```

2. **Restore Credit Data**:
   ```bash
   # Analyze what needs to be restored
   npx tsx scripts/rollback-migration.ts 2025-08-02
   
   # Manually restore balances from archived data
   ```

## Monitoring

### Key Metrics to Track

1. **API Usage**:
   - Requests per hour by tier
   - Rate limit hit rates
   - Most used endpoints

2. **Subscriptions**:
   - Active subscriptions by tier
   - Churn rate (cancelled subscriptions)
   - Expired subscriptions not renewed

3. **System Health**:
   - API usage record table growth
   - Cleanup job success rates
   - Authentication session performance

### Alerts to Set Up

- High rate of API rate limit hits (may need tier limit adjustment)
- Failed subscription processing
- Cleanup job failures
- Unusual API usage patterns

## Performance Considerations

1. **API Usage Records**:
   - Table can grow quickly with high API usage
   - Regular cleanup is essential (automated in maintenance script)
   - Consider partitioning by hour_bucket for very high volumes

2. **Session Handling**:
   - Effective tier calculation happens on every session load
   - Consider caching tier information in session for performance
   - Monitor database query performance for user lookups

3. **Rate Limiting**:
   - Each API request requires database read/write for usage tracking
   - Consider Redis-based rate limiting for higher performance needs
   - Current implementation prioritizes data accuracy over raw performance

## Security Considerations

1. **API Rate Limiting**: Prevents API abuse and ensures fair usage
2. **Subscription Validation**: Server-side validation prevents tier bypass
3. **Data Archival**: Credit transaction data preserved for audit compliance
4. **Graceful Degradation**: System remains functional even if rate limiting fails

## Support and Troubleshooting

### Common Issues

1. **Users stuck on expired tier**: Run maintenance script to process expired subscriptions
2. **API rate limiting too aggressive**: Adjust limits in tier configuration
3. **Session not updating**: Clear session storage and re-authenticate

### Debug Commands

```bash
# Check user's effective tier
npx prisma studio
# Navigate to users table and check subscription fields

# View API usage for user
# Navigate to api_usage_records table and filter by user_id

# Check tier configurations
# Navigate to tiers table and verify api_rate_limit_hourly values
```

## Next Steps

1. **Monitor Migration**: Watch for any issues in first 48 hours
2. **User Communication**: Notify users of new tier benefits
3. **Analytics Setup**: Implement tracking for new tier usage patterns
4. **Payment Integration**: Connect subscription management to billing system
5. **Admin Interface**: Build admin tools for subscription management

---

**Migration Completed**: August 2, 2025  
**Rollback Available Until**: August 16, 2025  
**Documentation Version**: 1.0