import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const jwtAuthProvider = {
  async authenticate(token: string) {
    try {
      // Specify allowed algorithms to prevent algorithm confusion attacks
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256', 'RS256'], // Allow common secure algorithms
        maxAge: '24h', // Enforce token expiration
      }) as {
        sub: string;
        [key: string]: any;
      };
      
      if (!decoded.sub) {
        throw new Error('Token missing required "sub" claim');
      }
      
      return {
        userId: decoded.sub,
        metadata: decoded,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`JWT validation failed: ${error.message}`);
      }
      throw new Error('Invalid JWT token');
    }
  },
};
