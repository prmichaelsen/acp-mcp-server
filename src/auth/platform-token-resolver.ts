/**
 * Platform Token Resolver
 * 
 * Resolves user credentials from platform API.
 */

import type {
  ResourceTokenResolver,
  CredentialsAPIResponse,
  CredentialsAPIHeaders,
  TenantAPIErrorResponse
} from '@prmichaelsen/mcp-auth';
import type { PlatformJWTProvider } from './platform-jwt-provider.js';

export interface PlatformTokenResolverConfig {
  platformUrl: string;
  authProvider: PlatformJWTProvider;
  cacheTokens?: boolean;
  cacheTtl?: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class PlatformTokenResolver implements ResourceTokenResolver {
  private config: PlatformTokenResolverConfig;
  private tokenCache = new Map<string, CachedToken>();
  
  constructor(config: PlatformTokenResolverConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    console.log('Platform token resolver initialized');
  }
  
  async resolveToken(userId: string, resourceType: string): Promise<string | null> {
    try {
      const cacheKey = `${userId}:${resourceType}`;
      
      // Check cache
      if (this.config.cacheTokens !== false) {
        const cached = this.tokenCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          return cached.token;
        }
      }
      
      // Get JWT token from auth provider
      const jwtToken = this.config.authProvider.getJWTToken(userId);
      if (!jwtToken) {
        console.warn(`No JWT token found for user ${userId}`);
        return null;
      }
      
      // Call platform API with JWT (not service token)
      const url = `${this.config.platformUrl}/api/credentials/${resourceType}`;
      const headers: CredentialsAPIHeaders = {
        'Authorization': `Bearer ${jwtToken}`,
        'X-User-ID': userId
      };
      
      const response = await fetch(url, {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json() as TenantAPIErrorResponse;
        
        if (response.status === 404) {
          console.warn(`No ${resourceType} credentials for user ${userId}`);
          return null;
        }
        
        console.error('Platform API error:', errorData);
        throw new Error(`Platform API error: ${errorData.error || response.status}`);
      }
      
      const data = await response.json() as CredentialsAPIResponse;
      
      if (!data.access_token) {
        console.warn('Token field missing');
        return null;
      }
      
      // Return the entire credentials object as JSON string
      // This includes: access_token (SSH key), remote_url (host), system_username, etc.
      const token = JSON.stringify(data);
      
      // Cache token
      if (this.config.cacheTokens !== false) {
        const ttl = this.config.cacheTtl || 300000;
        this.tokenCache.set(cacheKey, {
          token,
          expiresAt: Date.now() + ttl
        });
      }
      
      return token;
    } catch (error) {
      console.error('Failed to resolve token:', error);
      return null;
    }
  }
  
  async cleanup(): Promise<void> {
    this.tokenCache.clear();
  }
}
