import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthState } from '@/types';
import { storage } from '@/services/storage';
import { trpcClient } from '@/lib/trpc';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    organization: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [user, organization] = await Promise.all([
        storage.getUser(),
        storage.getOrganization(),
      ]);

      if (user && organization) {
        setAuthState({
          user,
          organization,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await trpcClient.auth.login.mutate({ email, password });
      
      const user = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role as 'owner' | 'user',
        orgId: result.user.orgId,
      };

      const organization = {
        id: result.organization.id,
        name: result.organization.name,
      };
      
      await Promise.all([
        storage.saveUser(user),
        storage.saveOrganization(organization),
        storage.saveToken(result.token),
      ]);

      setAuthState({
        user,
        organization,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }, []);



  const logout = useCallback(async () => {
    try {
      await storage.clearAll();
      setAuthState({
        user: null,
        organization: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return useMemo(() => ({
    ...authState,
    isLoading,
    login,
    logout,
  }), [authState, isLoading, login, logout]);
});
