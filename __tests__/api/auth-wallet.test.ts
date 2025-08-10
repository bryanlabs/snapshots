import { NextRequest } from 'next/server';

// Mock NextAuth before any imports
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Import after mocks
import { POST } from '@/app/api/v1/auth/wallet/route';
import { signIn } from '@/auth';

describe('/api/v1/auth/wallet', () => {
  let mockSignIn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn = signIn as jest.Mock;
  });

  describe('POST', () => {
    it('should authenticate with valid wallet credentials', async () => {
      mockSignIn.mockResolvedValue(undefined); // Success

      const body = {
        walletAddress: 'cosmos1abc123def456',
        signature: 'valid-signature-string',
        message: 'Sign this message to authenticate',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith('wallet', {
        walletAddress: 'cosmos1abc123def456',
        signature: 'valid-signature-string',
        message: 'Sign this message to authenticate',
        redirect: false,
      });
    });

    it('should return 400 for missing walletAddress', async () => {
      const body = {
        signature: 'valid-signature-string',
        message: 'Sign this message',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should return 400 for missing signature', async () => {
      const body = {
        walletAddress: 'cosmos1abc123def456',
        message: 'Sign this message',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should return 400 for missing message', async () => {
      const body = {
        walletAddress: 'cosmos1abc123def456',
        signature: 'valid-signature-string',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should return 400 for empty string fields', async () => {
      const body = {
        walletAddress: '',
        signature: '',
        message: '',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should return 401 when signIn throws error', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid signature'));

      const body = {
        walletAddress: 'cosmos1abc123def456',
        signature: 'invalid-signature',
        message: 'Sign this message',
      };
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // Mock request.json() method
      request.json = jest.fn().mockResolvedValue(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication failed');
      expect(mockSignIn).toHaveBeenCalled();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });
      
      // Mock request.json() to reject with JSON parse error
      request.json = jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication failed');
    });
  });
});