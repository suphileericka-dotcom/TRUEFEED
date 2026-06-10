require('dotenv').config();

const env = {
  appName: 'TRUEFEED API',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM || 'TRUEFEED <onboarding@resend.dev>',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  trustProxy: process.env.TRUST_PROXY === 'true',
  vercelProjectHostPatterns: [
    /^truefeed(?:-[a-z0-9-]+)?\.vercel\.app$/i,
    /^truefeed(?:-[a-z0-9-]+)?-suphileericka-dotcoms-projects\.vercel\.app$/i,
  ],
};

function assertProductionEnv() {
  if (env.nodeEnv !== 'production' && env.nodeEnv !== 'staging') {
    return;
  }

  const missing = [];

  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'change-me-access-secret') {
    missing.push('JWT_ACCESS_SECRET');
  }

  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET === 'change-me-refresh-secret'
  ) {
    missing.push('JWT_REFRESH_SECRET');
  }

  if (!env.databaseUrl) {
    missing.push('DATABASE_URL');
  }

  if (missing.length > 0) {
    throw new Error(`Missing secure environment configuration: ${missing.join(', ')}`);
  }
}

assertProductionEnv();

module.exports = {
  env,
};
