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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { Calendar, Plus, CheckCircle, Clock, Phone, User, CalendarDays, Loader2 } from "lucide-react";
import { getAppointments, getPayments } from "@/lib/api";
import { notify } from "@/lib/toast";
import { forceSeedReceptionData } from "@/lib/forceSeed";

export default function ReceptionDashboard({ onPageChange }) {
  const [selectedView, setSelectedView] = useState("day");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysAppointments: 0,
    checkedIn: 0,
    waitingRoom: 0,
    completedToday: 0,
  });
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [todaysPayments, setTodaysPayments] = useState([]);

  // Load live data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        // Fetch appointments and payments
        const [appointmentsData, paymentsData] = await Promise.all([
          getAppointments({
            date: today.toISOString().split('T')[0],
          }),
          getPayments({}),
        ]);
        
        // Filter today's appointments
        const todayAppts = Array.isArray(appointmentsData) 
          ? appointmentsData.filter(apt => {
              if (!apt.start_time) return false;
              const aptDate = new Date(apt.start_time);
              return aptDate >= startOfDay && aptDate <= endOfDay;
            })
          : [];
        
        setTodaysAppointments(todayAppts);
        
        // Calculate stats
        const completed = todayAppts.filter(a => a.status === 'completed').length;
        const booked = todayAppts.filter(a => a.status === 'booked').length;
        const cancelled = todayAppts.filter(a => a.status === 'cancelled').length;
        
        setStats({
          todaysAppointments: todayAppts.length,
          checkedIn: booked,
          waitingRoom: todayAppts.filter(a => a.status === 'booked' && new Date(a.start_time) <= new Date()).length,
          completedToday: completed,
        });
        
        // Filter today's payments
        const todayPayments = Array.isArray(paymentsData)
          ? paymentsData.filter(p => {
              if (!p.created_at) return false;
              const payDate = new Date(p.created_at);
              return payDate >= startOfDay && payDate <= endOfDay;
            })
          : [];
        setTodaysPayments(todayPayments);
        
        console.log('✅ RBAC: Reception dashboard loaded live data from /reception/* endpoints');
        console.log('✅ Reception dashboard data loaded successfully');
        console.log('✅ Loaded from /api/reception/* endpoints');
        
        // Auto-force-seed if all endpoints return empty (development helper)
        const allEmpty = todayAppts.length === 0 && (!paymentsData || paymentsData.length === 0);
        if (allEmpty && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ All data is empty. Auto-triggering force seed...');
          try {
            await forceSeedReceptionData();
            // Reload data after seeding
            const [newAppts, newPayments] = await Promise.all([
              getAppointments({ date: today.toISOString().split('T')[0] }),
              getPayments({}),
            ]);
            const newTodayAppts = Array.isArray(newAppts) 
              ? newAppts.filter(apt => {
                  if (!apt.start_time) return false;
                  const aptDate = new Date(apt.start_time);
                  return aptDate >= startOfDay && aptDate <= endOfDay;
                })
              : [];
            setTodaysAppointments(newTodayAppts);
            setTodaysPayments(newPayments || []);
            notify.success('Database seeded and data loaded successfully');
          } catch (seedError) {
            console.error('Auto-seed failed:', seedError);
          }
        } else {
          // Success toast for dashboard data
          try {
            // Show a special toast if seeded sample data is detected
            const hasSeedAppts = todayAppts.some(a => (a.notes || '').toLowerCase().includes('sample appointment'));
            const hasSeedPayments = paymentsData && paymentsData.some(p => (p.amount === 150.00 || p.amount === 250.00));
            
            if (hasSeedAppts || hasSeedPayments) {
              notify.success('Sample data added successfully');
            } else {
              notify.success('Data loaded successfully');
            }
          } catch {}
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        notify.error("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const todaysCheckIns = todaysAppointments.slice(0, 4).map(apt => ({
    id: apt.id,
    time: formatTime(apt.start_time),
    client: {
      name: apt.client?.name || apt.client?.clientUser?.name || "Unknown Client",
      phone: apt.client?.phone || "",
      avatar: null, // No avatar URLs from API
    },
    service: apt.service?.name || "Service",
    provider: apt.provider?.name || apt.provider_id || "No Provider",
    status: apt.status === "completed" ? "checked-in" : apt.status === "booked" ? "waiting" : "pending",
  }));

  const upcomingWeek = (() => {
    const week = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      // Count appointments for this day (using all appointments, not just today's)
      // This would ideally fetch appointments for the week, but for now we'll show today's count
      const dayApps = i === 0 ? todaysAppointments.length : 0; // Only show today's count for now
      week.push({ day: dayName, date: String(dayNum), appointments: dayApps });
    }
    return week;
  })();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  const quickStats = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reception Dashboard</h1>
            <p className="text-muted-foreground">
              {formatDate(new Date())}
            </p>
          </div>
        <Button onClick={() => onPageChange("appointments/book")}>
          <Plus className="mr-2 h-4 w-4" /> Book Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.todaysAppointments}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{quickStats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">Clients checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Waiting Room</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{quickStats.waitingRoom}</div>
            <p className="text-xs text-muted-foreground">Currently waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Appointments finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Overview</CardTitle>
            <CardDescription>Weekly appointment overview</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedView} onValueChange={setSelectedView}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>

              {/* Day View */}
              <TabsContent value="day" className="space-y-4 mt-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Today's Schedule</h3>
                  <p className="text-muted-foreground">{quickStats.todaysAppointments} {quickStats.todaysAppointments === 1 ? 'appointment' : 'appointments'} scheduled</p>
                  <Button
                    className="mt-4"
                    onClick={() => onPageChange("appointments/calendar")}
                  >
                    View Calendar
                  </Button>
                </div>
              </TabsContent>

              {/* Week View */}
              <TabsContent value="week" className="mt-4">
                <div className="grid grid-cols-7 gap-2">
                  {upcomingWeek.map((day) => (
                    <div
                      key={day.day}
                      className="text-center p-2 border rounded"
                    >
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                      <div className="font-semibold">{day.date}</div>
                      <div className="text-xs mt-1">
                        <Badge variant="outline" className="text-xs">
                          {day.appointments}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Month View */}
              <TabsContent value="month" className="mt-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Month View</h3>
                  <p className="text-muted-foreground">Full calendar view</p>
                  <Button
                    className="mt-4"
                    onClick={() => onPageChange("appointments/calendar")}
                  >
                    Open Calendar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Today's Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Check-ins</CardTitle>
            <CardDescription>Manage client arrivals and check-ins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysCheckIns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appointments scheduled for today
              </div>
            ) : (
              todaysCheckIns.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="text-center min-w-[60px] font-semibold text-sm">
                    {appointment.time}
                  </div>
                  <Avatar className="h-10 w-10">
                    {appointment.client.avatar ? (
                      <AvatarImage
                        src={appointment.client.avatar}
                        alt={appointment.client.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      {appointment.client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{appointment.client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    with {appointment.provider}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge
                    variant={
                      appointment.status === "checked-in"
                        ? "default"
                        : appointment.status === "in-treatment"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {appointment.status.replace("-", " ")}
                  </Badge>
                  {appointment.status === "pending" && (
                    <Button size="sm" variant="outline">
                      Check In
                    </Button>
                  )}
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common reception tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("appointments/book")}
            >
              <Plus className="h-6 w-6" />
              <span>Book Appointment</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("clients/add")}
            >
              <User className="h-6 w-6" />
              <span>Add Client</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("payments/pos")}
            >
              <Phone className="h-6 w-6" />
              <span>Process Payment</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => onPageChange("appointments/list")}
            >
              <Calendar className="h-6 w-6" />
              <span>View All Appointments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
