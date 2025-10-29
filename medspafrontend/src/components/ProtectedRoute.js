"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login if user is not authenticated
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // Note: We don't do URL-based navigation anymore
    // All navigation is handled by state-based routing in page.js
  }, [loading, user, router]);

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
        <p className="text-red-500 text-lg">Access Denied</p>
      </div>
    );
  }

  return <>{children}</>;
}
