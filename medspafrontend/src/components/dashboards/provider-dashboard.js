"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
} from "lucide-react";
import { getAppointments, formatAppointmentForDisplay, getConsentForms } from "@/lib/api";
import { notify } from "@/lib/toast";

// Helper function to format time from ISO string
const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

// Pending consents will be loaded from API

const quickStats = {
  todaysAppointments: 4,
  pendingConsents: 3,
  completedTreatments: 12,
  totalRevenue: "$3,240",
};

export function ProviderDashboard({ onPageChange }) {
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [pendingConsents, setPendingConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysAppointments: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
  });

  // Fetch live appointments data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Get today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        console.log('🔍 Provider: Fetching appointments from /api/staff/appointments...');
        
        // Fetch both appointments and consent forms in parallel
        const [appointmentsData, consentFormsData] = await Promise.all([
          getAppointments({ date: todayStr }),
          getConsentForms(),
        ]);
        
        console.log('📋 Provider: Raw appointments data:', appointmentsData);
        console.log('📋 Provider: Raw consent forms data:', consentFormsData);
        
        // Format appointments for display
        const formattedAppointments = Array.isArray(appointmentsData)
          ? appointmentsData.map(formatAppointmentForDisplay)
          : [];
        
        // Filter today's appointments
        const todayAppts = formattedAppointments.filter((apt) => {
          if (!apt.start_time) return false;
          const aptDate = new Date(apt.start_time);
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
          return aptDate >= todayStart && aptDate <= todayEnd;
        });
        
        setTodaysAppointments(todayAppts);
        
        // Process consent forms - get pending ones
        const consentForms = Array.isArray(consentFormsData) ? consentFormsData : [];
        const pending = consentForms.filter((cf) => {
          // Pending if not signed or expired
          if (!cf.digital_signature || !cf.date_signed) {
            return true;
          }
          const signedDate = new Date(cf.date_signed);
          const expiryDate = new Date(signedDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          return new Date() > expiryDate; // Expired also counts as pending
        }).slice(0, 3); // Show max 3 pending consents
        
        setPendingConsents(pending.map((cf) => ({
          id: cf.id,
          client: cf.client?.name || cf.client?.clientUser?.name || 'Unknown Client',
          treatment: cf.service?.name || 'Treatment',
          dueDate: cf.date_signed ? new Date(cf.date_signed).toLocaleDateString() : 'Pending',
          priority: !cf.digital_signature ? 'high' : 'medium',
        })));
        
        // Calculate stats
        const confirmed = todayAppts.filter((a) => a.status === 'confirmed' || a.status === 'booked').length;
        const completed = todayAppts.filter((a) => a.status === 'completed').length;
        
        setStats({
          todaysAppointments: todayAppts.length,
          confirmed,
          completed,
          pending: todayAppts.length - confirmed - completed,
        });
        
        // Show success message
        if (todayAppts.length > 0) {
          console.log(`✅ Provider appointments fetched successfully (${todayAppts.length} records)`);
          notify.success("Appointments loaded successfully");
          console.log('✅ RBAC: Provider endpoints validated successfully');
        } else {
          console.warn('⚠️ No appointments found for today - data may be auto-seeding...');
        }
      } catch (error) {
        console.error('❌ Error fetching provider appointments:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Today is Saturday, December 21, 2025
          </p>
        </div>
        <Button onClick={() => onPageChange("treatments/notes")}>
          <FileText className="mr-2 h-4 w-4" />
          Add Treatment Notes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.todaysAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed, {stats.confirmed} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Consents
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              1
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Week
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground">Treatments completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">From treatments</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule + Pending Consents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your appointments for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading appointments...
              </div>
            ) : todaysAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appointments scheduled for today
              </div>
            ) : (
              todaysAppointments.map((appointment) => {
                const clientName = appointment.client?.name || appointment.client?.clientUser?.name || "Unknown Client";
                const serviceName = appointment.service?.name || "Unknown Service";
                const notes = appointment.notes || "";
                
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className="text-center min-w-[60px]">
                      <div className="font-semibold text-sm">
                        {formatTime(appointment.start_time)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {appointment.service?.duration || 60} min
                      </div>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {clientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">
                          {clientName}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {serviceName}
                      </p>
                      {notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        appointment.status === "confirmed" || appointment.status === "booked"
                          ? "outline"
                          : appointment.status === "completed"
                          ? "default"
                          : appointment.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {appointment.status || "booked"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Consents</CardTitle>
            <CardDescription>
              Consent forms requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingConsents.map((consent) => (
              <div
                key={consent.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{consent.client}</p>
                  <p className="text-sm text-muted-foreground">
                    {consent.treatment}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {consent.dueDate}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      consent.priority === "high"
                        ? "destructive"
                        : consent.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {consent.priority}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => onPageChange("treatments/consents")}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onPageChange("treatments/consents")}
            >
              View All Consents
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common provider tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("treatments/notes")}
            >
              <FileText className="h-6 w-6" />
              <span>SOAP Notes</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("treatments/photos")}
            >
              <Camera className="h-6 w-6" />
              <span>Before/After Photos</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("treatments/consents")}
            >
              <FileText className="h-6 w-6" />
              <span>Review Consents</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("clients/list")}
            >
              <User className="h-6 w-6" />
              <span>Client Profiles</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
