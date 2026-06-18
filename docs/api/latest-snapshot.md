# Latest Snapshot API

## Overview

The latest snapshot endpoint returns the newest published archive for a
canonical chain and generates an nginx secure-link download URL.

The current public snapshot service advertises three chains:

```text
cosmoshub-4
noble-1
osmosis-1
```

LevelDB and PebbleDB are database variants under each canonical chain. They are
not separate public chains.

## Endpoint

```text
GET /api/v1/chains/{chainId}/snapshots/latest
```

`chainId` may be either the canonical chain id or a storage variant id. For
example, `cosmoshub-4-pebble` is canonicalized to `cosmoshub-4` before listing
snapshots.

## Query Parameters

- `database`: optional database filter. Accepted values are `leveldb`,
  `goleveldb`, `pebble`, or `pebbledb`.
- `include_previous`: set to `true` to include up to two older official
  candidates. These are useful as fallback options, but the latest artifact is
  usually the right default.

## Authentication

Authentication is optional.

- Free users can call the endpoint without a bearer token.
- Premium or unlimited sessions receive longer-lived secure links.

## Success Response

```json
{
  "success": true,
  "data": {
    "chain_id": "cosmoshub-4",
    "height": 31552799,
    "size": 120000000000,
    "compression": "zst",
    "url": "https://snapshots.bryanlabs.net/snapshots/cosmoshub-4-pebble/cosmoshub-4-pebble-31552799-20260613-000007.tar.zst?...",
    "expires_at": "2026-06-13T01:00:00.000Z",
    "tier": "free",
    "database_backend": "pebbledb",
    "database_label": "PebbleDB",
    "commands": {
      "curl": "curl -L -C - -O \"https://snapshots.bryanlabs.net/...\"",
      "aria2c": "aria2c -c -x 8 -s 8 -k 1M --file-allocation=none \"https://snapshots.bryanlabs.net/...\""
    },
    "latest": {
      "id": "cosmoshub-4-pebble:cosmoshub-4-pebble-31552799-20260613-000007.tar.zst",
      "chain_id": "cosmoshub-4",
      "storage_chain_id": "cosmoshub-4-pebble",
      "file_name": "cosmoshub-4-pebble-31552799-20260613-000007.tar.zst",
      "height": 31552799,
      "size": 120000000000,
      "compression": "zst",
      "url": "https://snapshots.bryanlabs.net/...",
      "expires_at": "2026-06-13T01:00:00.000Z",
      "tier": "free",
      "database_backend": "pebbledb",
      "database_label": "PebbleDB",
      "commands": {
        "curl": "curl -L -C - -O \"https://snapshots.bryanlabs.net/...\"",
        "aria2c": "aria2c -c -x 8 -s 8 -k 1M --file-allocation=none \"https://snapshots.bryanlabs.net/...\""
      }
    },
    "previous": []
  },
  "message": "Latest snapshot URL generated successfully"
}
```

## Response Fields

- `chain_id`: Canonical chain id. For Cosmos Hub this is always
  `cosmoshub-4`.
- `height`: Block height parsed from the published archive name.
- `size`: Archive size in bytes.
- `compression`: Archive compression type.
- `url`: Time-limited nginx secure-link download URL.
- `expires_at`: ISO 8601 expiration time for the generated URL.
- `tier`: Access tier used for the generated URL.
- `database_backend`: Database backend for the returned archive, such as
  `goleveldb` or `pebbledb`.
- `database_label`: Human-readable database label, such as `LevelDB` or
  `PebbleDB`.
- `commands`: ready-to-run resumable download commands for the top-level
  returned URL.
- `latest`: structured details for the same latest artifact. This is the
  preferred field for new clients.
- `previous`: older official artifacts when `include_previous=true`; otherwise
  an empty array.

## Error Responses

### 404 Not Found

```json
{
  "success": false,
  "error": "No snapshots found",
  "message": "No snapshots available for chain cosmoshub-4"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to generate snapshot URL",
  "message": "Error details..."
}
```

## Examples

Latest snapshot across all Cosmos Hub database variants:

```bash
curl -fsS https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots/latest | jq .
```

Latest LevelDB snapshot plus previous LevelDB candidates:

```bash
curl -fsS "https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots/latest?database=leveldb&include_previous=true" | jq .
```

Latest PebbleDB snapshot plus previous PebbleDB candidates:

```bash
curl -fsS "https://snapshots.bryanlabs.net/api/v1/chains/osmosis-1/snapshots/latest?database=pebbledb&include_previous=true" | jq .
```

List all published Cosmos Hub snapshots, including database fields:

```bash
curl -fsS https://snapshots.bryanlabs.net/api/v1/chains/cosmoshub-4/snapshots | jq .
```

## Notes

- The latest endpoint returns the most recently modified snapshot across the
  configured storage variants for the canonical chain unless `database` is set.
- The `previous` list is a fallback list. Retention may rotate old artifacts,
  so start the download soon after generating the signed URL and prefer
  resumable clients such as `aria2c` or `curl -C -`.
- The archive height is expected to be nonzero and present in the archive
  filename.
- Snapshot metadata sidecars are written by the processor and should report
  `height_source: cometbft-blockstore`.
- Current Cosmos Hub snapshots are `.tar.zst` archives compressed with zstd
  level 12.
- Download URLs use nginx secure links. Do not log or publish full signed URLs.
