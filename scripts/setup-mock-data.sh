#!/bin/bash

# Create sample files with some content (1MB each for testing)
echo "Creating mock snapshot files..."

# Cosmos Hub snapshots
dd if=/dev/zero of=mock-data/cosmos/cosmoshub-4-15234567.tar.lz4 bs=1M count=1 2>/dev/null
dd if=/dev/zero of=mock-data/cosmos/cosmoshub-4-15200000.tar.lz4 bs=1M count=1 2>/dev/null
dd if=/dev/zero of=mock-data/cosmos/cosmoshub-4-archive-15234567.tar.lz4 bs=1M count=2 2>/dev/null

# Osmosis snapshots  
dd if=/dev/zero of=mock-data/osmosis/osmosis-1-12345678.tar.lz4 bs=1M count=1 2>/dev/null
dd if=/dev/zero of=mock-data/osmosis/osmosis-1-12300000.tar.lz4 bs=1M count=1 2>/dev/null

# Juno snapshots
dd if=/dev/zero of=mock-data/juno/juno-1-9876543.tar.lz4 bs=1M count=1 2>/dev/null
dd if=/dev/zero of=mock-data/juno/juno-1-9850000.tar.lz4 bs=1M count=1 2>/dev/null

echo "Mock data created successfully!"