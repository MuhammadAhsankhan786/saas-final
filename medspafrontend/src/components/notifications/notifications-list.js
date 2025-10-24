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
} from "../ui/dialog";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Search,
  Filter,
  Eye,
  Loader2,
  Mail,
  Phone,
  CreditCard,
  Package,
  Clock,
} from "lucide-react";
import { getNotifications, getUnreadNotifications, markNotificationAsRead } from "@/lib/api";

export function NotificationsList({ onPageChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load notifications from API
  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const data = await getNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.data?.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Read" && notification.read_at) ||
      (statusFilter === "Unread" && !notification.read_at);

    const matchesType = typeFilter === "All" || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const unreadCount = notifications.filter(n => n && !n.read_at).length;
  const totalNotifications = notifications.length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "inventory":
        return <Package className="h-4 w-4 text-orange-500" />;
      case "user":
        return <User className="h-4 w-4 text-purple-500" />;
      case "system":
        return <Bell className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeBadgeVariant = (type) => {
    switch (type) {
      case "appointment":
        return "default";
      case "payment":
        return "outline";
      case "inventory":
        return "secondary";
      case "user":
        return "outline";
      case "system":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setIsDetailsOpen(true);
  };

  const handleMarkAsRead = async (notificationId) => {
    setIsProcessing(true);
    setError(null);
    try {
      await markNotificationAsRead(notificationId);
      // Reload notifications
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(err.message || "Failed to mark notification as read.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      await Promise.all(unreadNotifications.map(n => markNotificationAsRead(n.id)));
      // Reload notifications
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError(err.message || "Failed to mark all notifications as read.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading notifications...</span>
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
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Manage your notifications and alerts</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? "Marking..." : `Mark All Read (${unreadCount})`}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
              Unread Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Read Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalNotifications - unreadCount}</div>
            <p className="text-xs text-muted-foreground">Already viewed</p>
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
              <Label htmlFor="search">Search Notifications</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, message, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Unread">Unread</SelectItem>
                  <SelectItem value="Read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No notifications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => (
                    <TableRow key={notification.id} className={!notification.read_at ? "bg-muted/50" : ""}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <Badge variant={getNotificationTypeBadgeVariant(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {notification.data?.title || 'No Title'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {notification.data?.message || 'No Message'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {notification.read_at ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <Badge variant={notification.read_at ? "outline" : "secondary"}>
                            {notification.read_at ? "Read" : "Unread"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(notification)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!notification.read_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={isProcessing}
                              className="border-border hover:bg-primary/5"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              Complete information about this notification
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-6">
              {/* Notification Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  Notification Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(selectedNotification.type)}
                      <Badge variant={getNotificationTypeBadgeVariant(selectedNotification.type)}>
                        {selectedNotification.type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {selectedNotification.read_at ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <Badge variant={selectedNotification.read_at ? "outline" : "secondary"}>
                        {selectedNotification.read_at ? "Read" : "Unread"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedNotification.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Read At</div>
                    <div className="font-medium text-foreground">
                      {selectedNotification.read_at ? new Date(selectedNotification.read_at).toLocaleString() : 'Not read'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Content</h3>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div className="font-medium text-foreground">
                      {selectedNotification.data?.title || 'No Title'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Message</div>
                    <div className="text-foreground">
                      {selectedNotification.data?.message || 'No Message'}
                    </div>
                  </div>
                  {selectedNotification.data?.action_url && (
                    <div>
                      <div className="text-sm text-muted-foreground">Action URL</div>
                      <div className="text-foreground">
                        <a href={selectedNotification.data.action_url} className="text-primary hover:underline">
                          {selectedNotification.data.action_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Close
                </Button>
                {!selectedNotification.read_at && (
                  <Button
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id);
                      setIsDetailsOpen(false);
                    }}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

