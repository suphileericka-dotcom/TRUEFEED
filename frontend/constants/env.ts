export type AppEnvironment = 'development' | 'staging' | 'production';

const fallbackByEnvironment = {
  development: {
    apiUrl: 'http://localhost:4000',
    appName: 'TRUEFEED Dev',
  },
  staging: {
    apiUrl: 'https://truefeed-production.up.railway.app',
    appName: 'TRUEFEED Staging',
  },
  production: {
    apiUrl: 'https://truefeed-production.up.railway.app',
    appName: 'TRUEFEED',
  },
} as const;

function getEnvironment(value?: string, nodeEnv?: string): AppEnvironment {
  if (value === 'staging' || value === 'production') {
    return value;
  }

  if (nodeEnv === 'production') {
    return 'production';
  }

  return 'development';
}

const environment = getEnvironment(process.env.EXPO_PUBLIC_APP_ENV, process.env.NODE_ENV);
const fallback = fallbackByEnvironment[environment];

export const env = {
  environment,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || fallback.apiUrl,
  appName: process.env.EXPO_PUBLIC_APP_NAME || fallback.appName,
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',
  isProduction: environment === 'production',
};
