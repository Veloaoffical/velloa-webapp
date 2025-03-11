'use client';

import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Send, Mail, Phone, CheckCircle2, XCircle, AlertCircle, ChevronDown, Building, Users2, Cat, Car, Briefcase, DollarSign, UserRoundPlus, Ban } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AnimationData = Record<string, unknown>;

interface PersonDetails {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string;
  ssn: string;
  drivers_license_state: string;
  drivers_license_number: string;
  date_of_birth: string | null;
  gender: string;
  marital_status: string;
  about_you: string;
  status: string;
  company_id?: string;
  company?: string;
  credit_score?: number;
  criminal_check?: 'pending' | 'completed' | 'failed';
  employment_check?: 'pending' | 'completed' | 'failed';
  eviction_check?: 'pending' | 'completed' | 'failed';
  rental_history_check?: 'pending' | 'completed' | 'failed';
  property_name?: string;
  property_address?: string;
  unit_number?: string;
  unit_type?: string;
  monthly_rent?: number;
  property_image?: string;
  property_availability_date?: string;
  unit_id?: string;
  current_address?: {
    city: string;
    street: string;
    province: string;
    postal_code: string;
  };
  pets?: Array<{
    age: string;
    name: string;
    type: string;
    breed: string;
    color: string;
    gender: string;
    weight: string;
    spayedNeutered: boolean;
  }>;
  vehicles?: Array<{
    make: string;
    year: string;
    color: string;
    model: string;
    state: string;
    licensePlate: string;
  }>;
  dependents?: Array<{
    age: string;
    lastName: string;
    firstName: string;
    middleName: string;
    relationship: string;
  }>;
  employment?: {
    address: {
      city: string;
      street: string;
      province: string;
      postal_code: string;
    };
    job_title: string;
    employer_name: string;
    monthly_income: number;
    supervisor_name: string;
    supervisor_phone: string;
    employment_start_date: string;
  };
  income?: {
    alimony: number;
    other_income: number;
    child_support: number;
    employment_income: number;
    investment_income: number;
    retirement_income: number;
    other_income_source: string;
    government_assistance: number;
  };
}


function CheckStatus({ status }: { status?: 'pending' | 'completed' | 'failed' }) {
  if (!status) return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'pending':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}

function getCreditScoreColor(score: number) {
  if (score < 400) return 'bg-red-500';
  if (score < 500) return 'bg-gradient-to-r from-red-500 to-orange-500';
  if (score < 600) return 'bg-gradient-to-r from-orange-500 to-yellow-400';
  if (score < 700) return 'bg-gradient-to-r from-yellow-400 to-green-500';
  return 'bg-gradient-to-r from-green-500 to-green-600';
}

function getCreditScoreCategory(score: number) {
  if (score < 400) return 'VERY POOR';
  if (score < 500) return 'POOR';
  if (score < 600) return 'FAIR';
  if (score < 700) return 'GOOD';
  return 'EXCELLENT';
}

