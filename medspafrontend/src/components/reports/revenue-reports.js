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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { getRevenueReport } from "@/lib/api";

// Mock revenue data
const revenueData = [
  { month: "Jan", revenue: 32000, appointments: 145, newClients: 28 },
  { month: "Feb", revenue: 28000, appointments: 132, newClients: 24 },
  { month: "Mar", revenue: 35000, appointments: 156, newClients: 31 },
  { month: "Apr", revenue: 41000, appointments: 178, newClients: 35 },
  { month: "May", revenue: 38000, appointments: 165, newClients: 29 },
  { month: "Jun", revenue: 47000, appointments: 198, newClients: 42 },
];

const serviceRevenue = [
  { service: "Botox Injections", revenue: 12500, percentage: 26.6 },
  { service: "Dermal Fillers", revenue: 9800, percentage: 20.9 },
  { service: "Hydrafacial", revenue: 7200, percentage: 15.3 },
  { service: "IV Therapy", revenue: 5900, percentage: 12.6 },
  { service: "Laser Hair Removal", revenue: 4800, percentage: 10.2 },
  { service: "Other Services", revenue: 4800, percentage: 10.2 },
];

const monthlyComparison = [
  { metric: "Total Revenue", current: 47000, previous: 38000, change: 23.7 },
  { metric: "Appointments", current: 198, previous: 165, change: 20.0 },
  { metric: "New Clients", current: 42, previous: 29, change: 44.8 },
  { metric: "Average Revenue per Client", current: 237, previous: 262, change: -9.5 },
];

const COLORS = ['#00A8E8', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export function RevenueReports({ onPageChange }) {
  const [revenueData, setRevenueData] = useState([]);
  const [serviceRevenue, setServiceRevenue] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("6months");
  const [chartType, setChartType] = useState("line");

  // Load revenue data from API
  useEffect(() => {
    async function loadRevenueData() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          period: timeRange,
          format: 'chart'
        };
        const data = await getRevenueReport(params);
        setRevenueData(data?.chartData || []);
        setServiceRevenue(data?.serviceRevenue || []);
        setMonthlyComparison(data?.comparison || []);
      } catch (err) {
        console.error("Error loading revenue data:", err);
        setError("Failed to load revenue data.");
      } finally {
        setLoading(false);
      }
    }
    loadRevenueData();
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

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to download reports");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/reports/revenue/pdf?period=${timeRange}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${timeRange}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading revenue report:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading revenue data...</span>
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
            <h1 className="text-2xl font-bold text-foreground">Revenue Reports</h1>
            <p className="text-muted-foreground">Analyze revenue trends and performance metrics</p>
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
        {monthlyComparison.map((item, index) => {
          // Handle both API data structure (month, revenue, growth) and mock data structure (metric, current, change)
          const metric = item.metric || item.month || "Unknown Metric";
          const current = item.current || item.revenue || 0;
          const change = item.change || item.growth || 0;
          const isRevenue = (item.metric && item.metric.includes("Revenue")) || (item.month && item.revenue !== undefined);
          
          return (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {isRevenue ? formatCurrency(current) : current}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(change)}
                  <span className={`text-sm ${getChangeColor(change)}`}>
                    {formatPercentage(change)} from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Controls */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Revenue Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[120px] bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">
                    <div className="flex items-center space-x-2">
                      <LineChart className="h-4 w-4" />
                      <span>Line</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Bar</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <RechartsLineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? "Revenue" : 
                      name === "appointments" ? "Appointments" : "New Clients"
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00A8E8"
                    strokeWidth={3}
                    dot={{ fill: "#00A8E8", strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#4ECDC4"
                    strokeWidth={2}
                    dot={{ fill: "#4ECDC4", strokeWidth: 2, r: 3 }}
                  />
                </RechartsLineChart>
              ) : (
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? "Revenue" : 
                      name === "appointments" ? "Appointments" : "New Clients"
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#00A8E8" />
                  <Bar dataKey="appointments" fill="#4ECDC4" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Service Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Service Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={serviceRevenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {serviceRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Performing Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceRevenue.map((service, index) => (
                <div key={service.service || index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{service.service || "Unknown Service"}</p>
                      <p className="text-sm text-muted-foreground">{service.percentage || 0}% of total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(service.revenue || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Monthly Revenue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>New Clients</TableHead>
                  <TableHead>Avg Revenue/Appointment</TableHead>
                  <TableHead>Growth Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((month, index) => {
                  const prevMonth = index > 0 ? revenueData[index - 1] : null;
                  const growthRate = prevMonth && month.revenue && prevMonth.revenue
                    ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 
                    : 0;
                  const avgRevenuePerAppointment = month.revenue && month.appointments
                    ? month.revenue / month.appointments
                    : 0;

                  return (
                    <TableRow key={month.month || index}>
                      <TableCell className="font-medium text-foreground">{month.month || "Unknown"}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(month.revenue || 0)}
                      </TableCell>
                      <TableCell className="text-foreground">{month.appointments || 0}</TableCell>
                      <TableCell className="text-foreground">{month.newClients || 0}</TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(avgRevenuePerAppointment)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getChangeIcon(growthRate)}
                          <span className={`text-sm ${getChangeColor(growthRate)}`}>
                            {formatPercentage(growthRate)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              <h4 className="font-semibold text-foreground mb-3">Revenue Highlights</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• June showed the highest revenue at {formatCurrency(47000)}</li>
                <li>• Botox injections are the top revenue generator at {formatCurrency(12500)}</li>
                <li>• Average monthly growth rate is 15.2%</li>
                <li>• Client acquisition increased by 44.8% this month</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Focus marketing efforts on Botox and Dermal Fillers</li>
                <li>• Consider expanding Hydrafacial services</li>
                <li>• Implement referral program to maintain client growth</li>
                <li>• Optimize pricing for underperforming services</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
