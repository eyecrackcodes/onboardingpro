"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  LogOut,
  User,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
  UserX,
  CheckCircle,
} from "lucide-react";
import { authService, type AuthUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

// Auth Context
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      const authUser = await authService.signInWithGoogle();
      setUser(authUser);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign-in failed";
      setError(errorMessage);
      console.error("[AuthProvider] Sign-in error:", err);
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign-out failed";
      setError(errorMessage);
      console.error("[AuthProvider] Sign-out error:", err);
    }
  };

  const hasPermission = (permission: string) => {
    return authService.hasPermission(user, permission as any);
  };

  const hasRole = (role: string) => {
    return authService.hasRole(user, role as any);
  };

  const canAccessRoute = (route: string) => {
    return authService.canAccessRoute(user, route);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    error,
    hasPermission,
    hasRole,
    canAccessRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Sign-in Component
export function SignInCard() {
  const { signIn, error, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    await signIn();
    setSigningIn(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Onboarding Tracker
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Sign in with your company Google account
        </p>
        <div className="text-xs text-gray-500 mt-2">
          <p className="font-medium">Authorized Domains:</p>
          <p>@luminarylife.com • @digitalbga.com</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm font-medium">
                Access Denied
              </span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            {error.includes("Access denied") && (
              <div className="mt-2 text-xs text-red-600">
                <p>
                  Only employees with company email addresses can access this
                  system.
                </p>
                <p>
                  Contact your administrator if you believe this is an error.
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {signingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with Google
            </>
          )}
        </Button>

        <div className="text-center text-xs text-gray-500">
          By signing in, you agree to use Google authentication
          <br />
          for secure access and calendar integration.
        </div>
      </CardContent>
    </Card>
  );
}

// User Profile Component
export function UserProfile() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "recruiter":
        return "bg-green-100 text-green-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt={user.displayName || "User"}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.displayName || "User"}
          </p>
          {user.role && (
            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      <Button
        onClick={signOut}
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Route Guard Component
export function RouteGuard({
  children,
  requiredPermission,
  requiredRole,
  fallback,
}: {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: React.ReactNode;
}) {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null; // Will be handled by AuthGuard
  }

  // Check route access
  if (!authService.canAccessRoute(user, pathname)) {
    return (
      fallback || (
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Restricted
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                You don't have permission to access this page.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Permission Required
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                You need the "{requiredPermission}" permission to access this
                feature.
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  // Check specific role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      fallback || (
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Role Required
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                You need the "{requiredRole}" role to access this feature.
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// Auth Guard Component
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SignInCard />
      </div>
    );
  }

  // Show account created message for new users
  if (
    user.appUser &&
    new Date().getTime() - user.appUser.createdAt.getTime() < 60000
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Account Created!
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              Welcome, {user.displayName}!
            </p>
            <p className="text-gray-600 text-sm mb-4">
              Your account has been created with <strong>{user.role}</strong>{" "}
              permissions.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p>
                If you need different permissions, please contact your
                administrator.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