export function PersonRentalApplication() {
  const [animationData, setAnimationData] = useState<AnimationData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        const response = await fetch(`/api/people/${params.id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch person details');
        }
        console.log('Fetched person details:', data);
        console.log('Company ID from person details:', data.company_id);
        setPersonDetails(data);
      } catch (error) {
        console.error('Error fetching person details:', error);
        toast.error('Failed to fetch person details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonDetails();
  }, [params.id]);

  useEffect(() => {
    import('../../../../../public/SentMessageAnimation.json')
      .then((mod) => {
        const data = mod.default;
        data.fr = 30;
        setAnimationData(data);
      })
      .catch(err => console.error('Error loading animation:', err));
  }, []);

  const handleResend = async () => {
    try {
      setIsResending(true);
      console.log('Starting resend request for prospect ID:', params.id);
      
      const response = await fetch(`/api/people/${params.id}/resend-application`, {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to resend application');
      }

      toast.success('Application resent successfully');
      console.log('Email sent successfully:', data.data);
    } catch (error) {
      console.error('Error resending application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend application');
    } finally {
      setIsResending(false);
    }
  };

  const handleDecline = async () => {
    if (!personDetails) {
      toast.error('No application details available');
      return;
    }

    try {
      const response = await fetch(`/api/people/${params.id}/decline-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyName: personDetails.property_name,
          unitNumber: personDetails.unit_number,
          propertyAddress: personDetails.property_address,
          applicantName: `${personDetails.first_name} ${personDetails.last_name}`,
          applicantEmail: personDetails.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send decline email');
      }

      toast.success('Application declined successfully');
    } catch (error) {
      console.error('Error declining application:', error);
      toast.error('Failed to decline application');
    }
  };

  const handleAccept = async () => {
    if (!personDetails) {
      toast.error('No application details available');
      return;
    }

    try {
      if (!personDetails.company_id) {
        toast.error('No company ID available');
        return;
      }

      console.log('Fetching company name for ID:', personDetails.company_id);

      // Get company name from companies table using the ID
      const supabase = createClientComponentClient();
      const { data: company, error: companyNameError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', personDetails.company_id)
        .single();

      console.log('Supabase response:', { company, error: companyNameError });

      if (companyNameError) {
        console.error('Error fetching company name:', companyNameError);
        toast.error('Failed to fetch company name');
        return;
      }
      
      if (!company?.name) {
        console.error('Company found but no name:', company);
        toast.error('Company name not found');
        return;
      }

      console.log('Successfully found company:', company);

      const response = await fetch(`/api/people/${params.id}/accept-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyName: personDetails.property_name || '',
          unitNumber: personDetails.unit_number || '',
          propertyAddress: personDetails.property_address || '',
          applicantName: `${personDetails.first_name} ${personDetails.last_name}`,
          applicantEmail: personDetails.email,
          companyName: company.name
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept application');
      }

      toast.success('Application accepted successfully');
      
      window.location.reload();
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept application');
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-16rem)]">
        <Card className="h-full">
          <CardContent className="h-full p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!personDetails) {
    return (
      <div className="h-[calc(100vh-16rem)]">
        <Card className="h-full">
          <CardContent className="h-full p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Failed to load person details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (personDetails.status === 'sent') {
    return (
      <div className="h-[calc(100vh-16rem)]">
        <Card className="h-full">
          <CardContent className="h-full p-6">
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="relative w-[300px] h-[300px]">
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg animate-pulse">
                    <div className="w-full h-full" />
                  </div>
                )}
                
                {animationData && (
                  <Lottie
                    animationData={animationData}
                    loop={false}
                    autoplay={true}
                    className="w-full h-full"
                    onComplete={() => setIsLoaded(true)}
                    rendererSettings={{
                      preserveAspectRatio: 'xMidYMid slice',
                      progressiveLoad: false,
                    }}
                  />
                )}
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Application Sent
              </h1>
              
              <div className="flex flex-col items-center space-y-2">
                <p className="text-muted-foreground">
                  The prospect has received a rental application, we&apos;re waiting for the application to be filled out.
                </p>
              </div>

              <Button 
                className="w-[200px] bg-primary hover:bg-primary/90"
                onClick={handleResend}
                disabled={isResending}
              >
                <Send className="w-4 h-4 mr-2" />
                {isResending ? 'Resending...' : 'Resend Application'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-16rem)]">
      <Card>
        <CardContent className="p-6">
          {personDetails.status === 'accepted' && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium text-green-900">Application Accepted</h3>
                <p className="text-sm text-green-700">
                  This prospect has been approved and notified via email.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-semibold mb-4">Property of Interest</h2>
              <div className="rounded-lg border bg-background overflow-hidden max-w-sm">
                <div className="aspect-[3/1] relative overflow-hidden">
                  {personDetails.property_image ? (
                    <Image 
                      src={personDetails.property_image} 
                      alt={personDetails.property_name || 'Property'} 
                      className="w-full h-full object-cover"
                      width={1000}
                      height={1000}
                      />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-semibold">{personDetails.unit_number || '64'}</h3>
                    <div className="h-1 w-1 rounded-full bg-green-500" />
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {personDetails.property_name || '64 Tawes trail'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {personDetails.property_address || 'King City, ON L7B1B4'}
                    </p>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      <p>{personDetails.unit_number ? `${personDetails.unit_number} - Unit ${personDetails.unit_number}` : '64 Tawes trail - Unit 64'}</p>
                    </div>
                    <p className="text-muted-foreground">
                      Available {personDetails.property_availability_date ? new Date(personDetails.property_availability_date).toLocaleDateString() : '1/1/2025'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={personDetails.first_name}
                    className="bg-background"
                    placeholder="Enter first name"
                    disabled
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Middle Name</Label>
                  <Input 
                    value={personDetails.middle_name || ''}
                    className="bg-background"
                    placeholder="Enter middle name"
                    disabled
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={personDetails.last_name}
                    className="bg-background"
                    placeholder="Enter last name"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input 
                      value={personDetails.email}
                      className="bg-background pl-9"
                      placeholder="Enter email address"
                      disabled
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Input 
                      value={personDetails.phone}
                      className="bg-background pl-9"
                      placeholder="Enter phone number"
                      disabled
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Identification</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>SSN <span className="text-red-500">*</span></Label>
                  <Input 
                    value={`••••••${personDetails.ssn?.slice(-4) || ''}`}
                    className="bg-background"
                    placeholder="Enter SSN"
                    disabled
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Driver&apos;s License Number</Label>
                  <Input 
                    value={personDetails.drivers_license_number || ''}
                    className="bg-background"
                    placeholder="Enter license number"
                    disabled
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Driver License Province</Label>
                  <Select disabled value={personDetails.drivers_license_state || ''}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Province">
                        {personDetails.drivers_license_state === 'ON' ? 'Ontario' : personDetails.drivers_license_state || ''}
                      </SelectValue>
                    </SelectTrigger>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    value={personDetails.date_of_birth ? new Date(personDetails.date_of_birth).toLocaleDateString() : ''}
                    className="bg-background"
                    placeholder="mm/dd/yyyy"
                    disabled
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Select disabled value={personDetails.gender || ''}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Marital Status</Label>
                  <Select disabled value={personDetails.marital_status || ''}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label>Tell us why you&apos;re awesome!</Label>
                <Textarea 
                  value={personDetails.about_you || ''}
                  className="bg-background resize-none mt-2"
                  placeholder="Share a bit about yourself..."
                  disabled
                />
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {(personDetails.about_you?.length || 0)}/1000 characters
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Background Check</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Credit Score</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {personDetails.credit_score ? `${personDetails.credit_score} - ${getCreditScoreCategory(personDetails.credit_score)}` : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="relative pt-6">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
                      <span>VERY POOR</span>
                      <span>POOR</span>
                      <span>FAIR</span>
                      <span>GOOD</span>
                      <span>EXCELLENT</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      {personDetails.credit_score ? (
                        <div 
                          className={`h-full transition-all duration-500 ${getCreditScoreColor(personDetails.credit_score)}`}
                          style={{ width: `${(personDetails.credit_score / 850) * 100}%` }}
                        />
                      ) : (
                        <div className="h-full bg-muted" />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                      <span>300</span>
                      <span>400</span>
                      <span>600</span>
                      <span>700</span>
                      <span>850</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`flex flex-col p-4 rounded-lg border bg-background cursor-pointer transition-all duration-200 ${expandedCard === 'criminal' ? 'min-h-[200px]' : 'min-h-[88px]'}`}
                    onClick={() => toggleCard('criminal')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Criminal History Check</Label>
                        <p className="text-sm text-muted-foreground mt-1">Background verification</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckStatus status={personDetails.criminal_check} />
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedCard === 'criminal' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {expandedCard === 'criminal' && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>No criminal records found</li>
                          <li>Verification completed on {new Date().toLocaleDateString()}</li>
                          <li>Status: {personDetails.criminal_check || 'Pending'}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`flex flex-col p-4 rounded-lg border bg-background cursor-pointer transition-all duration-200 ${expandedCard === 'employment' ? 'min-h-[200px]' : 'min-h-[88px]'}`}
                    onClick={() => toggleCard('employment')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Employment Verification</Label>
                        <p className="text-sm text-muted-foreground mt-1">Income and employment</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckStatus status={personDetails.employment_check} />
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedCard === 'employment' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {expandedCard === 'employment' && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Current employer verified</li>
                          <li>Income verification in progress</li>
                          <li>Status: {personDetails.employment_check || 'Pending'}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`flex flex-col p-4 rounded-lg border bg-background cursor-pointer transition-all duration-200 ${expandedCard === 'eviction' ? 'min-h-[200px]' : 'min-h-[88px]'}`}
                    onClick={() => toggleCard('eviction')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Eviction History Check</Label>
                        <p className="text-sm text-muted-foreground mt-1">Previous evictions</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckStatus status={personDetails.eviction_check} />
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedCard === 'eviction' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {expandedCard === 'eviction' && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>No eviction records found</li>
                          <li>Database check completed</li>
                          <li>Status: {personDetails.eviction_check || 'Pending'}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`flex flex-col p-4 rounded-lg border bg-background cursor-pointer transition-all duration-200 ${expandedCard === 'rental' ? 'min-h-[200px]' : 'min-h-[88px]'}`}
                    onClick={() => toggleCard('rental')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rental History Check</Label>
                        <p className="text-sm text-muted-foreground mt-1">Previous rentals</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckStatus status={personDetails.rental_history_check} />
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedCard === 'rental' ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {expandedCard === 'rental' && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Previous rental references pending</li>
                          <li>Landlord contact in progress</li>
                          <li>Status: {personDetails.rental_history_check || 'Pending'}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Current Residence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Street Address</Label>
                  <Input 
                    value={personDetails.current_address?.street || ''}
                    className="bg-background"
                    placeholder="Enter street address"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input 
                    value={personDetails.current_address?.city || ''}
                    className="bg-background"
                    placeholder="Enter city"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Province</Label>
                  <Input 
                    value={personDetails.current_address?.province || ''}
                    className="bg-background"
                    placeholder="Enter province"
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Postal Code</Label>
                  <Input 
                    value={personDetails.current_address?.postal_code || ''}
                    className="bg-background"
                    placeholder="Enter postal code"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Employment</h2>
              {personDetails.employment && (
                personDetails.employment.job_title || 
                personDetails.employment.employer_name || 
                personDetails.employment.monthly_income || 
                personDetails.employment.supervisor_name || 
                personDetails.employment.supervisor_phone || 
                personDetails.employment.employment_start_date
              ) ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Employer Name</Label>
                      <Input 
                        value={personDetails.employment.employer_name}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Job Title</Label>
                      <Input 
                        value={personDetails.employment.job_title}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Monthly Income</Label>
                      <Input 
                        value={`$${personDetails.employment.monthly_income.toLocaleString()}`}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input 
                        value={new Date(personDetails.employment.employment_start_date).toLocaleDateString()}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Supervisor Name</Label>
                      <Input 
                        value={personDetails.employment.supervisor_name}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Supervisor Phone</Label>
                      <Input 
                        value={personDetails.employment.supervisor_phone}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Street Address</Label>
                        <Input 
                          value={personDetails.employment.address.street}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>City</Label>
                        <Input 
                          value={personDetails.employment.address.city}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Province</Label>
                        <Input 
                          value={personDetails.employment.address.province}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Postal Code</Label>
                        <Input 
                          value={personDetails.employment.address.postal_code}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg flex flex-col items-center gap-2">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                  <span>No employment information listed</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Income</h2>
              {personDetails.income && (
                personDetails.income.employment_income || 
                personDetails.income.investment_income || 
                personDetails.income.retirement_income || 
                personDetails.income.alimony || 
                personDetails.income.child_support || 
                personDetails.income.government_assistance || 
                personDetails.income.other_income
              ) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Employment Income</Label>
                    <Input 
                      value={`$${personDetails.income.employment_income.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Investment Income</Label>
                    <Input 
                      value={`$${personDetails.income.investment_income.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Retirement Income</Label>
                    <Input 
                      value={`$${personDetails.income.retirement_income.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Alimony</Label>
                    <Input 
                      value={`$${personDetails.income.alimony.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Child Support</Label>
                    <Input 
                      value={`$${personDetails.income.child_support.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Government Assistance</Label>
                    <Input 
                      value={`$${personDetails.income.government_assistance.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Other Income</Label>
                    <Input 
                      value={`$${personDetails.income.other_income.toLocaleString()}/year`}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Other Income Source</Label>
                    <Input 
                      value={personDetails.income.other_income_source}
                      disabled
                    />
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg flex flex-col items-center gap-2">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                  <span>No income information listed</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Pets</h2>
              {personDetails.pets && personDetails.pets.length > 0 && 
               personDetails.pets.some(pet => 
                 pet.name || pet.type || pet.breed || pet.color || pet.age || pet.weight || pet.gender
               ) ? (
                <div className="space-y-6">
                  {personDetails.pets.map((pet, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="grid gap-2">
                        <Label>Pet Name</Label>
                        <Input 
                          value={pet.name}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Input 
                          value={pet.type}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Breed</Label>
                        <Input 
                          value={pet.breed}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Color</Label>
                        <Input 
                          value={pet.color}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Age</Label>
                        <Input 
                          value={`${pet.age} years`}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Weight</Label>
                        <Input 
                          value={`${pet.weight} lbs`}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Gender</Label>
                        <Input 
                          value={pet.gender}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Spayed/Neutered</Label>
                        <Input 
                          value={pet.spayedNeutered ? 'Yes' : 'No'}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg flex flex-col items-center gap-2">
                  <Cat className="h-8 w-8 text-muted-foreground" />
                  <span>No pets listed</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Vehicles</h2>
              {personDetails.vehicles && personDetails.vehicles.length > 0 && 
               personDetails.vehicles.some(vehicle => 
                 vehicle.make || vehicle.model || vehicle.year || vehicle.color || vehicle.state || vehicle.licensePlate
               ) ? (
                <div className="space-y-6">
                  {personDetails.vehicles.map((vehicle, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="grid gap-2">
                        <Label>Make</Label>
                        <Input 
                          value={vehicle.make}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Model</Label>
                        <Input 
                          value={vehicle.model}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Year</Label>
                        <Input 
                          value={vehicle.year}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Color</Label>
                        <Input 
                          value={vehicle.color}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Province/State</Label>
                        <Input 
                          value={vehicle.state}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>License Plate</Label>
                        <Input 
                          value={vehicle.licensePlate}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg flex flex-col items-center gap-2">
                  <Car className="h-8 w-8 text-muted-foreground" />
                  <span>No vehicles listed</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4">Dependents</h2>
              {personDetails.dependents && personDetails.dependents.length > 0 && 
               personDetails.dependents.some(dep => 
                 dep.firstName || dep.middleName || dep.lastName || dep.age || dep.relationship
               ) ? (
                <div className="space-y-6">
                  {personDetails.dependents.map((dependent, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="grid gap-2">
                        <Label>First Name</Label>
                        <Input 
                          value={dependent.firstName}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Middle Name</Label>
                        <Input 
                          value={dependent.middleName}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Last Name</Label>
                        <Input 
                          value={dependent.lastName}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Age</Label>
                        <Input 
                          value={dependent.age}
                          disabled
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Relationship</Label>
                        <Input 
                          value={dependent.relationship}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg flex flex-col items-center gap-2">
                  <Users2 className="h-8 w-8 text-muted-foreground" />
                  <span>No dependents listed</span>
                </div>
              )}
            </div>

            {personDetails.status !== 'accepted' && (
              <div className="flex flex-col gap-32 pt-6">
                <h2 className="text-base font-semibold">Review</h2>
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    className="w-[200px]"
                    onClick={handleDecline}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button 
                    className="w-[200px] bg-[#16B364] hover:bg-[#16B364]/90"
                    onClick={handleAccept}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    className="w-[200px] bg-[#16B364] hover:bg-[#16B364]/90"
                    onClick={() => {
                      // TODO: Implement create lease agreement functionality
                    }}
                  >
                    <UserRoundPlus className="h-4 w-4 mr-2" />
                    Create Lease Agreement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 