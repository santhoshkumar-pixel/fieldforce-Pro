import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";
import { mockUsers } from "../data/mockData";

const AuthContext = createContext(null);
const STORAGE_KEY = "fieldforce_admin_session";

export function AuthProvider({ children }) {
 const [user, setUser] = useState(() => {
 try {
 const stored = sessionStorage.getItem(STORAGE_KEY);
 return stored ? JSON.parse(stored) : null;
 } catch {
 return null;
 }
 });

  const login = async (email, password) => {
    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    try {
      const loggedInUser = await api.auth.login(email, password);
      setUser(loggedInUser);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      return { success: true };
    } catch (error) {
      // Fallback to mock user if API fails / backend not running
      const mockKey = Object.keys(mockUsers).find(
        (k) => k.toLowerCase() === normalizedEmail
      );
      const mockUser = mockKey ? mockUsers[mockKey] : null;
      if (mockUser) {
        setUser(mockUser);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        return { success: true };
      }
      return { success: false, error: "Invalid email or password" };
    }
  };

 const logout = () => {
 setUser(null);
 sessionStorage.removeItem(STORAGE_KEY);
 };

 const updateUser = async (updatedFields) => {
 setUser((prev) => {
 if (!prev) return null;
 const nextUser = { ...prev, ...updatedFields };
 sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
 return nextUser;
 });

 if (user && user.id) {
 try {
 const nextUser = { ...user, ...updatedFields };
 await api.users.update(user.id, nextUser);
 } catch (error) {
 console.error("Failed to update user in backend:", error);
 }
 }
 };

 const refreshPermissions = async () => {
 if (!user) return;
 try {
   // Try the /me endpoint first — it returns full user with DB permissions
   const meData = await api.auth.getMe().catch(() => null);
   if (meData && Array.isArray(meData.permissions)) {
     const currentPerms = user.permissions || [];
     const nextPerms = meData.permissions;
     const hasChanged = currentPerms.length !== nextPerms.length ||
       !currentPerms.every((p) => nextPerms.includes(p));
     if (hasChanged) {
       setUser((prev) => {
         if (!prev) return null;
         const updated = { ...prev, permissions: nextPerms };
         sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
         return updated;
       });
     }
     return;
   }
   // Fallback: use the role-based permissions endpoint
   const data = await api.auth.getPermissions();
   if (data && Array.isArray(data.permissions)) {
     const currentPerms = user.permissions || [];
     const nextPerms = data.permissions;
     const hasChanged = currentPerms.length !== nextPerms.length ||
       !currentPerms.every((p) => nextPerms.includes(p));
     if (hasChanged) {
       setUser((prev) => {
         if (!prev) return null;
         const updated = { ...prev, permissions: nextPerms };
         sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
         return updated;
       });
     }
   }
 } catch (error) {
   console.error("Failed to refresh permissions:", error);
 }
 };

 useEffect(() => {
 if (user) {
 refreshPermissions();
 }
 }, []);

 const hasPermission = (permission) => {
 // Super Admin has unrestricted access to everything
 if (user?.role === "Super Admin") return true;

 const permissions = user?.permissions || [];
 if (!permission) return false;

 const check = (perm) => {
 if (permissions.includes(perm) || permissions.includes("*.*") || permissions.includes("*")) return true;
 const baseModule = perm.split(".")[0];
 return permissions.includes(`${baseModule}.*`);
 };

 return Array.isArray(permission) ? permission.some(check) : check(permission);
 };

 const value = useMemo(
 () => ({
 user,
 isAuthenticated: Boolean(user),
 isAdmin: user?.role === "Admin",
 isSuperAdmin: user?.role === "Super Admin",
 isUnrestricted: ["Super Admin", "Admin", "Operational Manager", "Warehouse Manager", "Warehouse"].includes(user?.role),
 login,
 logout,
 updateUser,
 hasPermission,
 refreshPermissions,
 }),
 [user]
 );

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error("useAuth must be used within AuthProvider");
 return ctx;
}
