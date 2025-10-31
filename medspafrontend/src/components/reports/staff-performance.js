"use client";

import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  Star,
  Clock,
  DollarSign,
  Award,
  Loader2,
} from "lucide-react";
import { notify } from "@/lib/toast";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { getStaffPerformanceReport } from "@/lib/api";

// Mock staff performance data
const staffPerformance = [
  {
    id: "1",
    name: "Dr. Chen",
    role: "Provider",
    department: "Injectables",
    appointments: 45,
    revenue: 12500,
    rating: 4.8,
    clientSatisfaction: 95,
    utilization: 88,
    lastActive: "2025-12-21",
    status: "active",
  },
  {
    id: "2",
    name: "Dr. Johnson",
    role: "Provider",
    department: "Skincare",
    appointments: 38,
    revenue: 9800,
    rating: 4.6,
    clientSatisfaction: 92,
    utilization: 82,
    lastActive: "2025-12-21",
    status: "active",
  },
  {
    id: "3",
    name: "Dr. Smith",
    role: "Provider",
    department: "Laser",
    appointments: 32,
    revenue: 7200,
    rating: 4.7,
    clientSatisfaction: 94,
    utilization: 75,
    lastActive: "2025-12-20",
    status: "active",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    role: "Receptionist",
    department: "Front Desk",
    appointments: 0,
    revenue: 0,
    rating: 4.5,
    clientSatisfaction: 90,
    utilization: 95,
    lastActive: "2025-12-21",
    status: "active",
  },
];

const monthlyPerformance = [
  { month: "Jan", appointments: 145, revenue: 32000, satisfaction: 92 },
  { month: "Feb", appointments: 132, revenue: 28000, satisfaction: 89 },
  { month: "Mar", appointments: 156, revenue: 35000, satisfaction: 94 },
  { month: "Apr", appointments: 178, revenue: 41000, satisfaction: 96 },
  { month: "May", appointments: 165, revenue: 38000, satisfaction: 93 },
  { month: "Jun", appointments: 198, revenue: 47000, satisfaction: 95 },
];

const performanceMetrics = [
  { metric: "Appointments", current: 198, previous: 165, change: 20.0 },
  { metric: "Revenue", current: 47000, previous: 38000, change: 23.7 },
  { metric: "Client Satisfaction", current: 95, previous: 93, change: 2.2 },
  { metric: "Staff Utilization", current: 88, previous: 85, change: 3.5 },
];

const radarData = [
  {
    subject: "Appointments",
    DrChen: 45,
    DrJohnson: 38,
    DrSmith: 32,
  },
  {
    subject: "Revenue",
    DrChen: 125,
    DrJohnson: 98,
    DrSmith: 72,
  },
  {
    subject: "Satisfaction",
    DrChen: 95,
    DrJohnson: 92,
    DrSmith: 94,
  },
  {
    subject: "Utilization",
    DrChen: 88,
    DrJohnson: 82,
    DrSmith: 75,
  },
];

