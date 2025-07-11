import { IronSessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { User } from '../types';
import { config } from '../config';

export interface SessionData {
  user?: User;
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  password: config.auth.password,
  cookieName: config.auth.cookieName,
  cookieOptions: config.auth.cookieOptions,
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function login(user: User) {
  const session = await getSession();
  session.user = user;
  session.isLoggedIn = true;
  await session.save();
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  if (session.isLoggedIn && session.user) {
    return session.user;
  }
  return null;
}