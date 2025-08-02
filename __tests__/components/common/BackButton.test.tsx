import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/common/BackButton';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('BackButton', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('renders with default text and props', () => {
    render(<BackButton />);
    
    // Check if the button exists
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Check if default text is hidden on mobile but visible on larger screens
    const text = screen.getByText('All Snapshots');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('hidden', 'sm:block');
    
    // Check if icon is present
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<BackButton text="Back to Home" />);
    
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('shows text on mobile when showTextOnMobile is true', () => {
    render(<BackButton showTextOnMobile />);
    
    const text = screen.getByText('All Snapshots');
    expect(text).toHaveClass('block');
    expect(text).not.toHaveClass('hidden');
  });

  it('has proper accessibility attributes when text is hidden', () => {
    render(<BackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Navigate back to All Snapshots');
  });

  it('navigates to default href when clicked', async () => {
    const user = userEvent.setup();
    render(<BackButton />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to custom href when clicked', async () => {
    const user = userEvent.setup();
    render(<BackButton href="/custom-path" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockPush).toHaveBeenCalledWith('/custom-path');
  });

  it('applies custom className', () => {
    render(<BackButton className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has proper styling classes for purple theme', () => {
    render(<BackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'border-purple-200',
      'dark:border-purple-800',
      'text-purple-700',
      'dark:text-purple-300'
    );
  });
});