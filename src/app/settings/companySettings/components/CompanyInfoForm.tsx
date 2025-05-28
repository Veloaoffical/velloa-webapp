import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MailIcon } from "lucide-react";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import CalendarInput from "@/components/calendarwithmonthsinput";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const COMPANY_TYPES = [
  "Property Management",
  "Real Estate",
  "Co-op",
  "Landlord",
  "Other",
];
const COUNTRIES = ["Canada", "United States"];
const CANADIAN_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"
];
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];
const CURRENCIES = ["CAD", "USD"];
const TIMEZONES = [
  "America/Toronto", "America/Vancouver", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC"
];

const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Company Name is required"),
  companyType: z.string().min(1, "Company Type is required"),
  website: z.string().optional().or(z.literal("")),
  businessPhone: z.any().refine(val => !!val, { message: "Business Phone is required" }),
  businessEmail: z.string().email("Invalid email address"),
  streetNumber: z.string().min(1, "Street Number is required"),
  streetName: z.string().min(1, "Street Name is required"),
  unit: z.string().optional().or(z.literal("")),
  poBox: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province/State is required"),
  postalCode: z.string().min(1, "Postal Code / ZIP is required"),
  country: z.string().min(1, "Country is required"),
  registrationNumber: z.string().optional().or(z.literal("")),
  timeZone: z.string().min(1, "Time Zone is required"),
  fiscalYearStart: z.date({ required_error: "Fiscal Year Start Date is required" }),
  currency: z.string().min(1, "Currency is required"),
});

type CompanyInfoFormValues = z.infer<typeof companyInfoSchema>;

export function CompanyInfoForm({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const form = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: "",
      companyType: "",
      website: "",
      businessPhone: undefined,
      businessEmail: "",
      streetNumber: "",
      streetName: "",
      unit: "",
      poBox: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
      registrationNumber: "",
      timeZone: "",
      fiscalYearStart: undefined,
      currency: "",
    },
  });
  const { control, handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (data: CompanyInfoFormValues) => {
    try {
      const res = await fetch('/api/company/settings/companyinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          fiscalYearStart: data.fiscalYearStart ? data.fiscalYearStart.toISOString() : null,
        }),
      });
      if (!res.ok) {
        // Optionally handle API error
        return;
      }
      onOpenChange(false);
    } catch {
      // Optionally handle unexpected error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Company Info</DialogTitle>
          <DialogDescription>Update your company details below.</DialogDescription>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Info</h3>
            <FormField
              control={control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Type *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {COMPANY_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone Number *</FormLabel>
                  <FormControl>
                    <PhoneNumberInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter business phone number"
                      defaultCountry="CA"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="businessEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="pl-9"
                        type="email"
                        placeholder="info@company.com"
                        {...field}
                      />
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                        <MailIcon size={16} aria-hidden="true" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <h3 className="text-lg font-semibold">Business Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="streetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="streetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="poBox"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Box</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province/State *</FormLabel>
                    <FormControl>
                      {form.watch("country") === "Canada" ? (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                          <SelectContent>
                            {CANADIAN_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : form.watch("country") === "United States" ? (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="Enter province/state" {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code / ZIP *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code / zip" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <h3 className="text-lg font-semibold">Business Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter business registration number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="timeZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Zone *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select time zone" /></SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="fiscalYearStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year Start Date *</FormLabel>
                    <FormControl>
                      <CalendarInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(cur => <SelectItem key={cur} value={cur}>{cur}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 