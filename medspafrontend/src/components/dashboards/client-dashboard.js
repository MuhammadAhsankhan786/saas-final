"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Calendar, FileText, CreditCard, Gift, CheckCircle, Download, Star, Loader2, ArrowRight } from 'lucide-react';
import { getAppointments, getMyPackages, getPayments, getConsentForms } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';

export default function ClientDashboard({ onPageChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [consents, setConsents] = useState([]);

  // Load dashboard data from API - OPTIMIZED: Parallel loading
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Load all data in parallel for faster loading
        const [appointmentsData, packagesData, paymentsData, consentsData] = await Promise.all([
          getAppointments().catch(err => {
            console.warn('Failed to load appointments:', err);
            return [];
          }),
          getMyPackages().catch(err => {
            console.warn('Failed to load packages:', err);
            return [];
          }),
          getPayments().catch(err => {
            console.warn('Failed to load payments:', err);
            return [];
          }),
          getConsentForms().catch(err => {
            console.warn('Failed to load consents:', err);
            return [];
          }),
        ]);
        
        // Process appointments
        const allAppointments = Array.isArray(appointmentsData) ? appointmentsData : [];
        const now = new Date();
        
        // Separate upcoming and past
        const upcoming = allAppointments
          .filter(apt => {
            const startTime = apt.start_time ? new Date(apt.start_time) : null;
            return startTime && startTime > now;
          })
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .slice(0, 2);
        
        const recent = allAppointments
          .filter(apt => {
            const startTime = apt.start_time ? new Date(apt.start_time) : null;
            return startTime && startTime <= now;
          })
          .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
          .slice(0, 3);
        
        setUpcomingAppointments(upcoming);
        setRecentAppointments(recent);
        
        // Process packages
        setPackages(Array.isArray(packagesData) ? packagesData : []);
        
        // Process payments
        const paymentsList = Array.isArray(paymentsData) ? paymentsData : [];
        setRecentPayments(paymentsList.slice(0, 2));
        
        // Process consents
        const consentsList = Array.isArray(consentsData) ? consentsData : [];
        setConsents(consentsList.slice(0, 3));
        
        console.log('✅ Client dashboard: All data loaded in parallel');
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        notify.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  // Calculate package stats
  const packageStats = packages.length > 0 ? packages[0] : null;
  const servicesUsed = packageStats?.sessions_used || 0;
  const servicesTotal = packageStats?.total_sessions || 0;
  const progress = servicesTotal > 0 ? (servicesUsed / servicesTotal) * 100 : 0;

  // Get next appointment
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  const nextAppointmentDate = nextAppointment?.start_time ? new Date(nextAppointment.start_time) : null;

  // Format appointment for display
  const formatAppointment = (apt) => {
    const startTime = apt.start_time ? new Date(apt.start_time) : null;
    return {
      id: apt.id,
      date: startTime ? startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      time: startTime ? startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
      service: apt.service?.name || 'Unknown Service',
      provider: apt.provider?.name || 'Unknown Provider',
      location: apt.location?.name || 'Unknown Location',
      status: apt.status || 'booked',
    };
  };

  // Format payment for display
  const formatPayment = (payment) => {
    const paymentDate = payment.created_at ? new Date(payment.created_at) : null;
    return {
      id: payment.id,
      date: paymentDate ? paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      amount: `$${parseFloat(payment.amount || 0).toFixed(2)}`,
      service: payment.appointment?.service?.name || payment.description || 'Payment',
      method: payment.payment_method || 'Credit Card',
      status: payment.status || 'paid',
    };
  };

  // Format consent for display
  const formatConsent = (consent) => {
    const consentDate = consent.created_at ? new Date(consent.created_at) : null;
    const signedDate = consent.date_signed ? new Date(consent.date_signed) : null;
    return {
      id: consent.id,
      name: `${consent.service?.name || 'Service'} Consent Form`,
      date: signedDate ? signedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
            (consentDate ? consentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'),
      status: consent.date_signed ? 'signed' : 'pending',
      type: 'consent',
    };
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Welcome back, {user?.name || 'Client'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your wellness journey continues</p>
        </div>
      </div>

      {/* Quick Stats - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextAppointmentDate ? (
              <>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {nextAppointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAppointment(nextAppointment).service} at {formatAppointment(nextAppointment).time}
                </p>
              </>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">None</div>
                <p className="text-xs text-muted-foreground">No upcoming appointments</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Package Progress</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {servicesUsed}/{servicesTotal}
            </div>
            <p className="text-xs text-muted-foreground">Services used</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Recent Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {recentPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">Last {recentPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Consent Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {consents.filter(c => !c.date_signed).length}
            </div>
            <p className="text-xs text-muted-foreground">Pending signatures</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments & Packages - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled treatments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              upcomingAppointments.map((apt) => {
                const formatted = formatAppointment(apt);
                return (
                  <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{formatted.service}</p>
                      <p className="text-sm text-muted-foreground">{formatted.date} at {formatted.time}</p>
                      <p className="text-sm text-muted-foreground">with {formatted.provider}</p>
                      <p className="text-xs text-muted-foreground">{formatted.location}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <Badge variant="outline" className="w-fit">{formatted.status}</Badge>
                    </div>
                  </div>
                );
              })
            )}
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-primary/5" 
              onClick={() => onPageChange('appointments/list')}
            >
              View All Appointments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Package Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Package Status</CardTitle>
            <CardDescription>
              {packageStats ? packageStats.name || 'Active Package' : 'No active package'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {packageStats ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Services Used</span>
                    <span className="text-foreground">{servicesUsed} of {servicesTotal}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                {packageStats.expires_at && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expiry Date</span>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(packageStats.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-primary/5" 
                  onClick={() => onPageChange('payments/packages')}
                >
                  View Package Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No active package</p>
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-primary/5" 
                  onClick={() => onPageChange('payments/packages')}
                >
                  View Packages
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Treatments & Documents - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Treatments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Treatments</CardTitle>
            <CardDescription>Your treatment history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent treatments</p>
              </div>
            ) : (
              recentAppointments.map((apt) => {
                const formatted = formatAppointment(apt);
                return (
                  <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{formatted.service}</p>
                      <p className="text-sm text-muted-foreground">{formatted.date}</p>
                      <p className="text-sm text-muted-foreground">with {formatted.provider}</p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {formatted.status}
                    </Badge>
                  </div>
                );
              })
            )}
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-primary/5" 
              onClick={() => onPageChange('appointments/list')}
            >
              View All Appointments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">My Documents</CardTitle>
            <CardDescription>Consents, summaries, and instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {consents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No consent forms</p>
              </div>
            ) : (
              consents.map((consent) => {
                const formatted = formatConsent(consent);
                return (
                  <div key={consent.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-border rounded-lg bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{formatted.name}</p>
                      <p className="text-sm text-muted-foreground">{formatted.date}</p>
                      <p className="text-xs text-muted-foreground capitalize">{formatted.type}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Badge variant={formatted.status === 'signed' ? 'default' : 'outline'} className="w-fit">
                        {formatted.status}
                      </Badge>
                      {formatted.status === 'signed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-border hover:bg-primary/5"
                          onClick={() => onPageChange('client/consents')}
                        >
                          <Download className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-primary/5" 
              onClick={() => onPageChange('client/consents')}
            >
              View All Consents
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments - Responsive */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Payments</CardTitle>
          <CardDescription>Your payment history and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payment history</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {recentPayments.map((payment) => {
                  const formatted = formatPayment(payment);
                  return (
                    <div key={payment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-border rounded-lg bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{formatted.service}</p>
                        <p className="text-sm text-muted-foreground">{formatted.date}</p>
                        <p className="text-sm text-muted-foreground">Paid via {formatted.method}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <p className="font-medium text-foreground">{formatted.amount}</p>
                          <Badge variant="outline" className="w-fit">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {formatted.status}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-border hover:bg-primary/5 w-full sm:w-auto"
                          onClick={() => onPageChange('payments/history')}
                        >
                          <Download className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Receipt</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-border hover:bg-primary/5" 
                onClick={() => onPageChange('payments/history')}
              >
                View All Payments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
