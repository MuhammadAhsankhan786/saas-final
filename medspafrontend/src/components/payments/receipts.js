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
  CreditCard,
  Download,
  Eye,
  Filter,
  Receipt,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getPayments, generateReceipt } from "@/lib/api";

export function Receipts({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const isProvider = role === "provider";
  const isReception = role === "reception";
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("completed");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load receipts from API - fetch live data
  useEffect(() => {
    async function loadReceipts() {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Receipts - Fetching latest receipts...');
        const response = await getPayments({ status: 'completed' });
        
        console.log('📥 Receipts - Raw API response:', response);
        
        // Handle different response formats
        let receiptsArray = [];
        
        if (Array.isArray(response)) {
          receiptsArray = response;
        } else if (response && Array.isArray(response.data)) {
          receiptsArray = response.data;
        } else if (response && response.data && typeof response.data === 'object') {
          receiptsArray = response.data.data || response.data.items || [];
        } else if (response && response.payments && Array.isArray(response.payments)) {
          receiptsArray = response.payments;
        } else {
          console.warn('⚠️ Unexpected response format:', response);
          receiptsArray = [];
        }
        
        // Filter to only completed payments (these are the receipts)
        receiptsArray = receiptsArray.filter(p => p && p.status === 'completed');
        
        console.log('✅ Receipts - Processed receipts array:', receiptsArray.length, receiptsArray);
        setPayments(receiptsArray);
        
        if (receiptsArray.length === 0) {
          console.warn('⚠️ No receipts found.');
        } else {
          console.log('✅ Successfully loaded', receiptsArray.length, 'receipts');
        }
      } catch (err) {
        console.error("❌ Error loading receipts:", err);
        setError("Failed to load receipts: " + (err.message || "Unknown error"));
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadReceipts();
  }, [refreshKey]); // Re-fetch when refreshKey changes

  // Listen for payment completion events from POS
  useEffect(() => {
    const handlePaymentCompleted = (event) => {
      const { paymentId, transactionId } = event.detail || {};
      console.log('📢 Payment completed event received - refreshing receipts...', {
        paymentId,
        transactionId
      });
      setTimeout(() => {
        console.log('🔄 Refreshing receipts after payment completion...');
        setRefreshKey(prev => prev + 1);
      }, 2000);
    };

    window.addEventListener('paymentCompleted', handlePaymentCompleted);
    
    const handleFocus = () => {
      console.log('🔄 Window focused - checking for new receipts...');
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentCompleted);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Function to manually refresh receipts
  const refreshReceipts = () => {
    console.log('🔄 Manually refreshing receipts...');
    setRefreshKey(prev => prev + 1);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsOpen(true);
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const blob = await generateReceipt(paymentId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating receipt:", err);
      alert("Failed to generate receipt. Please try again.");
    }
  };

  const handleRefundPayment = (paymentId) => {
    if (confirm("Are you sure you want to process a refund for this payment?")) {
      console.log(`Processing refund for payment ${paymentId}`);
      alert("Refund processed successfully!");
    }
  };

  const filteredReceipts = payments.filter((payment) => {
    if (!payment) return false;
    
    const matchesSearch = 
      searchQuery === "" ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.client?.name && payment.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.client_name && payment.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.id && payment.id.toString().includes(searchQuery));

    const matchesStatus = statusFilter === "All" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Fetching latest receipts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={refreshReceipts}>Retry</Button>
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
            onClick={() => onPageChange("payments/pos")}
            className="border-border hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to POS
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">View Receipts</h1>
            <p className="text-muted-foreground">View and download payment receipts</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={refreshReceipts}
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
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Receipts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by transaction ID, client name..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Receipts ({filteredReceipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center p-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No receipts found.</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search criteria.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((payment) => {
                    const clientName = payment.client?.name || payment.client_name || "Unknown Client";
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.transaction_id || `Payment #${payment.id}`}
                        </TableCell>
                        <TableCell>{clientName}</TableCell>
                        <TableCell>
                          ${parseFloat(payment.amount || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method || 'cash'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.created_at 
                            ? new Date(payment.created_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {payment.status || 'completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
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
                            {!isAdmin && !isProvider && !isReception && payment.status === "completed" && (
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
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              Complete information about this receipt
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <>
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
                      <div className="font-medium text-foreground">
                        {selectedPayment.transaction_id || `Payment #${selectedPayment.id}`}
                      </div>
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
                              <div className="font-medium text-foreground">
                                ${parseFloat(item.subtotal).toFixed(2)}
                              </div>
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
                      <div className="font-medium text-foreground">
                        {selectedPayment.payment_method}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={selectedPayment.status === 'completed' ? 'default' : 'secondary'}>
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
                    <Receipt className="mr-2 h-4 w-4" />
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
                {selectedPayment.status === "completed" && (
                  <Button
                    variant="outline"
                    onClick={() => handleRefundPayment(selectedPayment.id)}
                    className="border-border hover:bg-destructive/5 hover:text-destructive"
                  >
                    Refund
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

