# Blockchain Snapshots Service

A production-grade blockchain snapshot hosting service providing reliable, bandwidth-managed access to blockchain snapshots with tiered user system. Built with Next.js 15, nginx storage backend, and deployed on Kubernetes.

## 🚀 Overview

The Blockchain Snapshots Service provides high-speed access to blockchain node snapshots for the Cosmos ecosystem. It features:

- **Tiered Access**: Free tier (50 Mbps shared) and Premium tier (250 Mbps shared)
- **Multiple Authentication**: Email/password and Cosmos wallet (Keplr) authentication
- **Compression Support**: Both ZST and LZ4 compressed snapshots
- **Resume Support**: Interrupted downloads can be resumed
- **Real-time Monitoring**: Prometheus metrics and Grafana dashboards
- **High Availability**: Redundant deployments with automatic failover
- **Security**: NextAuth.js authentication, secure download links, and IP restrictions

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Integration with Snapshot Processor](#-integration-with-snapshot-processor)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Key Features

### Core Functionality
- **Multiple Chain Support**: Host snapshots for 30+ Cosmos chains
- **Dual Compression**: Support for both ZST and LZ4 compressed snapshots
- **Bandwidth Management**: Dynamic per-connection bandwidth allocation
- **Download Resume**: Support for interrupted download resumption
- **Real-time Updates**: Automated snapshot processing via snapshot-processor
- **User Management**: Full account system with profile, billing, and download history

### User Experience
- **Instant Access**: No registration required for free tier
- **Premium Tier**: 5x faster downloads for authenticated users
- **Multiple Auth Methods**: Email/password or Cosmos wallet authentication
- **Search & Filter**: Find snapshots by chain name, type, or compression
- **Download Progress**: Real-time download statistics
- **Mobile Responsive**: Optimized for all device sizes

### Technical Features
- **Secure Downloads**: Time-limited download URLs with nginx secure_link module
- **Rate Limiting**: Prevent abuse with configurable limits
- **Health Checks**: Automated monitoring and alerting
- **Metrics Export**: Prometheus-compatible metrics
- **GitOps Ready**: Kubernetes manifests managed in bare-metal repository

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **React 19**: Latest React features
- **NextAuth.js v5**: Authentication system

### Backend
- **Next.js API Routes**: Full-stack capabilities
- **Nginx**: Static file storage with secure_link module
- **Prisma ORM**: Database management
- **SQLite**: User and session storage
- **Redis**: Session caching and rate limiting
- **JWT**: API authentication

### Infrastructure
- **Kubernetes**: Container orchestration
- **TopoLVM**: Dynamic volume provisioning
- **Snapshot Processor**: Go-based automated snapshot processing
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **GitHub Actions**: CI/CD pipeline

## 🏗️ Architecture

### High-Level Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│   Nginx     │◀────│  Snapshot   │
└─────────────┘     │  Web App    │     │  Storage    │     │  Processor  │
                    └─────────────┘     └─────────────┘     └─────────────┘
                            │                    │                    │
                            ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │   SQLite    │     │  TopoLVM    │     │ Kubernetes  │
                    │  Database   │     │   Storage   │     │    Jobs     │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

### Component Interaction
1. **User browses** available snapshots via Next.js frontend
2. **Authentication** checked via NextAuth.js for tier determination
3. **Snapshot data** fetched from nginx autoindex API
4. **Download URLs** generated with nginx secure_link module
5. **Direct download** from nginx with bandwidth management
6. **Metrics** collected for monitoring and analytics
7. **Snapshot creation** handled by separate snapshot-processor service

### Integration with Snapshot Processor
The web app works in conjunction with the [snapshot-processor](https://github.com/bryanlabs/snapshot-processor):
- **Processor creates** snapshots on schedule or request
- **Compresses** with ZST or LZ4 based on configuration
- **Uploads** to nginx storage at `/snapshots/[chain-id]/`
- **Web app displays** available snapshots from nginx
- **Users download** directly from nginx storage

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Docker (for development database)
- Kubernetes cluster (for production)

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/bryanlabs/snapshots.git
   cd snapshots
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize database**
   ```bash
   ./scripts/init-db-proper.sh
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Test Accounts
- **Email**: test@example.com
- **Password**: snapshot123

## 💻 Development

### Project Structure
```
snapshots/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── account/       # Account management
│   │   ├── admin/         # Admin endpoints
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── v1/            # Public API v1
│   │   └── health         # Health checks
│   ├── (auth)/            # Auth pages layout
│   ├── (public)/          # Public pages layout
│   ├── account/           # User account pages
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── auth/             # Authentication logic
│   ├── nginx/            # Nginx storage client
│   └── bandwidth/        # Bandwidth management
├── prisma/               # Database schema
├── __tests__/            # Test files
├── docs/                 # Documentation
└── public/              # Static assets
```

### Environment Variables
```bash
# Nginx Storage Configuration
NGINX_ENDPOINT=nginx
NGINX_PORT=32708
NGINX_USE_SSL=false
NGINX_EXTERNAL_URL=https://snapshots.bryanlabs.net
SECURE_LINK_SECRET=your-secure-link-secret

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://snapshots.bryanlabs.net
DATABASE_URL=file:/app/prisma/dev.db

# Legacy Auth (for API compatibility)
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=$2a$10$...

# Bandwidth Limits (Mbps)
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Download Limits
DAILY_DOWNLOAD_LIMIT=10

# API Configuration
NEXT_PUBLIC_API_URL=https://snapshots.bryanlabs.net
```

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database commands
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open database GUI
npx prisma generate       # Generate Prisma client
```

## 📚 API Reference

See [API Routes Documentation](./API_ROUTES.md) for detailed endpoint information.

### Public API (v1)
- `GET /api/v1/chains` - List all chains with snapshots
- `GET /api/v1/chains/[chainId]` - Get chain details
- `GET /api/v1/chains/[chainId]/snapshots` - List chain snapshots
- `GET /api/v1/chains/[chainId]/snapshots/latest` - Get latest snapshot
- `POST /api/v1/chains/[chainId]/download` - Generate download URL
- `POST /api/v1/auth/login` - Legacy JWT authentication
- `POST /api/v1/auth/wallet` - Wallet authentication

### NextAuth API
- `POST /api/auth/signin` - Sign in with credentials or wallet
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `POST /api/auth/register` - Register new account

### Account API
- `GET /api/account/avatar` - Get user avatar
- `POST /api/account/link-email` - Link email to wallet account

### Admin API
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/downloads` - Download analytics

## 🧪 Testing

### Test Structure
```
__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── integration/      # Integration tests
└── lib/             # Library tests
```

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests (requires running app)
npm run test:e2e

# Test coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

## 🚢 Deployment

### Kubernetes Deployment

The application is deployed as part of the BryanLabs bare-metal infrastructure:

1. **Repository Structure**
   ```
   bare-metal/
   └── cluster/
       └── chains/
           └── cosmos/
               └── fullnode/
                   └── snapshot-service/
                       └── webapp/
                           ├── deployment.yaml
                           ├── configmap.yaml
                           ├── secrets.yaml
                           ├── pvc.yaml
                           └── kustomization.yaml
   ```

2. **Deploy with Kustomize**
   ```bash
   cd /path/to/bare-metal
   kubectl apply -k cluster
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods -n fullnodes -l app=webapp
   kubectl get svc -n fullnodes webapp
   ```

### Docker Build

```bash
# Build for production (AMD64)
docker buildx build --builder cloud-bryanlabs-builder \
  --platform linux/amd64 \
  -t ghcr.io/bryanlabs/snapshots:v1.5.0 \
  --push .

# Build for local testing
docker build -t snapshots:local .
```

### CI/CD Pipeline
The project uses GitHub Actions for automated deployment:
- Tests run on every push
- Docker images built and pushed to GitHub Container Registry
- Kubernetes manifests in bare-metal repo updated
- Automatic rollback on failure

## 📊 Monitoring

### Health Checks
- `/api/health` - Application health status
- Kubernetes liveness/readiness probes configured
- Database connection monitoring
- Nginx storage availability checks

### Metrics Collection
The service exports Prometheus metrics at `/api/metrics`:
- Request counts and latencies
- Download statistics by tier and chain
- Bandwidth usage metrics
- Authentication success/failure rates
- Database query performance

### Grafana Dashboards
Pre-built dashboards available:
- Service Overview
- User Analytics
- Download Statistics
- Error Tracking
- Performance Metrics

## 🔗 Integration with Snapshot Processor

The web app displays snapshots created by the [snapshot-processor](https://github.com/bryanlabs/snapshot-processor):

### How it Works
1. **Processor Configuration** defines snapshot schedules per chain
2. **Processor creates** VolumeSnapshots on schedule
3. **Processor compresses** snapshots (ZST or LZ4)
4. **Processor uploads** to nginx storage at `/snapshots/[chain-id]/`
5. **Web app reads** nginx autoindex to list available snapshots
6. **Web app generates** secure download URLs for users

### File Naming Convention
- Scheduled: `[chain-id]-[YYYYMMDD]-[HHMMSS].tar.[compression]`
- On-demand: `[chain-id]-[block-height].tar.[compression]`
- Examples: 
  - `noble-1-20250722-174634.tar.zst`
  - `osmosis-1-12345678.tar.lz4`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write meaningful commit messages
- Add JSDoc comments for public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- BryanLabs team for infrastructure support
- Cosmos ecosystem for blockchain technology
- Open source contributors

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/bryanlabs/snapshots/issues)
- **Discord**: [BryanLabs Discord](https://discord.gg/bryanlabs)
- **Email**: support@bryanlabs.net