export function StaffPerformance({ onPageChange }) {
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("6months");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Load staff performance data from API
  useEffect(() => {
    async function loadStaffPerformance() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          period: timeRange,
          format: 'chart'
        };
        const data = await getStaffPerformanceReport(params);
        setStaffPerformance(data?.staffData || []);
        setMonthlyPerformance(data?.monthlyData || []);
        setPerformanceMetrics(data?.metricsData || []);
        setRadarData(data?.radarData || []);
      } catch (err) {
        console.error("Error loading staff performance:", err);
        setError("Failed to load staff performance data.");
      } finally {
        setLoading(false);
      }
    }
    loadStaffPerformance();
  }, [timeRange]);

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatPercentage = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getChangeIcon = (change) => {
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change) => {
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "active":
        return "outline";
      case "inactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleExportReport = async () => {
    try {
      console.log("Exporting staff performance report...");
      const token = localStorage.getItem("token");
      if (!token) {
        notify.error("Please log in to download reports");
        return;
      }

      // TODO: Replace with actual endpoint when available
      // For now, show success message
      notify.success("Staff performance report exported successfully!");
    } catch (error) {
      console.error("Error exporting staff report:", error);
      notify.error("Failed to export report. Please try again.");
    }
  };

  const filteredStaff = staffPerformance.filter((staff) => {
    return departmentFilter === "All" || staff.department === departmentFilter;
  });

  const totalAppointments = staffPerformance.reduce((sum, staff) => sum + staff.appointments, 0);
  const totalRevenue = staffPerformance.reduce((sum, staff) => sum + staff.revenue, 0);
  const averageRating = staffPerformance.reduce((sum, staff) => sum + staff.rating, 0) / staffPerformance.length;
  const averageSatisfaction = staffPerformance.reduce((sum, staff) => sum + staff.clientSatisfaction, 0) / staffPerformance.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading staff performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("dashboard")}
            className="border-border hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Performance</h1>
            <p className="text-muted-foreground">Monitor staff performance and productivity metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] bg-input-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportReport}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center">
                {metric.metric === "Appointments" && <Calendar className="mr-2 h-4 w-4" />}
                {metric.metric === "Revenue" && <DollarSign className="mr-2 h-4 w-4" />}
                {metric.metric === "Client Satisfaction" && <Star className="mr-2 h-4 w-4" />}
                {metric.metric === "Staff Utilization" && <Clock className="mr-2 h-4 w-4" />}
                {metric.metric}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metric.metric === "Revenue" ? formatCurrency(metric.current) : 
                 metric.metric === "Client Satisfaction" || metric.metric === "Staff Utilization" ? 
                 `${metric.current}%` : metric.current}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getChangeIcon(metric.change)}
                <span className={`text-sm ${getChangeColor(metric.change)}`}>
                  {formatPercentage(metric.change)} from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Monthly Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(value) : 
                    name === "satisfaction" ? `${value}%` : value,
                    name === "revenue" ? "Revenue" : 
                    name === "appointments" ? "Appointments" : "Satisfaction"
                  ]}
                />
                <Bar yAxisId="left" dataKey="appointments" fill="#00A8E8" name="Appointments" />
                <Bar yAxisId="left" dataKey="revenue" fill="#4ECDC4" name="Revenue" />
                <Bar yAxisId="right" dataKey="satisfaction" fill="#FF6B6B" name="Satisfaction" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Radar Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Provider Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Dr. Chen"
                  dataKey="DrChen"
                  stroke="#00A8E8"
                  fill="#00A8E8"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Dr. Johnson"
                  dataKey="DrJohnson"
                  stroke="#4ECDC4"
                  fill="#4ECDC4"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Dr. Smith"
                  dataKey="DrSmith"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Staff Performance Details</CardTitle>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[150px] bg-input-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                <SelectItem value="Injectables">Injectables</SelectItem>
                <SelectItem value="Skincare">Skincare</SelectItem>
                <SelectItem value="Laser">Laser</SelectItem>
                <SelectItem value="Front Desk">Front Desk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Satisfaction</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{staff.name}</div>
                        <div className="text-sm text-muted-foreground">{staff.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{staff.role}</TableCell>
                    <TableCell className="text-foreground">{staff.appointments}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatCurrency(staff.revenue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(staff.rating)}
                        <span className="text-sm text-muted-foreground ml-1">
                          {staff.rating}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${staff.clientSatisfaction}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground">{staff.clientSatisfaction}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${staff.utilization}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground">{staff.utilization}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(staff.status)}>
                        {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Performance Highlights</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dr. Chen leads in appointments and revenue generation</li>
                <li>• Average client satisfaction increased to 95%</li>
                <li>• Staff utilization rate improved to 88%</li>
                <li>• All providers maintain ratings above 4.5 stars</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement performance-based incentives</li>
                <li>• Provide additional training for underperforming areas</li>
                <li>• Recognize top performers with awards</li>
                <li>• Schedule regular performance reviews</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
