#!/usr/bin/env tsx

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const secrets = new Map<string, string>();

// Parse .env file
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const [key, ...valueParts] = trimmed.split('=');
  const value = valueParts.join('=');
  
  if (key && value) {
    secrets.set(key, value);
  }
}

// Upload secrets to Google Cloud Secret Manager
const projectName = 'acp-mcp-server';

for (const [key, value] of secrets) {
  const secretName = `${projectName}-${key.toLowerCase().replace(/_/g, '-')}`;
  
  console.log(`Uploading secret: ${secretName}`);
  
  try {
    // Create or update secret
    execSync(
      `echo -n "${value}" | gcloud secrets create ${secretName} --data-file=- || echo -n "${value}" | gcloud secrets versions add ${secretName} --data-file=-`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error(`Failed to upload ${secretName}`);
  }
}

console.log('\n✅ Secrets uploaded successfully');
