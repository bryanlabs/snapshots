# Premium Features Guide

Unlock the full potential of the BryanLabs Snapshot Service with our Premium tier. This guide covers all premium features and benefits.

## Premium Benefits Overview

### 🚀 5x Faster Downloads
- **250MB/s shared bandwidth** (vs 50MB/s free tier)
- Priority bandwidth allocation
- Consistent speeds even during peak hours
- Optimized for large snapshot downloads

### 📊 Enhanced Features
- Download history tracking
- Priority support
- Early access to new chains
- API access for automation

### 💰 Simple Pricing
- Affordable monthly subscription
- No download limits
- Cancel anytime
- Team plans available

## Getting Started with Premium

### 1. Account Creation
Contact our team to set up your premium account:
- Email: premium@bryanlabs.net
- Include your desired username
- Specify individual or team plan

### 2. Login Process
Once your account is created:
1. Visit [https://snapshots.bryanlabs.net/login](https://snapshots.bryanlabs.net/login)
2. Enter your premium credentials
3. You'll see a "Premium" badge in the navigation

### 3. Verification
Verify your premium status:
- Look for the "Premium" badge in the header
- Check download speeds on your first download
- View your account status at `/api/v1/auth/me`

## Premium Features in Detail

### High-Speed Downloads

#### Bandwidth Allocation
```
Free Tier:    50MB/s  (shared among all free users)
Premium Tier: 250MB/s (shared among premium users)
```

#### Real-World Performance
Typical download times for a 100GB snapshot:
- **Free Tier**: ~34 minutes (at maximum speed)
- **Premium Tier**: ~7 minutes (at maximum speed)

*Note: Actual speeds depend on number of concurrent users*

### Download Management

#### Resume Support
Premium downloads are fully resumable:
```bash
# Start download
wget -c https://snapshots.bryanlabs.net/download/cosmos/latest.tar.lz4

# If interrupted, resume with same command
wget -c https://snapshots.bryanlabs.net/download/cosmos/latest.tar.lz4
```

#### Concurrent Downloads
Premium users can download multiple snapshots simultaneously:
```bash
# Download multiple chains in parallel
aria2c -x 4 url1 url2 url3
```

### API Access

Premium users get enhanced API access:

#### Authentication
```bash
# Login via API
curl -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email", "password":"your-password"}'

# Returns authentication token
```

#### Automated Downloads
```bash
#!/bin/bash
# automated-snapshot.sh

# Login and save cookie
curl -c cookies.txt -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"$EMAIL", "password":"$PASSWORD"}'

# Get download URL
DOWNLOAD_URL=$(curl -b cookies.txt \
  -X POST https://snapshots.bryanlabs.net/api/v1/chains/cosmos/download \
  -H "Content-Type: application/json" \
  | jq -r .data.downloadUrl)

# Download with premium speed
wget -c "$DOWNLOAD_URL" -O cosmos-latest.tar.lz4
```

### Priority Support

Premium users receive:
- **Response time**: Within 24 hours (vs 72 hours)
- **Direct email support**: premium-support@bryanlabs.net
- **Priority issue resolution**
- **Custom snapshot requests** (for supported chains)

### Early Access

Get access to:
- New chain snapshots before public release
- Beta features and improvements
- Direct feedback channel to development team
- Influence on roadmap priorities

## Usage Best Practices

### Optimize Download Speed

#### 1. Use Multi-Connection Downloads
```bash
# aria2 with optimized settings for premium
aria2c -x 8 -s 8 -k 1M --file-allocation=none \
  --max-connection-per-server=8 \
  --min-split-size=1M \
  "https://snapshots.bryanlabs.net/download/cosmos/latest.tar.lz4"
```

#### 2. Schedule Large Downloads
- Download during off-peak hours for best speeds
- Use our API to check current bandwidth usage
- Set up automated downloads during quiet periods

#### 3. Geographic Considerations
- Our CDN automatically routes to nearest server
- Premium tier gets priority routing
- Contact support for region-specific optimizations

### Automation Examples

#### Daily Snapshot Sync
```bash
#!/bin/bash
# daily-sync.sh - Run via cron

CHAINS=("cosmos" "osmosis" "juno")
DOWNLOAD_DIR="/data/snapshots"

# Login once
AUTH_TOKEN=$(curl -s -X POST https://snapshots.bryanlabs.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'$EMAIL'", "password":"'$PASSWORD'"}' \
  | jq -r .token)

for chain in "${CHAINS[@]}"; do
  echo "Downloading $chain snapshot..."
  
  # Get latest snapshot info
  SNAPSHOT_INFO=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    https://snapshots.bryanlabs.net/api/v1/chains/$chain/snapshots \
    | jq -r '.data[0]')
  
  # Download if newer than local
  # ... download logic here
done
```

#### Health Check Integration
```python
# snapshot_monitor.py
import requests
import time

class SnapshotMonitor:
    def __init__(self, email, password):
        self.session = requests.Session()
        self.login(email, password)
    
    def login(self, email, password):
        response = self.session.post(
            'https://snapshots.bryanlabs.net/api/v1/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
    
    def check_snapshot_age(self, chain_id, max_age_hours=25):
        response = self.session.get(
            f'https://snapshots.bryanlabs.net/api/v1/chains/{chain_id}/snapshots'
        )
        latest = response.json()['data'][0]
        
        age = time.time() - latest['createdAt']
        if age > max_age_hours * 3600:
            self.alert(f"Snapshot for {chain_id} is {age/3600:.1f} hours old!")
```

## Premium Account Management

### Account Settings
Access your account settings:
1. Login to your account
2. Visit account dashboard (coming soon)
3. Manage preferences and settings

### Billing
- Monthly billing cycle
- Automatic renewal
- Update payment methods via support
- Request invoices for accounting

### Team Accounts
For organizations needing multiple users:
- Shared premium bandwidth pool
- User management dashboard
- Consolidated billing
- Usage analytics

## Comparison Table

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| Download Speed | 50MB/s shared | 250MB/s shared |
| Registration Required | No | Yes |
| Resume Support | Yes | Yes |
| Concurrent Downloads | Limited | Unlimited |
| API Access | Basic | Full |
| Support Response | 72 hours | 24 hours |
| Download History | No | Yes |
| Early Access | No | Yes |
| Custom Snapshots | No | Available |
| Price | Free | Contact us |

## FAQ

### Q: How do I upgrade to Premium?
A: Contact premium@bryanlabs.net with your desired username.

### Q: Can I share my account?
A: Premium accounts are for individual use. Team plans are available for organizations.

### Q: What happens if I exceed bandwidth?
A: Premium bandwidth is shared among premium users. You won't be cut off, but speeds may vary based on concurrent usage.

### Q: Can I cancel anytime?
A: Yes, you can cancel your subscription at any time. Access continues until the end of your billing period.

### Q: Do you offer trials?
A: Contact our sales team for trial options.

### Q: Are there download limits?
A: No, premium users have unlimited downloads within the shared bandwidth pool.

## Getting Help

### Premium Support Channels
- **Email**: premium-support@bryanlabs.net
- **Discord**: Premium channel access
- **Response Time**: Within 24 hours

### Common Premium Issues

#### "Not seeing premium speeds"
1. Verify you're logged in (check for Premium badge)
2. Check current bandwidth usage via API
3. Try multi-connection download tools
4. Contact support with download speeds

#### "Login not working"
1. Ensure cookies are enabled
2. Clear browser cache
3. Try incognito/private mode
4. Reset password via support

#### "Need custom snapshot"
1. Email request to premium-support@bryanlabs.net
2. Include chain details and requirements
3. Allow 48 hours for new chain setup

## Next Steps

- Set up [automated downloads](#automation-examples)
- Review [API documentation](/docs/api-reference/endpoints.md)
- Join premium Discord channel
- Contact support for onboarding assistance

Thank you for choosing BryanLabs Premium! We're committed to providing the fastest, most reliable snapshot service for your blockchain infrastructure needs.