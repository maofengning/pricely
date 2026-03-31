// User-related types
export interface User {
  id: string;
  email: string;
  nickname?: string;
  createdAt: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  userId: string;
  token: string;
  refreshToken: string;
  user?: User;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  token: string;
}