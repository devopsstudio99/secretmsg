export interface AppConfig {
  port: number;
  domainUrl: string;
  bcryptRounds: number;
}

export function getAppConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    domainUrl: process.env.DOMAIN_URL || 'http://localhost:3000',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
  };
}
