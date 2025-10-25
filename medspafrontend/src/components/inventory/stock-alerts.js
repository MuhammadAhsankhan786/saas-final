"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Search,
  Eye,
  ShoppingCart,
  Calendar,
  Bell,
  X,
  Loader2,
} from "lucide-react";
import { getStockAlerts, getStockAlertStatistics, dismissStockAlert, resolveStockAlert } from "@/lib/api";

export function StockAlerts({ onPageChange }) {
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertTypeFilter, setAlertTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load stock alerts from API
  useEffect(() => {
    async function loadStockAlerts() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStockAlerts();
        setStockAlerts(data || []);
      } catch (err) {
        console.error("Error loading stock alerts:", err);
        setError("Failed to load stock alerts.");
      } finally {
        setLoading(false);
      }
    }
    loadStockAlerts();
  }, []);

  const filteredAlerts = stockAlerts.filter((alert) => {
    const productName = alert.product_name || "Unknown Product";
    const sku = alert.sku || "Unknown SKU";
    const category = alert.category || "Unknown Category";
    const supplier = alert.supplier || "Unknown Supplier";
    
    const matchesSearch = 
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAlertType = alertTypeFilter === "All" || alert.alert_type === alertTypeFilter;
    const matchesPriority = priorityFilter === "All" || alert.priority === priorityFilter;

    return matchesSearch && matchesAlertType && matchesPriority;
  });

  const criticalAlerts = stockAlerts.filter(a => a && a.priority === "critical").length;
  const highPriorityAlerts = stockAlerts.filter(a => a && a.priority === "high").length;
  const totalAlerts = stockAlerts.length;
  const outOfStockItems = stockAlerts.filter(a => a && a.alert_type === "out-of-stock").length;

  const alertTypes = ["All", "critical", "high-priority", "out-of-stock", "low-stock", "normal"];
  const priorities = ["All", "critical", "high", "medium", "low"];

  const getAlertIcon = (alertType, priority) => {
    if (priority === "critical") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (priority === "high") {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    } else if (priority === "medium") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getAlertTypeBadgeVariant = (alertType) => {
    switch (alertType) {
      case "out-of-stock":
        return "destructive";
      case "low-stock":
        return "secondary";
      case "expiring-soon":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setIsDetailsOpen(true);
  };

  const handleRestock = (alertId) => {
    // Here you would typically open a restock modal
    console.log(`Restocking product for alert ${alertId}`);
    alert("Restock functionality would open here");
  };

  const handleDismissAlert = async (alertId) => {
    if (confirm("Are you sure you want to dismiss this alert?")) {
      setIsProcessing(true);
      setError(null);
      try {
        await dismissStockAlert(alertId);
        // Reload alerts
        const data = await getStockAlerts();
        setStockAlerts(data || []);
      } catch (err) {
        console.error("Error dismissing alert:", err);
        setError(err.message || "Failed to dismiss alert.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleMarkAsOrdered = (alertId) => {
    // Here you would typically mark the product as ordered
    console.log(`Marking product as ordered for alert ${alertId}`);
    alert("Product marked as ordered successfully");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading stock alerts...</span>
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
            <h1 className="text-2xl font-bold text-foreground">Stock Alerts</h1>
            <p className="text-muted-foreground">Monitor inventory levels and manage stock alerts</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highPriorityAlerts}</div>
            <p className="text-xs text-muted-foreground">Urgent restocking needed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Alerts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by product name, SKU, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="alertType">Alert Type</Label>
              <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "All" ? "All Types" : type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority === "All" ? "All Priorities" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Stock Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Days Until Out</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const productName = alert.product_name || "Unknown Product";
                  const sku = alert.sku || "Unknown SKU";
                  const category = alert.category || "Unknown Category";
                  const currentStock = alert.current_stock || 0;
                  const minStock = alert.min_stock || 0;
                  const maxStock = alert.max_stock || 0;
                  const unit = alert.unit || "unit";
                  const lastRestocked = alert.last_restocked;
                  
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{productName}</div>
                          <div className="text-sm text-muted-foreground">SKU: {sku}</div>
                          <div className="text-sm text-muted-foreground">{category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">
                            {currentStock} {unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Min: {minStock} | Max: {maxStock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAlertTypeBadgeVariant(alert.alert_type)}>
                          {alert.alert_type.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.alert_type, alert.priority)}
                          <Badge variant={getPriorityBadgeVariant(alert.priority)}>
                            {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {alert.days_until_out} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {lastRestocked ? new Date(lastRestocked).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(alert)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestock(alert.id)}
                            className="border-border hover:bg-primary/5"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsOrdered(alert.id)}
                            className="border-border hover:bg-primary/5"
                          >
                            Mark Ordered
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismissAlert(alert.id)}
                            disabled={isProcessing}
                            className="border-border hover:bg-destructive/5 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
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

      {/* Alert Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Complete information about this stock alert
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              {/* Product Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Product Name</div>
                    <div className="font-medium text-foreground">{selectedAlert.product_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">SKU</div>
                    <div className="font-medium text-foreground">{selectedAlert.sku}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-medium text-foreground">{selectedAlert.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Supplier</div>
                    <div className="font-medium text-foreground">{selectedAlert.supplier}</div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Stock Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                    <div className="font-medium text-foreground">
                      {selectedAlert.current_stock} {selectedAlert.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Minimum Stock</div>
                    <div className="font-medium text-foreground">{selectedAlert.min_stock}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Maximum Stock</div>
                    <div className="font-medium text-foreground">{selectedAlert.max_stock}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Days Until Out</div>
                    <div className={`font-medium ${
                      selectedAlert.days_until_out === 0 ? "text-red-600" :
                      selectedAlert.days_until_out <= 7 ? "text-orange-600" :
                      "text-foreground"
                    }`}>
                      {selectedAlert.days_until_out} days
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  Alert Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Alert Type</div>
                    <Badge variant={getAlertTypeBadgeVariant(selectedAlert.alert_type)}>
                      {selectedAlert.alert_type.replace("-", " ")}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Priority</div>
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(selectedAlert.alert_type, selectedAlert.priority)}
                      <Badge variant={getPriorityBadgeVariant(selectedAlert.priority)}>
                        {selectedAlert.priority.charAt(0).toUpperCase() + selectedAlert.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Restocked</div>
                    <div className="font-medium text-foreground">
                      {selectedAlert.last_restocked ? new Date(selectedAlert.last_restocked).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Alert Created</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedAlert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Cost Price</div>
                    <div className="font-medium text-foreground">
                      ${selectedAlert.cost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Selling Price</div>
                    <div className="font-medium text-foreground">
                      ${selectedAlert.selling_price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleRestock(selectedAlert.id)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Restock Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
