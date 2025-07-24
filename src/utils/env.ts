export enum Environment {
  DEV = "development",
  PROD = "production",
}

export function isDev(): boolean {
  return process.env.NODE_ENV === Environment.DEV;
}

export function getAPIGatewayPrefix(): string {
  return process.env.API_GATEWAY_PREFIX || "/api-gw";
}

export function getMashupAPIPrefix(): string {
  return process.env.MASHUP_API_PREFIX || "";
}

export function getPublicPath(): string {
  return process.env.publicPath || "";
}

export function showLogo() {
  return true;
}

export function showMultiLang() {
  return true;
}

export function enableEmailAuth() {
  return false;
}
