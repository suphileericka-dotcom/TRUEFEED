export type AppEnvironment = 'development' | 'staging' | 'production';

const fallbackByEnvironment = {
  development: {
    apiUrl: 'http://localhost:4000',
    appName: 'TRUEFEED Dev',
  },
  staging: {
    apiUrl: 'https://staging-api.truefeed.example',
    appName: 'TRUEFEED Staging',
  },
  production: {
    apiUrl: 'https://api.truefeed.example',
    appName: 'TRUEFEED',
  },
} as const;

function getEnvironment(value?: string): AppEnvironment {
  if (value === 'staging' || value === 'production') {
    return value;
  }

  return 'development';
}

const environment = getEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const fallback = fallbackByEnvironment[environment];

export const env = {
  environment,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || fallback.apiUrl,
  appName: process.env.EXPO_PUBLIC_APP_NAME || fallback.appName,
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',
  isProduction: environment === 'production',
};
