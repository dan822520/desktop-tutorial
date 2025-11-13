import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  issuer: 'asset-qrcode-system',
  audience: 'asset-qrcode-users'
};
