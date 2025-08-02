import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms'; // ✅ import correct type

export const generateToken = (payload: { id: number; role: string }): string => {
  const secret: Secret | undefined = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const expiresIn: StringValue = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, secret, options);
};
