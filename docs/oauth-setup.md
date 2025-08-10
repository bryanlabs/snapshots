# OAuth Setup Guide

This guide explains how to enable Google and GitHub OAuth authentication for the Snapshots application.

## Current Status
- OAuth code is prepared but buttons are currently disabled
- Email/password and Keplr wallet authentication are working
- OAuth can be enabled by adding the required credentials

## Google OAuth Setup

### Step 1: Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Authorized JavaScript origins**:
     ```
     https://snapshots.bryanlabs.net
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     https://snapshots.bryanlabs.net/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google
     ```

### Step 2: Add to Environment
Add these to your `.env.local` or Kubernetes secrets:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## GitHub OAuth Setup

### Step 1: Create OAuth App
1. Go to GitHub Settings → [Developer settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Configure:
   - **Application name**: BryanLabs Snapshots
   - **Homepage URL**: https://snapshots.bryanlabs.net
   - **Authorization callback URL**: https://snapshots.bryanlabs.net/api/auth/callback/github

### Step 2: Add to Environment
Add these to your `.env.local` or Kubernetes secrets:
```env
GITHUB_CLIENT_ID=your-client-id-here
GITHUB_CLIENT_SECRET=your-client-secret-here
```

## Kubernetes Deployment

To add OAuth credentials to the webapp deployment:

1. Update the webapp secrets:
```bash
kubectl edit secret webapp-secrets -n fullnodes
```

2. Add the base64-encoded values:
```yaml
data:
  GOOGLE_CLIENT_ID: <base64-encoded-value>
  GOOGLE_CLIENT_SECRET: <base64-encoded-value>
  GITHUB_CLIENT_ID: <base64-encoded-value>
  GITHUB_CLIENT_SECRET: <base64-encoded-value>
```

3. Update the deployment to include these environment variables

## Enabling OAuth in Code

The OAuth providers are already configured in the code but need the environment variables to activate. Once credentials are added:

1. The Google and GitHub buttons will automatically enable
2. Users can sign in with their Google or GitHub accounts
3. New accounts will be created automatically on first sign-in

## Testing

To test OAuth locally:
1. Add credentials to `.env.local`
2. Run `npm run dev`
3. Navigate to http://localhost:3000/auth/signin
4. Try signing in with Google or GitHub

## Notes
- OAuth users don't need to set a password
- Email from OAuth provider will be used as the account email
- Display name will be pulled from the OAuth provider profile
- Users can link multiple auth methods to the same account (future feature)