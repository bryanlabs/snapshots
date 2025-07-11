import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/components/providers/AuthProvider');
jest.mock('next/navigation');

describe('LoginForm', () => {
  let mockLogin: jest.Mock;
  let mockPush: jest.Mock;
  let mockUseAuth: jest.Mock;
  let mockUseRouter: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockLogin = jest.fn();
    mockPush = jest.fn();
    
    mockUseAuth = useAuth as jest.Mock;
    mockUseRouter = useRouter as jest.Mock;
    
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: null,
    });
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  it('should render login form', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Login to BryanLabs Snapshots')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should handle form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue(true);
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should display error message when login fails', async () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: 'Invalid email or password',
    });
    
    render(<LoginForm />);
    
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('should not redirect when login fails', async () => {
    mockLogin.mockResolvedValue(false);
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should validate email format', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
  });

  it('should validate password is required', async () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('should update input values on change', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'mypassword');
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('mypassword');
  });

  it('should prevent form submission when loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Try to click again while loading
    await user.click(submitButton);
    
    // Login should only be called once
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('should handle form submission with enter key', async () => {
    mockLogin.mockResolvedValue(true);
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<LoginForm />);
    
    const form = screen.getByRole('form', { hidden: true });
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
    expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
    expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
  });
});