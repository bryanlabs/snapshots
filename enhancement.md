# BryanLabs Snapshot Service Enhancement Plan

## Vision

Transform BryanLabs from a basic snapshot provider into the premier, developer-focused snapshot service for the Cosmos ecosystem by emphasizing speed, transparency, and automation.

## Phase 1: Easy Features (1-2 weeks total)

### 1.1 UI Card Redesign
Replace description text with functional information:

**Current**:
```
Osmosis
Osmosis is an advanced AMM protocol for interchain assets.
[Active] 3 snapshots
```

**New**:
```
Osmosis
Latest: Block 25,261,834 • 2 hours ago
Size: 91.5 GB compressed • zst format
Update: Every 6 hours
```

### 1.2 Homepage Padding Reduction
- Reduce hero section padding by 30-40%
- Add live metrics dashboard widget
- Show "Latest Updates" feed

### 1.3 Speed Test Feature
Allow users to test their connection speed to BryanLabs servers.

**Endpoint**: `GET /api/v1/speedtest`
- Serves a small test file
- Measures actual download speed
- Helps users choose appropriate tier

### 1.4 Chain Metadata API
Expose comprehensive chain information for automation tools.

**Endpoint**: `GET /api/v1/chains/{chainId}/info`

**Response**:
```json
{
  "chain_id": "osmosis-1",
  "latest_snapshot": {
    "height": 25261834,
    "size": 91547443618,
    "age_hours": 2
  },
  "snapshot_schedule": "every 6 hours",
  "average_size": 85000000000,
  "compression_ratio": 0.45
}
```

### 1.5 Copy Download Command Button
- Add "Copy Download Command" button on chain detail pages
- Generate curl/wget commands with proper authentication

## Phase 2: Medium Features (2-3 weeks total)

### 2.1 Programmatic URL Retrieval API ✅ Priority
Enable developers to get snapshot URLs via API without using the web UI.

**Endpoint**: `GET /api/v1/chains/{chainId}/snapshots/latest`

**Free Tier Request**:
```bash
curl -s https://snapshots.bryanlabs.net/api/v1/chains/osmosis-1/snapshots/latest
```

**Premium Tier Request**:
```bash
curl -H "Authorization: Bearer $TOKEN" -s https://snapshots.bryanlabs.net/api/v1/chains/osmosis-1/snapshots/latest
```

**Response**:
```json
{
  "chain_id": "osmosis-1",
  "height": 25261834,
  "size": 91547443618,
  "compression": "zst",
  "url": "https://minio.bryanlabs.net/snapshots/osmosis-1/osmosis-1-25261834.tar.zst?X-Amz-Algorithm=...",
  "expires_at": "2024-12-17T15:30:00Z",
  "tier": "free",
  "checksum": {
    "sha256": "a1b2c3d4..."
  }
}
```

### 2.2 Terminal-Inspired Theme
- Monospace fonts for technical data
- ANSI-style color scheme
- ASCII progress bars
- Command palette navigation (Cmd+K)

### 2.3 Basic API Documentation
- Write OpenAPI specification
- Generate interactive documentation
- Include code examples for common languages

### 2.4 Volume Snapshot Lifecycle Management ✅ Priority
Implement lifecycle-based deletion to prevent race conditions between snapshot rotation and processing.

**Problem**: VolumeSnapshots can be deleted while processor is still using them, causing job failures.

**Solution**: Only delete VolumeSnapshots after successful MinIO upload.

**Implementation**:

1. **Processor Script Enhancement** (`process-single-snapshot.sh`):
```bash
# After successful MinIO upload
if [ $? -eq 0 ]; then
    echo "[INFO] Upload successful, marking volume snapshot for deletion"
    kubectl label volumesnapshot $VOLUME_SNAPSHOT_NAME \
        minio-uploaded=true \
        upload-time=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
        -n $NAMESPACE
fi
```

2. **Cleanup Job** (new CronJob):
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: volume-snapshot-cleanup
spec:
  schedule: "*/30 * * * *"  # Every 30 minutes
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: bitnami/kubectl:latest
            command:
            - /bin/bash
            - -c
            - |
              # Delete snapshots that are:
              # 1. Labeled as uploaded
              # 2. Older than 5 minutes (grace period)
              kubectl get volumesnapshot -A \
                -l minio-uploaded=true \
                -o json | jq -r '.items[] | 
                select((.metadata.labels."upload-time" // "" | . != "" and 
                (now - (. | fromdateiso8601)) > 300)) | 
                "\(.metadata.namespace) \(.metadata.name)"' |
              while read ns name; do
                echo "Deleting $name in namespace $ns"
                kubectl delete volumesnapshot $name -n $ns
              done
```

3. **Processor Selection Logic**:
```bash
# Only select snapshots not yet uploaded
LATEST_SNAPSHOT=$(kubectl get volumesnapshot -n $NAMESPACE \
    -l chain=$CHAIN_ID,!minio-uploaded \
    --sort-by=.metadata.creationTimestamp \
    -o jsonpath='{.items[-1].metadata.name}')
