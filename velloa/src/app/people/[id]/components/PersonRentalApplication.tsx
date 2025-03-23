'use client';

import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Send, CheckCircle2, DollarSign, Download, ArrowLeftRight, TriangleAlert, CheckIcon } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CreditScoreGauge from '@/components/backgroundchecks/credit-score-gauge';
import DebtToIncomeGauge from '@/components/backgroundchecks/debt-to-income-gauge';
import RentToIncomeGauge from '@/components/backgroundchecks/rent-to-income-gauge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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
          
          {/* Debt to Income Gauge */}
          {activeSidebarItem === 'summary' && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Debt to Income</h2>
                  <div className="h-[26px] px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium flex items-center gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>FAIR</span>
                  </div>
                </div>
                <div className="w-full max-w-none">
                  <DebtToIncomeGauge ratio={35} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Rent to Income Gauge */}
          {activeSidebarItem === 'summary' && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Rent to Income</h2>
                  <div className="h-[26px] px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium flex items-center gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>GOOD</span>
                  </div>
                </div>
                <div className="w-full max-w-none">
                  <RentToIncomeGauge ratio={28} />
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
          <Card className="shadow-sm mt-6">
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Address history</h3>
                  </div>
                  
                  {/* Current Address Section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <h4 className="font-semibold text-base">Current Address</h4>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Matches Bureau</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-full overflow-auto">
                        <Table>
                          <TableBody>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Residential status</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                {personDetails.residence?.monthly_rent ? 'Rent' : 'Rent'}
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Address</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                123 Main St, Toronto, ON, M5A 1A1
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Length of stay</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                {personDetails.residence?.move_in_date ? 
                                  `${new Date(personDetails.residence.move_in_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - Present` : 
                                  'Jan 2018 - Present'}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="h-full overflow-auto">
                        <Table>
                          <TableBody>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Monthly rent</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                {personDetails.residence?.monthly_rent ? 
                                  `$${personDetails.residence.monthly_rent.toLocaleString()}` : 
                                  '$1,850'}
                              </TableCell>
                            </TableRow>
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
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Previous Address Section */}
                  <div>
                    <h4 className="font-semibold text-base mb-4">Previous Address</h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-full overflow-auto">
                        <Table>
                          <TableBody>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Residential status</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                Rent
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Address</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                480 Queens Quay W, Toronto ON, Canada, M5V 2Y5
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Length of stay</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                May 2015 - Dec 2017
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="h-full overflow-auto">
                        <Table>
                          <TableBody>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Monthly rent</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                $1,650
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Reason for moving</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                Needed more space
                              </TableCell>
                            </TableRow>
                            <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">Landlord reference</TableCell>
                              <TableCell className="py-2.5 font-medium">
                                Michael Thompson
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Income Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Income</h3>
                  </div>
                  
                  {/* Income Overview */}
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="overflow-hidden bg-muted/50">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Personal income (annual pre-tax)
                        </div>
                        <div className="text-2xl font-semibold">
                          ${personDetails.employment?.monthly_income 
                            ? (personDetails.employment.monthly_income * 12).toLocaleString() 
                            : '80,000'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Household income (annual pre-tax)
                        </div>
                        <div className="text-2xl font-semibold">
                          $140,000
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Income Sources */}
                  <div>                    
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Income source</TableHead>
                          <TableHead>Annual amount</TableHead>
                          <TableHead>Proof of income</TableHead>
                          <TableHead className="text-right">File</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">ACME PLUMBING, FULL TIME EMPLOYMENT</TableCell>
                          <TableCell className="py-2.5">$70,000</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                          <TableCell className="py-2.5 text-right">
                            <Button variant="ghost" size="sm" className="h-8 text-primary">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">COMMISSION</TableCell>
                          <TableCell className="py-2.5">$10,000</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                          <TableCell className="py-2.5 text-right">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Occupants Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">Occupants</h3>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
                    </div>
                  </div>
                  
                  {/* Occupants Summary */}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Adults</span>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">2</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Dependants</span>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">1</span>
                    </div>
                  </div>
                  
                  {/* Occupants List */}
                  <div>
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone number</TableHead>
                          <TableHead>Share of rent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">
                            <div>
                              <div className="font-medium">John Doe</div>
                              <div className="text-xs text-muted-foreground">Current applicant</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">test@email.com</TableCell>
                          <TableCell className="py-2.5">(555) 555-5555</TableCell>
                          <TableCell className="py-2.5">$1,000</TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">
                            <div>
                              <div className="font-medium">Jane Doe</div>
                              <div className="text-xs text-muted-foreground">Family - wife</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">test2@email.com</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                          <TableCell className="py-2.5">$200</TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">
                            <div>
                              <div className="font-medium">Jonathan Jr</div>
                              <div className="text-xs text-muted-foreground">Child</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Co-signer Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="font-semibold text-base">Co-signer (Guarantor)</h4>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">1</span>
                    </div>
                    
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone number</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">
                            <div>
                              <div className="font-medium">Susan Doe</div>
                              <div className="text-xs text-muted-foreground">Mother</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">test3@mail.com</TableCell>
                          <TableCell className="py-2.5">(555) 555-5555</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Pets Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">Pets</h3>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
                    </div>
                  </div>
                  
                  {/* Pets List */}
                  <div>
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Type of animal</TableHead>
                          <TableHead>Breed</TableHead>
                          <TableHead>Weight (lbs)</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Fixed</TableHead>
                          <TableHead className="text-right">Photo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">cat</TableCell>
                          <TableCell className="py-2.5">Abyssinian Cat</TableCell>
                          <TableCell className="py-2.5">4</TableCell>
                          <TableCell className="py-2.5">M</TableCell>
                          <TableCell className="py-2.5">7</TableCell>
                          <TableCell className="py-2.5">Y</TableCell>
                          <TableCell className="py-2.5 text-right">
                            <Button variant="ghost" size="sm" className="h-8 text-primary">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Vehicles Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">Vehicles</h3>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {personDetails.vehicles?.length || 1}
                      </span>
                    </div>
                  </div>
                  
                  {/* Vehicles List */}
                  <div>
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Make</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>License Plate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        {personDetails.vehicles && personDetails.vehicles.length > 0 ? (
                          personDetails.vehicles.map((vehicle, index) => (
                            <TableRow key={index} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5 font-medium">{vehicle.make}</TableCell>
                              <TableCell className="py-2.5">{vehicle.model}</TableCell>
                              <TableCell className="py-2.5">{vehicle.year}</TableCell>
                              <TableCell className="py-2.5">{vehicle.licensePlate}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                            <TableCell className="py-2.5 font-medium">Ford</TableCell>
                            <TableCell className="py-2.5">F-150</TableCell>
                            <TableCell className="py-2.5">1996</TableCell>
                            <TableCell className="py-2.5">124XSQ</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Additional information Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Additional information</h3>
                  </div>
                  
                  {/* Questions and Answers */}
                  <div>
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Question</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Additional Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">Do you smoke or vape?</TableCell>
                          <TableCell className="py-2.5">No</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">Have you given notice to your landlord?</TableCell>
                          <TableCell className="py-2.5">No</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">Have you ever refused to pay rent?</TableCell>
                          <TableCell className="py-2.5">No</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">Have you ever been evicted?</TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">Yes</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            I got evicted due to noise concerns related to my dog. Since that incident, I have devoted considerable time and effort to properly train my dog. These measures have proven successful, and I can confidently attest that my dog is now well-trained and no longer a source of disruption.
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5 font-medium">Do you have a criminal record?</TableCell>
                          <TableCell className="py-2.5">No</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Personal message Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Personal message from tenant</h3>
                  </div>
                  
                  {/* Message content */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">
                      I am impressed with the features and location of your property. It seems to be the perfect fit for my needs, and I am excited about the prospect of making it my new home. Thank you for considering my application, and I look forward to the possibility of becoming a tenant at your property.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Applicant Consent Card */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Applicant consent</h3>
                    <div className="text-sm text-muted-foreground">
                      DATE CONSENTED: {personDetails.date_of_birth ? new Date(personDetails.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Oct 12, 2018'}
                    </div>
                  </div>
                  
                  {/* Consent content */}
                  <div className="border border-muted rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"></path></svg>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        I ({personDetails.first_name || 'John'} {personDetails.last_name || 'Doe'}) confirm that all information provided in this application is accurate to the best of my knowledge. I give the landlord, property manager or landlord&apos;s agent, permission to run my credit report and background check and to contact my references, for the purpose of assessing my rental application. I agree to allowing the following individuals or groups to disclose any relevant information about me: credit reporting services, court, tribunals, banks, prior landlords, employers, and personal references. I consent to SingleKey&apos;s Terms and Conditions and Privacy Policy.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          
          {/* Public Record Search */}
          <div className="mt-6 mb-4">
            <h2 className="font-semibold text-2xl mb-1">Public record search</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Background check results from various public records databases.
            </p>
            
            <div className="rounded-md border border-amber-500/50 px-4 py-3 text-amber-600 mb-6">
              <div className="flex gap-3">
                <TriangleAlert className="mt-0.5 shrink-0 opacity-60" size={16} aria-hidden="true" />
                <div className="grow space-y-1">
                  <p className="text-sm font-medium">Public record search disclaimer:</p>
                  <p className="text-sm opacity-80">
                    These results combine self-reported information with available databases, which may lead to potential discrepancies. Please review carefully to verify the applicant&apos;s identity before making a decision. The Public Record Search and Credit Report originate from different data sources, so a name mismatch in the Public Record Search does not necessarily indicate an error in the Credit Report.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Summary</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="h-full overflow-auto">
                  <Table>
                    <TableBody>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Public court records</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Criminal record search</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Fraud watchlist</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Known affiliations</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Global clearance check</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="h-full overflow-auto">
                  <Table>
                    <TableBody>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Openroom</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1.5">
                            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                            Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">CanLII</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1.5">
                            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                            Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">SOQUIJ / TAL</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1.5">
                            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                            Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Public safety check</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5">Other searches</TableCell>
                        <TableCell className="py-2.5 w-[120px]">
                          <Badge variant="outline" className="gap-1">
                            <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                            Cleared
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Public Record Search Accordion */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Public record results</h3>
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Public court records</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Cleared
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Criminal record search</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Cleared
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Fraud watchlist</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Cleared
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Known affiliations</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Cleared
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Global clearance check</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Cleared
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Identity verification</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Criminal Record Search Accordion */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Criminal record results</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      National Criminal Record Search
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">RCMP Record Check</p>
                          </div>
                          <div className="text-sm">Date checked: May 14, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No record found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Verification method:</span> Digital fingerprint scan
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="2" className="even:bg-transparent odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Provincial Court Records
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Ontario Court System</p>
                          </div>
                          <div className="text-sm">Date checked: May 12, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No provincial records found
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="3" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      International Criminal Checks
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">International Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No international records found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Jurisdictions checked:</span> US, UK, EU, Australia
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          
          {/* Public Safety Results */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Public safety results</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Sex Offender Registry Check
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Registry</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No record found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Verification method:</span> Identity verification
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="2" className="even:bg-transparent odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Violent Offender Database
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 14, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No record found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Coverage:</span> National database of violent offenders
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="3" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Terrorist Watchlist Check
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Global Security Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No matches found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Databases checked:</span> OFAC, Interpol, UN Sanctions List
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          
          {/* Fraud Watchlist Results */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Fraud watchlist results</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Financial Fraud Database
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Financial Fraud Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 16, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No fraud history found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Coverage:</span> National database of financial fraud perpetrators
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="2" className="even:bg-transparent odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Identity Theft Registry
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">ID Verification Service</p>
                          </div>
                          <div className="text-sm">Date checked: May 16, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> Identity verified, no alerts
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Verification method:</span> SSN validation, address history, documentation
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="3" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Rental Fraud History
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Rental Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No record of rental fraud
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Database coverage:</span> Records from major property management companies and rental agencies
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          
          {/* Known Affiliations Results */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Known affiliations results</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Organized Group Affiliations
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Security Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 14, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No known affiliations
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Verification method:</span> Background investigation
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="2" className="even:bg-transparent odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Political Extremism Check
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">National Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 16, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No matches found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Coverage:</span> Records of known extremist group members
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="3" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Association Verification
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Background Check Service</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No concerning associations
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Verification scope:</span> Professional, social, and organizational affiliations
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          
          {/* Global Clearance Results */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Global clearance results</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      International Criminal Records
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Interpol Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 14, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No international criminal records
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Countries checked:</span> 195 member countries
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="2" className="even:bg-transparent odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Global Financial Sanctions
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">World Bank List</p>
                          </div>
                          <div className="text-sm">Date checked: May 16, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No sanctions found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Lists checked:</span> OFAC, EU, UN, HMT, and other global sanctions lists
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="3" className="odd:bg-muted/50 border-none px-4 py-2">
                    <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline hover:bg-transparent">
                      Foreign Asset Control Check
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-2">
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">OFAC Database</p>
                          </div>
                          <div className="text-sm">Date checked: May 15, 2023</div>
                        </div>
                        <div className="space-y-3 mt-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Status:</span> No matches found
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Database coverage:</span> Specially Designated Nationals and Blocked Persons List
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          
          {/* Employment History Card */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Employment history</h3>
                  </div>
                </div>
                
                {/* Employment History Table */}
                <div>
                  <Table>
                    <TableHeader className="bg-transparent">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Employer</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Dates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody aria-hidden="true" className="table-row h-2"></tbody>
                    <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">ACME Carpentry</TableCell>
                        <TableCell className="py-2.5">Carpenter</TableCell>
                        <TableCell className="py-2.5">Jan 04, 2022 - Present</TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">ABC Carpenters</TableCell>
                        <TableCell className="py-2.5">Carpenter</TableCell>
                        <TableCell className="py-2.5">Sep 20, 2017 - Dec 20, 2021</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Education History Card */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Education history</h3>
                  </div>
                </div>
                
                {/* Education History Table */}
                <div>
                  <Table>
                    <TableHeader className="bg-transparent">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Institution</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Dates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody aria-hidden="true" className="table-row h-2"></tbody>
                    <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">George Brown College</TableCell>
                        <TableCell className="py-2.5">Carpentry</TableCell>
                        <TableCell className="py-2.5">Sep 07, 2014 - Apr 20, 2016</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Social Media Scan Card */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Social media scan</h3>
                  </div>
                </div>
                
                {/* Social Media Scan Table */}
                <div>
                  <Table>
                    <TableHeader className="bg-transparent">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>NETWORK</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead>LINK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody aria-hidden="true" className="table-row h-2"></tbody>
                    <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">Facebook</TableCell>
                        <TableCell className="py-2.5">Personal profile</TableCell>
                        <TableCell className="py-2.5">
                          <a href="https://www.facebook.com/" className="text-primary hover:underline flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                            https://www.facebook.com/
                          </a>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">Pinterest</TableCell>
                        <TableCell className="py-2.5">Personal profile</TableCell>
                        <TableCell className="py-2.5">
                          <a href="https://www.pinterest.com/" className="text-primary hover:underline flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                            https://www.pinterest.com/
                          </a>
                        </TableCell>
                      </TableRow>
                      <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                        <TableCell className="py-2.5 font-medium">LinkedIn</TableCell>
                        <TableCell className="py-2.5">Personal profile</TableCell>
                        <TableCell className="py-2.5">
                          <a href="https://www.linkedin.com/" className="text-primary hover:underline flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                            https://www.linkedin.com/
                          </a>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 mb-4">
            <h2 className="font-semibold text-2xl mb-1">ID Verification</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Verify the applicant&apos;s identity with their government-issued ID.
            </p>
            
            
          </div> 

          {/* ID Verification Card */}
          <Card className="shadow-sm mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">ID verification results</h3>
                
                {/* Driver's License Images */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className=" rounded-md overflow-hidden">
                      <img 
                        src="/assets/driver-license/front-driver.png" 
                        alt="Driver's License Front" 
                        className="object-contain w-full h-full max-h-[150px] mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Driver&apos;s License (Front)</p>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-md overflow-hidden">
                      <img 
                        src="/assets/driver-license/back-driver.png" 
                        alt="Driver's License Back" 
                        className="object-contain w-full h-full max-h-[150px] mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Driver&apos;s License (Back)</p>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-md overflow-hidden">
                      <img 
                        src="/assets/driver-license/ID-selfie.png" 
                        alt="ID Selfie" 
                        className="object-contain w-full h-full max-h-[150px] mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">ID Selfie</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead colSpan={2} className="text-center font-semibold">ID Information</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Full name</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            John Doe
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Date of birth</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            01/01/1990
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Address</TableCell>
                          <TableCell className="py-2.5 w-[180px]">
                            123 Main St, Toronto, ON, M5A 1A1
                          </TableCell>
                        </TableRow>
                         <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">ID number</TableCell>
                          <TableCell className="py-2.5 w-[180px]">
                            A6101-40706-60905
                          </TableCell>
                        </TableRow>
                         <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Date of expiry</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            01/01/2025
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent">
                          <TableHead colSpan={2} className="text-center font-semibold">Verification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody aria-hidden="true" className="table-row h-2"></tbody>
                      <TableBody>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Name match</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Pass
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Date of birth match</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Pass
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Valid ID</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Pass
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Valid selfie</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Pass
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Selfie matches ID photo</TableCell>
                          <TableCell className="py-2.5 w-[120px]">
                            <Badge variant="outline" className="gap-1">
                              <CheckIcon className="text-emerald-500" size={12} aria-hidden="true" />
                              Pass
                            </Badge>
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
