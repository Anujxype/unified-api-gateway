import { DEFAULT_ADMIN_PASSWORD } from "./constants";

const ADMIN_SESSION_KEY = "fastx_admin_session";
const USER_SESSION_KEY = "fastx_user_session";

export const adminAuth = {
  login: (password: string): boolean => {
    if (password === DEFAULT_ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      return true;
    }
    return false;
  },
  logout: (): void => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },
  isAuthenticated: (): boolean => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  },
};

export const userAuth = {
  login: (keyValue: string, keyName: string): void => {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify({ keyValue, keyName }));
  },
  logout: (): void => {
    sessionStorage.removeItem(USER_SESSION_KEY);
  },
  getSession: (): { keyValue: string; keyName: string } | null => {
    const session = sessionStorage.getItem(USER_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },
  isAuthenticated: (): boolean => {
    return sessionStorage.getItem(USER_SESSION_KEY) !== null;
  },
};
