"use client";

import React from "react";
import AppointmentForm from "./AppointmentForm";

export function AppointmentBooking({ onPageChange }) {
  const handleSuccess = () => {
    // Redirect to appointment list after successful booking
    console.log("✅ Appointment created successfully, redirecting to list");
    onPageChange("appointments/list");
  };

  return (
    <AppointmentForm 
      onPageChange={onPageChange}
      onSuccess={handleSuccess}
    />
  );
}
