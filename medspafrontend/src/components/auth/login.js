"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      email: "admin@medispa.com",
      role: "Admin Dashboard",
      description: "View KPIs, manage staff, locations",
    },
    {
      email: "provider@medispa.com",
      role: "Provider Dashboard",
      description: "Today's appointments, treatment notes",
    },
    {
      email: "reception@medispa.com",
      role: "Reception Dashboard",
      description: "Book appointments, check-ins",
    },
    {
      email: "client@medispa.com",
      role: "Client Portal",
      description: "My appointments, documents, payments",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">MediSpa</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome to your wellness management platform
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Demo Accounts
            </CardTitle>
            <CardDescription>
              Use these accounts to explore different user roles (password:
              <span className="font-semibold"> demo123</span>)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors hover:border-primary/30"
                onClick={() => {
                  setEmail(account.email);
                  setPassword("demo123");
                }}
              >
                <div className="font-medium text-sm text-foreground">
                  {account.role}
                </div>
                <div className="text-xs text-muted-foreground">{account.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {account.description}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
