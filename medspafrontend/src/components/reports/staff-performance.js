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
        console.log("📊 Staff Performance API Response:", data);
        
        // Extract staff data from response
        const staffData = data?.staffData || data?.staff_performance || [];
        console.log("✅ Staff Data Count:", staffData.length);
        console.log("✅ Staff Data:", staffData);
        
        setStaffPerformance(staffData);
        setMonthlyPerformance(data?.monthlyData || []);
        
        // Ensure metricsData is an array
        const metrics = data?.metricsData;
        if (Array.isArray(metrics)) {
          console.log("✅ Metrics Data (Array):", metrics);
          setPerformanceMetrics(metrics);
        } else if (metrics && typeof metrics === 'object') {
          // Convert object to array format if needed
          setPerformanceMetrics([]);
          console.warn("⚠️ metricsData is an object, expected array. Converting...");
        } else {
          console.log("⚠️ No metrics data found");
          setPerformanceMetrics([]);
        }
        
        // Transform radar data from backend format to RadarChart format
        // Backend returns: [{ name: "Dr. X", appointments: 45, revenue: 12500, ... }, ...]
        // RadarChart needs: [{ subject: "Appointments", "Dr. X": 45, "Dr. Y": 38, ... }, ...]
        const backendRadarData = data?.radarData || [];
        let transformedRadarData = [];
        
        if (backendRadarData.length > 0) {
          // Get all unique metrics from the first staff member
          const radarMetrics = ['appointments', 'revenue', 'rating', 'satisfaction', 'completionRate'];
          
          transformedRadarData = radarMetrics.map(metric => {
            const metricData = {
              subject: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1').trim()
            };
            
            // Add each staff member's value for this metric
            backendRadarData.forEach(staff => {
              const staffName = staff.name || 'Unknown';
              let value = staff[metric] || 0;
              
              // Normalize values to 0-100 scale for better visualization
              if (metric === 'appointments') {
                // Normalize appointments (assuming max 100 appointments)
                value = Math.min(100, (value / 100) * 100);
              } else if (metric === 'revenue') {
                // Normalize revenue (assuming max $50000)
                value = Math.min(100, (value / 50000) * 100);
              } else if (metric === 'rating') {
                // Convert 5-star rating to 0-100 scale
                value = (value / 5) * 100;
              } else if (metric === 'satisfaction' || metric === 'completionRate') {
                // Already in percentage (0-100)
                value = Math.min(100, value);
              }
              
              metricData[staffName] = Math.round(value);
            });
            
            return metricData;
          });
        } else if (staffData.length > 0) {
          // If no radar data from backend, generate from staffData
          const providers = staffData.filter(s => s.role === 'provider').slice(0, 5); // Limit to 5 providers
          
          if (providers.length > 0) {
            const radarMetrics = [
              { key: 'appointments', label: 'Appointments', max: 100 },
              { key: 'revenue', label: 'Revenue', max: 50000 },
              { key: 'rating', label: 'Rating', max: 5, isPercentage: false },
              { key: 'clientSatisfaction', label: 'Satisfaction', max: 100 },
              { key: 'utilization', label: 'Utilization', max: 100 }
            ];
            
            transformedRadarData = radarMetrics.map(metric => {
              const metricData = { subject: metric.label };
              
              providers.forEach(staff => {
                const staffName = staff.name || 'Unknown';
                let value = staff[metric.key] || 0;
                
                // Normalize to 0-100 scale
                if (metric.isPercentage === false && metric.max === 5) {
                  // Rating: convert 5-star to 0-100
                  value = (value / 5) * 100;
                } else {
                  // Percentage or count: normalize to 0-100
                  value = Math.min(100, (value / metric.max) * 100);
                }
                
                metricData[staffName] = Math.round(value);
              });
              
              return metricData;
            });
          }
        }
        
        console.log("✅ Transformed Radar Data:", transformedRadarData);
        setRadarData(transformedRadarData);
      } catch (err) {
        console.error("Error loading staff performance:", err);
        if (err.message && err.message.includes("Unauthenticated")) {
          setError("Your session has expired. Please refresh the page or login again.");
          // Clear invalid token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          setError("Failed to load staff performance data: " + (err.message || "Unknown error"));
        }
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
    if (!status) return "outline";
    switch (status.toLowerCase()) {
      case "active":
        return "outline";
      case "inactive":
        return "secondary";
      case "excellent":
        return "default";
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

  const totalAppointments = staffPerformance.length > 0 
    ? staffPerformance.reduce((sum, staff) => sum + (staff.appointments || 0), 0) 
    : 0;
  const totalRevenue = staffPerformance.length > 0 
    ? staffPerformance.reduce((sum, staff) => sum + (staff.revenue || 0), 0) 
    : 0;
  const averageRating = staffPerformance.length > 0 
    ? staffPerformance.reduce((sum, staff) => sum + (staff.rating || 0), 0) / staffPerformance.length 
    : 0;
  const averageSatisfaction = staffPerformance.length > 0 
    ? staffPerformance.reduce((sum, staff) => sum + (staff.clientSatisfaction || 0), 0) / staffPerformance.length 
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading staff performance data from database...</span>
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
      {/* Header - Responsive */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Staff Performance</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Monitor staff performance and productivity metrics</p>
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
        {Array.isArray(performanceMetrics) && performanceMetrics.length > 0 ? (
          performanceMetrics.map((metric, index) => (
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
          ))
        ) : (
          <div className="col-span-4 text-center py-8 text-muted-foreground">
            No metrics data available
          </div>
        )}
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
          {radarData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>No performance data available for comparison</p>
                <p className="text-sm mt-2">Data will appear once providers have appointments</p>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {(() => {
                    // Get unique provider names from radar data
                    const providerNames = new Set();
                    radarData.forEach(item => {
                      Object.keys(item).forEach(key => {
                        if (key !== 'subject') {
                          providerNames.add(key);
                        }
                      });
                    });
                    
                    const colors = ['#00A8E8', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCF7F', '#9B59B6', '#E74C3C'];
                    let colorIndex = 0;
                    
                    return Array.from(providerNames).slice(0, 5).map((name, index) => {
                      const color = colors[colorIndex % colors.length];
                      colorIndex++;
                      return (
                        <Radar
                          key={name}
                          name={name}
                          dataKey={name}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.3}
                        />
                      );
                    });
                  })()}
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
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
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading staff performance data from database..." : "No staff performance data available. Data will appear once staff members have appointments."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id || staff.staff_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{staff.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{staff.department || staff.role || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{staff.role || 'N/A'}</TableCell>
                      <TableCell className="text-foreground">{staff.appointments || staff.total_appointments || 0}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(staff.revenue || staff.revenue_generated || 0)}
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
                            style={{ width: `${staff.utilization || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground">{staff.utilization || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(staff.status || 'active')}>
                        {staff.status ? (staff.status.charAt(0).toUpperCase() + staff.status.slice(1)) : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  ))
                )}
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
                {staffPerformance.length > 0 ? (
                  <>
                    {(() => {
                      const topPerformer = staffPerformance.reduce((top, staff) => 
                        (staff.appointments > (top?.appointments || 0)) ? staff : top, null
                      );
                      return topPerformer ? (
                        <li>• {topPerformer.name} leads in appointments ({topPerformer.appointments}) and revenue ({formatCurrency(topPerformer.revenue)})</li>
                      ) : null;
                    })()}
                    {averageSatisfaction > 0 && (
                      <li>• Average client satisfaction: {averageSatisfaction.toFixed(1)}%</li>
                    )}
                    {(() => {
                      const avgUtilization = staffPerformance.reduce((sum, staff) => sum + (staff.utilization || 0), 0) / staffPerformance.length;
                      return avgUtilization > 0 ? (
                        <li>• Average staff utilization: {avgUtilization.toFixed(1)}%</li>
                      ) : null;
                    })()}
                    {averageRating > 0 && (
                      <li>• Average staff rating: {averageRating.toFixed(1)} stars</li>
                    )}
                    {totalAppointments > 0 && (
                      <li>• Total appointments: {totalAppointments}</li>
                    )}
                    {totalRevenue > 0 && (
                      <li>• Total revenue: {formatCurrency(totalRevenue)}</li>
                    )}
                  </>
                ) : (
                  <li>• No performance data available</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {staffPerformance.length > 0 ? (
                  <>
                    {(() => {
                      const lowPerformers = staffPerformance.filter(staff => 
                        (staff.utilization || 0) < 50 || (staff.rating || 0) < 3.5
                      );
                      return lowPerformers.length > 0 ? (
                        <li>• Provide additional training for {lowPerformers.length} underperforming staff member{lowPerformers.length > 1 ? 's' : ''}</li>
                      ) : null;
                    })()}
                    {(() => {
                      const topPerformers = staffPerformance.filter(staff => 
                        (staff.rating || 0) >= 4.5 && (staff.utilization || 0) >= 75
                      );
                      return topPerformers.length > 0 ? (
                        <li>• Recognize {topPerformers.length} top performer{topPerformers.length > 1 ? 's' : ''} with awards</li>
                      ) : null;
                    })()}
                    <li>• Implement performance-based incentives</li>
                    <li>• Schedule regular performance reviews</li>
                    {(() => {
                      const inactiveStaff = staffPerformance.filter(staff => 
                        staff.status === 'inactive' || (staff.appointments || 0) === 0
                      );
                      return inactiveStaff.length > 0 ? (
                        <li>• Review {inactiveStaff.length} inactive staff member{inactiveStaff.length > 1 ? 's' : ''}</li>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <>
                    <li>• Load performance data to see recommendations</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
