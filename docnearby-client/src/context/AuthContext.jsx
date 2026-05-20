import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api.js";
import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors during logout
    }
    setToken("");
    setUser(null);
    localStorage.removeItem("dn_token");
    localStorage.removeItem("dn_user");
  }, []);

  const refreshMe = useCallback(async () => {
    setLoading(true);

    try {
      const res = await authApi.me();

      if (res?.success) {
        setUser(res.data?.user || null);

        if (res.data?.token) {
          setToken(res.data.token);
        }
      } else {
        logout();
      }

      return res;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [logout]);

  useEffect(() => {
    if (token) localStorage.setItem("dn_token", token);

    if (user) {
      localStorage.setItem("dn_user", JSON.stringify(user));
    }
  }, [token, user]);

  useEffect(() => {
    if (!isInitialized) {
      const init = async () => {
        const savedToken = localStorage.getItem("dn_token");
        if (savedToken) {
          setToken(savedToken);   // restore token into state first
          await refreshMe();
        } else {
          setIsInitialized(true); // nothing to restore, mark done
        }
      };
      init();
    }
  }, [refreshMe, isInitialized]);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      token,
      setToken,
      user,
      setUser,
      loading,
      isInitialized,
      isAuthenticated,
      logout,
      refreshMe,
    }),
    [token, user, loading, isInitialized, isAuthenticated, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
