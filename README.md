# Blockchain Snapshots Service

A production-grade blockchain snapshot hosting service providing reliable, bandwidth-managed access to blockchain snapshots with tiered user system. Built with Next.js, MinIO, and deployed on Kubernetes.

## 🚀 Overview

The Blockchain Snapshots Service provides high-speed access to blockchain node snapshots for the Cosmos ecosystem. It features:

- **Tiered Access**: Free tier (50MB/s shared) and Premium tier (250MB/s shared)
- **Resume Support**: Interrupted downloads can be resumed
- **Real-time Monitoring**: Prometheus metrics and Grafana dashboards
- **High Availability**: Redundant deployments with automatic failover
- **Security**: JWT authentication, pre-signed URLs, and IP restrictions

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Key Features

### Core Functionality
- **Multiple Chain Support**: Host snapshots for 30+ Cosmos chains
- **Bandwidth Management**: Dynamic per-connection bandwidth allocation
- **Download Resume**: Support for interrupted download resumption
- **Real-time Updates**: Daily snapshot updates with automated sync
- **Compression Options**: LZ4 compressed snapshots for faster downloads

### User Experience
- **Instant Access**: No registration required for free tier
- **Premium Tier**: 5x faster downloads for authenticated users
- **Search & Filter**: Find snapshots by chain name or network
- **Download Progress**: Real-time download statistics
- **Mobile Responsive**: Optimized for all device sizes

### Technical Features
- **Pre-signed URLs**: Secure, time-limited download links
- **Rate Limiting**: Prevent abuse with configurable limits
- **Health Checks**: Automated monitoring and alerting
- **Metrics Export**: Prometheus-compatible metrics
- **GitOps Ready**: Kubernetes manifests for easy deployment

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **React 19**: Latest React features
- **Inter Font**: Professional typography

### Backend
- **Next.js API Routes**: Full-stack capabilities
- **MinIO**: S3-compatible object storage
- **JWT**: Secure authentication
- **Prometheus**: Metrics collection
- **Node.js 20**: Runtime environment

### Infrastructure
- **Kubernetes**: Container orchestration
- **TopoLVM**: Dynamic volume provisioning
- **HAProxy**: Load balancing
- **Grafana**: Metrics visualization
- **GitHub Actions**: CI/CD pipeline

## 🏗️ Architecture

### High-Level Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│   MinIO     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Prometheus  │     │  TopoLVM    │
                    └─────────────┘     └─────────────┘
```

### Component Interaction
1. User browses available snapshots via Next.js frontend
2. Authentication checked for tier determination
3. Pre-signed URL generated with bandwidth metadata
4. Direct download from MinIO with rate limiting
5. Metrics collected for monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Docker (for MinIO development)
- Kubernetes cluster (for production)

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/bryanlabs/snapshots.git
   cd snapshots
   ```

2. **Create mock data**
   ```bash
   ./scripts/setup-mock-data.sh
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: [http://localhost:3000](http://localhost:3000)
   - MinIO Console: [http://localhost:9001](http://localhost:9001) (admin/minioadmin)

5. **Test premium login**
   - Username: `premium_user`
   - Password: `premium123`

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start MinIO (Docker)**
   ```bash
   docker run -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /data --console-address ":9001"
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 💻 Development

### Project Structure
```
snapshots/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── chains/            # Chain pages
│   ├── login/             # Auth pages
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities and helpers
├── hooks/                 # Custom React hooks
├── __tests__/            # Test files
├── docs/                  # Documentation
└── public/               # Static assets
```

### Environment Variables
```bash
# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Authentication
JWT_SECRET=your-secret-key
PREMIUM_USERNAME=premium_user
PREMIUM_PASSWORD_HASH=$2a$10$...

# Bandwidth Limits (MB/s)
BANDWIDTH_FREE_TOTAL=50
BANDWIDTH_PREMIUM_TOTAL=250

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
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

# Format code
npm run format
```

## 📚 API Reference

See [API Routes Documentation](./API_ROUTES.md) for detailed endpoint information.

### Quick Reference
- `GET /api/health` - Health check
- `GET /api/v1/chains` - List all chains
- `GET /api/v1/chains/[chainId]/snapshots` - List snapshots
- `POST /api/v1/chains/[chainId]/download` - Generate download URL
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/auth/me` - Current user info

## 🧪 Testing

### Test Structure
```
__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── integration/      # Integration tests
└── e2e/             # End-to-end tests
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
```

### Writing Tests
```typescript
// Example API test
describe('Download API', () => {
  it('should generate URL for free tier', async () => {
    const response = await request(app)
      .post('/api/v1/chains/cosmos-hub/download')
      .send({ filename: 'latest.tar.lz4' })
      
    expect(response.status).toBe(200)
    expect(response.body.tier).toBe('free')
  })
})
```

## 🚢 Deployment

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t snapshots-app .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f app
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

### Docker Hub / GitHub Container Registry

The CI/CD pipeline automatically builds and pushes images to GitHub Container Registry:

```bash
# Pull the latest image
docker pull ghcr.io/bryanlabs/snapshots:latest

# Run the container
docker run -p 3000:3000 \
  --env-file .env.local \
  ghcr.io/bryanlabs/snapshots:latest
```

### Kubernetes Deployment

1. **Create namespace**
   ```bash
   kubectl create namespace apps
   ```

2. **Apply configurations**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods -n apps
   kubectl get svc -n apps
   ```

### CI/CD Pipeline
The project uses GitHub Actions for automated deployment:
- Tests run on every push
- Docker images built and pushed to registry
- Kubernetes manifests updated automatically
- Rollback capability for failed deployments

## 📊 Monitoring

### Metrics Collection
The service exports Prometheus metrics:
- Request counts and latencies
- Download statistics by tier
- Bandwidth usage metrics
- Error rates and types

### Grafana Dashboards
Pre-built dashboards available in `docs/grafana/`:
- Service Overview
- Bandwidth Usage
- User Analytics
- Error Tracking

### Alerts
Configured alerts for:
- High error rates
- Bandwidth limit exceeded
- Storage capacity low
- Service unavailability

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
- Polkachu for snapshot data integration
- Cosmos ecosystem for blockchain technology
- Open source contributors

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/bryanlabs/snapshots/issues)
- **Discord**: [BryanLabs Discord](https://discord.gg/bryanlabs)
- **Email**: support@bryanlabs.net
