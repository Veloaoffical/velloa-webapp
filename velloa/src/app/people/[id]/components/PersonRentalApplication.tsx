'use client';

import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Send, CheckCircle2, ChevronDown, DollarSign, Download, ArrowLeftRight } from 'lucide-react';

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import CreditScoreGauge from '@/components/creditscore/credit-score-gauge';

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
  residence?: {
    address?: {
      city: string;
      street: string;
      province: string;
      postal_code: string;
    };
    monthly_rent?: number | null;
    move_in_date?: string | null;
    landlord_name?: string;
    landlord_email?: string;
    landlord_phone?: string;
    no_past_residence?: boolean;
    reason_for_leaving?: string;
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
    employment_type: string;
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

export function PersonRentalApplication() {
  const [animationData, setAnimationData] = useState<AnimationData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  // Fixed activeSidebarItem to always be 'summary'
  const activeSidebarItem = 'summary';

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

  // New two-column layout
  return (
    <div className="min-h-[calc(100vh-16rem)] relative">
      <div className="grid grid-cols-4 gap-6">
        {/* Left Column */}
        <div className="col-span-1 sticky top-6 self-start h-fit">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Property Details</h2>
                
                <div className="flex flex-col space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium text-right">{personDetails?.property_address || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="font-medium">{personDetails?.unit_number || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent:</span>
                      <span className="font-medium">
                        <span className="inline-flex items-center">
                          <DollarSign className="h-3 w-3 mr-0.5 text-muted-foreground" />
                          {personDetails?.monthly_rent?.toLocaleString() || 'Unknown'}/month
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Move-in:</span>
                      <span className="font-medium">{personDetails?.property_availability_date ? new Date(personDetails.property_availability_date).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    {personDetails.status !== 'accepted' && (
                      <Button 
                        className="w-full"
                        variant="default"
                        size="sm"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Decline/Accept
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="col-span-3 space-y-6 overflow-auto">
          {/* First Card: Applicant Overview */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg">
                Applicant Overview
              </h2>
              
              {personDetails.status === 'accepted' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-green-900">Application Accepted</h3>
                    <p className="text-sm text-green-700">
                      This prospect has been approved and notified via email.
                    </p>
                  </div>
                </div>
              )}

              {/* Applicant details table */}
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Occupants</TableCell>
                          <TableCell className="py-2.5 w-[100px]">
                            <div className="text-sm">
                              {personDetails.dependents?.length 
                                ? `2 Adults, ${personDetails.dependents.length} Dependant${personDetails.dependents.length > 1 ? 's' : ''}`
                                : "1 Adult"}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Employment status</TableCell>
                          <TableCell className="py-2.5 w-[100px]">
                            <div className="text-sm">
                              {personDetails.employment?.employment_type ? 
                                personDetails.employment.employment_type.charAt(0).toUpperCase() + 
                                personDetails.employment.employment_type.slice(1) : 
                                "Not specified"}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Personal income</TableCell>
                          <TableCell className="py-2.5 w-[100px]">
                            <div className="text-sm">
                              ${personDetails.employment?.monthly_income 
                                ? (personDetails.employment.monthly_income * 12).toLocaleString() 
                                : personDetails.income?.employment_income?.toLocaleString() || "0"}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Pets</TableCell>
                          <TableCell className="py-2.5 w-[100px]">
                            <div className="text-sm">
                              {personDetails.pets?.length || 0}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Company</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <div className="text-sm">
                              {personDetails.employment?.employer_name || "Not specified"}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Vehicles</TableCell>
                          <TableCell className="py-2.5 w-[100px]">
                            <div className="text-sm">
                              {personDetails.vehicles?.length || 0}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Second Card: Credit Overview */}
          {activeSidebarItem === 'summary' && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Credit Overview</h2>
                  <div className="h-[26px] px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium flex items-center gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>PASS</span>
                  </div>
                </div>
                <div className="w-full">
                  <CreditScoreGauge score={personDetails.credit_score || 613} />
                </div>
              </CardContent>
            </Card>
          )}
          

          {/* Rental Application heading with explanatory text */}
          <div className="mt-6 mb-4">
            <h2 className="font-semibold text-2xl mb-1">Rental Application</h2>
            <p className="text-sm text-muted-foreground">The following section contains self-reported data provided by the tenant in the rental application.
            </p>
          </div>
          
          {/* Fourth Card: Rental Application */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Personal details</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">First name</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.first_name || 'John'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Middle name</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.middle_name || 'Michael'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Last name</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.last_name || 'Doe'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Date of birth</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.date_of_birth ? new Date(personDetails.date_of_birth).toLocaleDateString() : '25 Aug, 1992 (32 yrs old)'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">SSN/SIN</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.ssn ? `••••••${personDetails.ssn.slice(-4)}` : '-'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Driver&apos;s license</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.drivers_license_number || '-'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Email</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.email || 'test@email.com'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Phone number</TableCell>
                          <TableCell className="py-2.5 font-medium">
                            {personDetails.phone || '(555) 555-5555'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              {/* Address History Card */}
              <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Address history</h3>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableBody>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Current address</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Matches Bureau</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Residential status</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.monthly_rent ? 'Rent' : 'Rent'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Address</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.address ? 
                                `${personDetails.residence.address.street}, ${personDetails.residence.address.city} ${personDetails.residence.address.province}, ${personDetails.residence.address.postal_code}` : 
                                '6021 Yonge Street, North York ON, Canada, M2M 3W2'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Length of stay</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.move_in_date ? 
                                `${new Date(personDetails.residence.move_in_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present` : 
                                'Jan 2018 - Feb 2023'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Monthly rent</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.monthly_rent ? 
                                `$${personDetails.residence.monthly_rent.toLocaleString()}` : 
                                '-'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableBody>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Reason for moving</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.reason_for_leaving || 'Moving closer to work'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Landlord reference</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.landlord_name || 'Jennifer Cook'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Landlord number</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.landlord_phone || '(416) 888-8888'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5">Landlord email</TableCell>
                            <TableCell className="py-2.5 font-medium">
                              {personDetails.residence?.landlord_email || 'jennifer@singlekey.com'}
                            </TableCell>
                          </TableRow>
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5"></TableCell>
                            <TableCell className="py-2.5 font-medium">
                              &nbsp;
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
} 
