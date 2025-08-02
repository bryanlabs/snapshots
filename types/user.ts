export interface User {
  username: string;
  isLoggedIn: boolean;
  tier?: 'free' | 'premium' | 'unlimited';
}