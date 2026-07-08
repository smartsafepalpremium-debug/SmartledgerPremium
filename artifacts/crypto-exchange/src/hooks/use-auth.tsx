import { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogin, useLogout, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User, LoginRequest, RegisterRequest } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isLoginPending: boolean;
  isRegisterPending: boolean;
  isLogoutPending: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: ["/api/auth/me"],
      retry: false,
      staleTime: Infinity,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (response) => {
        queryClient.setQueryData(getGetMeQueryKey(), response.user);
        setLocation("/dashboard");
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (response) => {
        queryClient.setQueryData(getGetMeQueryKey(), response.user);
        setLocation("/dashboard");
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.clear();
        setLocation("/login");
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: async (data) => { await loginMutation.mutateAsync({ data }); },
        register: async (data) => { await registerMutation.mutateAsync({ data }); },
        logout: async () => { await logoutMutation.mutateAsync(); },
        isLoginPending: loginMutation.isPending,
        isRegisterPending: registerMutation.isPending,
        isLogoutPending: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
