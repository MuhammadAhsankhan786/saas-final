"use client";

import React, { useState } from "react";
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
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Search,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

export function Support({ onPageChange }) {
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  });

  const [tickets, setTickets] = useState([
    {
      id: "1",
      subject: "Login Issues",
      category: "Technical",
      priority: "high",
      status: "open",
      description: "Unable to log in to the system. Getting error message.",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      assignedTo: "Support Team",
      responses: [
        {
          id: "1",
          message: "We're looking into this issue. Please try clearing your browser cache.",
          author: "Support Team",
          createdAt: "2024-01-15T11:00:00Z",
        },
      ],
    },
    {
      id: "2",
      subject: "Feature Request",
      category: "Enhancement",
      priority: "low",
      status: "in-progress",
      description: "Would like to add bulk appointment scheduling feature.",
      createdAt: "2024-01-14T14:20:00Z",
      updatedAt: "2024-01-15T09:15:00Z",
      assignedTo: "Development Team",
      responses: [
        {
          id: "1",
          message: "Thank you for the suggestion. This feature is under consideration.",
          author: "Development Team",
          createdAt: "2024-01-14T16:30:00Z",
        },
      ],
    },
    {
      id: "3",
      subject: "Payment Processing Error",
      category: "Billing",
      priority: "high",
      status: "resolved",
      description: "Payment not processing for client appointments.",
      createdAt: "2024-01-13T09:45:00Z",
      updatedAt: "2024-01-14T16:20:00Z",
      assignedTo: "Billing Team",
      responses: [
        {
          id: "1",
          message: "Issue has been resolved. Payment processing is now working normally.",
          author: "Billing Team",
          createdAt: "2024-01-14T16:20:00Z",
        },
      ],
    },
  ]);

  const [faqs] = useState([
    {
      id: "1",
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page and follow the instructions sent to your email.",
      category: "Account",
    },
    {
      id: "2",
      question: "How do I schedule an appointment?",
      answer: "Go to the Appointments section and click 'New Appointment'. Fill in the required details and save.",
      category: "Appointments",
    },
    {
      id: "3",
      question: "How do I add a new client?",
      answer: "Navigate to Clients section and click 'Add Client'. Fill in the client information and save.",
      category: "Clients",
    },
    {
      id: "4",
      question: "How do I generate reports?",
      answer: "Go to the Reports section and select the type of report you want to generate.",
      category: "Reports",
    },
    {
      id: "5",
      question: "How do I manage inventory?",
      answer: "Go to the Inventory section to view products, update stock levels, and set up alerts.",
      category: "Inventory",
    },
    {
      id: "6",
      question: "How do I update my business settings?",
      answer: "Go to Settings > Business Settings to update your business information and preferences.",
      category: "Settings",
    },
  ]);

  const [contactInfo] = useState({
    phone: "(555) 123-4567",
    email: "support@medispa-wellness.com",
    hours: "Monday - Friday: 9:00 AM - 6:00 PM EST",
    address: "123 Support Center, New York, NY 10001",
  });

  const categories = [
    "Technical",
    "Billing",
    "Feature Request",
    "Enhancement",
    "Bug Report",
    "General",
  ];

  const priorities = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  ];

  const statuses = [
    { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
    { value: "in-progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
    { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
    { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : "bg-gray-100 text-gray-800";
  };

  const handleInputChange = (field, value) => {
    setNewTicket(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTicket = () => {
    if (newTicket.subject && newTicket.category && newTicket.description) {
      const ticket = {
        id: Date.now().toString(),
        ...newTicket,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: "Support Team",
        responses: [],
      };
      setTickets(prev => [ticket, ...prev]);
      setNewTicket({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
      });
      alert("Support ticket created successfully!");
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-foreground">Support Center</h1>
            <p className="text-muted-foreground">Get help and support for your MedSpa system</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === "tickets" ? "default" : "ghost"}
          onClick={() => setActiveTab("tickets")}
          className="flex-1"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Support Tickets
        </Button>
        <Button
          variant={activeTab === "faq" ? "default" : "ghost"}
          onClick={() => setActiveTab("faq")}
          className="flex-1"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          FAQ
        </Button>
        <Button
          variant={activeTab === "contact" ? "default" : "ghost"}
          onClick={() => setActiveTab("contact")}
          className="flex-1"
        >
          <Phone className="mr-2 h-4 w-4" />
          Contact Us
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets, FAQ, or contact information..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input-background border-border"
        />
      </div>

      {/* Support Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          {/* Create New Ticket */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Create New Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newTicket.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of the issue"
                    className="bg-input-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newTicket.category} 
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger className="bg-input-background border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newTicket.priority} 
                  onValueChange={(value) => handleInputChange("priority", value)}
                >
                  <SelectTrigger className="bg-input-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Detailed description of the issue or request"
                  className="bg-input-background border-border"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleCreateTicket}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">{ticket.subject}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {priorities.find(p => p.value === ticket.priority)?.label}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {statuses.find(s => s.value === ticket.status)?.label}
                        </Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{ticket.description}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Assigned to: {ticket.assignedTo}</p>
                    <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
                    <p>Last updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
                  </div>
                  {ticket.responses.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-foreground">Responses:</h4>
                      {ticket.responses.map((response) => (
                        <div key={response.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{response.author}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(response.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{faq.question}</CardTitle>
                <Badge variant="outline">{faq.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Phone className="mr-2 h-5 w-5" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{contactInfo.phone}</p>
                <p className="text-muted-foreground">{contactInfo.hours}</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-foreground font-medium">{contactInfo.email}</p>
                <p className="text-muted-foreground">We'll respond within 24 hours</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-foreground">User Guide</h3>
                  <p className="text-sm text-muted-foreground">Complete system documentation</p>
                  <Button variant="outline" className="mt-2">
                    View Guide
                  </Button>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-foreground">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">Technical integration guide</p>
                  <Button variant="outline" className="mt-2">
                    View API Docs
                  </Button>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium text-foreground">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
                  <Button variant="outline" className="mt-2">
                    Watch Videos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
