"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Jab auth load ho jaye aur user na mile → login pe bhej do
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // Agar user mil gaya aur role-based dashboard open nahi hua to redirect kare
    if (!loading && user) {
      const roleRoutes = {
        admin: "/admin/dashboard",
        provider: "/provider/dashboard",
        reception: "/reception/dashboard",
        client: "/client/dashboard",
      };

      const target = roleRoutes[user.role];

      // Agar koi aur dashboard khol raha hai jo uske role se match nahi karta
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role) &&
        pathname !== target
      ) {
        router.replace(target); // auto redirect to apna dashboard
      }
    }
  }, [loading, user, router, pathname, allowedRoles]);

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
