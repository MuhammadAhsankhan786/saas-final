"use client";

import React from "react";
import AppointmentForm from "./AppointmentForm";

export function AppointmentBooking({ onPageChange }) {
  return (
    <AppointmentForm 
      onPageChange={onPageChange}
    />
  );
}
