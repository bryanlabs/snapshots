import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, prisma, generateTestEmail } from './setup';
import bcrypt from 'bcryptjs';

// Mock NextAuth
jest.mock('../../auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Import route handlers
import { POST as registerHandler } from '../../app/api/auth/register/route';
import { DELETE as deleteAccountHandler } from '../../app/api/auth/delete-account/route';

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up users created in tests
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user with valid data', async () => {
      const email = generateTestEmail();
      const requestData = {
        email,
        password: 'securepass123',
        displayName: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User created successfully');
      expect(data.userId).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email },
        include: { personalTier: true },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.displayName).toBe('Test User');
      expect(user?.personalTier?.name).toBe('free');
      expect(await bcrypt.compare('securepass123', user?.passwordHash || '')).toBe(true);
    });

    it('should reject duplicate email addresses', async () => {
      const email = generateTestEmail();
      
      // Create first user
      await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash('password', 10),
          personalTierId: 'free-tier-test',
        },
      });

      // Try to create duplicate
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'password123',
        }),
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should reject invalid email format', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should reject short passwords', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: generateTestEmail(),
          password: 'short',
        }),
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should use email prefix as displayName if not provided', async () => {
      const email = 'johndoe@example.com';
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'password123',
        }),
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user?.displayName).toBe('johndoe');
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    it('should delete authenticated user account', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: generateTestEmail(),
          passwordHash: await bcrypt.hash('password', 10),
          personalTierId: 'free-tier-test',
        },
      });

      // Mock auth to return user
      const { auth } = require('../../auth');
      auth.mockResolvedValue({
        user: { id: user.id },
      });

      const request = new Request('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
      });

      const response = await deleteAccountHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Account deleted successfully');

      // Verify user was deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { auth } = require('../../auth');
      auth.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
      });

      const response = await deleteAccountHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Legacy Auth API', () => {
    it('should support legacy login endpoint', async () => {
      // This would test the legacy /api/v1/auth/login endpoint
      // Implementation depends on whether you want to keep legacy support
    });
  });
});