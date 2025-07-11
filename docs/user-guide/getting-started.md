# Getting Started with Blockchain Snapshots

Welcome to the BryanLabs Blockchain Snapshots service! This guide will help you get started with downloading blockchain snapshots for your nodes.

## What are Blockchain Snapshots?

Blockchain snapshots are point-in-time copies of blockchain data that allow you to quickly sync a new node without downloading the entire blockchain history from genesis. This can save days or even weeks of synchronization time.

## Service Overview

Our service provides:
- **Daily updated snapshots** for 30+ Cosmos ecosystem chains
- **LZ4 compressed files** for faster downloads and reduced bandwidth
- **Two access tiers**: Free (50MB/s shared) and Premium (250MB/s shared)
- **Resume support** for interrupted downloads
- **Global CDN delivery** for consistent speeds worldwide

## Quick Start

### 1. Browse Available Chains

Visit [https://snapshots.bryanlabs.net](https://snapshots.bryanlabs.net) to see all available blockchain snapshots.

### 2. Find Your Chain

Use the search bar to quickly find your desired blockchain. You can search by:
- Chain name (e.g., "Cosmos Hub")
- Chain ID (e.g., "cosmoshub-4")
- Network name

### 3. View Snapshot Details

Click on any chain to see:
- Latest snapshot information
- Block height
- File size
- Creation timestamp
- Download options

### 4. Download Snapshot

#### Free Tier (No Registration Required)
1. Click the "Download" button
2. You'll see a notice about the free tier speed limit (50MB/s shared)
3. Confirm to start the download

#### Premium Tier (5x Faster)
1. Click "Login" in the top navigation
2. Enter your premium credentials
3. Download at 250MB/s shared bandwidth

## Access Tiers

### Free Tier
- **Speed**: 50MB/s shared among all free users
- **Access**: No registration required
- **Ideal for**: Testing, development, occasional use

### Premium Tier
- **Speed**: 250MB/s shared among premium users (5x faster)
- **Access**: Login required
- **Benefits**: 
  - Priority bandwidth allocation
  - Faster download speeds
  - Download history tracking
  - Priority support

## Download Best Practices

### 1. Use a Download Manager
For large files, we recommend using a download manager that supports resume:
- **wget**: `wget -c [download-url]`
- **curl**: `curl -C - -O [download-url]`
- **aria2**: `aria2c -c [download-url]`

### 2. Verify Downloads
Always verify the integrity of downloaded snapshots:
```bash
# Check file size matches expected
ls -lh snapshot.tar.lz4

# Extract and verify
lz4 -d snapshot.tar.lz4 | tar -tf - > /dev/null
```

### 3. Plan for Storage
Ensure you have sufficient disk space:
- Compressed snapshot size (what you download)
- Extracted size (typically 2-3x larger)
- Additional space for blockchain growth

## Browser Compatibility

Our service works best with:
- Chrome/Edge (latest versions)
- Firefox (latest version)
- Safari (latest version)
- Mobile browsers (responsive design)

## Troubleshooting

### Download Starts but Fails
- Check your internet connection stability
- Use a download manager with resume support
- Try downloading during off-peak hours

### Slow Download Speeds
- Free tier bandwidth is shared among all users
- Consider upgrading to Premium for guaranteed faster speeds
- Check your local internet connection speed

### Can't Find Your Chain
- Use the search function
- Check if the chain name has changed
- Contact support if the chain should be available

## Next Steps

- [Learn how to use downloaded snapshots](./downloading-snapshots.md)
- [Explore premium features](./premium-features.md)
- [View API documentation](/docs/api-reference/endpoints.md)

## Support

Need help? We're here to assist:
- **Email**: support@bryanlabs.net
- **Discord**: [BryanLabs Discord](https://discord.gg/bryanlabs)
- **GitHub**: [Issue Tracker](https://github.com/bryanlabs/snapshots/issues)