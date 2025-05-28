'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react'; // Keep for isResending, remove useEffect
// import { useEffect } from 'react'; // Remove useEffect
import { toast } from 'sonner';
import { Send, CheckCircle2, DollarSign, Download, ArrowLeftRight, TriangleAlert, CheckIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog" // <-- Add Dialog imports

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
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

// Import the comprehensive PersonDetails type from the page component
import type { PersonDetails } from '../page'; 

// Update props interface to accept the comprehensive PersonDetails object
interface PersonRentalApplicationProps {
  personDetails: PersonDetails | null; // Accept the comprehensive object (can be null if fetch failed in page.tsx)
}

// Driver's license format definitions
const driverLicenseFormats = {
  AB: { pattern: "[0-9]{9}", format: "999999999", maxLength: 9 },
  BC: { pattern: "[0-9]{7}", format: "9999999", maxLength: 7 },
  MB: { pattern: "[A-Z][A-Z\\*]{5}[A-Z0-9]{2}[0-9]", format: "AKKKKAKXX9XX9", maxLength: 12 },
  NB: { pattern: "[0-9]{7}", format: "9999999", maxLength: 7 },
  NL: { pattern: "[A-Z][0-9]{9}", format: "A999999999", maxLength: 10 },
  NS: { pattern: "[A-Z]{5}[0-9]{9}", format: "AKKKK99999999", maxLength: 14 },
  NT: { pattern: "[0-9]{9}", format: "999999999", maxLength: 9 },
  NU: { pattern: "[0-9]{5}", format: "99999", maxLength: 5 },
  ON: { pattern: "[A-Z][0-9]{14}", format: "A99999999999999", maxLength: 15 },
  PE: { pattern: "[0-9]{5}", format: "99999", maxLength: 5 },
  QC: { pattern: "[A-Z][0-9]{12}", format: "A999999999999", maxLength: 13 },
  SK: { pattern: "[0-9]{8}", format: "99999999", maxLength: 8 },
  YT: { pattern: "[0-9]{6}", format: "999999", maxLength: 6 }
};

// Helper function to format driver's license (basic implementation)
const formatDriverLicense = (number?: string | null, state?: string | null): string => {
  if (!number || !state) return '-'; // Return dash if number or state is missing
  
  const stateUpper = state.toUpperCase() as keyof typeof driverLicenseFormats;
  const formatInfo = driverLicenseFormats[stateUpper]; // Assign formatInfo

  // Check if the state and its format info exist in our list
  if (formatInfo) {
    // Basic display: Number (State) if format exists
    // Masking implementation would require a library or more complex logic
    return `${number} (${stateUpper})`; 
  } else {
    // Return just the number if state format is unknown
    return number;
  }
};

// Helper function to format phone number (assuming North American format)
const formatPhoneNumber = (phoneNumber?: string | null): string => {
  if (!phoneNumber) return '-'; 

  const digits = phoneNumber.replace(/\D/g, ''); // Use /\D/g instead of /\\D/g

  if (digits.length === 10) {
    // Format as (+1) XXX-XXX-XXXX
    return `+1 ${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Handle case where +1 is already included as just '1'
     return ` +1 ${digits.substring(1, 4)}-${digits.substring(4, 7)}-${digits.substring(7, 11)}`;
  }
  
  // Fallback for numbers that don't fit the expected format
  return phoneNumber; 
};

// Helper function to format address
const formatAddress = (address?: { street?: string; city?: string; province?: string; postal_code?: string } | null): string => {
  if (!address) return '-';
  // Ensure province is uppercase if it exists
  const provinceUpper = address.province ? address.province.toUpperCase() : '';
  const parts = [address.street, address.city, provinceUpper, address.postal_code].filter(Boolean); // Filter out null/undefined/empty strings
  return parts.join(', ') || '-';
};

// Helper function to format duration
const formatDuration = (years?: number | null, months?: number | null): string => {
  if (years === undefined || years === null || months === undefined || months === null) return '-';
  const yearText = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : '';
  const monthText = months > 0 ? `${months} mo${months > 1 ? 's' : ''}` : '';
  // Handle edge case where duration is 0 years and 0 months
  if (!yearText && !monthText && (years === 0 && months === 0)) return 'Less than a month';
  if (!yearText && !monthText) return '-'; // If data is missing/invalid
  if (yearText && monthText) return `${yearText}, ${monthText}`;
  return yearText || monthText;
};

// Helper function to format date (Month Year)
const formatDateMonthYear = (dateString?: string | null): string => {
  if (!dateString) return '-';
  try {
    // Directly parse the dateString, assuming it's a valid ISO format or similar
    const date = new Date(dateString); 
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) { 
      console.error("Invalid date string provided:", dateString);
      return 'Invalid Date'; // Return specific error string
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date'; // Return specific error string on catch
  }
};

// Use the personDetails prop directly
export function PersonRentalApplication({ personDetails }: PersonRentalApplicationProps) {
  const [isResending, setIsResending] = useState(false);
  const activeSidebarItem = 'summary';

  // Handle case where personDetails might be null (if fetch failed server-side)
  if (!personDetails) {
     return (
      <div className="h-[calc(100vh-16rem)]">
        <Card className="h-full">
          <CardContent className="h-full p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Failed to load person details.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate occupants AND separate co-signers - Use the type from PersonDetails
  const calculateOccupantsAndCosigners = (dependents: PersonDetails['dependents']) => {
    let adultCount = 1; // Start with the applicant
    let dependentCount = 0;
    // Use the imported dependent type
    const occupantsList: NonNullable<PersonDetails['dependents']> = []; 
    const cosignersList: NonNullable<PersonDetails['dependents']> = [];

    if (dependents && Array.isArray(dependents)) {
      dependents.forEach(dep => {
        // Check if the dependent is a co-signer (adjust relationship value if needed)
        if (dep.relationship?.toLowerCase() === 'cosigner' || dep.relationship?.toLowerCase() === 'guarantor') { 
          cosignersList.push(dep);
        } else {
          // It's a regular occupant
          occupantsList.push(dep);
          if (dep && typeof dep === 'object' && dep.type === 'adult') {
            adultCount++;
          } else if (dep && typeof dep === 'object') { // Assume non-adults are dependents
            dependentCount++;
          }
        }
      });
    }
    return { adultCount, dependentCount, occupantsList, cosignersList };
  };

  // Use the refactored function
  const { adultCount, dependentCount, occupantsList, cosignersList } = calculateOccupantsAndCosigners(personDetails.dependents);

  // --- Calculate Rent Shares ---
  const totalRent = personDetails.monthly_rent ?? 0;
  const otherOccupantsRentShare = occupantsList.reduce((sum, occupant) => {
    const share = parseFloat(occupant.shareOfRent || '0');
    return sum + (isNaN(share) ? 0 : share);
  }, 0);
  
  const applicantRentShare = totalRent - otherOccupantsRentShare;

  // Use personDetails.id from props
  const handleResend = async () => {
    if (!personDetails?.id) return; // Guard against missing id
    try {
      setIsResending(true);
      console.log('Starting resend request for prospect ID:', personDetails.id);

      const response = await fetch(`/api/people/${personDetails.id}/resend-application`, {
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

  // Use personDetails prop directly from here onwards
  if (personDetails.status === 'sent') {
    return (
      <div className="min-h-[calc(100vh-16rem)] relative">
        <div className="grid grid-cols-4 gap-6">
          {/* Left Column: Property Details */}
          <div className="col-span-1 sticky top-6 self-start h-fit">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="font-semibold text-lg">Property Details</h2>
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start"> {/* Use items-start for alignment */}
                        <span className="text-muted-foreground mr-2">Address:</span> {/* Add margin */}
                        <TooltipProvider delayDuration={100}> {/* Add delay duration */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium text-right truncate max-w-[200px] cursor-default"> {/* Add truncate, max-width, cursor */}
                                {personDetails?.property_address ?? 'Not available'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end"> {/* Adjust position */}
                              <p className="max-w-xs">{personDetails?.property_address ?? 'Not available'}</p> {/* Add max-width to content */}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit:</span>
                        <span className="font-medium">{personDetails?.unit_number ?? 'Not available'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="font-medium">
                          <span className="inline-flex items-center">
                            <DollarSign className="h-3 w-3 mr-0.5 text-muted-foreground" />
                            {personDetails?.monthly_rent ? `${personDetails.monthly_rent.toLocaleString()}/month` : 'Not available'}
                          </span>
                        </span>
                      </div>
                    </div>
                    {personDetails.status === 'sent' && (
                      <div className="pt-4 border-t space-y-2">
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={handleResend}
                          disabled={isResending}
                          size="sm" 
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isResending ? 'Resending...' : 'Resend Application'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Application Sent Message */}
          <div className="col-span-3 space-y-6 overflow-auto">
            <Card className="h-[calc(100vh-16rem)] shadow-sm"> {/* Adjusted height */}
              <CardContent className="h-full p-6">
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  {/* Image component replacing Lottie */}
                  <div className="relative w-[300px] h-[300px]">
                    <Image
                      src="/assets/figures/rental-application-waiting.png"
                      alt="Application Sent Illustration"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                  
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Application Sent
                  </h1>
                  
                  <div className="flex flex-col items-center space-y-2 text-center"> {/* Added text-center */}
                    <p className="text-muted-foreground max-w-md"> {/* Added max-width */}
                      The prospect has received a rental application, we&apos;re waiting for the application to be filled out.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // New two-column layout for completed/other statuses
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
                    <div className="flex justify-between items-start"> {/* Use items-start for alignment */}
                      <span className="text-muted-foreground mr-2">Address:</span> {/* Add margin */}
                      <TooltipProvider delayDuration={100}> {/* Add delay duration */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium text-right truncate max-w-[200px] cursor-default"> {/* Add truncate, max-width, cursor */}
                              {personDetails?.property_address ?? 'Not available'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end"> {/* Adjust position */}
                            <p className="max-w-xs">{personDetails?.property_address ?? 'Not available'}</p> {/* Add max-width to content */}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="font-medium">{personDetails?.unit_number ?? 'Not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent:</span>
                      <span className="font-medium">
                        <span className="inline-flex items-center">
                          <DollarSign className="h-3 w-3 mr-0.5 text-muted-foreground" />
                          {personDetails?.monthly_rent ? `${personDetails.monthly_rent.toLocaleString()}/month` : 'Not available'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    {personDetails.status !== 'accepted' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="default" size="sm">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Decline/Accept
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Manage Application</DialogTitle>
                            <DialogDescription>
                              Choose an action for this rental application.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="sm:justify-start gap-2">
                            <Button 
                              type="button" 
                              variant="default"
                              onClick={() => console.log('Accept & Start Lease clicked')}
                            >
                              Accept & Start Lease
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => console.log('Accept clicked')}
                            >
                              Accept
                            </Button>
                            <Button 
                              type="button" 
                              variant="destructive"
                              onClick={() => console.log('Decline clicked')}
                            >
                              Decline
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[100px] */}
                            <div className="text-sm">
                              {occupantsList.length} {/* Use the calculated text */}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Employment status</TableCell>
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[100px] */}
                            <div className="text-sm">
                              {/* Check if employment is an array and access type from first element */}
                              {(personDetails.employment && Array.isArray(personDetails.employment) && personDetails.employment.length > 0 && personDetails.employment[0].employment_type) ? 
                                personDetails.employment[0].employment_type.charAt(0).toUpperCase() + 
                                personDetails.employment[0].employment_type.slice(1) : 
                                "Not specified"}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Personal income</TableCell>
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[100px] */}
                            <div className="text-sm">
                              {/* Updated fallback logic to access first element of the array */}
                              ${(personDetails.income?.employment_income ??
                                (personDetails.employment && Array.isArray(personDetails.employment) && personDetails.employment.length > 0
                                  ? (personDetails.employment[0]?.monthly_income ?? 0) * 12 // Access first element's income
                                  : 0)
                              ).toLocaleString()}
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
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[100px] */}
                            <div className="text-sm">
                              {personDetails.pets?.length || 0}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Company</TableCell>
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[120px] */}
                            <div className="text-sm">
                              {/* Access employer_name from the first element if employment is an array */}
                              {(personDetails.employment && Array.isArray(personDetails.employment) && personDetails.employment.length > 0)
                                ? personDetails.employment[0].employer_name 
                                : "Not specified" /* Simplified fallback */}
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Vehicles</TableCell>
                          <TableCell className="py-2.5 text-right"> {/* Removed w-[100px] */}
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
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                            {personDetails.first_name || 'John'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Middle name</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {personDetails.middle_name || 'Michael'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Last name</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {personDetails.last_name || 'Doe'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Date of birth</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
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
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {personDetails.ssn ? `••••••${personDetails.ssn.slice(-4)}` : '-'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Driver&apos;s license</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {/* Use the helper function to format the license */}
                            {formatDriverLicense(personDetails.drivers_license_number, personDetails.drivers_license_state)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Email</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {personDetails.email || 'test@email.com'}
                          </TableCell>
                        </TableRow>
                        <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                          <TableCell className="py-2.5">Phone number</TableCell>
                          <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */} 
                            {formatPhoneNumber(personDetails.phone)}
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

                  {/* Current Address Section - Conditionally Rendered */}
                  {personDetails.residence && personDetails.residence.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-4">
                        <h4 className="font-semibold text-base">Current Address</h4>
                        {/* TODO: Add logic for "Matches Bureau" based on actual data */}
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Matches Bureau</span>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="h-full overflow-auto">
                          <Table>
                            <TableBody>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Residential status</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[0]?.residential_status
                                    ? personDetails.residence[0].residential_status.charAt(0).toUpperCase() + personDetails.residence[0].residential_status.slice(1)
                                    : '-'}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Address</TableCell>
                                <TableCell className="py-2.5 font-medium text-right whitespace-normal break-words"> {/* Added whitespace-normal, break-words */}
                                  {formatAddress(personDetails.residence[0]?.address)}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Length of Stay</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[0]?.move_in_date ?
                                    `${formatDateMonthYear(personDetails.residence[0].move_in_date)} - Present` :
                                    '-'}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Monthly Rent</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[0]?.monthly_rent ?
                                    `$${personDetails.residence[0].monthly_rent.toLocaleString()}` :
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
                                <TableCell className="py-2.5">Reason for Moving</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[0]?.reason_for_leaving || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Changed Label */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord Name</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {personDetails.residence[0]?.landlord_name || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Added Landlord Email Row */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord Email</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {personDetails.residence[0]?.landlord_email || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Added Landlord Phone Row */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord Phone</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {formatPhoneNumber(personDetails.residence[0]?.landlord_phone)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Address Section - Conditionally Rendered */}
                  {personDetails.residence && personDetails.residence.length > 1 && (
                    <div className="pt-6 border-t border-dashed"> {/* Add separator */}
                      <h4 className="font-semibold text-base mb-4">Previous Address</h4>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="h-full overflow-auto">
                          <Table>
                            <TableBody>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Residential status</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[1]?.residential_status
                                    ? personDetails.residence[1].residential_status.charAt(0).toUpperCase() + personDetails.residence[1].residential_status.slice(1)
                                    : '-'}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Address</TableCell>
                                <TableCell className="py-2.5 font-medium text-right whitespace-normal break-words"> {/* Added whitespace-normal, break-words */}
                                  {formatAddress(personDetails.residence[1]?.address)}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Length of stay</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {formatDuration(personDetails.residence[1]?.length_of_stay_years, personDetails.residence[1]?.length_of_stay_months)}
                                  {/* We could calculate dates if needed, but duration is simpler for now */}
                                </TableCell>
                              </TableRow>
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Monthly rent</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[1]?.monthly_rent ?
                                    `$${personDetails.residence[1].monthly_rent.toLocaleString()}` :
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
                                <TableCell className="py-2.5 font-medium text-right"> {/* <-- Added text-right */}
                                  {personDetails.residence[1]?.reason_for_leaving || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Changed Label */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord name</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {personDetails.residence[1]?.landlord_name || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Added Landlord Email Row */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord email</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {personDetails.residence[1]?.landlord_email || '-'}
                                </TableCell>
                              </TableRow>
                              {/* Added Landlord Phone Row */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">Landlord phone</TableCell>
                                <TableCell className="py-2.5 font-medium text-right"> 
                                  {formatPhoneNumber(personDetails.residence[1]?.landlord_phone)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display message if no address history */}
                   {(!personDetails.residence || personDetails.residence.length === 0) && (
                      <div className="text-center text-muted-foreground py-4">
                          No address history provided.
                      </div>
                   )}
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
                          {/* Updated income logic: Use income.employment_income first, fallback to employment array */}
                          ${(
                            personDetails.income?.employment_income ??
                            (personDetails.employment && Array.isArray(personDetails.employment) && personDetails.employment.length > 0 && personDetails.employment[0].monthly_income
                              ? personDetails.employment[0].monthly_income * 12
                              : 0) // Default to 0 if no income found
                          ).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Household income (annual pre-tax)
                        </div>
                        <div className="text-2xl font-semibold">
                          {/* Display actual household income */}
                          ${personDetails.income?.household_income?.toLocaleString() ?? 'N/A'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Income Sources Table */}
                  <div>
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent"><TableHead>Income source</TableHead><TableHead>Annual amount</TableHead><TableHead>Proof Provided</TableHead><TableHead className="text-right">File</TableHead></TableRow>
                      </TableHeader>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        {/* Dynamic rendering of income sources from employment array */}
                        {personDetails.employment && Array.isArray(personDetails.employment) && personDetails.employment.length > 0 ? (
                          personDetails.employment.map((job, index) => {
                            // Ensure job and properties exist before accessing
                            const annualAmount = job?.monthly_income ? job.monthly_income * 12 : 0;
                            const employmentTypeFormatted = job?.employment_type
                              ? job.employment_type.charAt(0).toUpperCase() + job.employment_type.slice(1)
                              : 'Unknown Type';
                            const incomeSourceText = `${job?.employer_name || 'Unknown Employer'}, ${employmentTypeFormatted}`;
                            // Assume proof_of_income_file_url holds the link - needs type adjustment if name differs
                            const proofUrl = job?.verification_document_url; // Use verification_document_url
                            const hasProof = !!proofUrl;

                            return (
                              <TableRow key={index} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5 font-medium">{incomeSourceText}</TableCell>
                                <TableCell className="py-2.5">${annualAmount.toLocaleString()}</TableCell>
                                <TableCell className="py-2.5">
                                  {hasProof ? <CheckIcon className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  {hasProof ? (
                                    <Button asChild variant="ghost" size="sm" className="h-8 text-primary">
                                      {/* Link opens in new tab */}
                                      <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </a>
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                              No employment information provided.
                            </TableCell>
                          </TableRow>
                        )}
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
                      {/* Dynamic Occupant Count (Applicant + regular occupants) */}
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {1 + occupantsList.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Occupants Summary - Use calculated counts */}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Adults</span>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {adultCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Dependants</span>
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {dependentCount}
                      </span>
                    </div>
                  </div>
                  
                  {/* Occupants List - Use occupantsList */}
                  <div>
                          <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone number</TableHead><TableHead>Share of rent</TableHead></TableRow>
                      </TableHeader>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                              {/* Applicant Row */}
                              <TableRow className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                <TableCell className="py-2.5">
                                  <div>
                                    <div className="font-medium">{`${personDetails.first_name || ''} ${personDetails.last_name || ''}`.trim()}</div>
                                    <div className="text-xs text-muted-foreground">Current applicant</div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">{personDetails.email || '-'}</TableCell>
                                <TableCell className="py-2.5">{formatPhoneNumber(personDetails.phone)}</TableCell>
                                <TableCell className="py-2.5">
                                  {/* Display calculated applicant rent share */}
                                  {applicantRentShare > 0 ? `$${applicantRentShare.toLocaleString()}` : (totalRent > 0 ? '-' : '-')} 
                                </TableCell>
                              </TableRow>
                              {/* Dependents Rows - Use occupantsList from calculated results */}
                              {occupantsList.map((dep, index) => (
                                <TableRow key={`dep-${index}`} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                  <TableCell className="py-2.5">
                                    <div>
                                      <div className="font-medium">{`${dep.firstName || ''} ${dep.middleName || ''} ${dep.lastName || ''}`.trim()}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {/* Capitalize relationship */}
                                        {dep.relationship ? dep.relationship.charAt(0).toUpperCase() + dep.relationship.slice(1) : 'Occupant'} 
                                        {/* Safely access dep.type */}
                                        {dep?.type === 'adult' ? '' : (dep.age ? ` - ${dep.age} yrs old` : '')} {/* Display age if not adult */}
                                      </div>
                                    </div>
                                  </TableCell>
                                  {/* Safely access dep.email */}
                                  <TableCell className="py-2.5">{dep?.email || '-'}</TableCell>
                                  {/* Safely access dep.phone */}
                                  <TableCell className="py-2.5">{formatPhoneNumber(dep?.phone)}</TableCell>
                                  <TableCell className="py-2.5">
                                    {/* Safely access dep.shareOfRent */}
                                    {dep?.shareOfRent ? `$${parseFloat(dep.shareOfRent).toLocaleString()}` : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                  
                  {/* Co-signer Section - Conditionally Rendered based on cosignersList */}
                  {(cosignersList.length > 0) && (
                    <div className="pt-6 border-t border-dashed"> {/* Add separator */}
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-semibold text-base">Co-signer (Guarantor)</h4>
                        {/* Dynamic Co-signer Count */}
                        <span className="h-6 w-6 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                           {cosignersList.length}
                        </span>
                      </div>
                      
                      <Table>
                        <TableHeader className="bg-transparent">
                          <TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone number</TableHead></TableRow>
                        </TableHeader>
                        <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                          {/* Co-signer Rows - Use cosignersList */}
                          {cosignersList.map((cosigner, index) => (
                            <TableRow key={`cosigner-${index}`} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5">
                                <div>
                                  <div className="font-medium">{`${cosigner.firstName || ''} ${cosigner.middleName || ''} ${cosigner.lastName || ''}`.trim()}</div>
                                   <div className="text-xs text-muted-foreground">
                                      {/* Capitalize relationship */}
                                      {cosigner.relationship ? cosigner.relationship.charAt(0).toUpperCase() + cosigner.relationship.slice(1) : 'Co-signer'}
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">{cosigner.email || '-'}</TableCell>
                              <TableCell className="py-2.5">{formatPhoneNumber(cosigner.phone)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
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
                      {/* Dynamic Pet Count */}
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {personDetails.pets?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Pets List */}
                  <div>
                          <Table>
                      <TableHeader className="bg-transparent">
                        {/* Removed 'Fixed' column based on user edit */}
                        <TableRow className="hover:bg-transparent"><TableHead>Type of animal</TableHead><TableHead>Breed</TableHead><TableHead>Weight (lbs)</TableHead><TableHead>Sex</TableHead><TableHead>Age</TableHead><TableHead className="text-right">Photo</TableHead></TableRow>
                      </TableHeader>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                              {/* Dynamic Pet Rows */}
                              {personDetails.pets && personDetails.pets.length > 0 ? (
                                personDetails.pets.map((pet, index) => (
                                  <TableRow key={`pet-${index}`} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                    <TableCell className="py-2.5 font-medium">{pet.type || '-'}</TableCell>
                                    <TableCell className="py-2.5">{pet.breed || '-'}</TableCell>
                                    <TableCell className="py-2.5">{pet.weight || '-'}</TableCell>
                                    <TableCell className="py-2.5">{pet.gender || '-'}</TableCell>
                                    <TableCell className="py-2.5">{pet.age || '-'}</TableCell>
                                    <TableCell className="py-2.5 text-right">
                                      {pet.photo_url ? (
                                        <Button asChild variant="ghost" size="sm" className="h-8 text-primary">
                                          <a href={pet.photo_url} target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                          </a>
                                        </Button>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                /* Row to display when no pets are found */
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                    No pet information provided.
                                  </TableCell>
                                </TableRow>
                              )}
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
                      {/* Dynamic Vehicle Count */}
                      <span className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {personDetails.vehicles?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Vehicles List */}
                  <div>
                          <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent"><TableHead>Make</TableHead><TableHead>Model</TableHead><TableHead>Year</TableHead><TableHead>License Plate</TableHead></TableRow>
                      </TableHeader>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                        {/* Dynamic Vehicle Rows */}
                        {personDetails.vehicles && personDetails.vehicles.length > 0 ? (
                          personDetails.vehicles.map((vehicle, index) => (
                            <TableRow key={`vehicle-${index}`} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                              <TableCell className="py-2.5 font-medium">{vehicle.make || '-'}</TableCell>
                              <TableCell className="py-2.5">{vehicle.model || '-'}</TableCell>
                              <TableCell className="py-2.5">{vehicle.year || '-'}</TableCell>
                              <TableCell className="py-2.5">{vehicle.licensePlate || '-'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          /* Row to display when no vehicles are found */
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                              No vehicle information provided.
                            </TableCell>
                          </TableRow>
                        )}
                            </TableBody>
                          </Table>
                        </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Questions Card - Replaces Additional Information */}
            <Card className="shadow-sm mt-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    {/* Update title */}
                    <h3 className="font-semibold text-lg">Custom Questions</h3>
                  </div>
                  
                  {/* Custom Questions and Answers Table */}
                  <div>
                          <Table>
                      <TableHeader className="bg-transparent">
                        {/* Adjust headers - remove Notes */}
                        <TableRow className="hover:bg-transparent"><TableHead className="w-1/3">Question</TableHead><TableHead>Answer</TableHead></TableRow>
                      </TableHeader>
                      <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
                              {/* Dynamic Custom Question Rows */}
                              {personDetails.custom_question_answers && personDetails.custom_question_answers.length > 0 ? (
                                personDetails.custom_question_answers.map((qa) => {
                                  // Helper function to format answer
                                  const formatAnswer = (answer: string | boolean | number | null | undefined, type: string) => {
                                    if (answer === null || answer === undefined) return '-';
                                    if (type === 'Yes/No') return answer ? 'Yes' : 'No';
                                    if (type === 'Date') {
                                      try {
                                        // Ensure answer is treated as string for Date constructor if needed
                                        return new Date(String(answer) + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
                                      } catch (e) {
                                        console.error("Error formatting date answer:", e); // Log the error
                                        return String(answer); // Fallback to string if date parsing fails
                                      }
                                    }
                                    // Add more formatting for Number, Text if needed
                                    return String(answer); 
                                  };

                                  return (
                                    <TableRow key={qa.id} className="odd:bg-muted/50 odd:hover:bg-muted/50 border-none hover:bg-transparent">
                                      <TableCell className="py-2.5 font-medium">{qa.question || '-'}</TableCell>
                                      <TableCell className="py-2.5">{formatAnswer(qa.answer, qa.answerType)}</TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                /* Row for no custom questions */
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                    No custom question answers provided.
                                  </TableCell>
                                </TableRow>
                              )}
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
                    <h3 className="font-semibold text-lg">More about the applicant</h3>
                  </div>
                  
                  {/* Message content */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">
                      {/* Use the dynamic about_you data or a fallback */}
                      {personDetails.about_you || 'No additional information provided.'}
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
                      DATE CONSENTED: {personDetails.consent_check?.velloa_terms?.timestamp 
                        ? formatDateMonthYear(personDetails.consent_check.velloa_terms.timestamp) 
                        : '-'}
                    </div>
                  </div>
                  
                  {/* Consent content */}
                  <div className="border border-muted rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6 9 17l-5-5"></path></svg>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        I ({personDetails.first_name || 'John'} {personDetails.last_name || 'Doe'}) confirm that
                        {personDetails.consent_check?.information_accuracy?.agreed && 
                          ` all information provided in this application is accurate to the best of my knowledge.`}
                        {personDetails.consent_check?.property_terms?.agreed && 
                          ` I give the landlord, property manager or landlord's agent, permission to run my credit report and background check and to contact my references, for the purpose of assessing my rental application. I agree to allowing the following individuals or groups to disclose any relevant information about me: credit reporting services, court, tribunals, banks, prior landlords, employers, and personal references.`}
                        {personDetails.consent_check?.velloa_terms?.agreed && 
                          ` I consent to Velloa's Terms and Conditions and Privacy Policy.`}
                        {/* Fallback if no consents are true (unlikely but safe) */}
                        {!(personDetails.consent_check?.information_accuracy?.agreed || personDetails.consent_check?.property_terms?.agreed || personDetails.consent_check?.velloa_terms?.agreed) &&
                          ` consent details are unavailable.`}
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
                      <TableRow className="hover:bg-transparent"><TableHead>Employer</TableHead><TableHead>Position</TableHead><TableHead>Dates</TableHead></TableRow>
                    </TableHeader>
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
                      <TableRow className="hover:bg-transparent"><TableHead>Institution</TableHead><TableHead>Program</TableHead><TableHead>Dates</TableHead></TableRow>
                    </TableHeader>
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
                      <TableRow className="hover:bg-transparent"><TableHead>NETWORK</TableHead><TableHead>STATUS</TableHead><TableHead>LINK</TableHead></TableRow>
                    </TableHeader>
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
                      <Image 
                        src="/assets/driver-license/front-driver.png" 
                        alt="Driver's License Front" 
                        width={240}
                        height={150}
                        className="object-contain w-full h-full max-h-[150px] mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Driver&apos;s License (Front)</p>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-md overflow-hidden">
                      <Image 
                        src="/assets/driver-license/back-driver.png" 
                        alt="Driver's License Back" 
                        width={240}
                        height={150}
                        className="object-contain w-full h-full max-h-[150px] mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Driver&apos;s License (Back)</p>
                  </div>
                  <div className="flex-1">
                    <div className="rounded-md overflow-hidden">
                      <Image 
                        src="/assets/driver-license/ID-selfie.png" 
                        alt="ID Selfie" 
                        width={240}
                        height={150}
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
                        <TableRow className="hover:bg-transparent"><TableHead colSpan={2} className="text-center font-semibold">ID Information</TableHead></TableRow>
                      </TableHeader>
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
                        <TableRow className="hover:bg-transparent"><TableHead colSpan={2} className="text-center font-semibold">Verification</TableHead></TableRow>
                      </TableHeader>
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
