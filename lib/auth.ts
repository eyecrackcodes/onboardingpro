// Authentication service for Google SSO with Firebase
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useState, useEffect } from "react";
import { createOrUpdateUser, getUserByEmail } from "./firestore";
import type { AppUser, UserRole, ALLOWED_DOMAINS } from "./types";
import { ALLOWED_DOMAINS, ROLE_PERMISSIONS } from "./types";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string;
  role?: UserRole;
  permissions?: any;
  appUser?: AppUser;
}

// Validate email domain
function validateEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

// Extract domain from email
function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

// Determine default role based on email/domain
function getDefaultRole(email: string): UserRole {
  const lowerEmail = email.toLowerCase();

  // You can customize this logic based on specific email patterns
  if (lowerEmail.includes("admin") || lowerEmail.includes("anthony")) {
    return "admin";
  } else if (lowerEmail.includes("recruit") || lowerEmail.includes("hr")) {
    return "recruiter";
  } else if (
    lowerEmail.includes("manager") ||
    lowerEmail.includes("supervisor")
  ) {
    return "manager";
  } else {
    return "viewer"; // Default safe role
  }
}

class AuthService {
  // Sign in with Google
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("No email associated with this Google account");
      }

      // Validate domain
      if (!validateEmailDomain(user.email)) {
        // Sign out the user immediately
        await signOut(auth);
        throw new Error(
          `Access denied. Only users from @luminarylife.com and @digitalbga.com domains are allowed.`
        );
      }

      // Get the Google access token for calendar access
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      // Check if user exists in our database
      let appUser = await getUserByEmail(user.email);

      if (!appUser) {
        // Auto-create user account with default role
        const defaultRole = getDefaultRole(user.email);
        const domain = extractDomain(user.email);

        appUser = {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: defaultRole,
          permissions: ROLE_PERMISSIONS[defaultRole],
          domain: domain,
          isActive: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };

        await createOrUpdateUser(appUser);

        console.log("[AuthService] New user account created:", {
          email: user.email,
          role: defaultRole,
          domain: domain,
        });
      } else {
        // Update last login time
        appUser.lastLoginAt = new Date();
        await createOrUpdateUser(appUser);
      }

      // Check if user is active
      if (!appUser.isActive) {
        await signOut(auth);
        throw new Error(
          "Your account has been deactivated. Please contact an administrator."
        );
      }

      console.log("[AuthService] Google sign-in successful:", {
        uid: user.uid,
        email: user.email,
        role: appUser.role,
        permissions: Object.keys(appUser.permissions).filter(
          (k) => appUser.permissions[k]
        ).length,
      });

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accessToken: accessToken || undefined,
        role: appUser.role,
        permissions: appUser.permissions,
        appUser: appUser,
      };
    } catch (error: any) {
      console.error("[AuthService] Google sign-in error:", error);

      // Handle specific error codes
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        throw new Error(
          "Pop-up was blocked by your browser. Please allow pop-ups and try again."
        );
      } else if (error.code === "auth/network-request-failed") {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }

      // If it's our custom domain validation error, pass it through
      if (error.message.includes("Access denied")) {
        throw error;
      }

      throw new Error(error.message || "Failed to sign in with Google");
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log("[AuthService] Sign-out successful");
    } catch (error) {
      console.error("[AuthService] Sign-out error:", error);
      throw new Error("Failed to sign out");
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          // Get the app user data
          const appUser = await getUserByEmail(user.email);

          if (appUser && appUser.isActive) {
            callback({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: appUser.role,
              permissions: appUser.permissions,
              appUser: appUser,
            });
          } else {
            // User not found or inactive
            callback(null);
          }
        } catch (error) {
          console.error("[AuthService] Error fetching user data:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // Get user's access token (for Google API calls)
  async getAccessToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error("[AuthService] Error getting access token:", error);
      return null;
    }
  }

  // Check if user has specific permission
  hasPermission(
    user: AuthUser | null,
    permission: keyof typeof ROLE_PERMISSIONS.admin
  ): boolean {
    return user?.permissions?.[permission] === true;
  }

  // Check if user has specific role
  hasRole(user: AuthUser | null, role: UserRole): boolean {
    return user?.role === role;
  }

  // Check if user can access route
  canAccessRoute(user: AuthUser | null, route: string): boolean {
    if (!user) return false;

    const permissions = user.permissions;
    if (!permissions) return false;

    // Route-based access control
    if (route.startsWith("/admin")) {
      return permissions.viewAdmin;
    } else if (route.startsWith("/candidates")) {
      return permissions.viewCandidates;
    } else if (route.startsWith("/cohorts")) {
      return permissions.viewCohorts;
    } else if (route.startsWith("/trainers")) {
      return permissions.viewTrainers;
    } else if (route.startsWith("/managers")) {
      return permissions.viewManagerPortal;
    } else if (route === "/") {
      return permissions.viewDashboard;
    }

    // Default to allowing access for other routes
    return true;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export auth state hook for React components
export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};

// Permission hooks for easy use in components
export const usePermission = (
  permission: keyof typeof ROLE_PERMISSIONS.admin
) => {
  const { user } = useAuthState();
  return authService.hasPermission(user, permission);
};

export const useRole = (role: UserRole) => {
  const { user } = useAuthState();
  return authService.hasRole(user, role);
};

// Re-export for convenience
export { auth, googleProvider } from "./firebase";
