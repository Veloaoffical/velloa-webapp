"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Added Button import
import { Check, Lock } from "lucide-react"; // Added icons
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils"; // Added cn import
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import * as reactSpring from '@react-spring/three'; // eslint-disable-line @typescript-eslint/no-unused-vars
import CalendarInput from "@/components/calendarwithmonthsinput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define onboarding steps
const onboardingSteps = [
  { id: 1, title: "Sign-Up", description: "Complete your account creation." },
  { id: 2, title: "Company Setup", description: "Enter your company details and address." },
  { id: 3, title: "Portfolio Setup", description: "Add your first property portfolio." },
  { id: 4, title: "Tenant & Unit Configuration", description: "Configure units and add tenants." },
  { id: 5, title: "Payment & Accounting Setup", description: "Set up payment methods and accounting." },
  { id: 6, title: "Document Templates & Digital Signing", description: "Configure document templates." },
  { id: 7, title: "Automation & Communication Settings", description: "Set up automations and communication." },
  { id: 8, title: "Invite Team Members", description: "Invite your team to Velloa." },
];

export default function OnboardingPage() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // State for current step
  const [fiscalYearStartDate, setFiscalYearStartDate] = useState<Date | undefined>(); // State for fiscal year start date
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set()); // State for completed steps

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final step completion (e.g., navigate away)
      console.log("Onboarding Complete!");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow jumping only to completed steps or the next step
    if (completedSteps.has(stepId - 1) || stepId === currentStep || stepId === Math.max(...completedSteps, 0) + 1) {
       if (stepId <= currentStep || completedSteps.has(stepId -1)) {
         setCurrentStep(stepId);
       }
    }
  };

  const CurrentStepContent = () => {
    const step = onboardingSteps.find(s => s.id === currentStep);
    if (!step) return <div>Step not found</div>;

    // Content based on current step
    let content;
    if (step.id === 1) { // Sign-Up
      content = (
        <form className="space-y-6 w-full mx-auto">
          <fieldset className="space-y-4 border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Personal Information</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First Name" required />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" placeholder="Middle Name" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last Name" required />
              </div>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <CalendarInput
                value={fiscalYearStartDate}
                onChange={setFiscalYearStartDate}
                placeholder="Select date of birth"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="(123) 456-7890" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Password" required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm Password" required />
            </div>
          </fieldset>
        </form>
      );
    } else if (step.id === 2) { // Company Setup (Combined)
      content = (
        <form className="space-y-6">
          <fieldset className="space-y-4 border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Basic Information</legend>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Your Company Inc." required />
            </div>
            <div>
              <Label htmlFor="companyType">Company Type</Label>
              <Select>
                <SelectTrigger id="companyType">
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property-management">Property Management</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="co-op">Co-op</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input id="website" placeholder="https://yourcompany.com" />
            </div>
            <div>
              <Label htmlFor="phone">Business Phone Number</Label>
              <Input id="phone" type="tel" placeholder="(123) 456-7890" />
            </div>
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" type="email" placeholder="contact@yourcompany.com" />
            </div>
          </fieldset>
          {/* Business Address Section */}
          <fieldset className="space-y-4 border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Business Address</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="streetNumber">Street Number</Label>
                <Input id="streetNumber" placeholder="123" />
              </div>
              <div>
                <Label htmlFor="streetName">Street Name</Label>
                <Input id="streetName" placeholder="Main St" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit (Optional)</Label>
                <Input id="unit" placeholder="Suite 100" />
              </div>
              <div>
                <Label htmlFor="poBox">PO Box (Optional)</Label>
                <Input id="poBox" placeholder="PO Box 1234" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Anytown" />
              </div>
              <div>
                <Label htmlFor="provinceState">Province / State</Label>
                <Input id="provinceState" placeholder="ON / CA" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <Label htmlFor="postalCode">Postal Code / ZIP</Label>
                <Input id="postalCode" placeholder="A1B 2C3 / 12345" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Add relevant countries */} 
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="gb">United Kingdom</SelectItem>
                    {/* Add more countries as needed */} 
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>
          {/* Business Details Section */}
          <fieldset className="space-y-4 border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Business Details</legend>
            <div>
              <Label htmlFor="regNumber">Business Registration Number (Optional)</Label>
              <Input id="regNumber" placeholder="123456789" />
            </div>
            <div>
              <Label htmlFor="fiscalYearStart">Fiscal Year Start Month</Label>
              <CalendarInput
                value={fiscalYearStartDate}
                onChange={setFiscalYearStartDate}
                placeholder="Select month/day" // Placeholder text
                className="w-full" // Optional: Adjust styling as needed
              />
            </div>
          </fieldset>
        </form>
      );
    } else if (step.id === 3) { // Portfolio Setup
      content = (
        <div className="bg-gray-100 p-8 rounded min-h-[200px] flex items-center justify-center">
          <p>Content for Step {currentStep}: {step.title}</p>
        </div>
      );
    } else if (step.id === 4) { // Tenant & Unit Configuration
      content = (
        <div className="bg-gray-100 p-8 rounded min-h-[200px] flex items-center justify-center">
          <p>Content for Step {currentStep}: {step.title}</p>
        </div>
      );
    } else if (step.id === 5) { // Payment & Accounting Setup
      content = (
        <form className="space-y-6 w-full mx-auto">
          <fieldset className="space-y-4 border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">Payment Rules</legend>
            <div>
              <Label htmlFor="rentDueDate">Rent Due Date</Label>
              <Select>
                <SelectTrigger id="rentDueDate">
                  <SelectValue placeholder="Select due date (e.g., 1st of month)" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(28)].map((_, i) => (
                    <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gracePeriod">Grace Period (in days)</Label>
              <Input id="gracePeriod" type="number" min="0" placeholder="e.g., 3" />
            </div>
            <div className="space-y-2">
              <Label>Late Fee Settings</Label>
              <RadioGroup className="flex flex-row gap-6" defaultValue="fixed" name="lateFeeType">
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="lateFee-fixed" value="fixed" />
                  <label htmlFor="lateFee-fixed" className="text-sm font-medium cursor-pointer">Fixed Amount</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="lateFee-percent" value="percent" />
                  <label htmlFor="lateFee-percent" className="text-sm font-medium cursor-pointer">Percentage (%)</label>
                </div>
              </RadioGroup>
              <div className="flex gap-4 mt-2">
                <Input id="lateFeeValue" type="number" min="0" placeholder="Late fee value" className="w-40" />
                <Select>
                  <SelectTrigger id="lateFeeWhen">
                    <SelectValue placeholder="When to apply" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after-grace">After Grace Period</SelectItem>
                    <SelectItem value="on-due">On Due Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>
        </form>
      );
    } else if (step.id === 6) { // Document Templates & Digital Signing
      content = (
        <div className="bg-gray-100 p-8 rounded min-h-[200px] flex items-center justify-center">
          <p>Content for Step {currentStep}: {step.title}</p>
        </div>
      );
    } else if (step.id === 7) { // Automation & Communication Settings
      content = (
        <div className="bg-gray-100 p-8 rounded min-h-[200px] flex items-center justify-center">
          <p>Content for Step {currentStep}: {step.title}</p>
        </div>
      );
    } else if (step.id === 8) { // Invite Team Members
      content = (
        <div className="bg-gray-100 p-8 rounded min-h-[200px] flex items-center justify-center">
          <p>Content for Step {currentStep}: {step.title}</p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
        <p className="text-muted-foreground mb-6">{step.description}</p>
        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!started ? (
          // Initial view with two panels
          <motion.div
            key="initial-layout"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }} // Keep parent opaque during children exit
            className="flex flex-col lg:flex-row min-h-screen"
          >
            {/* Left side - Green section */}
            <motion.div
              key="left"
              initial={{ x: 0 }}
              exit={{ x: '-100%', transition: { duration: 0.6, ease: 'easeInOut' } }}
              className="w-full lg:w-1/2 bg-green-600 text-white p-8 flex flex-col justify-between relative min-h-screen"
            >
              {/* Ensure content remains visible during animation if needed, adjust styling as necessary */}
              <div className="flex-none">
                <div className="relative h-12 w-48 mt-8 ml-8">
                  <Image 
                    src="/FF_VELLOA_white.png"
                    alt="Velloa Logo"
                    width={500}
                    height={500}
                    className="h-12 w-auto"
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                <h2 className="text-3xl font-bold mb-4">Welcome to Velloa!</h2>
                <p className="text-lg">Let&apos;s get your property management journey started.</p>
              </div>
              {/* Add a spacer div if needed for bottom alignment */}
              <div className="flex-none h-20"></div> 
            </motion.div>

            {/* Right side - Onboarding steps */}
            <motion.div
              key="right"
              initial={{ x: 0 }}
              exit={{ x: '100%', transition: { duration: 0.6, ease: 'easeInOut' } }}
              className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative bg-gray-50 min-h-screen"
            >
              <Link
                href="/"
                className="absolute top-4 left-4 lg:left-auto lg:right-4 p-2 text-gray-600 hover:text-gray-800 z-10"
              >
                <span className="sr-only">Back to home</span>
                 {/* Consider adding a back icon here */}
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                 </svg>
              </Link>
              {/* Onboarding Card Content */}
              <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Onboarding</h2>
                  <p className="mb-6 text-gray-600">Follow the steps to set up your account and get started with Velloa.</p>
                  {/* Placeholder for onboarding steps */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 1: Sign-Up</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 2: Company Setup</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 3: Portfolio Setup</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 4: Tenant & Unit Configuration</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 5: Payment & Accounting Setup</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 6: Document Templates & Digital Signing</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 7: Automation & Communication Settings</div>
                    <div className="p-4 bg-gray-100 rounded text-gray-800">Step 8: Invite Team Members</div>
                  </div>
                  <button
                    className="mt-8 w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setStarted(true)}
                  >
                    Start
                  </button>
                </div>
            </motion.div>
          </motion.div>
        ) : (
          // View after clicking start - Centered card
          <motion.div
            key="center-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut', delay: 0.3 } }} // Delay slightly
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3, ease: 'easeIn' } }} // Add exit for potential future transitions
            className="fixed inset-0 flex items-center justify-center z-20 p-10" // Use fixed positioning, removed bg-green-600
          >
            <ShaderGradientCanvas style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
              <ShaderGradient 
                control='query'
                urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.4&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%2300AA4B&color2=%2315A34A&color3=%236DBC76&destination=onCanvas&embedMode=off&envPreset=lobby&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=off&lightType=3d&pixelDensity=1&positionX=-1.4&positionY=0&positionZ=0&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=10&rotationZ=50&shader=defaults&type=plane&uDensity=1.3&uFrequency=5.5&uSpeed=0.2&uStrength=4&uTime=0&wireframe=false'
              /> 
              {/* You can customize gradient props here later */}
            </ShaderGradientCanvas>
            <Card className="w-full max-w-8xl h-[90vh] flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Onboarding</CardTitle>
                <CardDescription className="text-gray-600 pt-2">
                  Follow the steps to set up your account and get started with Velloa.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-row p-0 overflow-hidden"> {/* Changed to flex-row and removed padding */} 
                {/* Left Sidebar - Stepper */}
                <div className="w-72 border-r bg-muted/10 p-6 overflow-y-auto flex-shrink-0">
                  <h2 className="mb-6 text-lg font-semibold tracking-tight text-gray-700">Steps</h2>
                  <div className="relative ml-3">
                    {onboardingSteps.map((step, index) => {
                      const isStepCompleted = completedSteps.has(step.id);
                      const isCurrent = currentStep === step.id;
                      // Determine if the step is accessible (current, completed, or the one after the last completed)
                      const isAccessible = isCurrent || isStepCompleted || step.id === Math.max(0, ...completedSteps) + 1;

                      return (
                        <div key={step.id} className="relative mb-8">
                          {/* Connecting line */}
                          {index < onboardingSteps.length - 1 && (
                            <div className={cn(
                              "absolute left-[14px] top-[28px] h-[calc(100%+4px)] w-0.5 bg-border",
                              isStepCompleted ? "bg-green-600" : ""
                            )} />
                          )}
                          {/* Step Button/Indicator */}
                          <button
                            onClick={() => handleStepClick(step.id)}
                            className="group flex items-center gap-3 text-left w-full"
                            disabled={!isAccessible}
                          >
                            <div
                              className={cn(
                                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0",
                                isCurrent
                                  ? "bg-green-600 text-white"
                                  : isStepCompleted
                                  ? "bg-green-600/80 text-white"
                                  : "border border-border bg-background text-muted-foreground",
                                !isAccessible ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              {isStepCompleted ? <Check className="h-4 w-4" /> : !isAccessible ? <Lock className="h-3 w-3" /> : step.id}
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              isCurrent ? "text-green-600" : isStepCompleted ? "text-green-600/80" : "text-muted-foreground",
                              !isAccessible ? "opacity-50" : ""
                            )}>{step.title}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <CurrentStepContent />
                  </div>
                  {/* Navigation Buttons */}
                  <div className="flex justify-between p-6 border-t bg-muted/20">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={currentStep === 1}
                    >
                      Previous
                    </Button>
                    <Button onClick={handleNextStep}>
                      {currentStep === onboardingSteps.length ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div> // Changed from Fragment to div for positioning context
  );
}
