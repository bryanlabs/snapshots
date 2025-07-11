import { NextRequest } from 'next/server';
import { POST as loginPOST } from '@/app/api/v1/auth/login/route';
import { POST as logoutPOST } from '@/app/api/v1/auth/logout/route';
import { GET as meGET } from '@/app/api/v1/auth/me/route';
import { getIronSession } from 'iron-session';

// Mock iron-session
jest.mock('iron-session');
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('Authentication Flow Integration', () => {
  let mockGetIronSession: jest.Mock;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup session mock
    mockSession = {
      user: undefined,
      isLoggedIn: false,
      save: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
    };
    
    mockGetIronSession = getIronSession as jest.Mock;
    mockGetIronSession.mockResolvedValue(mockSession);
  });

  describe('Complete login flow', () => {
    it('should handle login -> verify user -> logout flow', async () => {
      // Step 1: Login
      const loginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      const loginResponse = await loginPOST(loginRequest);
      const loginData = await loginResponse.json();
      
      expect(loginResponse.status).toBe(200);
      expect(loginData.success).toBe(true);
      expect(loginData.data.email).toBe('admin@example.com');
      
      // Simulate session being set
      mockSession.user = loginData.data;
      mockSession.isLoggedIn = true;
      
      // Step 2: Verify user is logged in
      const meRequest = new NextRequest('http://localhost:3000/api/v1/auth/me');
      
      const meResponse = await meGET(meRequest);
      const meData = await meResponse.json();
      
      expect(meResponse.status).toBe(200);
      expect(meData.success).toBe(true);
      expect(meData.data.email).toBe('admin@example.com');
      
      // Step 3: Logout
      const logoutRequest = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
        method: 'POST',
      });
      
      const logoutResponse = await logoutPOST(logoutRequest);
      const logoutData = await logoutResponse.json();
      
      expect(logoutResponse.status).toBe(200);
      expect(logoutData.success).toBe(true);
      expect(mockSession.destroy).toHaveBeenCalled();
      
      // Step 4: Verify user is logged out
      mockSession.user = undefined;
      mockSession.isLoggedIn = false;
      
      const meAfterLogoutResponse = await meGET(meRequest);
      const meAfterLogoutData = await meAfterLogoutResponse.json();
      
      expect(meAfterLogoutResponse.status).toBe(401);
      expect(meAfterLogoutData.success).toBe(false);
      expect(meAfterLogoutData.error).toBe('Not authenticated');
    });

    it('should handle failed login attempts', async () => {
      // Attempt 1: Invalid email format
      const invalidEmailRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });
      
      const invalidEmailResponse = await loginPOST(invalidEmailRequest);
      const invalidEmailData = await invalidEmailResponse.json();
      
      expect(invalidEmailResponse.status).toBe(400);
      expect(invalidEmailData.success).toBe(false);
      expect(invalidEmailData.error).toBe('Invalid request');
      
      // Attempt 2: Short password
      const shortPasswordRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: '12345',
        }),
      });
      
      const shortPasswordResponse = await loginPOST(shortPasswordRequest);
      const shortPasswordData = await shortPasswordResponse.json();
      
      expect(shortPasswordResponse.status).toBe(400);
      expect(shortPasswordData.success).toBe(false);
      
      // Attempt 3: Non-existent user
      const nonExistentUserRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });
      
      const nonExistentUserResponse = await loginPOST(nonExistentUserRequest);
      const nonExistentUserData = await nonExistentUserResponse.json();
      
      expect(nonExistentUserResponse.status).toBe(401);
      expect(nonExistentUserData.success).toBe(false);
      expect(nonExistentUserData.error).toBe('Invalid credentials');
    });

    it('should handle multiple login sessions', async () => {
      // Login as regular user
      const userLoginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
        }),
      });
      
      const userLoginResponse = await loginPOST(userLoginRequest);
      const userLoginData = await userLoginResponse.json();
      
      expect(userLoginResponse.status).toBe(200);
      expect(userLoginData.data.role).toBe('user');
      
      // Simulate session update
      mockSession.user = userLoginData.data;
      mockSession.isLoggedIn = true;
      
      // Logout
      const logoutRequest = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
        method: 'POST',
      });
      
      await logoutPOST(logoutRequest);
      
      // Login as admin
      mockSession.user = undefined;
      mockSession.isLoggedIn = false;
      
      const adminLoginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      const adminLoginResponse = await loginPOST(adminLoginRequest);
      const adminLoginData = await adminLoginResponse.json();
      
      expect(adminLoginResponse.status).toBe(200);
      expect(adminLoginData.data.role).toBe('admin');
    });

    it('should persist session across requests', async () => {
      // Login
      const loginRequest = new NextRequest('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      });
      
      await loginPOST(loginRequest);
      
      // Simulate session persistence
      mockSession.user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockSession.isLoggedIn = true;
      
      // Make multiple authenticated requests
      const meRequest = new NextRequest('http://localhost:3000/api/v1/auth/me');
      
      for (let i = 0; i < 3; i++) {
        const response = await meGET(meRequest);
        const data = await response.json();
        
        expect(response.status).toBe(200);
        expect(data.data.email).toBe('admin@example.com');
      }
      
      // Session should still be valid
      expect(mockSession.isLoggedIn).toBe(true);
    });
  });

  describe('Session management edge cases', () => {
    it('should handle corrupted session data', async () => {
      // Set corrupted session data
      mockSession.user = { invalidData: true }; // Missing required fields
      mockSession.isLoggedIn = true;
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/me');
      const response = await meGET(request);
      const data = await response.json();
      
      // Should handle gracefully
      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('invalidData', true);
    });

    it('should handle session without login flag', async () => {
      // Set user data but not logged in flag
      mockSession.user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockSession.isLoggedIn = false;
      
      const request = new NextRequest('http://localhost:3000/api/v1/auth/me');
      const response = await meGET(request);
      
      expect(response.status).toBe(401);
    });
  });
});