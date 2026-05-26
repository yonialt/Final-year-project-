import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import API from '../lib/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const IDLE_WARN_MS  = 14 * 60 * 1000;  // 14 min → show warning
const IDLE_LIMIT_MS = 15 * 60 * 1000;  // 15 min → auto-logout

export const AuthProvider = ({ children }) => {
  const [token,  setToken]  = useState(localStorage.getItem('jwt') || null);
  const [user,   setUser]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false); // show "still there?" modal

  const warnTimerRef  = useRef(null);
  const logoutTimerRef = useRef(null);

  // ── Verify token and load profile on mount ────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data.data.user);
          setMustChangePassword(res.data.data.user.mustChangePassword || false);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = (newToken, changePasswordFlag = false) => {
    localStorage.setItem('jwt', newToken);
    setMustChangePassword(changePasswordFlag);
    setToken(newToken);
  };

  const logout = useCallback(() => {
    clearTimeout(warnTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    localStorage.removeItem('jwt');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
    setSessionWarning(false);
  }, []);

  const clearMustChangePassword = () => setMustChangePassword(false);

  // ── Idle-session timers ───────────────────────────────────────────────────
  const resetIdleTimers = useCallback(() => {
    if (!token) return; // only track when logged in
    clearTimeout(warnTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    setSessionWarning(false);

    // 14 min: show "still there?" banner
    warnTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
      // 1 more minute: auto-logout
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, IDLE_LIMIT_MS - IDLE_WARN_MS);
    }, IDLE_WARN_MS);
  }, [token, logout]);

  // User clicked "Stay logged in" in the warning modal
  const keepAlive = useCallback(() => {
    resetIdleTimers();
  }, [resetIdleTimers]);

  // Start / restart timers whenever the token changes (login / logout)
  useEffect(() => {
    if (!token) {
      clearTimeout(warnTimerRef.current);
      clearTimeout(logoutTimerRef.current);
      return;
    }
    resetIdleTimers();
    return () => {
      clearTimeout(warnTimerRef.current);
      clearTimeout(logoutTimerRef.current);
    };
  }, [token, resetIdleTimers]);

  // Listen for any user activity to reset the idle clock
  useEffect(() => {
    if (!token) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimers, { passive: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, resetIdleTimers));
  }, [token, resetIdleTimers]);

  return (
    <AuthContext.Provider value={{
      token, user, login, logout, isAuthenticated: !!token,
      loading, mustChangePassword, clearMustChangePassword,
      sessionWarning, keepAlive,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
