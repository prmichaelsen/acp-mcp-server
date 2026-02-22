import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const jwtAuthProvider = {
  async authenticate(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        [key: string]: any;
      };
      
      return {
        userId: decoded.sub,
        metadata: decoded,
      };
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  },
};
