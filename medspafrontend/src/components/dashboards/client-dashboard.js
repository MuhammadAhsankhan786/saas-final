"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Calendar, FileText, CreditCard, Gift, CheckCircle, Download, Plus, Star } from 'lucide-react';

// Mock data for client
const upcomingAppointments = [
  {
    id: '1',
    date: 'Dec 28, 2025',
    time: '2:00 PM',
    service: 'Botox Touch-up',
    provider: 'Dr. Chen',
    location: 'Downtown Clinic',
    status: 'confirmed'
  },
  {
    id: '2',
    date: 'Jan 15, 2026',
    time: '10:30 AM',
    service: 'Hydrafacial',
    provider: 'Dr. Johnson',
    location: 'Westside Location',
    status: 'confirmed'
  }
];

const recentAppointments = [
  {
    id: '1',
    date: 'Dec 15, 2025',
    service: 'Dermal Filler Consultation',
    provider: 'Dr. Chen',
    status: 'completed',
    rating: 5
  },
  {
    id: '2',
    date: 'Nov 22, 2025',
    service: 'Hydrafacial + LED',
    provider: 'Dr. Johnson',
    status: 'completed',
    rating: 5
  },
  {
    id: '3',
    date: 'Oct 18, 2025',
    service: 'Botox Injections',
    provider: 'Dr. Chen',
    status: 'completed',
    rating: 4
  }
];

const documents = [
  {
    id: '1',
    name: 'Botox Consent Form',
    date: 'Dec 15, 2025',
    status: 'signed',
    type: 'consent'
  },
  {
    id: '2',
    name: 'Treatment Summary - Dermal Fillers',
    date: 'Dec 15, 2025',
    status: 'available',
    type: 'summary'
  },
  {
    id: '3',
    name: 'Pre-Treatment Instructions',
    date: 'Dec 20, 2025',
    status: 'pending',
    type: 'instructions'
  }
];

const membershipData = {
  plan: 'Premium Wellness Package',
  progress: 60,
  servicesUsed: 6,
  servicesTotal: 10,
  renewalDate: 'Mar 15, 2026',
  savings: '$320'
};

const recentPayments = [
  {
    id: '1',
    date: 'Dec 15, 2025',
    amount: '$450',
    service: 'Dermal Filler Treatment',
    method: 'Credit Card',
    status: 'paid'
  },
  {
    id: '2',
    date: 'Nov 22, 2025',
    amount: '$180',
    service: 'Hydrafacial',
    method: 'Credit Card',
    status: 'paid'
  }
];

export default function ClientDashboard({ onPageChange }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Jessica!</h1>
          <p className="text-muted-foreground">Your wellness journey continues</p>
        </div>
        <Button onClick={() => onPageChange('appointments/book')}>
          <Plus className="mr-2 h-4 w-4" /> Book Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dec 28</div>
            <p className="text-xs text-muted-foreground">Botox Touch-up at 2:00 PM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Package Progress</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membershipData.servicesUsed}/{membershipData.servicesTotal}
            </div>
            <p className="text-xs text-muted-foreground">Services used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{membershipData.savings}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">1</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled treatments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{appointment.service}</p>
                  <p className="text-sm text-muted-foreground">{appointment.date} at {appointment.time}</p>
                  <p className="text-sm text-muted-foreground">with {appointment.provider}</p>
                  <p className="text-xs text-muted-foreground">{appointment.location}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="outline">{appointment.status}</Badge>
                  <Button size="sm" variant="outline">Reschedule</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => onPageChange('appointments/book')}>
              Book New Appointment
            </Button>
          </CardContent>
        </Card>

        {/* Package Status */}
        <Card>
          <CardHeader>
            <CardTitle>Package Status</CardTitle>
            <CardDescription>{membershipData.plan}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Services Used</span>
                <span>{membershipData.servicesUsed} of {membershipData.servicesTotal}</span>
              </div>
              <Progress value={membershipData.progress} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Renewal Date</span>
                <span className="text-sm font-medium">{membershipData.renewalDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Savings</span>
                <span className="text-sm font-medium text-green-600">{membershipData.savings}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => onPageChange('payments/packages')}>
              View Package Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Treatments & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Treatments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Treatments</CardTitle>
            <CardDescription>Your treatment history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{appointment.service}</p>
                  <p className="text-sm text-muted-foreground">{appointment.date}</p>
                  <p className="text-sm text-muted-foreground">with {appointment.provider}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < appointment.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
            <CardDescription>Consents, summaries, and instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{document.name}</p>
                  <p className="text-sm text-muted-foreground">{document.date}</p>
                  <p className="text-xs text-muted-foreground capitalize">{document.type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={document.status === 'signed' ? 'default' : document.status === 'available' ? 'secondary' : 'outline'}>
                    {document.status}
                  </Badge>
                  {document.status !== 'pending' && (
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => onPageChange('treatments/consents')}>
              View All Documents
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your payment history and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{payment.service}</p>
                  <p className="text-sm text-muted-foreground">{payment.date}</p>
                  <p className="text-sm text-muted-foreground">Paid via {payment.method}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{payment.amount}</p>
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {payment.status}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" /> Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => onPageChange('payments/history')}>
            View All Payments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
