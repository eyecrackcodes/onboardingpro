"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  UserPlus,
  GraduationCap,
  UserCheck,
  Settings,
  ClipboardList,
  UserCog,
  Shield,
} from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Candidates", href: "/candidates", icon: Users },
    { name: "Cohorts", href: "/cohorts", icon: GraduationCap },
    { name: "Trainers", href: "/trainers", icon: UserCog },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Manager Portal", href: "/managers/login", icon: Shield },
  ];

  return (
    <nav className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">
          Onboarding Tracker
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@callcenter.com</p>
          </div>
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </nav>
  );
}
