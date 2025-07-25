"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  GraduationCap,
  UserCheck,
  Settings,
  Building2,
} from "lucide-react";
import { UserProfile, useAuth } from "@/components/auth/AuthProvider";

// Define navigation items with permission requirements
const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    permission: "viewDashboard",
  },
  {
    name: "Candidates",
    href: "/candidates",
    icon: Users,
    permission: "viewCandidates",
  },
  {
    name: "Cohorts",
    href: "/cohorts",
    icon: GraduationCap,
    permission: "viewCohorts",
  },
  {
    name: "Trainers",
    href: "/trainers",
    icon: UserCheck,
    permission: "viewTrainers",
  },
  {
    name: "Manager Portal",
    href: "/managers",
    icon: Building2,
    permission: "viewManagerPortal",
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Settings,
    permission: "viewAdmin",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  // Filter navigation items based on user permissions
  const allowedNavItems = navigationItems.filter((item) =>
    hasPermission(item.permission)
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Onboarding Tracker
            </Link>
            {user?.role && (
              <div className="ml-3 text-xs text-gray-500">
                {user.role === "admin" && "🔧 Admin"}
                {user.role === "recruiter" && "📋 Recruiter"}
                {user.role === "manager" && "👥 Manager"}
                {user.role === "viewer" && "👀 Viewer"}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {allowedNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 pt-2">
          <div className="grid grid-cols-3 gap-1">
            {allowedNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-2 py-2 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
