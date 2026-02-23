#!/usr/bin/env node

/**
 * ACP MCP Server - Platform JWT Authentication Provider
 * 
 * Custom JWT auth provider that works with ESM and agentbase.me platform
 */

import type { AuthProvider, AuthResult, RequestContext } from '@prmichaelsen/mcp-auth';
import jwt from 'jsonwebtoken';

export interface PlatformJWTProviderConfig {
  serviceToken: string;
  issuer?: string;
  audience?: string;
  userIdClaim?: string;
  cacheResults?: boolean;
  cacheTtl?: number;
}

interface CachedAuthResult {
  result: AuthResult;
  expiresAt: number;
}

export class PlatformJWTProvider implements AuthProvider {
  private config: PlatformJWTProviderConfig;
  private authCache = new Map<string, CachedAuthResult>();
  public jwtTokenCache = new Map<string, string>();
  
  constructor(config: PlatformJWTProviderConfig) {
    this.config = {
      issuer: 'agentbase.me',
      audience: 'mcp-server',
      userIdClaim: 'userId',
      cacheResults: true,
      cacheTtl: 60000, // 60 seconds
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    console.log('Platform JWT auth provider initialized');
  }
  
  async authenticate(context: RequestContext): Promise<AuthResult> {
    try {
      const authHeader = context.headers?.['authorization'];
      
      if (!authHeader || Array.isArray(authHeader)) {
        return { authenticated: false, error: 'No authorization header' };
      }
      
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return { authenticated: false, error: 'Invalid authorization format' };
      }
      
      const token = parts[1];
      
      // Check cache
      if (this.config.cacheResults) {
        const cached = this.authCache.get(token);
        if (cached && Date.now() < cached.expiresAt) {
          return cached.result;
        }
      }
      
      // Verify JWT
      const decoded = jwt.verify(token, this.config.serviceToken, {
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as Record<string, any>;
      
      // Extract userId from configured claim (default: 'userId')
      const userIdClaim = this.config.userIdClaim || 'userId';
      const userId = decoded[userIdClaim];
      
      if (!userId) {
        return {
          authenticated: false,
          error: `Token missing required "${userIdClaim}" claim`
        };
      }
      
      // Store JWT for forwarding to credentials API
      this.jwtTokenCache.set(userId, token);
      
      const result: AuthResult = {
        authenticated: true,
        userId: userId,
        metadata: {
          email: decoded.email,
          ...decoded
        }
      };
      
      // Cache result
      if (this.config.cacheResults) {
        const ttl = this.config.cacheTtl || 60000;
        this.authCache.set(token, {
          result,
          expiresAt: Date.now() + ttl
        });
      }
      
      return result;
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
  
  getJWTToken(userId: string): string | undefined {
    return this.jwtTokenCache.get(userId);
  }
  
  async cleanup(): Promise<void> {
    this.authCache.clear();
    this.jwtTokenCache.clear();
  }
}
