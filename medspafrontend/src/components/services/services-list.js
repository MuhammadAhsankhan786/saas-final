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
import { Badge } from "../ui/badge";
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
  Search,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { getServices } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

export function ServicesList({ onPageChange }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        
        const servicesData = await getServices();
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (error) {
        console.error("Error loading services:", error);
        const errorMessage = error.message || "Failed to load services";
        setError(errorMessage);
        
        if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
          notify.error("Session expired. Please log in again.");
        } else {
          notify.error("Failed to load services: " + errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const filteredServices = services.filter((service) => {
    if (!service) return false;
    
    const matchesSearch = 
      (service.name && service.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading services...</span>
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
            <h1 className="text-3xl font-bold text-foreground">Services</h1>
            <p className="text-muted-foreground">View all available services</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Services ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {services.length === 0 
                        ? "No services available"
                        : "No services match your search"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{service.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {service.description || "No description"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {service.category ? (
                          <Badge variant="outline">{service.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-3 w-3" />
                          <span>{service.duration ? `${service.duration} min` : "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(service.price)}
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
    </div>
  );
}

