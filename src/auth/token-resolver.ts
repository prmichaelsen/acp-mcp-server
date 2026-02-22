import { env } from '../config/environment.js';

export async function tokenResolver(
  userId: string,
  integrationId: string,
  jwt: string
): Promise<{ access_token: string }> {
  const url = `${env.PLATFORM_URL}/api/v1/integrations/${integrationId}/credentials`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch credentials: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.credentials;
}
