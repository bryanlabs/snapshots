# Downloading and Using Snapshots

This guide covers everything you need to know about downloading and using blockchain snapshots from our service.

## Table of Contents
- [Download Methods](#download-methods)
- [Using Downloaded Snapshots](#using-downloaded-snapshots)
- [Extraction Guide](#extraction-guide)
- [Node Setup](#node-setup)
- [Verification](#verification)
- [Common Issues](#common-issues)

## Download Methods

### Web Browser Download
The simplest method for smaller snapshots:
1. Click the download button on the website
2. Save to your desired location
3. Browser will handle the download

**Pros**: Simple, no additional tools needed
**Cons**: Limited resume support, not ideal for large files

### Command Line with wget
Recommended for most users:
```bash
# Basic download
wget https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4

# With resume support
wget -c https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4

# With custom output name
wget -O cosmos-snapshot.tar.lz4 https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4
```

### Command Line with curl
Alternative to wget:
```bash
# Basic download
curl -O https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4

# With resume support
curl -C - -O https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4

# With progress bar
curl -# -O https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4
```

### Using aria2 (Recommended for Large Files)
Best performance with multi-connection support:
```bash
# Install aria2
sudo apt-get install aria2  # Debian/Ubuntu
sudo yum install aria2      # CentOS/RHEL
brew install aria2          # macOS

# Download with 4 connections
aria2c -x 4 -s 4 https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4

# With resume and retry
aria2c -c -x 4 -s 4 --retry-wait=30 --max-tries=10 https://snapshots.bryanlabs.net/download/[chain-id]/latest.tar.lz4
```

## Using Downloaded Snapshots

### Prerequisites
Before using a snapshot, ensure you have:
- Sufficient disk space (3x the compressed size)
- Decompression tool installed (LZ4 or ZST)
- Node binary installed and configured
- Stopped your node if it's running

### Install Decompression Tools

#### For LZ4 Compression
```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install lz4

# CentOS/RHEL
sudo yum install lz4

# macOS
brew install lz4

# Verify installation
lz4 --version
```

#### For ZST Compression
```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install zstd

# CentOS/RHEL
sudo yum install zstd

# macOS
brew install zstd

# Verify installation
zstd --version
```

## Extraction Guide

### 1. Stop Your Node
```bash
# Systemd
sudo systemctl stop cosmosd

# Or supervisor
sudo supervisorctl stop cosmosd

# Or screen/tmux
# Exit or kill the node process
```

### 2. Backup Current Data (Optional)
```bash
# Backup current state
cd $HOME
tar -czf backup-$(date +%Y%m%d).tar.gz .cosmos/
```

### 3. Clear Existing Data
```bash
# Remove old data (keep config and keys!)
cd $HOME/.cosmos/
rm -rf data/
```

### 4. Extract Snapshot

#### For LZ4 Files
```bash
# Navigate to data directory
cd $HOME/.cosmos/

# Extract LZ4 snapshot
lz4 -d /path/to/snapshot.tar.lz4 | tar -xf -

# Verify extraction
ls -la data/
```

#### For ZST Files
```bash
# Navigate to data directory
cd $HOME/.cosmos/

# Extract ZST snapshot
zstd -d /path/to/snapshot.tar.zst | tar -xf -

# Verify extraction
ls -la data/
```

### 5. Set Correct Permissions
```bash
# Ensure correct ownership
chown -R $(whoami):$(whoami) data/
```

## Node Setup

### 1. Update Configuration
Before starting with the snapshot, ensure your node configuration is correct:

```bash
# Edit config.toml
nano $HOME/.cosmos/config/config.toml

# Key settings to verify:
# - moniker
# - seeds/persistent_peers
# - pruning settings
```

### 2. Reset Node State
```bash
# Reset without deleting data
cosmosd tendermint unsafe-reset-all --home $HOME/.cosmos --keep-addr-book
```

### 3. Start Your Node
```bash
# Systemd
sudo systemctl start cosmosd
sudo journalctl -u cosmosd -f

# Or direct
cosmosd start --home $HOME/.cosmos
```

## Verification

### 1. Check Sync Status
```bash
# Check if node is syncing
cosmosd status | jq .SyncInfo

# Look for:
# - "catching_up": false (when fully synced)
# - "latest_block_height": should be increasing
```

### 2. Verify Block Height
```bash
# Get current height
cosmosd status | jq .SyncInfo.latest_block_height

# Compare with explorer
# Should be close to the network's current height
```

### 3. Monitor Logs
```bash
# Follow logs for any errors
sudo journalctl -u cosmosd -f --no-hostname --no-timestamp

# Look for:
# - "Executed block"
# - "Committed state"
# - No error messages
```

## Common Issues

### Issue: "No space left on device"
**Solution**: Ensure you have at least 3x the compressed snapshot size available
```bash
# Check available space
df -h

# Clean up if needed
du -sh $HOME/.cosmos/data/*
```

### Issue: "Permission denied"
**Solution**: Fix ownership and permissions
```bash
chown -R $(whoami):$(whoami) $HOME/.cosmos/
chmod -R 755 $HOME/.cosmos/data/
```

### Issue: "Wrong block height" or "AppHash mismatch"
**Solution**: The snapshot might be corrupted or for wrong network
```bash
# Clear and re-download
rm -rf $HOME/.cosmos/data/
# Re-extract snapshot
```

### Issue: Download keeps failing
**Solution**: Use a download manager with better resume support
```bash
# Use aria2 with aggressive retry
aria2c -c -x 4 -s 4 --retry-wait=30 --max-tries=100 [url]
```

### Issue: Extraction fails with "Unexpected end of file"
**Solution**: Snapshot download was incomplete
```bash
# Verify file size matches expected
ls -lh snapshot.tar.lz4

# Test archive integrity
lz4 -t snapshot.tar.lz4

# Re-download if corrupted
```

## Best Practices

### 1. Verify Before Extracting
Always verify the snapshot before extracting:

#### For LZ4 Files
```bash
# Test LZ4 archive
lz4 -t snapshot.tar.lz4

# List contents without extracting
lz4 -d snapshot.tar.lz4 | tar -tf - | head -20
```

#### For ZST Files
```bash
# Test ZST archive
zstd -t snapshot.tar.zst

# List contents without extracting
zstd -d snapshot.tar.zst | tar -tf - | head -20
```

### 2. Use Screen or Tmux
For long-running operations:
```bash
# Start screen session
screen -S snapshot

# Run extraction
lz4 -d snapshot.tar.lz4 | tar -xf -

# Detach: Ctrl+A, then D
# Reattach: screen -r snapshot
```

### 3. Monitor Progress
Track extraction progress:
```bash
# With pv (pipe viewer)
sudo apt-get install pv
lz4 -d snapshot.tar.lz4 | pv | tar -xf -
```

### 4. Automate with Scripts
Create a snapshot restore script:
```bash
#!/bin/bash
# restore-snapshot.sh

NODE_HOME="$HOME/.cosmos"
SNAPSHOT_URL="$1"

echo "Stopping node..."
sudo systemctl stop cosmosd

echo "Backing up current data..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz $NODE_HOME/data/

echo "Downloading snapshot..."
aria2c -c -x 4 "$SNAPSHOT_URL"

echo "Extracting snapshot..."
cd $NODE_HOME
rm -rf data/

# Detect compression type and extract
if ls *.tar.lz4 1> /dev/null 2>&1; then
    echo "Extracting LZ4 snapshot..."
    lz4 -d *.tar.lz4 | tar -xf -
elif ls *.tar.zst 1> /dev/null 2>&1; then
    echo "Extracting ZST snapshot..."
    zstd -d *.tar.zst | tar -xf -
else
    echo "No snapshot file found!"
    exit 1
fi

echo "Starting node..."
sudo systemctl start cosmosd

echo "Done! Check logs with: sudo journalctl -u cosmosd -f"
```

## Advanced Usage

### Partial Extraction
Extract only specific directories:

#### For LZ4 Files
```bash
# Extract only blockchain data
lz4 -d snapshot.tar.lz4 | tar -xf - data/blockchain.db

# Extract only state
lz4 -d snapshot.tar.lz4 | tar -xf - data/state.db
```

#### For ZST Files
```bash
# Extract only blockchain data
zstd -d snapshot.tar.zst | tar -xf - data/blockchain.db

# Extract only state
zstd -d snapshot.tar.zst | tar -xf - data/state.db
```

### Streaming Download and Extract
Download and extract simultaneously:

#### For LZ4 Files
```bash
# Requires sufficient bandwidth
curl -s [snapshot-url] | lz4 -d | tar -xf -
```

#### For ZST Files
```bash
# Requires sufficient bandwidth
curl -s [snapshot-url] | zstd -d | tar -xf -
```

### Parallel Extraction
For faster extraction on multi-core systems:

#### For ZST Files (supports multi-threading)
```bash
# ZST supports native multi-threading
zstd -d -T0 snapshot.tar.zst | tar -xf -
# -T0 uses all available CPU cores
```

#### For LZ4 Files
```bash
# LZ4 doesn't support multi-threading for decompression
# But tar extraction can be optimized
lz4 -d snapshot.tar.lz4 | tar -xf -
```

## Next Steps

- Review [Premium Features](./premium-features.md) for faster downloads
- Check [API Documentation](/docs/api-reference/endpoints.md) for automation
- Join our [Discord](https://discord.gg/bryanlabs) for support

## Need Help?

If you encounter issues not covered here:
1. Check our [FAQ](#)
2. Search [GitHub Issues](https://github.com/bryanlabs/snapshots/issues)
3. Contact support@bryanlabs.net
4. Join our Discord community