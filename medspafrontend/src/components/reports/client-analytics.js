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
  PieChart,
  UserPlus,
  Clock,
  DollarSign,
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
import { getClientRetentionReport } from "@/lib/api";
import { notify } from "@/lib/toast";

// Chart colors
const COLORS = ['#00A8E8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export function ClientAnalytics({ onPageChange }) {
  const [clientGrowthData, setClientGrowthData] = useState([]);
  const [retentionData, setRetentionData] = useState([]);
  const [demographicsData, setDemographicsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("6months");
  const [chartType, setChartType] = useState("line");

  // Load client analytics data from API
  useEffect(() => {
    async function loadClientAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          period: timeRange,
          format: 'chart'
        };
        const data = await getClientRetentionReport(params);
        setClientGrowthData(data?.growthData || []);
        setRetentionData(data?.retentionData || []);
        setDemographicsData(data?.demographicsData || []);
      } catch (err) {
        console.error("Error loading client analytics:", err);
        setError("Failed to load client analytics data.");
      } finally {
        setLoading(false);
      }
    }
    loadClientAnalytics();
  }, [timeRange]);

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

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

  const getSegmentBadgeVariant = (segment) => {
    switch (segment) {
      case "VIP":
        return "default";
      case "Regular":
        return "outline";
      case "New":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.error("Please log in to download reports");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/clients/analytics/pdf`, {
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
      a.download = 'client-analytics.pdf';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify.success("Client analytics report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading client analytics report:", error);
      notify.error("Failed to generate PDF. Please try again.");
    }
  };

  const totalClients = clientGrowthData && clientGrowthData.length > 0 ? clientGrowthData[clientGrowthData.length - 1].totalClients : 0;
  const newClientsThisMonth = clientGrowthData && clientGrowthData.length > 0 ? clientGrowthData[clientGrowthData.length - 1].newClients : 0;
  const returningClientsThisMonth = clientGrowthData && clientGrowthData.length > 0 ? clientGrowthData[clientGrowthData.length - 1].returningClients : 0;
  const clientRetentionRate = 85.2;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading client analytics...</span>
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

  if (!clientGrowthData || clientGrowthData.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Client Data Available</h3>
        <p className="text-muted-foreground mb-4">
          There are no clients in the system yet. Add some clients to see analytics data.
        </p>
        <Button onClick={() => onPageChange('clients')}>
          Go to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("dashboard")}
            className="border-border hover:bg-primary/5 w-full sm:w-auto"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Client Analytics</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Analyze client behavior and engagement metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
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
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalClients}</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+8.6% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              New Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{newClientsThisMonth}</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+44.8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{clientRetentionRate}%</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+2.1% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Avg Revenue/Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$195</div>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">-5.2% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Growth Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Client Growth Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[120px] bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
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
                <RechartsLineChart data={clientGrowthData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="newClients"
                    stroke="#00A8E8"
                    strokeWidth={3}
                    dot={{ fill: "#00A8E8", strokeWidth: 2, r: 4 }}
                    name="New Clients"
                  />
                  <Line
                    type="monotone"
                    dataKey="returningClients"
                    stroke="#4ECDC4"
                    strokeWidth={3}
                    dot={{ fill: "#4ECDC4", strokeWidth: 2, r: 4 }}
                    name="Returning Clients"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalClients"
                    stroke="#FF6B6B"
                    strokeWidth={3}
                    dot={{ fill: "#FF6B6B", strokeWidth: 2, r: 4 }}
                    name="Total Clients"
                  />
                </RechartsLineChart>
              ) : (
                <BarChart data={clientGrowthData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newClients" fill="#00A8E8" name="New Clients" />
                  <Bar dataKey="returningClients" fill="#4ECDC4" name="Returning Clients" />
                  <Bar dataKey="totalClients" fill="#FF6B6B" name="Total Clients" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Client Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Client Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={clientSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {clientSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Segment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientSegments.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{segment.segment}</p>
                      <p className="text-sm text-muted-foreground">{segment.count} clients</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(segment.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{segment.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Clients by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatCurrency(client.totalSpent)}
                    </TableCell>
                    <TableCell className="text-foreground">{client.appointments}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {new Date(client.lastVisit).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSegmentBadgeVariant(client.segment)}>
                        {client.segment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === "active" ? "outline" : "secondary"}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
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
              <h4 className="font-semibold text-foreground mb-3">Client Behavior</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Client retention rate increased to 85.2%</li>
                <li>• VIP clients generate 52% of total revenue</li>
                <li>• Average client lifetime value is $1,250</li>
                <li>• Referral rate increased by 23% this month</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement VIP client loyalty program</li>
                <li>• Focus on converting new clients to regulars</li>
                <li>• Create targeted campaigns for inactive clients</li>
                <li>• Enhance referral program incentives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
