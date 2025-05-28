import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useId, useRef } from "react";
import { MailIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PhoneNumberInput } from "@/components/ui/phone-input";
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

interface ContactInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
}

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

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.any().refine(val => !!val, { message: "Phone is required" }),
  unit: z.string().optional().or(z.literal("")),
  streetNumber: z.string().min(1, "Street Number is required"),
  streetName: z.string().min(1, "Street Name is required"),
  poBox: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province/State is required"),
  postalCode: z.string().min(1, "Postal Code / ZIP is required"),
  country: z.string().min(1, "Country is required"),
  mode: z.enum(["company", "custom"]),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

export function ContactInfoDialog({ open, onOpenChange, propertyId }: ContactInfoDialogProps) {
  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: '',
      phone: undefined,
      unit: '',
      streetNumber: '',
      streetName: '',
      poBox: '',
      city: '',
      province: '',
      postalCode: '',
      country: '',
      mode: 'company',
    },
  });
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = form;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const radioId = useId();
  const customFieldsRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      fetch(`/api/property/${propertyId}/propertySettings`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch property settings');
          return res.json();
        })
        .then((data) => {
          reset({
            email: data.property_email || '',
            phone: typeof data.property_contact_phone_number === 'string' && /^\+\d{1,15}$/.test(data.property_contact_phone_number)
              ? data.property_contact_phone_number
              : undefined,
            unit: data.property_contact_address?.unit || '',
            streetNumber: data.property_contact_address?.streetNumber || '',
            streetName: data.property_contact_address?.streetName || '',
            poBox: data.property_contact_address?.poBox || '',
            city: data.property_contact_address?.city || '',
            province: data.property_contact_address?.province || '',
            postalCode: data.property_contact_address?.postalCode || '',
            country: data.property_contact_address?.country || '',
            mode: data.property_contact_type === 'custom' ? 'custom' : 'company',
          });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, propertyId, reset]);

  const onSubmit = async (values: ContactInfoFormValues) => {
    setLoading(true);
    setError(null);
    try {
      let payload: Record<string, unknown> = {};
      if (values.mode === 'custom') {
        payload = {
          property_contact_type: 'custom',
          property_email: values.email,
          property_contact_phone_number: values.phone || null,
          property_contact_address: {
            unit: values.unit,
            streetNumber: values.streetNumber,
            streetName: values.streetName,
            poBox: values.poBox,
            city: values.city,
            province: values.province,
            postalCode: values.postalCode,
            country: values.country,
          },
        };
      } else {
        payload = {
          property_contact_type: 'company',
          property_email: null,
          property_contact_phone_number: null,
          property_contact_address: null,
        };
      }
      const res = await fetch(`/api/property/${propertyId}/propertySettings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update contact info');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to update contact info');
      } else {
        setError('Failed to update contact info');
      }
    } finally {
      setLoading(false);
    }
  };

  const mode = watch('mode');
  const country = watch('country');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Information</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="mode"
              render={({ field }) => (
                <RadioGroup
                  className="gap-6"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem
                      value="company"
                      id={`${radioId}-1`}
                      aria-describedby={`${radioId}-1-description`}
                    />
                    <div className="grid grow gap-2">
                      <Label htmlFor={`${radioId}-1`}>Use company contact info</Label>
                      <p id={`${radioId}-1-description`} className="text-muted-foreground text-xs">
                        Use the company-wide contact and address information for this property.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem
                      value="custom"
                      id={`${radioId}-2`}
                      aria-describedby={`${radioId}-2-description`}
                      aria-controls="custom-contact-fields"
                    />
                    <div className="grow">
                      <div className="grid grow gap-2">
                        <Label htmlFor={`${radioId}-2`}>Use custom property contact info</Label>
                        <p id={`${radioId}-2-description`} className="text-muted-foreground text-xs">
                          Enter custom contact and address information for this property.
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              )}
            />
            <div
              role="region"
              id="custom-contact-fields"
              aria-labelledby={`${radioId}-2`}
              className="grid transition-all ease-in-out data-[state=collapsed]:grid-rows-[0fr] data-[state=collapsed]:opacity-0 data-[state=expanded]:grid-rows-[1fr] data-[state=expanded]:opacity-100"
              data-state={mode === 'custom' ? 'expanded' : 'collapsed'}
              ref={customFieldsRef}
            >
              <div className="pointer-events-none -m-2 overflow-hidden p-2">
                <div className="pointer-events-auto mt-3">
                  {mode === 'custom' && (
                    <>
                      <div className="space-y-4">
                        <Separator />
                        <h3 className="text-lg font-semibold">Contact Information</h3>
                        <FormField
                          control={control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 peer-disabled:opacity-50">
                                    <MailIcon size={16} aria-hidden="true" />
                                  </div>
                                  <Input
                                    type="email"
                                    className="ps-9"
                                    placeholder="Enter email"
                                    {...field}
                                    disabled={loading}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <PhoneNumberInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={loading}
                                  placeholder="Enter phone number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Separator />
                        <h3 className="text-lg font-semibold">Contact Address</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={control}
                            name="streetNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="123" {...field} disabled={loading} />
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
                                <FormLabel>Street Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Main St" {...field} disabled={loading} />
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
                                  <Input placeholder="Apt 4B" {...field} disabled={loading} />
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
                                  <Input disabled={loading} placeholder="Optional" {...field} />
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
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} disabled={loading} />
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
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
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
                        <FormField
                          control={control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province/State</FormLabel>
                              <FormControl>
                                {country === "Canada" ? (
                                  <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                                    <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                                    <SelectContent>
                                      {CANADIAN_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : country === "United States" ? (
                                  <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                    <SelectContent>
                                      {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input {...field} disabled={loading} />
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
                              <FormLabel>Postal Code / ZIP</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter postal code / zip" {...field} disabled={loading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
            <DialogFooter className="gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isSubmitting} className="bg-[#16B364] hover:bg-[#16B364]/90">
                {loading || isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 