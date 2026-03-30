import { api } from './api';
import { useUserStore } from '@/stores';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  User,
} from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    api.setToken(response.token);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    api.setToken(response.token);
    return response;
  },

  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    const response = await api.post<TokenRefreshResponse>('/auth/refresh', {
      refreshToken,
    } as TokenRefreshRequest);
    api.setToken(response.token);
    return response;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    api.setToken(null);
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },
};

// Hook for auth operations
export function useAuth() {
  const { user, token, isAuthenticated, setAuth, setUser, logout } = useUserStore();

  return {
    user,
    token,
    isAuthenticated,
    login: async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      setAuth(response);
      return response;
    },
    register: async (email: string, password: string, nickname?: string) => {
      const response = await authService.register({ email, password, nickname });
      setAuth(response);
      return response;
    },
    logout: async () => {
      await authService.logout();
      logout();
    },
  };
}