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
  CreditCard,
  Download,
  Eye,
  Filter,
  Calendar,
  User,
  DollarSign,
  Receipt,
  Search,
  Loader2,
} from "lucide-react";
import { getPayments, generateReceipt } from "@/lib/api";

const statusOptions = ["All", "completed", "pending", "refunded", "failed"];
const paymentMethodOptions = ["All", "stripe", "cash"];

export function PaymentHistory({ onPageChange }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-fetch

  // Load payments from API - fetch live data
  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Payment History - Fetching latest transactions...');
        const response = await getPayments();
        
        console.log('📥 Payment History - Raw API response:', response);
        console.log('📥 Response type:', typeof response);
        console.log('📥 Is array?', Array.isArray(response));
        
        // Handle different response formats
        let paymentsArray = [];
        
        if (Array.isArray(response)) {
          paymentsArray = response;
        } else if (response && Array.isArray(response.data)) {
          paymentsArray = response.data;
        } else if (response && response.data && typeof response.data === 'object') {
          // If response.data is an object with pagination
          paymentsArray = response.data.data || response.data.items || [];
        } else if (response && response.payments && Array.isArray(response.payments)) {
          paymentsArray = response.payments;
        } else {
          console.warn('⚠️ Unexpected response format:', response);
          paymentsArray = [];
        }
        
        console.log('✅ Payment History - Processed payments array:', paymentsArray.length, paymentsArray);
        setPayments(paymentsArray);
        
        if (paymentsArray.length === 0) {
          console.warn('⚠️ No payments found in Transaction History. Response was:', response);
        } else {
          console.log('✅ Successfully loaded', paymentsArray.length, 'payments');
        }
      } catch (err) {
        console.error("❌ Error loading payments:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
        setError("Failed to load payment history: " + (err.message || "Unknown error"));
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [refreshKey]); // Re-fetch when refreshKey changes

  // Refresh data when component mounts or page is navigated to
  useEffect(() => {
    console.log('🔄 Payment History - Component mounted/navigated, refreshing data...');
    setRefreshKey(prev => prev + 1);
  }, []); // Run once on mount

  // Listen for payment completion events from POS
  useEffect(() => {
    const handlePaymentCompleted = (event) => {
      const { paymentId, transactionId } = event.detail || {};
      console.log('📢 Payment completed event received - refreshing history...', {
        paymentId,
        transactionId
      });
      // Longer delay to ensure backend has saved the payment and relationships
      setTimeout(() => {
        console.log('🔄 Refreshing payment history after payment completion...');
        setRefreshKey(prev => prev + 1);
      }, 2000); // 2 second delay
    };

    // Listen for custom payment completion event
    window.addEventListener('paymentCompleted', handlePaymentCompleted);
    
    // Also check for focus events (when user returns to this page)
    const handleFocus = () => {
      console.log('🔄 Window focused - checking for new payments...');
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentCompleted);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Function to manually refresh payments
  const refreshPayments = () => {
    console.log('🔄 Manually refreshing payment history...');
    setRefreshKey(prev => prev + 1);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case "refunded":
        return <Receipt className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <CreditCard className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "completed":
        return "outline";
      case "pending":
        return "secondary";
      case "refunded":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const clientName = payment.client?.name || payment.client_name || "Unknown Client";
    const serviceName = payment.service?.name || payment.service_name || "Unknown Service";
    const providerName = payment.provider?.name || payment.provider_name || "Unknown Provider";
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      providerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "All" || 
      (methodFilter === "stripe" && payment.payment_method === "stripe") ||
      (methodFilter === "cash" && payment.payment_method === "cash");

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate statistics with proper null handling
  const totalAmount = filteredPayments.reduce((sum, payment) => {
    const amount = parseFloat(payment?.amount) || 0;
    return sum + amount;
  }, 0);
  
  const completedPayments = filteredPayments.filter(p => p && p.status === "completed").length;
  const pendingPayments = filteredPayments.filter(p => p && p.status === "pending").length;
  
  // Calculate average per transaction with proper formatting
  const averagePerTransaction = filteredPayments.length > 0 
    ? (totalAmount / filteredPayments.length) 
    : 0;
  
  // Format currency values
  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const blob = await generateReceipt(paymentId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating receipt:", err);
      alert("Failed to generate receipt. Please try again.");
    }
  };

  const handleRefundPayment = (paymentId) => {
    if (confirm("Are you sure you want to process a refund for this payment?")) {
      // Here you would typically process the refund
      console.log(`Processing refund for payment ${paymentId}`);
      alert("Refund processed successfully!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading payment history...</span>
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
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">View and manage all payment transactions</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={refreshPayments}
          className="border-border hover:bg-primary/5"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground overflow-hidden">
              ${formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground truncate">From {filteredPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPayments}</div>
            <p className="text-xs text-muted-foreground">Successful payments</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground overflow-hidden">
              ${formatCurrency(averagePerTransaction)}
            </div>
            <p className="text-xs text-muted-foreground truncate">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Payments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by client, service, or transaction ID..."
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
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "All" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Time</SelectItem>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Week">This Week</SelectItem>
                  <SelectItem value="Month">This Month</SelectItem>
                  <SelectItem value="Quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Payment Transactions ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="text-lg font-medium text-foreground">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                          {payments.length === 0 
                            ? "No payments have been processed yet. Process a payment from POS to see it here."
                            : "No payments match your current filters. Try adjusting your search criteria."}
                        </p>
                        {payments.length === 0 && (
                          <Button
                            variant="outline"
                            onClick={() => onPageChange("payments/pos")}
                            className="mt-4 border-border hover:bg-primary/5"
                          >
                            Go to Point of Sale
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                  const clientName = payment.client?.name || payment.client_name || "Unknown Client";
                  const serviceName = payment.service?.name || payment.service_name || "Unknown Service";
                  const providerName = payment.provider?.name || payment.provider_name || "Unknown Provider";
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{clientName}</div>
                        <div className="text-sm text-muted-foreground">ID: {payment.client_id}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-foreground">
                            {payment.paymentItems && payment.paymentItems.length > 0 ? (
                              <div className="space-y-1">
                                {payment.paymentItems.map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.item_name} (x{item.quantity}) - ${parseFloat(item.subtotal).toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              serviceName || 'POS Transaction'
                            )}
                          </div>
                          {payment.transaction_id && (
                            <div className="text-xs text-muted-foreground">ID: {payment.transaction_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          ${payment.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {payment.payment_method === 'stripe' ? 'Credit/Debit Card' : 
                         payment.payment_method === 'cash' ? 'Cash' : 
                         payment.payment_method || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {payment.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefundPayment(payment.id)}
                              className="border-border hover:bg-destructive/5 hover:text-destructive"
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4 custom-scrollbar">
              {/* Transaction Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Transaction ID</div>
                    <div className="font-medium text-foreground">{selectedPayment.transaction_id || `Payment #${selectedPayment.id}`}</div>
                  </div>
                  {selectedPayment.paymentItems && selectedPayment.paymentItems.length > 0 && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-muted-foreground mb-2">Items Purchased</div>
                      <div className="space-y-2">
                        {selectedPayment.paymentItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-background rounded border border-border">
                            <div>
                              <div className="font-medium text-foreground">{item.item_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)} × {item.quantity}
                              </div>
                            </div>
                            <div className="font-medium text-foreground">${parseFloat(item.subtotal).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="font-medium text-foreground">
                      ${selectedPayment.amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payment Method</div>
                    <div className="font-medium text-foreground">{selectedPayment.payment_method}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedPayment.status)}
                      <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(selectedPayment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Client Name</div>
                    <div className="font-medium text-foreground">
                      {selectedPayment.client?.name || selectedPayment.client_name || 'Unknown Client'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Client ID</div>
                    <div className="font-medium text-foreground">{selectedPayment.client_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium text-foreground">
                      {selectedPayment.service?.name || selectedPayment.service_name || 'Unknown Service'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium text-foreground">
                      {selectedPayment.provider?.name || selectedPayment.provider_name || 'Unknown Provider'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Notes</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedPayment.notes}</p>
                  </div>
                </div>
              )}

            </div>
          )}
          {selectedPayment && (
            <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t border-border mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
                className="border-border hover:bg-primary/5"
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadReceipt(selectedPayment.id)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