```

**Benefits**:
- Eliminates race conditions
- Reduces storage usage (only keeps what's needed)
- Self-healing (failed uploads keep snapshot for retry)
- Clear audit trail via labels

**Benefits**:
- Eliminates race conditions
- Reduces storage usage (only keeps what's needed)
- Self-healing (failed uploads keep snapshot for retry)
- Clear audit trail via labels

### 2.5 Snapshot Comparison Table
- Frontend component showing multiple snapshots
- Compare sizes, ages, and compression ratios
- Help users choose optimal snapshot

### 2.6 Per-Chain Snapshot Schedules
Allow different chains to have different snapshot schedules instead of a fixed "every 6 hours" for all chains.

**Problem**: All chains currently use the same 6-hour snapshot schedule, but different chains have different needs based on their activity and size.

**Solution**: Implement configurable per-chain snapshot schedules.

**Implementation**:

1. **Configuration Schema**:
```yaml
# config/chain-schedules.yaml
chains:
  osmosis-1:
    schedule: "*/4 * * * *"  # Every 4 hours
    description: "High activity chain"
  
  cosmoshub-4:
    schedule: "*/12 * * * *"  # Every 12 hours
    description: "Lower activity, stable chain"
  
  juno-1:
    schedule: "*/6 * * * *"  # Every 6 hours (default)
    description: "Standard schedule"
```

2. **API Enhancement**:
Update the chain metadata API to include schedule information:
```json
{
  "chain_id": "osmosis-1",
  "snapshot_schedule": {
    "cron": "*/4 * * * *",
    "human_readable": "every 4 hours",
    "next_snapshot": "2024-12-17T16:00:00Z"
  }
}
```

3. **Frontend Updates**:
- Modify countdown timers to use chain-specific schedules
- Display schedule information in UI cards
- Show "Next snapshot in: X hours Y minutes"

4. **Snapshot Processor Updates**:
- Update Kubernetes CronJobs to use per-chain schedules
- Modify processor scripts to respect chain-specific timing
- Add schedule validation and monitoring

**Benefits**:
- Optimize resource usage based on chain activity
- Reduce unnecessary snapshots for low-activity chains
- Provide more frequent updates for high-activity chains
- Better cost management for storage and compute

## Phase 3: Hard Features (4-8 weeks total)

### 3.1 Real-time Bandwidth Display
Show current network utilization on the homepage and chain pages.

**Implementation**:
- Add metrics collection to nginx proxy
- Create `/api/v1/metrics/bandwidth` endpoint
- React components for live updates via WebSocket/SSE

**Display**:
```
Network Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Free Tier:     ████████░░░░░░░░  42/50 MB/s (5 active)
Premium Tier:  ██░░░░░░░░░░░░░░  23/250 MB/s (2 active)
```

### 3.2 Download Queue Visualization
For free tier users, show queue position and estimated wait time.

**Display when downloading**:
```
Your Download Queue Position
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Position: #3 of 7
Estimated wait: ~45 seconds
Current speed: 50 MB/s (shared)

[=========>          ] Starting soon...
```

### 3.3 Webhook Notifications
Allow users to subscribe to snapshot completion events.

**Webhook Registration**:
```bash
POST /api/v1/webhooks
{
  "chain_id": "osmosis-1",
  "url": "https://myapp.com/webhook",
  "events": ["snapshot.created"]
}
```

### 3.4 Snapshot Intelligence
Historical analysis and predictions:
- Growth rate trends
- Size predictions
- Optimal download times
- Pruning effectiveness metrics

### 3.5 Private Snapshots
- Upload custom snapshots
- Share with team members
- Access control lists

## Phase 4: Very Hard Features (12-16 weeks total)

### 4.1 User Management & Credit System ✅ Critical

#### 4.1.1 PostgreSQL Database Integration
Replace simple JWT auth with full user management system.

**Database Schema**:
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Credits system
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    balance DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'download', 'refund'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Download history
CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    chain_id VARCHAR(50) NOT NULL,
    snapshot_height BIGINT NOT NULL,
    size_bytes BIGINT NOT NULL,
    credits_charged DECIMAL(10,2) NOT NULL,
    download_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.2 Credit-Based Pricing Model
Move from tier-based to usage-based pricing.

**Pricing Structure**:
- **Free tier**: 5 GB/month free (requires registration)
- **Pay-as-you-go**: $0.10 per GB after free tier
- **Bulk credits**: Discounts for larger purchases
  - $10 = 110 GB (10% bonus)
  - $50 = 600 GB (20% bonus)
  - $100 = 1300 GB (30% bonus)

**Implementation**:
```typescript
// Calculate credit cost for download
function calculateCreditCost(sizeBytes: number, user: User): number {
  const sizeGB = sizeBytes / (1024 * 1024 * 1024);
  const freeGBRemaining = user.monthlyFreeGB - user.monthlyUsedGB;
  
  if (sizeGB <= freeGBRemaining) {
    return 0; // Free tier
  }
  
  const chargeableGB = sizeGB - freeGBRemaining;
  return chargeableGB * 0.10; // $0.10 per GB
}
```

### 4.2 User Registration & Authentication
Full user management with email verification.

**Endpoints**:
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot-password` - Password reset
- `GET /api/v1/auth/me` - Get current user info

