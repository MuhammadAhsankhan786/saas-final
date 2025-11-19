"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "@/lib/api";
import { notify } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await forgotPassword(email);
      setSuccess(true);
      notify.success(result.message || "Password reset link sent to your email");
    } catch (err) {
      const errorMessage = err.message || "Failed to send password reset link";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shadow-md" style={{ background: 'linear-gradient(to right, #6b21a8, #14b8a6)' }}>
              <span className="text-black font-bold text-xs leading-tight tracking-tight">PULSE</span>
            </div>
            <h1 className="text-3xl font-bold text-primary">PULSE</h1>
          </div>
          <p className="text-muted-foreground">
            Reset your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription className="text-green-600">
                    Password reset link has been sent to your email address. Please check your inbox and follow the instructions.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
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
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/login')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

