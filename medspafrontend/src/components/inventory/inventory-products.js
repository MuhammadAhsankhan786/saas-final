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
import { getProducts, createProduct, updateProduct, deleteProduct, adjustStock } from "@/lib/api";

export function InventoryProducts({ onPageChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    supplier: "",
    cost: "",
    selling_price: "",
    current_stock: "",
    min_stock: "",
    max_stock: "",
    unit: "",
    expiry_date: "",
    description: "",
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
    setIsProcessing(true);
    setError(null);
    try {
      await createProduct(newProduct);
      // Reload products
      const data = await getProducts();
      setProducts(data || []);
      setIsCreateProductOpen(false);
      setNewProduct({
        name: "",
        sku: "",
        category: "",
        supplier: "",
        cost: "",
        selling_price: "",
        current_stock: "",
        min_stock: "",
        max_stock: "",
        unit: "",
        expiry_date: "",
        description: "",
      });
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err.message || "Failed to create product.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditProduct = (productId) => {
    // Here you would typically open an edit modal
    console.log(`Editing product ${productId}`);
    alert("Edit product functionality would open here");
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsProcessing(true);
      setError(null);
      try {
        await deleteProduct(productId);
        // Reload products
        const data = await getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error("Error deleting product:", err);
        setError(err.message || "Failed to delete product.");
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
      // Reload products
      const data = await getProducts();
      setProducts(data || []);
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
        alert("Please log in to download reports");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/inventory/pdf`, {
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
    } catch (error) {
      console.error("Error downloading inventory report:", error);
      alert("Failed to generate PDF. Please try again.");
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
            <h1 className="text-2xl font-bold text-foreground">Inventory Products</h1>
            <p className="text-muted-foreground">Manage product inventory and stock levels</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleExportInventory}
            className="border-border hover:bg-primary/5"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Inventory
          </Button>
          <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="bg-input-background border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueCategories().map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newProduct.supplier}
                      onChange={(e) => handleInputChange("supplier", e.target.value)}
                      placeholder="Enter supplier name"
                      className="bg-input-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Cost Price</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={newProduct.cost}
                      onChange={(e) => handleInputChange("cost", e.target.value)}
                      placeholder="0.00"
                      className="bg-input-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selling_price">Selling Price</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      value={newProduct.selling_price}
                      onChange={(e) => handleInputChange("selling_price", e.target.value)}
                      placeholder="0.00"
                      className="bg-input-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={newProduct.current_stock}
                      onChange={(e) => handleInputChange("current_stock", e.target.value)}
                      placeholder="0"
                      className="bg-input-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_stock">Min Stock</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={newProduct.min_stock}
                      onChange={(e) => handleInputChange("min_stock", e.target.value)}
                      placeholder="0"
                      className="bg-input-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock">Max Stock</Label>
                    <Input
                      id="max_stock"
                      type="number"
                      value={newProduct.max_stock}
                      onChange={(e) => handleInputChange("max_stock", e.target.value)}
                      placeholder="0"
                      className="bg-input-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={newProduct.unit}
                      onChange={(e) => handleInputChange("unit", e.target.value)}
                      placeholder="e.g., vial, syringe, bottle"
                      className="bg-input-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={newProduct.expiry_date}
                      onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                      className="bg-input-background border-border"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Product description..."
                    className="bg-input-background border-border"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateProductOpen(false)}
                    className="border-border hover:bg-primary/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

      {/* Products Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{product.name || "Unknown Product"}</div>
                          <div className="text-sm text-muted-foreground">SKU: {product.sku || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{product.category || "N/A"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{product.current_stock || 0} {product.unit || ""}</div>
                          <div className="text-sm text-muted-foreground">
                            Min: {product.min_stock || 0} | Max: {product.max_stock || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">${(product.selling_price || 0).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Cost: ${(product.cost || 0).toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <Badge variant={getStatusBadgeVariant(status)}>
                            {status.replace("-", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(product)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product.id)}
                            className="border-border hover:bg-primary/5"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestock(product.id, 10)}
                            className="border-border hover:bg-primary/5"
                          >
                            Restock
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="border-border hover:bg-destructive/5 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Product Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="border-border hover:bg-primary/5"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleEditProduct(selectedProduct.id)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
