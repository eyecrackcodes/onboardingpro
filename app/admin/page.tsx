"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  Database,
  Shield,
  FileText,
  Activity,
  UserPlus,
  Key,
  BarChart3,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { RouteGuard, useAuth } from "@/components/auth/AuthProvider";

const adminFeatures = [
  {
    title: "User Management",
    description: "Manage user roles, permissions, and access control",
    href: "/admin/users",
    icon: Users,
    permission: "manageUsers",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Generate Test Data",
    description: "Create sample candidates and cohorts for testing",
    href: "/admin/generate-test-data",
    icon: Database,
    permission: "manageSettings",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Background Check Status",
    description: "View and monitor all background check statuses",
    icon: Shield,
    href: "/admin/background-check-status",
    permission: "manageSettings",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Fix User Document IDs",
    description: "Repair mismatched user document IDs",
    icon: Wrench,
    href: "/admin/fix-user-ids",
    permission: "manageSettings",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Debug Environment",
    description: "View environment variables and system status",
    href: "/admin/debug-env",
    icon: Settings,
    permission: "manageSettings",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "IBR Testing",
    description: "Test background check API integration",
    href: "/admin/ibr-test",
    icon: Activity,
    permission: "manageSettings",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "PDF Coordinates",
    description: "Test and debug PDF form field coordinates",
    href: "/admin/test-pdf-coordinates",
    icon: FileText,
    permission: "manageSettings",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

export default function AdminPage() {
  const { user, hasPermission } = useAuth();

  // Filter admin features based on permissions
  const allowedFeatures = adminFeatures.filter((feature) =>
    hasPermission(feature.permission)
  );

  return (
    <RouteGuard requiredPermission="viewAdmin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              System administration and management tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-700">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
            {user?.role && <Badge variant="outline">Role: {user.role}</Badge>}
          </div>
        </div>

        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Welcome, {user?.displayName}!
                </h3>
                <p className="text-gray-600 text-sm">
                  You have <strong>{user?.role}</strong> permissions with access
                  to {allowedFeatures.length} admin features.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Domain: @{user?.appUser?.domain} • Last login:{" "}
                  {user?.appUser?.lastLoginAt
                    ? new Date(user.appUser.lastLoginAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">Online</p>
                  <p className="text-sm text-gray-600">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Administrative Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allowedFeatures.map((feature) => (
              <Card
                key={feature.href}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.bgColor} mb-4`}
                      >
                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <Link href={feature.href}>
                    <Button className="w-full" variant="outline">
                      Access Tool
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Security Notice</h4>
                <p className="text-yellow-800 text-sm">
                  Admin actions are logged and monitored. Only use these tools
                  as needed for system administration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
