"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, User, Lock, AlertCircle } from "lucide-react";

// Demo manager credentials
const DEMO_MANAGERS = {
  "1234": { name: "John Smith", role: "Senior Manager", location: "Charlotte" },
  "5678": { name: "Sarah Johnson", role: "Team Lead", location: "Austin" },
  "9999": { name: "Demo Manager", role: "Administrator", location: "All" },
};

export default function ManagerLoginPage() {
  const router = useRouter();
  const [managerCode, setManagerCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if PIN exists
    if (DEMO_MANAGERS[pin as keyof typeof DEMO_MANAGERS]) {
      const manager = DEMO_MANAGERS[pin as keyof typeof DEMO_MANAGERS];

      // Store manager info in session storage (for demo purposes)
      sessionStorage.setItem(
        "managerAuth",
        JSON.stringify({
          authenticated: true,
          manager: {
            code: managerCode,
            ...manager,
          },
          loginTime: new Date().toISOString(),
        })
      );

      // Redirect to manager dashboard
      router.push("/managers");
    } else {
      setError("Invalid PIN. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to conduct interviews</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manager Login</CardTitle>
            <CardDescription>
              Enter your manager code and PIN to access the interview portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="managerCode">Manager Code</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="managerCode"
                    type="text"
                    placeholder="Enter your manager code"
                    value={managerCode}
                    onChange={(e) => setManagerCode(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">
                Demo Credentials:
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>
                  • Manager Code:{" "}
                  <code className="bg-white px-1 rounded">MGR001</code> | PIN:{" "}
                  <code className="bg-white px-1 rounded">1234</code>{" "}
                  (Charlotte)
                </p>
                <p>
                  • Manager Code:{" "}
                  <code className="bg-white px-1 rounded">MGR002</code> | PIN:{" "}
                  <code className="bg-white px-1 rounded">5678</code> (Austin)
                </p>
                <p>
                  • Manager Code:{" "}
                  <code className="bg-white px-1 rounded">DEMO</code> | PIN:{" "}
                  <code className="bg-white px-1 rounded">9999</code> (All)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
