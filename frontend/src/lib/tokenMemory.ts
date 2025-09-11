import { AuthTokens } from "../../types";


let memoryTokens: AuthTokens = { accessToken: null, refreshToken: null };

export function getMemoryTokens(): AuthTokens {
  return memoryTokens;
}

export function setMemoryTokens(tokens: Partial<AuthTokens>): void {
  memoryTokens = { ...memoryTokens, ...tokens };
}

export function clearMemoryTokens(): void {
  memoryTokens = { accessToken: null, refreshToken: null };
}


