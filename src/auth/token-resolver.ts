import { env } from '../config/environment.js';

interface CredentialsResponse {
  credentials: {
    access_token: string;
    [key: string]: any;
  };
}

export async function tokenResolver(
  userId: string,
  integrationId: string,
  jwt: string
): Promise<{ access_token: string }> {
  const url = `${env.PLATFORM_URL}/api/v1/integrations/${integrationId}/credentials`;
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credentials: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as CredentialsResponse;
    
    // Validate response structure
    if (!data.credentials?.access_token) {
      throw new Error('Invalid credentials response: missing access_token');
    }
    
    return data.credentials;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Credentials fetch timeout after 10 seconds');
    }
    throw error;
  }
}
