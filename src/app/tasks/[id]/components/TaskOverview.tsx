"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileSignature, 
  AlarmClockMinus,
  Users,
  User,
  Wrench,
  Repeat,
  Check,
  Mail,
  Phone,
  NotebookPen,
  DoorOpen,
  CalendarClock,
  CircleDollarSign,
  ContactRound,
  FolderClock,
  MessageSquare,
  Minus as MinusIcon,
  CheckIcon,
  MonitorSmartphone
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useForm } from "react-hook-form";
import Timeline from "@/components/timeline-hor";
import { Task, PartsLabourItem, PersonDetails } from "../TaskDetailsClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import AddTaskPage from './create-work-order/page';

// Define an interface for the timeline item structure
interface TimelineItem {
  id: number;
  date: string;
  title: string;
  description: string;
  isDeclined?: boolean; // Add optional flag for declined status
}

// Define the statuses for consistency
const TASK_ROLE_STATUSES = ["Open", "In Progress", "Completed", "Cancelled"]; 
const TENANT_REQUEST_ROLE_STATUS_SELECT_OPTIONS = ["Open", "In-progress", "Work-order-created", "Completed", "Request-canceled"];
const TENANT_REQUEST_ROLE_LOGIC_SEQUENCE = ["Open", "In-progress", "Work-order-created", "Completed"];

const WORK_ORDER_ROLE_STATUS_SELECT_OPTIONS = [
  "Work-order Started",
  "Vendor Approval",
  "Vendor Decline",
  "Vendor Bill",
  "Owner Approval",
  "Owner Decline",
  "Vendor Paid",
  "Job Complete"
];
const WORK_ORDER_ROLE_LOGIC_SEQUENCE = [
  "Work-order Started",
  "Vendor Approval",
  "Vendor Bill",
  "Owner Approval",
  "Vendor Paid",
  "Job Complete"
];

// Helper function to get the latest active status
const getCurrentStatusInfo = (taskStatus: Task['task_status']): { name: string | null; date: string | null } => {
  if (!taskStatus) return { name: null, date: null };

  let latestStatus: { name: string | null; date: string | null } = { name: null, date: null };
  let latestDate: Date | null = null;

  Object.entries(taskStatus).forEach(([key, value]) => {
    if (value.value === true && value.date) {
      const currentDate = parseISO(value.date);
      if (!latestDate || currentDate > latestDate) {
        latestDate = currentDate;
        latestStatus = { name: key, date: value.date };
      }
    }
  });

  return latestStatus;
};

interface TaskOverviewProps {
  taskDetails: Task;
  setActiveTab?: (value: string) => void;
  onAddNote?: () => void;
  personName: string;
  vendorDetails?: PersonDetails | null;
  tenantDetails?: PersonDetails | null;
  userCompanyName?: string | null;
  updateTaskDetails?: (updates: Partial<Task>) => void;
}

interface UpdateStatusForm {
  note: string;
}

