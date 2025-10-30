"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { notify } from "../lib/toast";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login if user is not authenticated
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // Check if user's role is allowed for this route
    if (
      !loading &&
      user &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role)
    ) {
      // Show toast notification
      notify.error(`Access restricted for ${user.role} role`);
      
      // Redirect to dashboard on unauthorized access
      // Using setTimeout to allow toast to show
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('navigate', { detail: { page: 'dashboard' } });
          window.dispatchEvent(event);
        }
      }, 500);
    }
  }, [loading, user, allowedRoles, router]);

  // Loader jab tak verify ho raha hai
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  // Agar unauthorized access attempt ho
  if (
    allowedRoles.length > 0 &&
    user &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold mb-2">Access Denied</p>
          <p className="text-muted-foreground text-sm">
            Your role ({user.role}) does not have permission to access this page.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
