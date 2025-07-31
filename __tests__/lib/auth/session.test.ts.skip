import { getSession, login, logout, getUser, sessionOptions } from '@/lib/auth/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { User } from '@/lib/types';

// Mock dependencies
jest.mock('iron-session');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Session Management', () => {
  let mockCookies: any;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock session
    mockSession = {
      user: undefined,
      isLoggedIn: false,
      save: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
    };
    
    // Setup mock cookies
    mockCookies = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    
    (cookies as jest.Mock).mockResolvedValue(mockCookies);
    (getIronSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('getSession', () => {
    it('should return a session instance', async () => {
      const session = await getSession();
      
      expect(cookies).toHaveBeenCalled();
      expect(getIronSession).toHaveBeenCalledWith(mockCookies, sessionOptions);
      expect(session).toBe(mockSession);
    });
  });

  describe('login', () => {
    it('should set user data and save session', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      
      await login(user);
      
      expect(mockSession.user).toEqual(user);
      expect(mockSession.isLoggedIn).toBe(true);
      expect(mockSession.save).toHaveBeenCalled();
    });

    it('should handle admin users', async () => {
      const adminUser: User = {
        id: '2',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      
      await login(adminUser);
      
      expect(mockSession.user).toEqual(adminUser);
      expect(mockSession.user.role).toBe('admin');
      expect(mockSession.isLoggedIn).toBe(true);
    });
  });

  describe('logout', () => {
    it('should destroy the session', async () => {
      await logout();
      
      expect(mockSession.destroy).toHaveBeenCalled();
    });

    it('should clear user data when session has user', async () => {
      mockSession.user = { id: '1', email: 'test@example.com' };
      mockSession.isLoggedIn = true;
      
      await logout();
      
      expect(mockSession.destroy).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return user when logged in', async () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      
      mockSession.isLoggedIn = true;
      mockSession.user = user;
      
      const result = await getUser();
      
      expect(result).toEqual(user);
    });

    it('should return null when not logged in', async () => {
      mockSession.isLoggedIn = false;
      
      const result = await getUser();
      
      expect(result).toBeNull();
    });

    it('should return null when user data is missing', async () => {
      mockSession.isLoggedIn = true;
      mockSession.user = undefined;
      
      const result = await getUser();
      
      expect(result).toBeNull();
    });

    it('should return null when session is partially invalid', async () => {
      mockSession.isLoggedIn = false;
      mockSession.user = { id: '1', email: 'test@example.com' };
      
      const result = await getUser();
      
      expect(result).toBeNull();
    });
  });

  describe('sessionOptions', () => {
    it('should have required configuration', () => {
      expect(sessionOptions).toHaveProperty('password');
      expect(sessionOptions).toHaveProperty('cookieName');
      expect(sessionOptions).toHaveProperty('cookieOptions');
      expect(sessionOptions.password).toBeTruthy();
      expect(sessionOptions.cookieName).toBeTruthy();
    });
  });
});