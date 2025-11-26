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
import { Textarea } from "../ui/textarea";
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
  Package,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Search,
  DollarSign,
  Box,
  Calendar,
  Loader2,
  Download,
} from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock, logInventoryUsage } from "@/lib/api";
import { notify } from "@/lib/toast";

export function InventoryProducts({ onPageChange }) {
  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  const isAdmin = role === "admin";
  const isProvider = role === "provider";
  const isReception = role === "reception";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    // Required fields
    name: "",
    sku: "",
    category: "",
    price: "",
    current_stock: "",
    location_id: "",
    // Optional fields
    lot_number: "",
    expiry_date: "",
    low_stock_threshold: "",
  });

  // Load products from API
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts();
        // Map API data to expected format
        const mappedProducts = (data || []).map(product => ({
          id: product.id,
          name: product.name || "Unknown Product",
          sku: product.sku || "N/A",
          category: product.category || "Uncategorized",
          supplier: product.supplier || "Unknown Supplier",
          cost: product.cost || 0, // Cost field - may not exist in API
          selling_price: product.price || product.selling_price || 0,
          current_stock: product.current_stock || 0,
          min_stock: product.minimum_stock || product.min_stock || 0,
          max_stock: product.max_stock || product.maximum_stock || 0,
          unit: product.unit || "unit",
          expiry_date: product.expiry_date,
          description: product.description || "",
          status: product.active ? "active" : "inactive",
          last_restocked: product.last_restocked,
          total_sold: product.total_sold || 0,
        }));
        setProducts(mappedProducts);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.supplier || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "All" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Helper function to determine product status
  const getProductStatus = (product) => {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    
    if (currentStock === 0) return "out-of-stock";
    if (currentStock <= minStock) return "low-stock";
    return "in-stock";
  };

  // Helper function to get unique categories from products
  const getUniqueCategories = () => {
    const categories = products.map(p => p.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const totalValue = products.reduce((sum, product) => {
    const currentStock = product.current_stock || 0;
    const cost = product.cost || product.selling_price || 0; // Use selling_price as fallback for cost
    return sum + (currentStock * cost);
  }, 0);
  const lowStockItems = products.filter(p => p && getProductStatus(p) === "low-stock").length;
  const outOfStockItems = products.filter(p => p && getProductStatus(p) === "out-of-stock").length;
  const totalProducts = products.length;

  const getStatusIcon = (status) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "low-stock":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "out-of-stock":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Box className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "in-stock":
        return "outline";
      case "low-stock":
        return "secondary";
      case "out-of-stock":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleCreateProduct = async () => {
    // Client-side validation for required fields
    if (!newProduct.name || newProduct.name.trim() === "") {
      alert("❌ Error: Product name is required.\n\nPlease enter a product name.");
      return;
    }
    
    if (!newProduct.sku || newProduct.sku.trim() === "") {
      alert("❌ Error: SKU is required.\n\nPlease enter a unique SKU.");
      return;
    }
    
    if (!newProduct.category || newProduct.category.trim() === "") {
      alert("❌ Error: Category is required.\n\nPlease enter a category.");
      return;
    }
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      alert("❌ Error: Price is required.\n\nPlease enter a valid price greater than 0.");
      return;
    }
    
    if (newProduct.current_stock === "" || parseInt(newProduct.current_stock) < 0) {
      alert("❌ Error: Stock is required.\n\nPlease enter a valid stock quantity.");
      return;
    }
    
    if (!newProduct.location_id || parseInt(newProduct.location_id) <= 0) {
      alert("❌ Error: Location is required.\n\nPlease enter a valid location ID (starting from 1).");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      // Map frontend fields to backend API format - exact match
      const productData = {
        // Required fields
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        current_stock: parseInt(newProduct.current_stock),
        location_id: parseInt(newProduct.location_id),
        
        // Optional fields
        lot_number: newProduct.lot_number || null,
        expiry_date: newProduct.expiry_date || null,
        low_stock_threshold: newProduct.low_stock_threshold ? parseInt(newProduct.low_stock_threshold) : null,
      };
      
      const result = await createProduct(productData);
      
      // Success message
      alert("✅ Success!\n\nProduct has been added successfully!");
      
      // Reload products
      const data = await getProducts();
      setProducts((data || []).map(product => ({
        id: product.id,
        name: product.name || "Unknown Product",
        sku: product.sku || "N/A",
        category: product.category || "Uncategorized",
        supplier: "Unknown Supplier",
        cost: 0,
        selling_price: product.price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.minimum_stock || 0,
        max_stock: product.maximum_stock || 0,
        unit: product.unit || "unit",
        expiry_date: product.expiry_date,
        description: "",
        status: product.active ? "active" : "inactive",
        last_restocked: null,
        total_sold: 0,
      })));
      
      setIsCreateProductOpen(false);
      setNewProduct({
        // Required fields
        name: "",
        sku: "",
        category: "",
        price: "",
        current_stock: "",
        location_id: "",
        // Optional fields
        lot_number: "",
        expiry_date: "",
        low_stock_threshold: "",
      });
    } catch (err) {
      // Parse error message for user-friendly display without console logs
      let errorMessage = "Please fill all required fields correctly.";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.errors) {
        const errorKeys = Object.keys(err.errors);
        if (errorKeys.length > 0) {
          errorMessage = Object.values(err.errors).flat().join('\n');
        }
      }
      
      // Show clean, user-friendly alert
      alert(`❌ Validation Error\n\n${errorMessage}\n\nPlease correct the errors and try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditProduct = async (product) => {
    if (!product || !product.id) {
      alert("❌ Error\n\nInvalid product selected for editing.");
      return;
    }
    
    // Set the editing product and open edit modal
    setEditingProduct(product);
    setIsEditProductOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      // Map frontend fields to backend API format
      const productData = {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category || null,
        price: parseFloat(editingProduct.selling_price) || 0,
        current_stock: parseInt(editingProduct.current_stock) || 0,
        minimum_stock: parseInt(editingProduct.min_stock) || 0,
        low_stock_threshold: parseInt(editingProduct.low_stock_threshold) || 0,
        unit: editingProduct.unit || null,
        expiry_date: editingProduct.expiry_date || null,
        location_id: parseInt(editingProduct.location_id) || 1,
        active: true,
      };
      
      await updateProduct(editingProduct.id, productData);
      
      // Success message
      alert("✅ Success!\n\nProduct has been updated successfully!");
      
      // Close edit modal
      setIsEditProductOpen(false);
      setEditingProduct(null);
      
      // Reload products with proper mapping
      const data = await getProducts();
      setProducts((data || []).map(product => ({
        id: product.id,
        name: product.name || "Unknown Product",
        sku: product.sku || "N/A",
        category: product.category || "Uncategorized",
        supplier: "Unknown Supplier",
        cost: 0,
        selling_price: product.price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.minimum_stock || 0,
        max_stock: product.maximum_stock || 0,
        unit: product.unit || "unit",
        expiry_date: product.expiry_date,
        description: "",
        status: product.active ? "active" : "inactive",
        last_restocked: null,
        total_sold: 0,
      })));
    } catch (err) {
      // Show user-friendly error without console logs
      const errorMessage = err.message || "Failed to update product. Please try again.";
      alert(`❌ Update Failed\n\n${errorMessage}\n\nPlease correct the errors and try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditingProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsProcessing(true);
      setError(null);
      try {
        await deleteProduct(productId);
        
        // Success message
        alert("✅ Success!\n\nProduct has been deleted successfully!");
        
        // Close details modal if open
        if (isDetailsOpen && selectedProduct && selectedProduct.id === productId) {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }
        
        // Reload products with proper mapping
        const data = await getProducts();
        setProducts((data || []).map(product => ({
          id: product.id,
          name: product.name || "Unknown Product",
          sku: product.sku || "N/A",
          category: product.category || "Uncategorized",
          supplier: "Unknown Supplier",
          cost: 0,
          selling_price: product.price || 0,
          current_stock: product.current_stock || 0,
          min_stock: product.minimum_stock || 0,
          max_stock: product.maximum_stock || 0,
          unit: product.unit || "unit",
          expiry_date: product.expiry_date,
          description: "",
          status: product.active ? "active" : "inactive",
          last_restocked: null,
          total_sold: 0,
        })));
      } catch (err) {
        // Show user-friendly error
        const errorMessage = err.message || "Failed to delete product. Please try again.";
        alert(`❌ Delete Failed\n\n${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRestock = async (productId, quantity) => {
    setIsProcessing(true);
    setError(null);
    try {
      await adjustStock(productId, {
        quantity: quantity,
        reason: "restock",
        notes: "Manual restock"
      });
      
      // Reload products with proper mapping
      const data = await getProducts();
      setProducts((data || []).map(product => ({
        id: product.id,
        name: product.name || "Unknown Product",
        sku: product.sku || "N/A",
        category: product.category || "Uncategorized",
        supplier: "Unknown Supplier",
        cost: 0,
        selling_price: product.price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.minimum_stock || 0,
        max_stock: product.maximum_stock || 0,
        unit: product.unit || "unit",
        expiry_date: product.expiry_date,
        description: "",
        status: product.active ? "active" : "inactive",
        last_restocked: null,
        total_sold: 0,
      })));
    } catch (err) {
      console.error("Error restocking product:", err);
      setError(err.message || "Failed to restock product.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleExportInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.error("Please log in to download reports");
        return;
      }

      // Use role-based endpoint
      const userRole = JSON.parse(localStorage.getItem("user") || "{}").role;
      
      // Provider cannot export inventory PDF - read-only access
      if (userRole === "provider") {
        notify.error("You don't have permission to export inventory reports");
        return;
      }
      
      let endpoint;
      if (userRole === "admin") {
        endpoint = "/admin/products/pdf";
      } else if (userRole === "reception") {
        endpoint = "/staff/products/pdf";
      } else {
        notify.error("You don't have permission to export inventory reports");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
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
      a.download = 'inventory-report.pdf';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify.success("Inventory report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading inventory report:", error);
      notify.error("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading inventory...</span>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Create Product Dialog - Shared between desktop and mobile */}
      {!isAdmin && !isProvider && !isReception && (
        <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Product</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new product to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Enter SKU"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    placeholder="Enter category"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className="bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_stock">Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    value={newProduct.current_stock}
                    onChange={(e) => handleInputChange("current_stock", e.target.value)}
                    placeholder="0"
                    className="bg-input-background border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location_id">Location ID</Label>
                  <Input
                    id="location_id"
                    type="number"
                    value={newProduct.location_id}
                    onChange={(e) => handleInputChange("location_id", e.target.value)}
                    placeholder="1"
                    className="bg-input-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lot_number">Lot Number (Optional)</Label>
                  <Input
                    id="lot_number"
                    value={newProduct.lot_number}
                    onChange={(e) => handleInputChange("lot_number", e.target.value)}
                    placeholder="Enter lot number"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={newProduct.expiry_date}
                    onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold (Optional)</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={newProduct.low_stock_threshold}
                    onChange={(e) => handleInputChange("low_stock_threshold", e.target.value)}
                    placeholder="Optional"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateProductOpen(false)}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProduct}
                  disabled={isProcessing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isProcessing ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header - Responsive & Professional */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Heading on top, Back button small icon */}
        <div className="flex items-start justify-between gap-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">Inventory Products</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage product inventory and stock levels</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onPageChange("dashboard")}
            className="h-8 w-8 p-0 flex-shrink-0"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
        </div>
        
        {/* Desktop: Original layout */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-row items-center gap-4">
          <Button
            variant="outline"
            onClick={() => onPageChange("dashboard")}
            className="border-border hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Products</h1>
              <p className="text-sm text-muted-foreground">Manage product inventory and stock levels</p>
          </div>
        </div>
          <div className="flex flex-row gap-2">
          {/* Provider cannot export inventory PDF - read-only access */}
          {!isProvider && (
            <Button
              variant="outline"
              onClick={handleExportInventory}
              className="border-border hover:bg-primary/5"
                size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Inventory
            </Button>
          )}
          {!isAdmin && !isProvider && !isReception && (
              <Button 
                onClick={() => setIsCreateProductOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile: Action buttons below heading */}
        <div className="sm:hidden flex flex-col gap-2">
          {!isProvider && (
            <Button
              variant="outline"
              onClick={handleExportInventory}
              className="border-border hover:bg-primary/5 w-full"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Inventory
            </Button>
          )}
          {!isAdmin && !isProvider && !isReception && (
            <Button 
              onClick={() => setIsCreateProductOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full" 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${(totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
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
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, SKU, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg sm:text-xl">
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xs sm:text-sm">Stock</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Price</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Expiry</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div>
                          <div className="font-medium text-foreground">{product.name || "Unknown Product"}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">{product.category || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">SKU: {product.sku || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground text-xs sm:text-sm hidden sm:table-cell">{product.category || "N/A"}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div>
                          <div className="font-medium text-foreground">{product.current_stock || 0} {product.unit || ""}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            Min: {product.min_stock || 0} | Max: {product.max_stock || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                        <div>
                          <div className="font-medium text-foreground">${(product.selling_price || 0).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Cost: ${(product.cost || 0).toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {getStatusIcon(status)}
                          <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                            <span className="hidden sm:inline">{status.replace("-", " ")}</span>
                            <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(product)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                      {!isAdmin && !isProvider && !isReception && (
                      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                      )}
                      {!isAdmin && !isProvider && !isReception && (
                      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestock(product.id, 10)}
                            className="border-border hover:bg-primary/5 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3 text-xs"
                          >
                            <span className="hidden sm:inline">Restock</span>
                            <span className="sm:hidden">+</span>
                          </Button>
                      )}
                      {!isAdmin && !isProvider && !isReception && (
                      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="border-border hover:bg-destructive/5 hover:text-destructive h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Product Details Dialog - Responsive */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Product Details</DialogTitle>
            <DialogDescription className="text-sm">
              Complete information about this product
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Product Name</div>
                    <div className="font-medium text-foreground">{selectedProduct.name || "Unknown Product"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">SKU</div>
                    <div className="font-medium text-foreground">{selectedProduct.sku || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-medium text-foreground">{selectedProduct.category || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Supplier</div>
                    <div className="font-medium text-foreground">{selectedProduct.supplier || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                    <div className="font-medium text-foreground">
                      {selectedProduct.current_stock || 0} {selectedProduct.unit || ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(getProductStatus(selectedProduct))}
                      <Badge variant={getStatusBadgeVariant(getProductStatus(selectedProduct))}>
                        {getProductStatus(selectedProduct).replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Cost Price</div>
                    <div className="font-medium text-foreground">
                      ${(selectedProduct.cost || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Selling Price</div>
                    <div className="font-medium text-foreground">
                      ${(selectedProduct.selling_price || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                    <div className="font-medium text-foreground">
                      ${((selectedProduct.selling_price || 0) - (selectedProduct.cost || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Box className="mr-2 h-4 w-4" />
                  Stock Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Min Stock Level</div>
                    <div className="font-medium text-foreground">{selectedProduct.min_stock || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Stock Level</div>
                    <div className="font-medium text-foreground">{selectedProduct.max_stock || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Restocked</div>
                    <div className="font-medium text-foreground">
                      {selectedProduct.last_restocked ? new Date(selectedProduct.last_restocked).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Sold</div>
                    <div className="font-medium text-foreground">{selectedProduct.total_sold || 0}</div>
                  </div>
                </div>
              </div>

              {/* Expiry Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Expiry Information
                </h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Expiry Date</div>
                  <div className="font-medium text-foreground">
                    {selectedProduct.expiry_date ? new Date(selectedProduct.expiry_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Description</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground">{selectedProduct.description}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Close
                </Button>
                {!isProvider && !isReception && (
                  <Button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setTimeout(() => handleEditProduct(selectedProduct), 100);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog - Responsive */}
      {!isProvider && !isReception && (
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
            <DialogDescription className="text-sm">
              Update product information
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Product Name</Label>
                  <Input
                    id="edit_name"
                    value={editingProduct.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_sku">SKU</Label>
                  <Input
                    id="edit_sku"
                    value={editingProduct.sku}
                    onChange={(e) => handleEditInputChange("sku", e.target.value)}
                    placeholder="Enter SKU"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_category">Category</Label>
                  <Input
                    id="edit_category"
                    value={editingProduct.category}
                    onChange={(e) => handleEditInputChange("category", e.target.value)}
                    placeholder="Enter category"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_price">Price</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    value={editingProduct.selling_price}
                    onChange={(e) => handleEditInputChange("selling_price", e.target.value)}
                    placeholder="0.00"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_current_stock">Current Stock</Label>
                  <Input
                    id="edit_current_stock"
                    type="number"
                    value={editingProduct.current_stock}
                    onChange={(e) => handleEditInputChange("current_stock", e.target.value)}
                    placeholder="0"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_min_stock">Minimum Stock</Label>
                  <Input
                    id="edit_min_stock"
                    type="number"
                    value={editingProduct.min_stock}
                    onChange={(e) => handleEditInputChange("min_stock", e.target.value)}
                    placeholder="0"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="edit_low_stock_threshold"
                    type="number"
                    value={editingProduct.low_stock_threshold || ""}
                    onChange={(e) => handleEditInputChange("low_stock_threshold", e.target.value)}
                    placeholder="0"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_location_id">Location ID</Label>
                  <Input
                    id="edit_location_id"
                    type="number"
                    value={editingProduct.location_id || 1}
                    onChange={(e) => handleEditInputChange("location_id", e.target.value)}
                    placeholder="1"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_unit">Unit</Label>
                  <Input
                    id="edit_unit"
                    value={editingProduct.unit}
                    onChange={(e) => handleEditInputChange("unit", e.target.value)}
                    placeholder="e.g., vial, syringe, bottle"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_expiry_date">Expiry Date (Optional)</Label>
                  <Input
                    id="edit_expiry_date"
                    type="date"
                    value={editingProduct.expiry_date}
                    onChange={(e) => handleEditInputChange("expiry_date", e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="border-border hover:bg-primary/5 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isProcessing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="mr-2 h-4 w-4" />
                  )}
                  {isProcessing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
