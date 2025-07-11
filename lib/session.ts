import { IronSessionOptions } from 'iron-session';
import { config } from './config';

export const sessionOptions: IronSessionOptions = {
  password: config.auth.password,
  cookieName: config.auth.cookieName,
  cookieOptions: config.auth.cookieOptions,
};