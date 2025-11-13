import dotenv from 'dotenv';
import type { Secret, SignOptions } from 'jsonwebtoken';

dotenv.config();

const defaultSecret = 'your_jwt_secret_key_change_this';
const configuredSecret = process.env.JWT_SECRET?.trim();
const secret: Secret = configuredSecret && configuredSecret.length > 0 ? configuredSecret : defaultSecret;

const expiresInValue = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

const signOptions: SignOptions = {
  expiresIn: expiresInValue,
  issuer: 'asset-qrcode-system',
  audience: 'asset-qrcode-users'
};

export const jwtConfig = {
  secret,
  signOptions
};
