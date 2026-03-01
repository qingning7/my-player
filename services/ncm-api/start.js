require('dotenv/config');

const fs = require('fs');
const os = require('os');
const path = require('path');

async function start() {
  process.env.PORT = process.env.PORT ?? '3001';
  process.env.CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN ?? 'http://localhost:5173';
  const tmpPath = os.tmpdir();
  const tokenPath = path.resolve(tmpPath, 'anonymous_token');
  if (!fs.existsSync(tokenPath)) {
    fs.writeFileSync(tokenPath, '', 'utf-8');
  }

  const generateConfig = require('@neteasecloudmusicapienhanced/api/generateConfig');
  const { serveNcmApi } = require('@neteasecloudmusicapienhanced/api/server');

  await generateConfig();
  await serveNcmApi({ checkVersion: true });
}

start().catch((error) => {
  console.error('Failed to start NCM API:', error);
  process.exit(1);
});