export function TaskOverview({ taskDetails, setActiveTab, onAddNote, personName, vendorDetails, tenantDetails, userCompanyName, chargeItems, updateTaskDetails }: TaskOverviewProps & { chargeItems?: PartsLabourItem[] }) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [selectedStatusKey, setSelectedStatusKey] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<UpdateStatusForm>({
    defaultValues: {
      note: ""
    }
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [vendors, setVendors] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [showCreateWorkOrderModal, setShowCreateWorkOrderModal] = useState(false);
  
  // Add notification options
  const notificationOptions = [
    {
      value: "none",
      label: "None",
      icon: <MinusIcon className="h-6 w-6" />
    },
    {
      value: "sms",
      label: "SMS",
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      value: "email",
      label: "Email",
      icon: <Mail className="h-6 w-6" />
    },
    {
      value: "both",
      label: "Both",
      icon: <MonitorSmartphone className="h-6 w-6" />
    }
  ];
  
  // Add a new form for vendor selection
  const vendorForm = useForm({
    defaultValues: {
      vendor_id: "",
      vendorNotification: ""
    }
  });

  // Determine if the assign button should be disabled
  const isAssignButtonDisabled = 
    assignLoading || 
    !selectedVendorId || 
    (selectedVendorId !== null && selectedNotification === null);

  const handleNavigateToNotes = () => {
    // Prioritize switching tab if setActiveTab exists
    if (setActiveTab) {
      setActiveTab("notes");
    }
    // Also call onAddNote if it exists (might open a modal, etc.)
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleUpdateStatusSubmit = async () => {
    if (!selectedStatusKey) {
      toast.error("Please select a status.");
      return;
    }

    try {
      const supabase = createClient();
      const currentDate = new Date().toISOString();
      const currentStatus = taskDetails.task_status || {};
      const newStatusObject = { ...currentStatus }; // Start with a copy

      let logicSequence: string[] = [];
      let terminalArchiveStatusKey: string | null = null;
      let isDeclineOrCancel = false;
      let targetKey: string | null = selectedStatusKey;
      let targetValue: boolean | null = true;

      if (taskDetails.role === 'work_order') {
        logicSequence = WORK_ORDER_ROLE_LOGIC_SEQUENCE;
        terminalArchiveStatusKey = "Job Complete";
        if (selectedStatusKey === "Vendor Decline") {
          targetKey = "Vendor Approval";
          targetValue = false;
          isDeclineOrCancel = true;
        } else if (selectedStatusKey === "Owner Decline") {
          targetKey = "Owner Approval";
          targetValue = false;
          isDeclineOrCancel = true;
        }
      } else if (taskDetails.role === 'tenant_request') {
        logicSequence = TENANT_REQUEST_ROLE_LOGIC_SEQUENCE;
        terminalArchiveStatusKey = "Completed";
        if (selectedStatusKey === "Request-canceled") {
          targetKey = "Request-canceled"; // Stays the same
          targetValue = true; // Mark cancel as true
          isDeclineOrCancel = true;
        }
      } else if (taskDetails.role === 'task') {
        logicSequence = ["Open", "In Progress", "Completed"]; // Simple sequence for tasks
        terminalArchiveStatusKey = "Completed";
        if (selectedStatusKey === "Cancelled") {
            targetKey = "Cancelled";
            targetValue = true;
            isDeclineOrCancel = true;
        }
      }

      // Auto-approve previous steps logic
      if (targetKey && targetValue === true && !isDeclineOrCancel && logicSequence.length > 0) {
          const targetIndex = logicSequence.findIndex(step => step === targetKey);
          if (targetIndex > 0) { 
              for (let i = 0; i < targetIndex; i++) {
                  const previousKey = logicSequence[i];
                  const previousStatus = newStatusObject[previousKey];
                  if (!previousStatus || previousStatus.value !== true) {
                      if (!(previousKey in newStatusObject)) {
                          newStatusObject[previousKey] = { date: null, value: null };
                      }
                      newStatusObject[previousKey] = {
                          ...(newStatusObject[previousKey]),
                          value: true,
                          date: currentDate,
                      };
                  }
              }
          }
      }
      
      // Update the target key in the new status object
      if (targetKey !== null && targetValue !== null) {
         if (!(targetKey in newStatusObject)) {
             newStatusObject[targetKey] = { date: null, value: null };
         }
         newStatusObject[targetKey] = {
            ...(newStatusObject[targetKey]),
            value: targetValue,
            date: currentDate,
         };

         // Reset subsequent statuses logic
         if (logicSequence.length > 0) {
            const selectedIndexInLogic = logicSequence.findIndex(step => step === targetKey || (taskDetails.role === 'work_order' && selectedStatusKey === 'Vendor Decline' && step === 'Vendor Approval') || (taskDetails.role === 'work_order' && selectedStatusKey === 'Owner Decline' && step === 'Owner Approval'));
            
            // Only reset subsequent steps if it wasn't a decline action that sets a previous step to false
            // Or if it's a cancellation (which sets itself to true, but subsequent steps should still be reset)
            if (selectedIndexInLogic !== -1 && (!isDeclineOrCancel || selectedStatusKey === targetKey) ) { // if isDeclineOrCancel is true, only proceed if selectedStatusKey is the targetKey (e.g. cancellation)
              for (let i = selectedIndexInLogic + 1; i < logicSequence.length; i++) {
                const subsequentKey = logicSequence[i];
                if (newStatusObject[subsequentKey]) {
                  newStatusObject[subsequentKey].date = null;
                  newStatusObject[subsequentKey].value = null;
                } else {
                  newStatusObject[subsequentKey] = { date: null, value: null };
                }
              }
            }
         }
      } else {
        console.error("Invalid status selected or logic error");
        toast.error("Invalid status selected.");
        return;
      }

      const { error: statusError } = await supabase
        .from("maintenance_requests")
        .update({ task_status: newStatusObject })
        .eq("id", taskDetails.id);

      if (statusError) throw statusError;

      if (updateTaskDetails) {
        updateTaskDetails({ task_status: newStatusObject });
      }

      form.reset({ note: "" });
      setSelectedStatusKey(null);
      setShowStatusDialog(false);

      if (terminalArchiveStatusKey && selectedStatusKey === terminalArchiveStatusKey) {
        const { error: archiveError } = await supabase
          .from("maintenance_requests")
          .update({ active_status: "archive" })
          .eq("id", taskDetails.id);

        if (archiveError) {
          console.error("Error archiving task:", archiveError);
          toast.error("Failed to archive task, but status updated.");
        }

        setShowSuccessPage(true);
        setTimeout(() => {
          setShowSuccessPage(false);
          router.push('/tasks');
        }, 2000);
      } else {
        router.refresh();
      }

    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const formatAssigneesNames = (assignee: { profile: { first_name: string; last_name: string; }; } | null | undefined) => {
    if (!assignee) return 'Not Assigned';
    return `${assignee.profile.first_name} ${assignee.profile.last_name}`;
  };

  const formatFrequency = (frequency: string | null | undefined) => {
    if (!frequency) return null;
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const getTimelineItemsAndStep = (taskStatus: Task['task_status'], role: Task['role']): { items: TimelineItem[]; activeStep: number; progressStep: number } => {
    const items: TimelineItem[] = [];
    let activeStep = 0;
    let progressStep = 0;
    let currentItemId = 1; // For unique item IDs

    const workOrderSequence = [
      "Work-order Started",
      "Vendor Approval",
      "Vendor Bill",
      "Owner Approval",
      "Vendor Paid",
      "Job Complete",
    ];
    const tenantRequestFullSequence = [ // The complete possible sequence for tenant_request
      "Open", "In Progress", "Work Order Created", "Completed"
    ];

    let currentDisplaySequence: string[] = [];

    if (role === 'tenant_request') {
      currentDisplaySequence.push("Open", "In Progress"); // Base steps

      // Add "Work Order Created" if its status is true
      if (taskStatus?.["Work Order Created"]?.value === true) {
        currentDisplaySequence.push("Work Order Created");
      }

      // Always add "Completed" step for tenant_request
      currentDisplaySequence.push("Completed");

      // Filter to ensure the sequence maintains the order of tenantRequestFullSequence
      // and remove any steps not meeting criteria (e.g. WO Created not true)
      // Also, this ensures "Completed" is placed correctly if WO Created is not present.
      currentDisplaySequence = tenantRequestFullSequence.filter(step => currentDisplaySequence.includes(step));

    } else { // work_order or other roles
      currentDisplaySequence = workOrderSequence;
    }


    // Handle !taskStatus case (e.g. new task)
    if (!taskStatus) {
      if (role === 'tenant_request') {
        // For a new tenant request, only "Open" and "In Progress" are shown by default.
        const initialTenantDisplaySequence = ["Open", "In Progress"];
        initialTenantDisplaySequence.forEach(key => {
          items.push({
            id: currentItemId++,
            date: 'N/A',
            title: key,
            description: `Status: ${key}`,
            isDeclined: false,
          });
        });
        return { items, activeStep: 0, progressStep: 0 };
      } else { // work_order or other roles (e.g. 'task')
        workOrderSequence.forEach((key, index) => {
          items.push({
            id: currentItemId++,
            date: index === 0 ? format(new Date(), 'MMM d, yyyy') : 'N/A',
            title: key,
            description: index === 0 ? "Work order created." : `Status: ${key}`,
            isDeclined: false,
          });
        });
        // Default to first step active for work order if no status
        return { items, activeStep: 1, progressStep: 1 };
      }
    }

    // Populate items based on currentDisplaySequence and taskStatus
    currentDisplaySequence.forEach((key) => {
      const statusData = taskStatus[key];
      const date = statusData?.date;
      const value = statusData?.value;
      let formattedDate = 'N/A';
      let title = key;
      let description = `Status: ${key}`; // Default
      let isDeclined = false;

      if (date) {
        const currentDate = parseISO(date);
        formattedDate = format(currentDate, 'MMM d, yyyy');
      }

      // --- Custom logic based on key AND role ---
      if (role === 'tenant_request') {
        switch (key) {
          case "Open":
            description = value === true ? "Request opened." : "Pending opening.";
            break;
          case "In Progress":
            description = value === true ? "Work in progress." : "Waiting to start.";
            break;
          case "Work Order Created": // This item is only added to currentDisplaySequence if value is true
            description = value === true ? "Work order generated." : "Waiting for work order.";
            break;
          case "Completed": // This item is only added to currentDisplaySequence if value is true
            description = value === true ? "Tenant request completed." : "Pending completion.";
            break;
          default:
             description = `Status: ${key} - ${value === true ? 'Done' : value === false ? 'Declined' : 'Pending'}`;
            break;
        }
      } else { // Logic for work_order or other roles
        switch (key) {
          case "Work-order Started":
            description = value === true ? "Work order created." : "Pending creation.";
            break;
          case "Vendor Approval":
            if (value === null || value === undefined) {
              title = "Vendor Approval";
              description = "Waiting for vendor approval.";
            } else if (value === false) {
              title = "Vendor Decline";
              description = "Vendor declined.";
              isDeclined = true;
            } else {
              title = "Vendor Approval";
              description = "Vendor approved.";
            }
            break;
          case "Vendor Bill":
            description = value === true ? "Vendor submitted bill." : "Waiting for vendor bill.";
            break;
          case "Owner Approval":
            if (value === null || value === undefined) {
              title = "Owner Approval";
              description = "Waiting for owner approval.";
            } else if (value === false) {
              title = "Owner Decline";
              description = "Owner declined.";
              isDeclined = true;
            } else {
              title = "Owner Approval";
              description = "Owner approved.";
            }
            break;
          case "Vendor Paid":
            title = "Vendor Paid";
            description = value === true ? "Vendor paid." : "Waiting for payment.";
            break;
          case "Job Complete":
            description = value === true ? "Work order completed." : "Pending completion.";
            break;
          default:
            break;
        }
      }
      // --- End Custom Logic ---

      items.push({
        id: currentItemId++,
        date: formattedDate,
        title: title,
        description: description,
        isDeclined: isDeclined,
      });
    });

    // Recalculate activeStep and progressStep based on the *full reference sequence* for the role
    const referenceSequence = role === 'tenant_request' ? tenantRequestFullSequence : workOrderSequence;
    let lastTrueIndexInRef = -1;
    let lastNonNullIndexInRef = -1;

    referenceSequence.forEach((key, index) => {
      const statusValue = taskStatus[key]?.value;
      if (statusValue === true) { // True means approved/completed step in the reference sequence
        lastTrueIndexInRef = index;
      }
      if (statusValue !== null && statusValue !== undefined) { // Any step in ref sequence that has been touched
        lastNonNullIndexInRef = index;
      }
    });

    activeStep = lastTrueIndexInRef !== -1 ? lastTrueIndexInRef + 1 : 0;
    progressStep = lastNonNullIndexInRef !== -1 ? lastNonNullIndexInRef + 1 : 0;

    return { items, activeStep, progressStep };
  };

  // Call getTimelineItemsAndStep with the role
  const { items: timelineItems, activeStep: currentTimelineStep, progressStep: currentProgressStep } = getTimelineItemsAndStep(taskDetails.task_status, taskDetails.role);

  // Determine timeline percentages based on role
  const timelinePercentages = taskDetails.role === 'tenant_request'
    ? undefined // Let the Timeline component calculate dynamically based on the actual number of items
    : [21, 39, 59, 78, 100]; // Percentages for 6 steps (Work Order)

  const openVendorDialog = async () => {
    setIsLoadingVendors(true);
    setShowVendorDialog(true);
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('people')
        .select('id, first_name, last_name, company')
        .eq('role', 'vendor');
      
      if (error) throw error;
      
      if (data) {
        const formattedVendors = data.map(vendor => ({
          id: vendor.id,
          name: vendor.company 
            ? `${vendor.company} (${vendor.first_name} ${vendor.last_name})` 
            : `${vendor.first_name} ${vendor.last_name}`
        }));
        setVendors(formattedVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleVendorChange = async () => {
    if (!selectedVendorId) {
      toast.error("Please select a vendor");
      return;
    }
    
    if (selectedNotification === null) {
      toast.error("Please select a notification method");
      return;
    }
    
    setAssignLoading(true);
    try {
      const supabase = createClient();
      
      // Update vendor_id in maintenance_requests table
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ vendor_id: selectedVendorId })
        .eq('id', taskDetails.id);
      
      if (updateError) throw updateError;
      
      // Get details of the newly assigned vendor
      const { data: vendorData, error: vendorError } = await supabase
        .from('people')
        .select('id, first_name, last_name, email, phone, company, role')
        .eq('id', selectedVendorId)
        .single();
        
      if (vendorError) throw vendorError;
      
      // Update client-side state
      if (updateTaskDetails && vendorData) {
        updateTaskDetails({ vendor_id: selectedVendorId });
      }
      
      toast.success("Vendor reassigned successfully");
      setShowVendorDialog(false);
      setSelectedVendorId(null);
      setSelectedNotification(null);
      
      // Send notifications based on selection
      if (selectedNotification !== "none") {
        // Send SMS notification
        if (selectedNotification === "sms" || selectedNotification === "both") {
          if (vendorData.phone) {
            let formattedAddressSms = 'Address not specified'; // Default for SMS
            if (taskDetails.property_id) {
              try {
                const { data: propertyRecord, error: propertyFetchError } = await supabase
                  .from('properties')
                  .select('property_settings')
                  .eq('id', taskDetails.property_id)
                  .single();

                if (propertyFetchError || !propertyRecord || !propertyRecord.property_settings) {
                  console.error('Error fetching property settings link/ID or link missing for SMS:', propertyFetchError?.message);
                } else {
                  const propertySettingsId = propertyRecord.property_settings;
                  const { data: settingsData, error: settingsFetchError } = await supabase
                    .from('property_settings')
                    .select('property_address')
                    .eq('id', propertySettingsId)
                    .single();

                  if (settingsFetchError) {
                    console.error('Supabase error fetching property address from settings for SMS:', settingsFetchError.message);
                  } else if (settingsData && settingsData.property_address) {
                    const pa = settingsData.property_address as { street_number?: string, street?: string, city?: string, province?: string, postal_code?: string, country?: string };
                    const streetPart = pa.street_number ? `${pa.street_number} ${pa.street}` : pa.street;
                    const cityPart = pa.city;
                    const provincePart = pa.province;
                    const postalPart = pa.postal_code;
                    const countryPart = pa.country;

                    const addressArray = [];
                    if (streetPart) addressArray.push(streetPart.trim());
                    if (cityPart) addressArray.push(cityPart.trim());
                    const provPostal = [];
                    if (provincePart) provPostal.push(provincePart.trim());
                    if (postalPart) provPostal.push(postalPart.trim());
                    if (provPostal.length > 0) addressArray.push(provPostal.join(' '));
                    if (countryPart) addressArray.push(countryPart.trim());

                    if (addressArray.length > 0) {
                      formattedAddressSms = addressArray.join(', ');
                    } else {
                      formattedAddressSms = 'Address details incomplete';
                    }
                  }
                }
              } catch (fetchAddressError) {
                console.error('Error fetching/processing property address for SMS:', fetchAddressError);
              }
            }

            const { error: notifyError } = await supabase.functions.invoke("notify-vendor-sms", {
              body: { 
                phone: vendorData.phone, 
                workOrderId: taskDetails.nano_id || taskDetails.id, 
                company: userCompanyName,
                propertyAddress: formattedAddressSms // Add property address here
              },
            });
            
            if (notifyError) {
              console.error("Error notifying vendor via SMS:", notifyError);
              toast.warning("Vendor reassigned but SMS notification failed");
            } else {
              toast.success("Vendor notified via SMS");
            }
          }
        }
        
        // Send email notification
        if (selectedNotification === "email" || selectedNotification === "both") {
          if (vendorData.email) {
            let formattedAddress = 'Address not specified'; // Default if fetching fails or no ID

            if (taskDetails.property_id) {
              try {
                // Step 1: Fetch the property_settings FK (ID) from the properties table
                const { data: propertyRecord, error: propertyFetchError } = await supabase
                  .from('properties')
                  .select('property_settings') // This column in 'properties' should hold the ID for 'property_settings' table
                  .eq('id', taskDetails.property_id) // taskDetails.property_id is properties.id
                  .single();

                if (propertyFetchError || !propertyRecord || !propertyRecord.property_settings) {
                  console.error('Error fetching property settings link/ID or link missing:', propertyFetchError?.message);
                  // formattedAddress remains 'Address not specified' by default
                } else {
                  const propertySettingsId = propertyRecord.property_settings; // This is the ID for property_settings table

                  // Step 2: Fetch the property_address from property_settings table using the obtained ID
                  const { data: settingsData, error: settingsFetchError } = await supabase
                    .from('property_settings')
                    .select('property_address')
                    .eq('id', propertySettingsId) // Use the correct ID for property_settings table
                    .single();

                  if (settingsFetchError) {
                    console.error('Supabase error fetching property address from settings:', settingsFetchError.message);
                  } else if (settingsData && settingsData.property_address) {
                    const pa = settingsData.property_address as { street_number?: string, street?: string, city?: string, province?: string, postal_code?: string, country?: string };
                    
                    const streetPart = pa.street_number ? `${pa.street_number} ${pa.street}` : pa.street;
                    const cityPart = pa.city;
                    const provincePart = pa.province;
                    const postalPart = pa.postal_code;
                    const countryPart = pa.country;

                    const addressArray = [];
                    if (streetPart) addressArray.push(streetPart.trim());
                    if (cityPart) addressArray.push(cityPart.trim());
                    
                    const provPostal = [];
                    if (provincePart) provPostal.push(provincePart.trim());
                    if (postalPart) provPostal.push(postalPart.trim());
                    if (provPostal.length > 0) addressArray.push(provPostal.join(' '));
                    
                    if (countryPart) addressArray.push(countryPart.trim());

                    if (addressArray.length > 0) {
                      formattedAddress = addressArray.join(', ');
                    } else {
                      formattedAddress = 'Address details incomplete';
                    }
                  }
                }
              } catch (fetchAddressError) {
                console.error('Error fetching/processing property address:', fetchAddressError);
                // toast.warn('Failed to process property address information.'); // Optional
              }
            }

            const emailBody = {
              email: vendorData.email,
              name: `${vendorData.first_name} ${vendorData.last_name}`,
              workOrderId: taskDetails.nano_id || taskDetails.id, // Use nano_id for Order Number, fallback to id
              company: userCompanyName || 'Velloa', // Default company name
              propertyAddress: formattedAddress,
              serviceType: "Work Order",
              dueDate: taskDetails.due_date ? format(parseISO(taskDetails.due_date), 'MMM d, yyyy') : 'Date not specified'
            };
            
            const { error: emailError } = await supabase.functions.invoke("notify-vendor-email", {
              body: emailBody,
            });
            
            if (emailError) {
              console.error("Error notifying vendor via email:", emailError);
              toast.warning("Vendor reassigned but email notification failed");
            } else {
              toast.success("Vendor notified via email");
            }
          }
        }
      }
      
    } catch (error) {
      console.error("Error reassigning vendor:", error);
      toast.error("Failed to reassign vendor");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleVendorDialogClose = () => {
    setShowVendorDialog(false);
    setSelectedVendorId(null);
    setSelectedNotification(null);
    // Optionally reset loading states if needed, though they are usually managed by their specific functions
    // setIsLoadingVendors(false); 
    // setAssignLoading(false);
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {taskDetails.role === 'task' ? (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={() => {
                    setShowStatusDialog(true);
                  }}
                >
                  <FolderClock className="w-4 h-4" />
                  Update Status
                </Button>
                <Button className="w-full gap-2" onClick={handleNavigateToNotes}>
                  <NotebookPen className="w-4 h-4" />
                  Add Note
                </Button>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setShowCreateWorkOrderModal(true)}
                >
                  <Wrench className="w-4 h-4" />
                  New Work Order
                </Button>
              </>
            ) : taskDetails.role === 'tenant_request' ? (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={() => setShowStatusDialog(true)}
                >
                  <FolderClock className="w-4 h-4" />
                  Update Status
                </Button>
                <Button className="w-full gap-2" onClick={handleNavigateToNotes}>
                  <NotebookPen className="w-4 h-4" />
                  Add Note
                </Button>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setShowCreateWorkOrderModal(true)}
                >
                  <Wrench className="w-4 h-4" />
                  Create Work Order
                </Button>
              </>
            ) : (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={() => setShowStatusDialog(true)}
                >
                  <FolderClock className="w-4 h-4" />
                  Update Status
                </Button>
                <Button className="w-full gap-2" onClick={handleNavigateToNotes}>
                  <NotebookPen className="w-4 h-4" />
                  Add Note
                </Button>
                {taskDetails.role === 'work_order' && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (taskDetails.task_status?.["Job Complete"]?.value === true) {
                        toast.info("This job is already complete. Vendors cannot be reassigned.");
                      } else {
                        openVendorDialog();
                      }
                    }}
                    disabled={assignLoading}
                  >
                    <ContactRound className="w-4 h-4" />
                    {assignLoading ? "Assigning…" : "Re-assign Vendor"}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {taskDetails.role === 'work_order' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Vendor (personName) */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <ContactRound className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium">{personName}</p>
            </CardContent>
          </Card>
          {/* Assignee */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <User className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Assignee</p>
              <p className="font-medium">{formatAssigneesNames(taskDetails.assignee)}</p>
            </CardContent>
          </Card>
          {/* Due Date */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <CalendarClock className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{taskDetails.due_date ? format(parseISO(taskDetails.due_date), 'MMM d, yyyy h:mm a') : 'Not Set'}</p>
            </CardContent>
          </Card>
          {/* Permit to Enter */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <DoorOpen className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Permit to Enter</p>
              <p className="font-medium">{taskDetails.permit_enter === true ? 'Granted' : 'Not Granted'}</p>
            </CardContent>
          </Card>
          {/* Work Order Cost */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <CircleDollarSign className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Work Order Cost</p>
              <p className="font-medium">
                {chargeItems && chargeItems.length > 0
                  ? `$${chargeItems.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}`
                  : '$0'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              {/* Use a default icon or update based on currentStatusInfo.name */}
              <AlarmClockMinus className="h-6 w-6 mb-2 text-muted-foreground" /> 
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {getCurrentStatusInfo(taskDetails.task_status).name || 'Not Set'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              {taskDetails.role === 'task' ? (
                <>
                  <Repeat className="h-6 w-6 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {taskDetails.task_type === 'recurring' ? 'Recurring' : 'One Time'}
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {taskDetails.role === 'tenant_request' ? 'Tenant' : 'Owner'}
                  </p>
                  <p className="font-medium">
                    {personName}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Users className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Assignee</p>
              <p className="font-medium">{formatAssigneesNames(taskDetails.assignee)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              {taskDetails.task_type === 'recurring' ? (
                <Repeat className="h-6 w-6 mb-2 text-muted-foreground" />
              ) : (
                <FileSignature className="h-6 w-6 mb-2 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {taskDetails.task_type === 'recurring' ? 'Frequency' : 'Due Date'}
              </p>
              <p className="font-medium">
                {taskDetails.task_type === 'recurring' ? (
                  <span className="flex flex-col gap-1">
                    <span>{formatFrequency(taskDetails.Recurring_frequency)}</span>
                    <span className="text-xs text-muted-foreground">
                      {taskDetails.start_date && format(parseISO(taskDetails.start_date), 'MMM d')} - {taskDetails.end_date && format(parseISO(taskDetails.end_date), 'MMM d, yyyy')}
                    </span>
                  </span>
                ) : (
                  taskDetails.due_date ? format(parseISO(taskDetails.due_date), 'MMM d, yyyy h:mm a') : 'Not Set'
                )}
              </p>
            </CardContent>
          </Card>
          {/* Permit to Enter Card (Added for tenant_request) */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <DoorOpen className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Permit to Enter</p>
              <p className="font-medium">{taskDetails.permit_enter === true ? 'Granted' : 'Not Granted'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline Progress in Card */}
      <Card>
        <CardContent>
          {/* Pass dynamic items and percentages */}
          <Timeline 
            activeStep={currentTimelineStep} 
            items={timelineItems} 
            progressStep={currentProgressStep} 
            stepPercentages={timelinePercentages} // Use dynamic percentages
          />
        </CardContent>
      </Card>

      {/* Task Description + Work Order Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
        {/* Description Card (left) */}
        <Card className="h-full">
        <CardHeader className="px-6 pt-6 pb-2">
            <h2 className="font-semibold text-lg">Description</h2>
          </CardHeader>
          <CardContent className="p-6 min-h-[300px] h-full">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {taskDetails.description || 'No description provided'}
            </p>
          </CardContent>
        </Card>
        {/* Info Card (right, all sections inside one card) */}
        <Card className="h-full">
          <CardHeader className="px-6 pt-6 pb-2">
            <h2 className="font-semibold text-lg">Details</h2>
          </CardHeader>
          <CardContent className="p-0 min-h-[300px] h-full flex flex-col gap-0">
            <div className="flex flex-col gap-4 px-6 pb-6">
              {/* Tenant Section - Fieldset Style */}
              {(taskDetails.role === 'tenant_request' || taskDetails.role === 'work_order') && tenantDetails && (
                <div className="relative border border-input rounded-md p-4 pt-5 mt-2.5">
                  <span className="absolute -top-2.5 left-3 bg-card px-1 text-sm text-muted-foreground font-medium">
                    Tenant
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <Link href={`/people/${tenantDetails.id}`} className="hover:underline font-medium">
                        {tenantDetails.first_name || tenantDetails.last_name ? `${tenantDetails.first_name || ''} ${tenantDetails.last_name || ''}`.trim() : 'View Person'}
                        {tenantDetails.company ? ` (${tenantDetails.company})` : ''}
                      </Link>
                    </div>
                    {tenantDetails.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a href={`mailto:${tenantDetails.email}`} className="hover:underline">{tenantDetails.email}</a>
                      </div>
                    )}
                    {tenantDetails.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{tenantDetails.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Section - Fieldset Style */}
              {taskDetails.role === 'work_order' && (
                 <div className="relative border border-input rounded-md p-4 pt-5 mt-2.5">
                  <span className="absolute -top-2.5 left-3 bg-card px-1 text-sm text-muted-foreground font-medium">
                    Vendor
                  </span>
                  {vendorDetails ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Link href={`/people/${vendorDetails.id}`} className="hover:underline font-medium">
                          {vendorDetails.company ? vendorDetails.company : `${vendorDetails.first_name || ''} ${vendorDetails.last_name || ''}`.trim()}
                          {(vendorDetails.company && (vendorDetails.first_name || vendorDetails.last_name)) ? ` (${`${vendorDetails.first_name || ''} ${vendorDetails.last_name || ''}`.trim()})` : ''}
                        </Link>
                      </div>
                      {vendorDetails.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <a href={`mailto:${vendorDetails.email}`} className="hover:underline">{vendorDetails.email}</a>
                        </div>
                      )}
                      {vendorDetails.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{vendorDetails.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not Assigned</span>
                  )}
                </div>
              )}

              {/* Assignee Section - Original Card Style (can be updated if needed) */}
              {taskDetails.role !== 'tenant_request' && taskDetails.role !== 'work_order' && taskDetails.assignee && (
                <Card className="border shadow-sm">
                   <CardContent className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="font-semibold text-base">Assignee</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                       <User className="w-4 h-4" />
                       <span className="font-medium">{formatAssigneesNames(taskDetails.assignee)}</span>
                     </div>
                   </CardContent>
                 </Card>
              )}

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateStatusSubmit(); }} className="space-y-4">
              <FormItem>
                <FormLabel>New Status</FormLabel>
                <Select
                  onValueChange={setSelectedStatusKey}
                  value={selectedStatusKey || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskDetails.role === 'work_order' ? (
                      WORK_ORDER_ROLE_STATUS_SELECT_OPTIONS.map(statusKey => (
                        <SelectItem key={statusKey} value={statusKey}>{statusKey}</SelectItem>
                      ))
                    ) : taskDetails.role === 'tenant_request' ? (
                      TENANT_REQUEST_ROLE_STATUS_SELECT_OPTIONS.map(statusKey => (
                        <SelectItem key={statusKey} value={statusKey}>{statusKey}</SelectItem>
                      ))
                    ) : taskDetails.role === 'task' ? (
                      TASK_ROLE_STATUSES.map(statusKey => (
                        <SelectItem key={statusKey} value={statusKey}>{statusKey}</SelectItem>
                      ))
                    ) : (
                       // Fallback for any other roles or if role is undefined
                       TASK_ROLE_STATUSES.map(statusKey => (
                        <SelectItem key={statusKey} value={statusKey}>{statusKey}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Work Order Modal */}
      <Dialog open={showCreateWorkOrderModal} onOpenChange={setShowCreateWorkOrderModal}>
        <DialogContent className="sm:max-w-[80%] lg:max-w-[90%] xl:max-w-[1400px] h-[90vh] flex flex-col p-0">
          {/* Visually hidden title for accessibility */}
          <DialogTitle className="sr-only">Create Work Order</DialogTitle>
          {/* Render AddTaskPage component inside the modal */}
          {/* Pass onClose function and potentially taskId */}
          <AddTaskPage
            onClose={() => {
              setShowCreateWorkOrderModal(false);
              router.refresh(); // Refresh data after closing modal
            }} 
            initialTaskId={taskDetails.id} // Pass task ID if needed
            isModal={true} // Indicate it's running in a modal
          />
        </DialogContent>
      </Dialog>

      {/* Success Page Dialog */}
      <Dialog open={showSuccessPage} onOpenChange={setShowSuccessPage}>
        <DialogContent className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Task Status Update</DialogTitle>
          </DialogHeader>
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {taskDetails.role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Complete
          </h2>
        </DialogContent>
      </Dialog>

      {/* Vendor Reassignment Dialog */}
      <Dialog 
        open={showVendorDialog} 
        onOpenChange={(open) => {
          if (!open) {
            handleVendorDialogClose();
          } else {
            // If opening, you might want to trigger openVendorDialog if it's not already called elsewhere
            // openVendorDialog(); // Or ensure this is called by the button that opens the dialog
            setShowVendorDialog(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Re-assign Vendor</DialogTitle>
          </DialogHeader>
          <Form {...vendorForm}>
            <form className="py-4">
              <div className="space-y-6">
                <FormItem>
                  <FormLabel>Select Vendor</FormLabel>
                  <Select
                    onValueChange={setSelectedVendorId}
                    value={selectedVendorId || undefined}
                    disabled={isLoadingVendors}
                  >
                    <FormControl>
                      <SelectTrigger className="h-[42px]">
                        <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : "Select a vendor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                
                <AnimatePresence>
                  {selectedVendorId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <fieldset className="space-y-4 mt-4">
                        <legend className="text-foreground text-sm leading-none font-medium">
                          Notify Vendor By:
                        </legend>
                        <div className="flex justify-center w-full">
                          <RadioGroup
                            className="flex gap-5"
                            value={selectedNotification || ""}
                            onValueChange={(value) => setSelectedNotification(value)}
                          >
                            {notificationOptions.map((item) => (
                              <label
                                key={item.value}
                                className="flex flex-col items-center cursor-pointer m-0 p-0"
                                style={{ minWidth: 80 }}
                              >
                                <RadioGroupItem
                                  id={`vendor-notify-${item.value}`}
                                  value={item.value}
                                  className="peer sr-only after:absolute after:inset-0"
                                />
                                <span
                                  className={`flex items-center justify-center rounded-lg border shadow-sm transition-colors w-20 h-20 text-center text-lg
                                    ${selectedNotification === item.value ? "border-ring bg-accent" : "border-input bg-background"}
                                    has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70
                                  `}
                                >
                                  {item.icon}
                                </span>
                                <span className="flex flex-row items-center gap-2 mt-2">
                                  {selectedNotification === item.value ? (
                                    <CheckIcon size={16} className="text-green-600" aria-hidden="true" />
                                  ) : (
                                    <MinusIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                                  )}
                                  <span className="text-xs font-medium">{item.label}</span>
                                </span>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                      </fieldset>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </Form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowVendorDialog(false)} disabled={assignLoading}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleVendorChange} 
              disabled={isAssignButtonDisabled}
            >
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 