"use client";

import React, { useState } from "react";
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
import { Calendar, Plus, CheckCircle, Clock, Phone, User, CalendarDays } from "lucide-react";

// Mock data
const todaysCheckIns = [
  {
    id: "1",
    time: "9:00 AM",
    client: {
      name: "Emma Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332b82?w=150&h=150&fit=crop&crop=face",
      phone: "(555) 123-4567",
    },
    service: "Botox Consultation",
    provider: "Dr. Chen",
    status: "checked-in",
  },
  {
    id: "2",
    time: "10:30 AM",
    client: {
      name: "Sarah Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      phone: "(555) 234-5678",
    },
    service: "Dermal Filler",
    provider: "Dr. Chen",
    status: "in-treatment",
  },
  {
    id: "3",
    time: "1:00 PM",
    client: {
      name: "Jessica Martinez",
      avatar:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=face",
      phone: "(555) 345-6789",
    },
    service: "Hydrafacial",
    provider: "Dr. Johnson",
    status: "waiting",
  },
  {
    id: "4",
    time: "2:30 PM",
    client: {
      name: "Amanda Wilson",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      phone: "(555) 456-7890",
    },
    service: "PRP Treatment",
    provider: "Dr. Chen",
    status: "pending",
  },
];

const upcomingWeek = [
  { day: "Mon", date: "23", appointments: 12 },
  { day: "Tue", date: "24", appointments: 15 },
  { day: "Wed", date: "25", appointments: 8 },
  { day: "Thu", date: "26", appointments: 6 },
  { day: "Fri", date: "27", appointments: 14 },
  { day: "Sat", date: "28", appointments: 11 },
  { day: "Sun", date: "29", appointments: 5 },
];

const quickStats = {
  todaysAppointments: 4,
  checkedIn: 2,
  waitingRoom: 1,
  completedToday: 8,
};

export default function ReceptionDashboard({ onPageChange }) {
  const [selectedView, setSelectedView] = useState("day");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reception Dashboard</h1>
          <p className="text-muted-foreground">
            Saturday, December 21, 2025
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
                  <p className="text-muted-foreground">4 appointments scheduled</p>
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
            {todaysCheckIns.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="text-center min-w-[60px] font-semibold text-sm">
                  {appointment.time}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={appointment.client.avatar}
                    alt={appointment.client.name}
                  />
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
            ))}
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