### 4.3 Credit Management
Allow users to purchase and track credits.

**Endpoints**:
- `GET /api/v1/credits/balance` - Check credit balance
- `POST /api/v1/credits/purchase` - Buy credits (Stripe integration)
- `GET /api/v1/credits/history` - Transaction history
- `GET /api/v1/credits/usage` - Monthly usage stats

**Stripe Integration**:
```typescript
// Credit purchase endpoint
async function purchaseCredits(amount: number, userId: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Snapshot Download Credits',
          description: `${calculateGBAmount(amount)} GB of downloads`
        },
        unit_amount: amount * 100, // cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${BASE_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/credits/cancel`,
    metadata: { userId }
  });
  
  return session;
}
```

### 4.4 User Dashboard
New authenticated user area with:
- Credit balance display
- Download history
- Usage statistics
- Payment history
- API key management

### 4.5 Migration Strategy
Smooth transition from current system:
1. Deploy new system alongside existing
2. Grandfather existing premium user with unlimited credits
3. Email notification campaign
4. 30-day transition period
5. Sunset old auth system

**Benefits**:
- Scalable revenue model
- Fair usage-based pricing
- Better user insights
- Automated billing
- No more bandwidth sharing issues

### 4.6 Multi-Region Support
- CDN integration for global distribution
- Region selection in download URLs
- Latency-based routing

### 4.7 SDK Libraries
Provide official libraries for snapshot integration:
- Go SDK for Cosmos nodes
- Python SDK for automation
- JavaScript/TypeScript for web apps

### 4.8 Terraform Provider
```hcl
resource "bryanlabs_snapshot" "osmosis" {
  chain_id = "osmosis-1"
  tier     = "premium"
  
  restore_config {
    target_directory = "/var/lib/osmosis"
    auto_start      = true
  }
}
```

### 4.9 Custom Snapshot Requests
For premium users:
- Request specific block heights
- Choose compression levels
- Schedule regular snapshots

### 4.10 Dedicated Bandwidth Pools
- Reserved bandwidth per premium user
- No sharing with other premium users
- Guaranteed minimum speeds

## Additional Feature Details

### GitHub Actions Integration
```yaml
- uses: bryanlabs/snapshot-restore@v1
  with:
    chain: osmosis-1
    tier: premium
    token: ${{ secrets.BRYANLABS_TOKEN }}
```

### Snapshot Automation
- Auto-restore on node failure
- Scheduled snapshot pulls
- Integration with monitoring systems


## Success Metrics

### Technical Metrics
- API response time < 200ms
- Download start time < 5s
- 99.9% uptime SLA
- Snapshot age < 6 hours

### User Metrics
- Developer adoption rate
- API usage vs web usage
- Premium conversion rate
- User retention

### Differentiation from Competitors
- **Speed Focus**: Real-time metrics and transparency
- **Developer First**: API-centric design
- **Automation**: Webhooks and programmatic access
- **Performance**: Fastest download speeds in Cosmos
- **Reliability**: Multiple regions and CDN support

## Timeline

- **Phase 1 (Easy)**: 1-2 weeks total
- **Phase 2 (Medium)**: 2-3 weeks total  
- **Phase 3 (Hard)**: 4-8 weeks total
- **Phase 4 (Very Hard)**: 12-16 weeks total

**Total Timeline**: 4-6 months for full implementation

## Recommended Implementation Order

Organized by difficulty to build momentum while prioritizing critical fixes and revenue features:

### Week 1-2: Phase 1 (Easy Wins)
1. UI Card Redesign
2. Homepage Padding Reduction
3. Speed Test Feature
4. Chain Metadata API
5. Copy Download Command Button

### Week 3-5: Phase 2 (Medium Priority)
1. Volume Snapshot Lifecycle (critical fix)
2. Programmatic URL Retrieval API (high priority)
3. Terminal Theme
4. Basic API Documentation
5. Snapshot Comparison Table
6. Per-Chain Snapshot Schedules

### Week 6-10: Start Phase 3 (Hard Features)
1. Real-time Bandwidth Display
2. Download Queue Visualization
3. Webhook Notifications

### Week 11-16: Start Phase 4 (Very Hard - Revenue Critical)
1. User Management & Credit System (highest priority despite complexity)
   - Database schema implementation
   - Basic registration/login
   - Stripe integration
   - Credit purchase flow
   - User dashboard
   - Migration from current system

### Month 5+: Complete Phase 3 & 4
1. Snapshot Intelligence
2. Private Snapshots
3. Multi-Region Support
4. SDK Libraries
5. Terraform Provider
6. Custom Snapshot Requests
7. Dedicated Bandwidth Pools

**Note**: The User Management & Credit System should be started early despite its complexity because:
- Enables scalable revenue model
- Removes bandwidth sharing issues
- Provides better user analytics
- Allows for future feature monetization