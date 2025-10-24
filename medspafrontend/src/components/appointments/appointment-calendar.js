"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  Plus,
  Filter,
} from "lucide-react";

// Mock appointment data
const appointments = [
  {
    id: "1",
    date: "2025-12-21",
    time: "9:00 AM",
    duration: 45,
    client: { name: "Emma Johnson", phone: "(555) 123-4567" },
    service: "Botox Consultation",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    status: "confirmed",
    color: "bg-blue-100 border-blue-200 text-blue-800",
  },
  {
    id: "2",
    date: "2025-12-21",
    time: "10:30 AM",
    duration: 30,
    client: { name: "Sarah Davis", phone: "(555) 234-5678" },
    service: "Dermal Filler",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    status: "in-progress",
    color: "bg-accent/10 border-accent/20 text-accent",
  },
  {
    id: "3",
    date: "2025-12-21",
    time: "1:00 PM",
    duration: 60,
    client: { name: "Jessica Martinez", phone: "(555) 345-6789" },
    service: "Hydrafacial",
    provider: "Dr. Johnson",
    location: "Westside Location",
    status: "confirmed",
    color: "bg-secondary/10 border-secondary/20 text-secondary",
  },
  {
    id: "4",
    date: "2025-12-22",
    time: "11:00 AM",
    duration: 90,
    client: { name: "Amanda Wilson", phone: "(555) 456-7890" },
    service: "PRP Treatment",
    provider: "Dr. Chen",
    location: "Downtown Clinic",
    status: "pending",
    color: "bg-warning/10 border-warning/20 text-warning",
  },
];

const timeSlots = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM",
  "2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM",
  "5:00 PM","5:30 PM","6:00 PM",
];

const providers = ["All Providers", "Dr. Chen", "Dr. Johnson", "Dr. Smith"];
const locations = ["All Locations", "Downtown Clinic", "Westside Location", "Northside Branch"];

export function AppointmentCalendar({ onPageChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [view, setView] = useState("day");

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getTodaysAppointments = () => {
    const today = currentDate.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === today);
  };

  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of week for the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Get last day of week for the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getAppointmentsForDate = (date) => {
    const dateString = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateString);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Calendar</h1>
          <p className="text-muted-foreground">Manage your appointment schedule</p>
        </div>
        <Button
          onClick={() => onPageChange("appointments/book")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-[200px] bg-input-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-[200px] bg-input-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="border-border hover:bg-primary/5 hover:border-primary/30"
        >
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Calendar Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
                className="border-border hover:bg-primary/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-foreground">
                {formatDate(currentDate)}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
                className="border-border hover:bg-primary/5"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={setView}>
              <TabsList className="bg-muted">
                <TabsTrigger
                  value="day"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Day
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={view}>
            {/* Day View */}
            <TabsContent value="day" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Time Slots */}
                <div className="lg:col-span-1">
                  <h3 className="font-medium mb-4 text-foreground">Time Slots</h3>
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="text-sm text-muted-foreground p-2 border-r border-border hover:bg-muted/50 transition-colors"
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appointments */}
                <div className="lg:col-span-3">
                  <h3 className="font-medium mb-4 text-foreground">
                    Appointments for {formatDate(currentDate)}
                  </h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {getTodaysAppointments().length > 0 ? (
                      getTodaysAppointments().map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-4 rounded-lg border ${appointment.color} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{appointment.time}</span>
                                <span className="text-sm">
                                  ({appointment.duration} min)
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-lg">{appointment.client.name}</p>
                                <p className="text-sm font-medium">{appointment.service}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {appointment.provider}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {appointment.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                appointment.status === "confirmed"
                                  ? "outline"
                                  : appointment.status === "in-progress"
                                  ? "default"
                                  : appointment.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                appointment.status === "confirmed"
                                  ? "border-secondary text-secondary"
                                  : appointment.status === "in-progress"
                                  ? "bg-accent text-accent-foreground"
                                  : appointment.status === "pending"
                                  ? "bg-warning/10 text-warning border-warning"
                                  : ""
                              }
                            >
                              {appointment.status.replace("-", " ")}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No Appointments</h3>
                        <p className="text-muted-foreground mb-4">
                          No appointments scheduled for this day
                        </p>
                        <Button
                          onClick={() => onPageChange("appointments/book")}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Book Appointment
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Week View */}
            <TabsContent value="week" className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {getWeekDates().map((date, index) => {
                  const dayAppointments = appointments.filter(
                    (apt) => apt.date === date.toISOString().split("T")[0]
                  );
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`border border-border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors ${
                        isToday ? "bg-primary/10 border-primary" : ""
                      }`}
                    >
                      <div className="text-center mb-3">
                        <div className="text-sm text-muted-foreground">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className={`text-lg font-semibold ${
                          isToday ? "text-primary" : "text-foreground"
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {dayAppointments.length > 0 ? (
                          dayAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className={`p-2 rounded text-xs ${appointment.color}`}
                              title={`${appointment.time} - ${appointment.client.name} - ${appointment.service}`}
                            >
                              <div className="font-medium truncate text-foreground">
                                {appointment.time}
                              </div>
                              <div className="truncate text-foreground">
                                {appointment.client.name}
                              </div>
                              <div className="truncate text-muted-foreground">
                                {appointment.service}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No appointments
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Month View */}
            <TabsContent value="month" className="space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
                    {day}
                  </div>
                ))}
                
                {/* Calendar dates */}
                {getMonthDates().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayAppointments = getAppointmentsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                        !isCurrentMonth ? "opacity-30" : ""
                      } ${isToday ? "bg-primary/10 border-primary" : ""}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? "text-primary font-bold" : "text-foreground"
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((appointment) => (
                          <div
                            key={appointment.id}
                            className={`text-xs p-1 rounded truncate ${appointment.color}`}
                            title={`${appointment.time} - ${appointment.client.name} - ${appointment.service}`}
                          >
                            <div className="font-medium">{appointment.time}</div>
                            <div className="truncate">{appointment.client.name}</div>
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Today's Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {getTodaysAppointments().length}
            </div>
            <p className="text-xs text-muted-foreground">Appointments scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Available Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground">Open time slots today</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">68%</div>
            <p className="text-xs text-muted-foreground">Calendar utilization</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
