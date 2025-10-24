"use client";

import React from "react";
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

// Mock data for today's appointments
const todaysAppointments = [
  {
    id: "1",
    time: "9:00 AM",
    client: {
      name: "Emma Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332b82?w=150&h=150&fit=crop&crop=face",
      age: 34,
    },
    service: "Botox Consultation",
    duration: "45 min",
    status: "confirmed",
    notes: "First-time client, interested in forehead treatment",
  },
  {
    id: "2",
    time: "10:30 AM",
    client: {
      name: "Sarah Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      age: 42,
    },
    service: "Dermal Filler Touch-up",
    duration: "30 min",
    status: "in-progress",
    notes: "Follow-up for lip filler, check symmetry",
  },
  {
    id: "3",
    time: "1:00 PM",
    client: {
      name: "Jessica Martinez",
      avatar:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=face",
      age: 28,
    },
    service: "Hydrafacial + LED",
    duration: "60 min",
    status: "confirmed",
    notes: "Regular monthly treatment, sensitive skin",
  },
  {
    id: "4",
    time: "2:30 PM",
    client: {
      name: "Amanda Wilson",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      age: 36,
    },
    service: "PRP Microneedling",
    duration: "90 min",
    status: "pending",
    notes: "New treatment plan, discuss expectations",
  },
];

const pendingConsents = [
  {
    id: "1",
    client: "Emma Johnson",
    treatment: "Botox Injections",
    dueDate: "Today",
    priority: "high",
  },
  {
    id: "2",
    client: "Michael Chen",
    treatment: "Laser Resurfacing",
    dueDate: "Tomorrow",
    priority: "medium",
  },
  {
    id: "3",
    client: "Lisa Anderson",
    treatment: "Chemical Peel",
    dueDate: "Dec 22",
    priority: "low",
  },
];

const quickStats = {
  todaysAppointments: 4,
  pendingConsents: 3,
  completedTreatments: 12,
  totalRevenue: "$3,240",
};

export function ProviderDashboard({ onPageChange }) {
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
              {quickStats.todaysAppointments}
            </div>
            <p className="text-xs text-muted-foreground">
              2 completed, 2 remaining
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
              {quickStats.pendingConsents}
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
              {quickStats.completedTreatments}
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
            {todaysAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="text-center min-w-[60px]">
                  <div className="font-semibold text-sm">{appointment.time}</div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.duration}
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <p className="font-medium truncate">
                      {appointment.client.name}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      ({appointment.client.age}y)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {appointment.notes}
                  </p>
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
                >
                  {appointment.status.replace("-", " ")}
                </Badge>
              </div>
            ))}
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
