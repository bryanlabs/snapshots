# Real-time Updates Implementation

This document describes the real-time update functionality implemented to fix the snapshot refresh issue.

## Overview

We've implemented real-time updates using React Query (TanStack Query) to automatically refresh snapshot and chain data without requiring manual page refreshes. This ensures users always see the latest snapshots as they become available.

## Implementation Details

### 1. React Query Setup

Added React Query provider to the application:
- **File**: `components/providers/query-provider.tsx`
- **Configuration**:
  - Stale time: 30 seconds (data considered fresh)
  - Cache time: 5 minutes (data stays in cache after unmount)
  - Refetch on window focus: Enabled
  - Refetch on reconnect: Enabled

### 2. Real-time Components

#### SnapshotListRealtime
- **File**: `components/snapshots/SnapshotListRealtime.tsx`
- **Features**:
  - Polls for new snapshots every 30 seconds
  - Shows refresh indicator when updating
  - Manual refresh button with loading state
  - Maintains UI state during updates

#### ChainListRealtime
- **File**: `components/chains/ChainListRealtime.tsx`
- **Features**:
  - Polls for chain updates every 60 seconds
  - Keyboard shortcut 'R' for manual refresh
  - Visual feedback during updates

### 3. React Query Hooks

#### useSnapshotsQuery
- **File**: `hooks/useSnapshotsQuery.ts`
- **Purpose**: Fetches snapshots for a specific chain
- **Default poll interval**: 30 seconds

#### useChainsQuery
- **File**: `hooks/useChainsQuery.ts`
- **Purpose**: Fetches all available chains
- **Default poll interval**: 60 seconds

## User Experience Improvements

1. **Automatic Updates**: Data refreshes automatically in the background
2. **Visual Feedback**: Spinning refresh icon shows when data is updating
3. **Manual Control**: Users can trigger immediate refresh with button or keyboard shortcut
4. **Seamless Updates**: Previous data remains visible while fetching new data
5. **Configurable Intervals**: Poll intervals can be adjusted per component

## Configuration

Poll intervals can be adjusted in the component props:

```tsx
// For snapshots (30 second default)
<SnapshotListRealtime 
  chainId={chain.id}
  initialSnapshots={snapshots}
  pollInterval={30000} // milliseconds
/>

// For chains (60 second default)
<ChainListRealtime 
  initialChains={chains}
  pollInterval={60000} // milliseconds
/>
```

## Performance Considerations

- Initial data is server-rendered for fast first paint
- Subsequent updates happen client-side
- React Query deduplicates requests across components
- Background refetching doesn't block UI
- Cached data reduces unnecessary API calls

## Testing

To verify real-time updates are working:

1. Open the chain detail page
2. Look for the refresh indicator (top-right of snapshot list)
3. Wait 30 seconds or click the refresh button
4. New snapshots should appear without page refresh

## Future Enhancements

1. **WebSocket Support**: Replace polling with WebSocket for instant updates
2. **Server-Sent Events**: Alternative to WebSocket for real-time push
3. **Optimistic Updates**: Show pending snapshots immediately
4. **Differential Updates**: Only fetch changed data
5. **User Preferences**: Allow users to configure refresh intervals