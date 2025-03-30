"use client"

import { useState, useEffect } from "react"
import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
// Import phone number value type
import { type Value as PhoneNumberValue } from "react-phone-number-input"

// Import page components
import IntroPage from "./steps/intro-page"
import PropertiesPage from "./steps/properties-page"
import LeadStatusPage from "./steps/lead-status-page"
import PersonalInfoPage from "./steps/personal-info-page"
import ResidenceQuestionPage from "./steps/residence-question-page"
import ResidenceDetailsPage from "./steps/residence-details-page"
import EmploymentPage, { type EmploymentFieldsSettings } from "./steps/employment-page"
import PetsQuestionPage from "./steps/pets-question-page"
import PetsDetailsPage from "./steps/pets-details-page"
import VehiclesQuestionPage from "./steps/vehicles-question-page"
import VehiclesDetailsPage from "./steps/vehicles-details-page"
import DependentsQuestionPage from "./steps/dependents-question-page"
import DependentTypeSelectionPage, { type DependentType } from "./steps/dependent-type-selection-page"
import DependentsDetailsPage from "./steps/dependents-details-page"
import CustomQuestionsPage from "./steps/custom-questions-page"
import SummaryPage from "./steps/summary-page"


// Define address form interface
interface AddressForm {
  id: number
  isPrimary: boolean
  streetAddress: string
  city: string
  province: string
  postalCode: string
  isExpanded: boolean
  monthlyRent?: string
  landlordName?: string
  lengthOfStay?: string
  landlordEmail?: string
  landlordPhone?: PhoneNumberValue
  reasonForLeaving?: string
  residentialStatus?: string
}

// Define employment form interface
interface EmploymentForm {
  id: number
  isPrimary: boolean
  employerName: string
  jobTitle: string
  monthlyIncome: string
  employmentType: string
  startDate: string
  endDate: string
  isCurrentJob: boolean
  supervisorName: string
  supervisorPhone: string
  employerStreetAddress: string
  employerCity: string
  employerProvince: string
  employerPostalCode: string
  isExpanded: boolean
  startDateObj?: Date
  endDateObj?: Date
  verificationDocumentFile?: File | null
}

// Define pet form interface
interface PetForm {
  id: number
  type: string
  breed: string
  weight: string
  sex: string
  age: string
  photo: File | null
  photoPreview: string | null
  isExpanded: boolean
}

// Define vehicle form interface
interface VehicleForm {
  id: number
  make: string
  model: string
  year: string
  licensePlate: string
  isExpanded: boolean
}

// Define dependent form interface
interface DependentForm {
  id: number
  type: DependentType
  firstName: string
  middleName: string
  lastName: string
  relationship: string
  email: string
  phone: string
  shareOfRent: string
  isExpanded: boolean
}

// Define custom question answer interface
interface CustomQuestionAnswer {
  id: number; // Matches the question ID
  question: string; // The question text (for reference)
  answer: string | boolean | number | Date | null; // Store the actual answer
  answerType: string; // Type like 'Text', 'Yes/No', 'Number', 'Date'
}

// Define interface for a single custom question (needed for ApplicationSettings)
interface CustomQuestion {
  id: number;
  question: string;
  answerType: string; // e.g., 'Yes/No', 'Text', 'Number', 'Date'
}

// --- Define interface for application settings ---
interface ApplicationSettings {
  pets: { enabled: boolean };
  vehicle: { enabled: boolean };
  dependants: { enabled: boolean }; // Renamed from dependents to match add-prospect/API
  customQuestions: { enabled: boolean; questions?: CustomQuestion[] }; // Updated to include optional questions array
  // Add other settings sections if needed later
}
// ------------------------------------------------

// --- Define interface for Residential Fields Settings ---
interface ResidentialFieldSetting {
  enabled: boolean;
  required: boolean;
}

interface ResidentialFieldsSettings {
  address?: ResidentialFieldSetting;
  monthlyRent?: ResidentialFieldSetting;
  landlordName?: ResidentialFieldSetting;
  lengthOfStay?: ResidentialFieldSetting;
  landlordEmail?: ResidentialFieldSetting;
  landlordPhone?: ResidentialFieldSetting;
  reasonForLeaving?: ResidentialFieldSetting;
  residentialStatus?: ResidentialFieldSetting; // Added this based on your example JSON
}
// ------------------------------------------------

// --- Define interface for Applicant Fields Settings ---
interface ApplicantFieldSetting {
  enabled: boolean;
  required: boolean;
}

export interface ApplicantFieldsSettings {
  ssn?: ApplicantFieldSetting;
  email?: ApplicantFieldSetting;
  gender?: ApplicantFieldSetting;
  tellUs?: ApplicantFieldSetting; // Maps to 'about' field
  lastName?: ApplicantFieldSetting;
  firstName?: ApplicantFieldSetting;
  middleName?: ApplicantFieldSetting;
  moveInDate?: ApplicantFieldSetting;
  dateOfBirth?: ApplicantFieldSetting;
  phoneNumber?: ApplicantFieldSetting;
  maritalStatus?: ApplicantFieldSetting;
  driverLicenseState?: ApplicantFieldSetting;
  driverLicenseNumber?: ApplicantFieldSetting;
}
// ------------------------------------------------

// --- Extend ApplicationSettings with EmploymentFields --- 
interface FullApplicationSettings extends ApplicationSettings {
  employmentFields?: EmploymentFieldsSettings;
  residentialFields?: ResidentialFieldsSettings;
  applicantFields?: ApplicantFieldsSettings; // Add applicant fields
}
// ------------------------------------------------

// --- Define interface for Personal Info Data State ---
export interface PersonalInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: PhoneNumberValue | undefined;
  ssn: string;
  driverLicenseState: string;
  driverLicenseNumber: string;
  moveInDate: string; // TODO: Use Date type if using date picker component
  dateOfBirth: string; // TODO: Use Date type if using date picker component
  gender: string;
  maritalStatus: string;
  about: string; // Maps to 'tellUs' setting in ApplicantFieldsSettings
}
// ------------------------------------------------

type StepType = 'intro' | 'properties' | 'lead_status' | 'personal_info' | 'residence' | 'employment' | 'pets' | 'vehicles' | 'dependents' | 'custom_questions' | 'summary'

export default function ProspectManagement() {
  const [step, setStep] = useState<StepType>('intro') // Reset to first step
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set()) // Empty set of completed steps
  
  // --- Settings state: Use the extended interface --- 
  const [applicationSettings, setApplicationSettings] = useState<FullApplicationSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  // ------------------------------------------------

  // --- Clear localStorage on page refresh ---
  useEffect(() => {
    // Clear localStorage items related to the stepper form
    localStorage.removeItem('prospectSelectedProperties');
    localStorage.removeItem('prospectLeadStatus');
    localStorage.removeItem('prospectPersonalInfo');
    localStorage.removeItem('prospectRentalHistory');
    localStorage.removeItem('prospectAddresses');
    localStorage.removeItem('prospectEmployment');
    localStorage.removeItem('prospectHasPets');
    localStorage.removeItem('prospectPets');
    localStorage.removeItem('prospectHasVehicles');
    localStorage.removeItem('prospectVehicles');
    localStorage.removeItem('prospectHasDependents');
    localStorage.removeItem('prospectDependents');
    localStorage.removeItem('prospectDependentType');
    localStorage.removeItem('prospectCustomAnswers');
    
    // You can add more localStorage items to clear if needed
  }, []);
  // ------------------------------------------------

  // --- Add state for properties and lead status ---
  const [propertiesData, setPropertiesData] = useState({
    selectedProperties: [] as string[],
    // Add other properties fields as needed
  });
  
  const [leadStatusData, setLeadStatusData] = useState({
    status: "",
    source: "",
    // Add other lead status fields as needed
  });
  // ------------------------------------------------

  // --- Load saved data from localStorage on mount ---
  useEffect(() => {
    // Load property data
    const savedProperties = localStorage.getItem('prospectSelectedProperties');
    if (savedProperties) {
      try {
        const properties = JSON.parse(savedProperties);
        setPropertiesData({
          selectedProperties: properties
        });
      } catch (error) {
        console.error('Error parsing saved properties:', error);
      }
    }

    // Load lead status data
    const savedLeadStatus = localStorage.getItem('prospectLeadStatus');
    if (savedLeadStatus) {
      try {
        const leadData = JSON.parse(savedLeadStatus);
        setLeadStatusData({
          status: leadData.leadStatus || "",
          source: leadData.leadSource || "",
          // Map other fields if needed
        });
      } catch (error) {
        console.error('Error parsing saved lead status:', error);
      }
    }

    // Load personal info data
    const savedPersonalInfo = localStorage.getItem('prospectPersonalInfo');
    if (savedPersonalInfo) {
      try {
        const personalData = JSON.parse(savedPersonalInfo);
        setPersonalInfoData(personalData);
      } catch (error) {
        console.error('Error parsing saved personal info:', error);
      }
    }

    // Load rental history selection
    const savedRentalHistory = localStorage.getItem('prospectRentalHistory');
    if (savedRentalHistory) {
      try {
        setHasRentalHistory(JSON.parse(savedRentalHistory));
      } catch (error) {
        console.error('Error parsing saved rental history:', error);
      }
    }

    // Load address forms
    const savedAddresses = localStorage.getItem('prospectAddresses');
    if (savedAddresses) {
      try {
        setAddressForms(JSON.parse(savedAddresses));
      } catch (error) {
        console.error('Error parsing saved addresses:', error);
      }
    }

    // Load employment forms
    const savedEmployment = localStorage.getItem('prospectEmployment');
    if (savedEmployment) {
      try {
        setEmploymentForms(JSON.parse(savedEmployment));
      } catch (error) {
        console.error('Error parsing saved employment:', error);
      }
    }

    // Load pets selection
    const savedHasPets = localStorage.getItem('prospectHasPets');
    if (savedHasPets) {
      try {
        setHasPets(JSON.parse(savedHasPets));
      } catch (error) {
        console.error('Error parsing saved pets selection:', error);
      }
    }

    // Load pet forms
    const savedPets = localStorage.getItem('prospectPets');
    if (savedPets) {
      try {
        setPetForms(JSON.parse(savedPets));
      } catch (error) {
        console.error('Error parsing saved pets:', error);
      }
    }

    // Load vehicles selection
    const savedHasVehicles = localStorage.getItem('prospectHasVehicles');
    if (savedHasVehicles) {
      try {
        setHasVehicles(JSON.parse(savedHasVehicles));
      } catch (error) {
        console.error('Error parsing saved vehicles selection:', error);
      }
    }

    // Load vehicle forms
    const savedVehicles = localStorage.getItem('prospectVehicles');
    if (savedVehicles) {
      try {
        setVehicleForms(JSON.parse(savedVehicles));
      } catch (error) {
        console.error('Error parsing saved vehicles:', error);
      }
    }

    // Load dependents selection
    const savedHasDependents = localStorage.getItem('prospectHasDependents');
    if (savedHasDependents) {
      try {
        setHasDependents(JSON.parse(savedHasDependents));
      } catch (error) {
        console.error('Error parsing saved dependents selection:', error);
      }
    }

    // Load dependent type selection
    const savedDependentType = localStorage.getItem('prospectDependentType');
    if (savedDependentType) {
      try {
        setSelectedDependentType(JSON.parse(savedDependentType));
      } catch (error) {
        console.error('Error parsing saved dependent type:', error);
      }
    }

    // Load dependent forms
    const savedDependents = localStorage.getItem('prospectDependents');
    if (savedDependents) {
      try {
        setDependentForms(JSON.parse(savedDependents));
      } catch (error) {
        console.error('Error parsing saved dependents:', error);
      }
    }

    // Load custom answers
    const savedCustomAnswers = localStorage.getItem('prospectCustomAnswers');
    if (savedCustomAnswers) {
      try {
        setCustomAnswers(JSON.parse(savedCustomAnswers));
      } catch (error) {
        console.error('Error parsing saved custom answers:', error);
      }
    }

    // Mark steps as completed if they have data
    const completedSteps = new Set<StepType>();
    if (savedProperties && JSON.parse(savedProperties).length > 0) {
      completedSteps.add('properties');
    }
    if (savedLeadStatus) {
      completedSteps.add('lead_status');
    }
    if (savedPersonalInfo) {
      completedSteps.add('personal_info');
    }
    if (savedRentalHistory !== null) {
      completedSteps.add('residence');
    }
    if (savedEmployment) {
      completedSteps.add('employment');
    }
    if (savedHasPets !== null) {
      completedSteps.add('pets');
    }
    if (savedHasVehicles !== null) {
      completedSteps.add('vehicles');
    }
    if (savedHasDependents !== null) {
      completedSteps.add('dependents');
    }
    if (savedCustomAnswers) {
      completedSteps.add('custom_questions');
    }
    
    if (completedSteps.size > 0) {
      setCompletedSteps(completedSteps);
    }
  }, []);
  // ------------------------------------------------

  // --- Fetch application settings on mount ---
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/company/settings/rental-application');
        if (!response.ok) {
          // Use default settings if API fails or returns error
          console.error('Failed to fetch rental application settings, using default values.');
          setApplicationSettings({
            pets: { enabled: true }, 
            vehicle: { enabled: true },
            dependants: { enabled: true },
            customQuestions: { enabled: true },
          });
        } else {
          const data = await response.json();
          // Assuming the API returns { rental_application: { pets: ..., vehicle: ... } }
          // Or handle if it returns the settings directly
          const settings = data.rental_application || data; // Adjust based on actual API response
          setApplicationSettings(settings);
          console.log("Fetched application settings:", settings);
        }
      } catch (error) {
        console.error('Error fetching application settings:', error);
        // Fallback to default settings on error
        setApplicationSettings({
          pets: { enabled: true },
          vehicle: { enabled: true },
          dependants: { enabled: true },
          customQuestions: { enabled: true },
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);
  // -------------------------------------------

  // Sub-steps state
  const [hasRentalHistory, setHasRentalHistory] = useState<boolean | null>(null)
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [hasVehicles, setHasVehicles] = useState<boolean | null>(null)
  const [hasDependents, setHasDependents] = useState<boolean | null>(null)
  const [selectedDependentType, setSelectedDependentType] = useState<DependentType>(null)

  const [residenceSubStep, setResidenceSubStep] = useState(1) // 1 for rental history question, 2 for address details
  const [petsSubStep, setPetsSubStep] = useState(1) // 1 for pets question, 2 for pet details
  const [vehiclesSubStep, setVehiclesSubStep] = useState(1) // 1 for vehicles question, 2 for vehicle details
  const [dependentsSubStep, setDependentsSubStep] = useState(1) // 1 for dependents question, 2 for type selection, 3 for details

  // Form states
  const [addressForms, setAddressForms] = useState<AddressForm[]>([
    {
      id: 1,
      isPrimary: true,
      streetAddress: "",
      city: "",
      province: "",
      postalCode: "",
      isExpanded: true,
    },
  ])

  const [employmentForms, setEmploymentForms] = useState<EmploymentForm[]>([
    {
      id: 1,
      isPrimary: true,
      employerName: "",
      jobTitle: "",
      monthlyIncome: "",
      employmentType: "",
      startDate: "",
      endDate: "",
      isCurrentJob: false,
      supervisorName: "",
      supervisorPhone: "",
      employerStreetAddress: "",
      employerCity: "",
      employerProvince: "",
      employerPostalCode: "",
      isExpanded: true,
      verificationDocumentFile: null,
    },
  ])

  const [petForms, setPetForms] = useState<PetForm[]>([
    {
      id: 1,
      type: "",
      breed: "",
      weight: "",
      sex: "",
      age: "",
      photo: null,
      photoPreview: null,
      isExpanded: true,
    },
  ])

  const [vehicleForms, setVehicleForms] = useState<VehicleForm[]>([
    {
      id: 1,
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      isExpanded: true,
    },
  ])

  const [dependentForms, setDependentForms] = useState<DependentForm[]>([])

  // State for custom question answers
  const [customAnswers, setCustomAnswers] = useState<CustomQuestionAnswer[]>([]);

  // --- State for Personal Info --- 
  const [personalInfoData, setPersonalInfoData] = useState<PersonalInfoData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: undefined,
    ssn: "",
    driverLicenseState: "",
    driverLicenseNumber: "",
    moveInDate: "", 
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    about: "",
  });
  // -------------------------------

  // --- Handler for Personal Info Changes ---
  // General handler for simple string inputs
  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string | boolean) => {
    // Type assertion might be needed if boolean values are used
    setPersonalInfoData(prev => ({ ...prev, [field]: value }));
  };

  // Specific handler for phone number
  const handlePersonalInfoPhoneChange = (value: PhoneNumberValue | undefined) => {
    setPersonalInfoData(prev => ({ ...prev, phoneNumber: value }));
  };

  // TODO: Add specific handlers for date fields if using date picker components
  // const handlePersonalInfoDateChange = (field: 'moveInDate' | 'dateOfBirth', value: Date | null) => { ... }
  // ---------------------------------------

  // Define the step order dynamically based on settings
  const getStepOrder = (): StepType[] => {
    const baseSteps: StepType[] = ['intro', 'properties', 'lead_status', 'personal_info', 'residence', 'employment'];
    const conditionalSteps: StepType[] = [];

    // Return base steps if settings haven't loaded yet
    if (isLoadingSettings || !applicationSettings) {
        // Optionally return just base steps or an empty array during loading
        return baseSteps;
    }

    // --- Conditionally add steps based on fetched settings object ---
    if (applicationSettings?.pets?.enabled) {
      conditionalSteps.push('pets');
    }
    if (applicationSettings?.vehicle?.enabled) {
      conditionalSteps.push('vehicles');
    }
    // Use 'dependants' key here to match the interface and expected API response
    if (applicationSettings?.dependants?.enabled) {
      conditionalSteps.push('dependents'); // Keep StepType as 'dependents'
    }
    if (applicationSettings?.customQuestions?.enabled) {
      conditionalSteps.push('custom_questions');
    }
    // -----------------------------------------------------

    // Add the final summary step
    return [...baseSteps, ...conditionalSteps, 'summary'];
  }

  // Helper function to mark step as completed
  const markStepCompleted = (completedStep: StepType) => {
    setCompletedSteps(prev => new Set([...prev, completedStep]));
  }

  // --- Helper Function to Validate a Single Address Form ---
  const isAddressFormValid = (form: AddressForm, settings: ResidentialFieldsSettings | undefined): boolean => {
    if (!settings) return true; // If no settings, assume valid

    const missingFields: string[] = [];

    // Check each required field based on settings
    if (settings.address?.enabled && settings.address.required) {
      if (!form.streetAddress) missingFields.push("Street Address");
      if (!form.city) missingFields.push("City");
      if (!form.province) missingFields.push("Province/State");
      if (!form.postalCode) missingFields.push("Postal/Zip Code");
    }
    if (settings.monthlyRent?.enabled && settings.monthlyRent.required && !form.monthlyRent) missingFields.push("Monthly Rent");
    if (settings.landlordName?.enabled && settings.landlordName.required && !form.landlordName) missingFields.push("Landlord Name");
    if (settings.lengthOfStay?.enabled && settings.lengthOfStay.required && !form.lengthOfStay) missingFields.push("Length of Stay"); // Note: This check needs adjustment if state changes for DateRangePicker
    if (settings.landlordEmail?.enabled && settings.landlordEmail.required && !form.landlordEmail) missingFields.push("Landlord Email");
    if (settings.landlordPhone?.enabled && settings.landlordPhone.required && !form.landlordPhone) missingFields.push("Landlord Phone");
    if (settings.reasonForLeaving?.enabled && settings.reasonForLeaving.required && !form.reasonForLeaving) missingFields.push("Reason for Leaving");
    if (settings.residentialStatus?.enabled && settings.residentialStatus.required && !form.residentialStatus) missingFields.push("Residential Status");

    return missingFields.length === 0;
  };
  // -------------------------------------------------------

  // --- Function to Notify User about Incomplete Address ---
  const notifyIncompleteAddress = () => {
    toast.error("Incomplete Address", {
      description: "Please fill out all required fields for the current address before adding a new one.",
    });
  };
  // -------------------------------------------------------

  // Check if a step can be accessed
  const isStepAccessible = (targetStep: StepType) => {
    const stepOrder = getStepOrder();
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(targetStep);
    
    // Can always go back
    if (targetStepIndex < currentStepIndex) return true;
    
    // Can only go forward if previous step is completed
    const previousStep = stepOrder[targetStepIndex - 1];
    return completedSteps.has(previousStep);
  }

  const handleNext = () => {
    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);
    
    // Handle sub-steps first
    if (step === 'residence' && residenceSubStep === 1) {
      if (hasRentalHistory === true) {
        setResidenceSubStep(2);
        return;
      } else if (hasRentalHistory === false) {
        // Skip residence details and mark as completed
        markStepCompleted('residence' as StepType);
        if (currentIndex < stepOrder.length - 1) {
          setStep(stepOrder[currentIndex + 1]);
        }
        return;
      }
    }

    // === Validation for Residence Details ===
    if (step === 'residence' && residenceSubStep === 2) {
      const settings = applicationSettings?.residentialFields;
      if (settings && hasRentalHistory) { // Only validate if settings exist and history is relevant
        // Find the first invalid form to show error for
        const invalidForm = addressForms.find(form => !isAddressFormValid(form, settings));

        if (invalidForm) {
            // Recalculate missing fields specifically for the toast message
            const missingFields: string[] = [];
            if (settings.address?.enabled && settings.address.required) {
              if (!invalidForm.streetAddress) missingFields.push("Street Address");
              if (!invalidForm.city) missingFields.push("City");
              if (!invalidForm.province) missingFields.push("Province/State");
              if (!invalidForm.postalCode) missingFields.push("Postal/Zip Code");
            }
            if (settings.monthlyRent?.enabled && settings.monthlyRent.required && !invalidForm.monthlyRent) missingFields.push("Monthly Rent");
            if (settings.landlordName?.enabled && settings.landlordName.required && !invalidForm.landlordName) missingFields.push("Landlord Name");
            if (settings.lengthOfStay?.enabled && settings.lengthOfStay.required && !invalidForm.lengthOfStay) missingFields.push("Length of Stay");
            if (settings.landlordEmail?.enabled && settings.landlordEmail.required && !invalidForm.landlordEmail) missingFields.push("Landlord Email");
            if (settings.landlordPhone?.enabled && settings.landlordPhone.required && !invalidForm.landlordPhone) missingFields.push("Landlord Phone");
            if (settings.reasonForLeaving?.enabled && settings.reasonForLeaving.required && !invalidForm.reasonForLeaving) missingFields.push("Reason for Leaving");
            if (settings.residentialStatus?.enabled && settings.residentialStatus.required && !invalidForm.residentialStatus) missingFields.push("Residential Status");

            toast.error(`Missing Residence Information (Address ${invalidForm.id})`, {
              description: `Please fill out the following required fields: ${missingFields.join(', ')}.`,
            });
            setCompletedSteps(prev => {
              const newSet = new Set(prev);
              newSet.delete('residence');
              return newSet;
            });
            return; // Stop execution
        }
      } else if (!hasRentalHistory) {
          // If user has NO rental history, mark step as complete and proceed
          markStepCompleted('residence' as StepType);
          if (currentIndex < stepOrder.length - 1) {
              setStep(stepOrder[currentIndex + 1]);
          }
          return; // Move to next step
      }
    }
    // ======================================

    if (step === 'pets' && petsSubStep === 1) {
      if (hasPets === true) {
        setPetsSubStep(2);
        return;
      } else if (hasPets === false) {
        // Skip pets details and mark as completed
        markStepCompleted('pets' as StepType);
        if (currentIndex < stepOrder.length - 1) {
          setStep(stepOrder[currentIndex + 1]);
        }
        return;
      }
    }

    if (step === 'vehicles' && vehiclesSubStep === 1) {
      if (hasVehicles === true) {
        setVehiclesSubStep(2);
        return;
      } else if (hasVehicles === false) {
        // Skip vehicles details and mark as completed
        markStepCompleted('vehicles' as StepType);
        if (currentIndex < stepOrder.length - 1) {
          setStep(stepOrder[currentIndex + 1]);
        }
        return;
      }
    }

    if (step === 'dependents') {
      if (dependentsSubStep === 1) {
        if (hasDependents === true) {
          setDependentsSubStep(2);
          return;
        } else if (hasDependents === false) {
          // Skip dependents details and mark as completed
          markStepCompleted('dependents' as StepType);
          if (currentIndex < stepOrder.length - 1) {
            setStep(stepOrder[currentIndex + 1]);
          }
          return;
        }
      } else if (dependentsSubStep === 2 && selectedDependentType !== null) {
        // Add a new dependent form based on the selected type
        const newId = dependentForms.length > 0 ? Math.max(...dependentForms.map((form) => form.id)) + 1 : 1;

        // Create a new form with the selected type
        const updatedForms = [
          ...dependentForms,
          {
            id: newId,
            type: selectedDependentType,
            firstName: "",
            middleName: "",
            lastName: "",
            relationship: "",
            email: "",
            phone: "",
            shareOfRent: "",
            isExpanded: true,
          },
        ];
        
        setDependentForms(updatedForms);
        // Save to localStorage
        localStorage.setItem('prospectDependents', JSON.stringify(updatedForms));

        setDependentsSubStep(3);
        return;
      }
    }

    // === Validation for Employment Details ===
    if (step === 'employment') {
      const settings = applicationSettings?.employmentFields;
      if (settings) { // Only validate if settings are loaded
        for (const form of employmentForms) {
          const missingFields: string[] = [];

          // Check each required field based on settings
          if (settings.employerName?.enabled && settings.employerName.required && !form.employerName) missingFields.push("Employer Name");
          if (settings.jobTitle?.enabled && settings.jobTitle.required && !form.jobTitle) missingFields.push("Job Title");
          if (settings.monthlyIncome?.enabled && settings.monthlyIncome.required && !form.monthlyIncome) missingFields.push("Monthly Income");
          if (settings.employmentType?.enabled && settings.employmentType.required && !form.employmentType) missingFields.push("Employment Type");
          if (settings.startDate?.enabled && settings.startDate.required && !form.startDate) missingFields.push("Start Date");
          // Assuming address fields are grouped and required together if address is required
          if (settings.address?.enabled && settings.address.required) {
            if (!form.employerStreetAddress) missingFields.push("Employer Street Address");
            if (!form.employerCity) missingFields.push("Employer City");
            if (!form.employerProvince) missingFields.push("Employer Province/State");
            if (!form.employerPostalCode) missingFields.push("Employer Postal/Zip Code");
          }
          // Add checks for supervisor name/phone if needed
          if (settings.supervisorName?.enabled && settings.supervisorName.required && !form.supervisorName) missingFields.push("Supervisor Name");
          if (settings.supervisorPhone?.enabled && settings.supervisorPhone.required && !form.supervisorPhone) missingFields.push("Supervisor Phone");
          // Add check for verifyDocument - This might need specific handling based on how file upload state is managed
          // if (settings.verifyDocument?.enabled && settings.verifyDocument.required && !form.verificationDocument) missingFields.push("Verification Document");

          if (missingFields.length > 0) {
            toast.error(`Missing Employment Information (Job ${form.id})`, {
              description: `Please fill out the following required fields: ${missingFields.join(', ')}.`,
            });
            // Prevent moving to the next step & un-complete
            setCompletedSteps(prev => {
              const newSet = new Set(prev);
              newSet.delete('employment'); 
              return newSet;
            });
            return; // Stop execution for this form
          }
        }
        // If validation passes, save the employment data to localStorage
        localStorage.setItem('prospectEmployment', JSON.stringify(employmentForms));
      }
    }
    // ======================================

    // === Validation for Custom Questions ===
    if (step === 'custom_questions') {
      const requiredQuestions = applicationSettings?.customQuestions?.questions || [];
      const answeredQuestionsCount = customAnswers.filter(a => a.answer !== null && a.answer !== '').length;

      if (answeredQuestionsCount < requiredQuestions.length) {
        toast.error("Missing Information", {
          description: "Please answer all custom questions before proceeding."
        });
        // Prevent moving to the next step
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete('custom_questions');
          return newSet;
        });
        return; 
      }
      // If validation passes, save custom answers to localStorage
      localStorage.setItem('prospectCustomAnswers', JSON.stringify(customAnswers));
    }
    // ========================================

    // === Validation for Personal Info ===
    if (step === 'personal_info') {
      const settings = applicationSettings?.applicantFields;
      if (settings) { // Only validate if settings are loaded
        const missingFields: string[] = [];

        if (settings.firstName?.enabled && settings.firstName.required && !personalInfoData.firstName) missingFields.push("First Name");
        if (settings.middleName?.enabled && settings.middleName.required && !personalInfoData.middleName) missingFields.push("Middle Name"); // Check if middle name can be truly required
        if (settings.lastName?.enabled && settings.lastName.required && !personalInfoData.lastName) missingFields.push("Last Name");
        if (settings.email?.enabled && settings.email.required && !personalInfoData.email) missingFields.push("Email"); // Add email format validation?
        if (settings.phoneNumber?.enabled && settings.phoneNumber.required && !personalInfoData.phoneNumber) missingFields.push("Phone Number"); // Add phone format validation?
        if (settings.ssn?.enabled && settings.ssn.required && !personalInfoData.ssn) missingFields.push("SSN"); // Add SSN format validation?
        if (settings.driverLicenseState?.enabled && settings.driverLicenseState.required && !personalInfoData.driverLicenseState) missingFields.push("Driver License Province");
        if (settings.driverLicenseNumber?.enabled && settings.driverLicenseNumber.required && !personalInfoData.driverLicenseNumber) missingFields.push("Driver's License Number"); // Add license format validation?
        if (settings.moveInDate?.enabled && settings.moveInDate.required && !personalInfoData.moveInDate) missingFields.push("Expected Move-in Date");
        if (settings.dateOfBirth?.enabled && settings.dateOfBirth.required && !personalInfoData.dateOfBirth) missingFields.push("Date of Birth");
        if (settings.gender?.enabled && settings.gender.required && !personalInfoData.gender) missingFields.push("Gender");
        if (settings.maritalStatus?.enabled && settings.maritalStatus.required && !personalInfoData.maritalStatus) missingFields.push("Marital Status");
        if (settings.tellUs?.enabled && settings.tellUs.required && !personalInfoData.about) missingFields.push("Tell us why you're Great!"); // Mapped from 'tellUs'
        
        // Add validation for driver's license format if number is entered
        if (personalInfoData.driverLicenseNumber && personalInfoData.driverLicenseState) {
           // TODO: Import or reimplement driverLicenseFormats and validateLicenseNumber logic here or pass error state down
           // if (!validateLicenseNumber(personalInfoData.driverLicenseNumber, personalInfoData.driverLicenseState)) {
           //   missingFields.push("Valid Driver's License Number (check format)");
           // }
        }

        if (missingFields.length > 0) {
          toast.error(`Missing Personal Information`, {
            description: `Please fill out the following required fields: ${missingFields.join(', ')}. If Driver's License Number is entered, ensure it matches the selected province's format.`,
          });
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete('personal_info'); 
            return newSet;
          });
          return; // Stop execution
        }
      }
    }
    // ===================================

    // === Validation for Dependents Details ===
    if (step === 'dependents' && dependentsSubStep === 3 && dependentForms.length > 0) {
      const lastDependent = dependentForms[dependentForms.length - 1];
      const missingFields: string[] = [];

      // Common required fields
      if (!lastDependent.firstName) missingFields.push("First Name");
      if (!lastDependent.lastName) missingFields.push("Last Name");
      if (!lastDependent.relationship) missingFields.push("Relationship");

      // Adult specific required fields - Adjusted
      if (lastDependent.type === 'adult') {
        if (!lastDependent.shareOfRent) missingFields.push("Share of Rent");
        // Require EITHER email OR phone
        if (!lastDependent.email && !lastDependent.phone) {
          missingFields.push("Email or Phone");
        }
      }
      
      // Child specific required fields (currently none beyond common)
      // if (lastDependent.type === 'child') { ... }

      if (missingFields.length > 0) {
        toast.error("Missing Dependent Information", {
          description: `Please fill out the following fields for the last dependent: ${missingFields.join(", ")}.`
        });
        // Prevent moving to the next step & un-complete
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete('dependents'); 
          return newSet;
        });
        return; // Stop execution
      }

      // If validation passes, save to localStorage
      localStorage.setItem('prospectDependents', JSON.stringify(dependentForms));
    }
    // ==========================================

    // Mark current step as completed
    markStepCompleted(step);
    
    // Move to next step if available
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
      // Reset sub-steps when moving to next main step
      setResidenceSubStep(1);
      setPetsSubStep(1);
      setVehiclesSubStep(1);
      setDependentsSubStep(1);
    }
  }

  const handlePrevious = () => {
    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);
    
    // Handle sub-steps first
    if (step === 'residence' && residenceSubStep === 2) {
      setResidenceSubStep(1);
      return;
    }

    if (step === 'pets' && petsSubStep === 2) {
      setPetsSubStep(1);
      return;
    }

    if (step === 'vehicles' && vehiclesSubStep === 2) {
      setVehiclesSubStep(1);
      return;
    }

    if (step === 'dependents') {
      if (dependentsSubStep === 3) {
        // If we're on the details page and there are no dependents or if we're adding a new dependent
        if (dependentForms.length === 0 || dependentForms[dependentForms.length - 1].firstName === "") {
          setDependentsSubStep(2);
          return;
        }
      } else if (dependentsSubStep === 2) {
        setDependentsSubStep(1);
        return;
      }
    }

    // Go to previous step if not at first step
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  }

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log("Application submitted!");
    alert("Application submitted successfully!");
  }

  // Event handlers
  const handleRentalHistorySelection = (hasHistory: boolean) => {
    setHasRentalHistory(hasHistory);
    // Save to localStorage
    localStorage.setItem('prospectRentalHistory', JSON.stringify(hasHistory));
  }

  const handlePetsSelection = (hasPetsValue: boolean) => {
    setHasPets(hasPetsValue);
    // Save to localStorage
    localStorage.setItem('prospectHasPets', JSON.stringify(hasPetsValue));
  }

  const handleVehiclesSelection = (hasVehiclesValue: boolean) => {
    setHasVehicles(hasVehiclesValue);
    // Save to localStorage
    localStorage.setItem('prospectHasVehicles', JSON.stringify(hasVehiclesValue));
  }

  const handleDependentsSelection = (hasDependentsValue: boolean) => {
    setHasDependents(hasDependentsValue);
    // Save to localStorage
    localStorage.setItem('prospectHasDependents', JSON.stringify(hasDependentsValue));
  }

  const handleDependentTypeSelection = (type: DependentType) => {
    setSelectedDependentType(type);
    // Save to localStorage
    localStorage.setItem('prospectDependentType', JSON.stringify(type));
  }

  // Form handlers
  const addAddressForm = () => {
    // Collapse all existing forms
    const collapsedForms = addressForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = addressForms.length > 0 ? Math.max(...addressForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    const updatedForms = [
      ...collapsedForms,
      {
        id: newId,
        isPrimary: false,
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
        isExpanded: true,
        monthlyRent: "",
        landlordName: "",
        lengthOfStay: "",
        landlordEmail: "",
        landlordPhone: undefined,
        reasonForLeaving: "",
        residentialStatus: "",
      },
    ];
    
    setAddressForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectAddresses', JSON.stringify(updatedForms));
  }

  const removeAddressForm = (id: number) => {
    // Don't allow removing the primary address
    if (addressForms.find((form) => form.id === id)?.isPrimary) {
      return
    }
    const updatedForms = addressForms.filter((form) => form.id !== id);
    setAddressForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectAddresses', JSON.stringify(updatedForms));
  }

  const toggleAddressForm = (id: number) => {
    const updatedForms = addressForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form));
    setAddressForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectAddresses', JSON.stringify(updatedForms));
  }

  const updateAddressForm = (id: number, field: string, value: string | number | boolean | PhoneNumberValue | undefined) => {
    const updatedForms = addressForms.map((form) => (form.id === id ? { ...form, [field]: value } : form));
    setAddressForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectAddresses', JSON.stringify(updatedForms));
  }

  // Specific handler for landlord phone number
  const handleLandlordPhoneChange = (id: number, value: PhoneNumberValue | undefined) => {
    const updatedForms = addressForms.map((form) => (form.id === id ? { ...form, landlordPhone: value } : form));
    setAddressForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectAddresses', JSON.stringify(updatedForms));
  };

  const addEmploymentForm = () => {
    // Only allow up to 2 jobs
    if (employmentForms.length >= 2) return

    // Collapse all existing forms
    const collapsedForms = employmentForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = employmentForms.length > 0 ? Math.max(...employmentForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    const updatedForms = [
      ...collapsedForms,
      {
        id: newId,
        isPrimary: false,
        employerName: "",
        jobTitle: "",
        monthlyIncome: "",
        employmentType: "",
        startDate: "",
        endDate: "",
        isCurrentJob: false,
        supervisorName: "",
        supervisorPhone: "",
        employerStreetAddress: "",
        employerCity: "",
        employerProvince: "",
        employerPostalCode: "",
        isExpanded: true,
        verificationDocumentFile: null,
      },
    ];
    
    setEmploymentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectEmployment', JSON.stringify(updatedForms));
  }

  const removeEmploymentForm = (id: number) => {
    const updatedForms = employmentForms.filter((form) => form.id !== id);
    setEmploymentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectEmployment', JSON.stringify(updatedForms));
  }

  const toggleEmploymentForm = (id: number) => {
    const updatedForms = employmentForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form));
    setEmploymentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectEmployment', JSON.stringify(updatedForms));
  }

  const updateEmploymentForm = (id: number, field: string, value: unknown) => {
    const updatedForms = employmentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form));
    setEmploymentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectEmployment', JSON.stringify(updatedForms));
  }

  const addPetForm = () => {
    // Collapse all existing forms
    const collapsedForms = petForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = petForms.length > 0 ? Math.max(...petForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    const updatedForms = [
      ...collapsedForms,
      {
        id: newId,
        type: "",
        breed: "",
        weight: "",
        sex: "",
        age: "",
        photo: null,
        photoPreview: null,
        isExpanded: true,
      },
    ];
    
    setPetForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectPets', JSON.stringify(updatedForms));
  }

  const removePetForm = (id: number) => {
    const updatedForms = petForms.filter((form) => form.id !== id);
    setPetForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectPets', JSON.stringify(updatedForms));
  }

  const togglePetForm = (id: number) => {
    const updatedForms = petForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form));
    setPetForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectPets', JSON.stringify(updatedForms));
  }

  const updatePetForm = (id: number, field: string, value: unknown) => {
    const updatedForms = petForms.map((form) => (form.id === id ? { ...form, [field]: value } : form));
    setPetForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectPets', JSON.stringify(updatedForms));
  }

  const addVehicleForm = () => {
    // Collapse all existing forms
    const collapsedForms = vehicleForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = vehicleForms.length > 0 ? Math.max(...vehicleForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    const updatedForms = [
      ...collapsedForms,
      {
        id: newId,
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        isExpanded: true,
      },
    ];
    
    setVehicleForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectVehicles', JSON.stringify(updatedForms));
  }

  const removeVehicleForm = (id: number) => {
    const updatedForms = vehicleForms.filter((form) => form.id !== id);
    setVehicleForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectVehicles', JSON.stringify(updatedForms));
  }

  const toggleVehicleForm = (id: number) => {
    const updatedForms = vehicleForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form));
    setVehicleForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectVehicles', JSON.stringify(updatedForms));
  }

  const updateVehicleForm = (id: number, field: string, value: unknown) => {
    const updatedForms = vehicleForms.map((form) => (form.id === id ? { ...form, [field]: value } : form));
    setVehicleForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectVehicles', JSON.stringify(updatedForms));
  }

  const addDependentForm = () => {
    // Reset to type selection step
    setDependentsSubStep(2)
    setSelectedDependentType(null)
    // Save to localStorage
    localStorage.setItem('prospectDependentType', JSON.stringify(null));
  }

  const removeDependentForm = (id: number) => {
    const updatedForms = dependentForms.filter((form) => form.id !== id);
    setDependentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectDependents', JSON.stringify(updatedForms));

    // If no dependents left, go back to type selection
    if (dependentForms.length <= 1) {
      setDependentsSubStep(2)
    }
  }

  const toggleDependentForm = (id: number) => {
    const updatedForms = dependentForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form));
    setDependentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectDependents', JSON.stringify(updatedForms));
  }

  const updateDependentForm = (id: number, field: string, value: string | number | boolean) => {
    const updatedForms = dependentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form));
    setDependentForms(updatedForms);
    // Save to localStorage
    localStorage.setItem('prospectDependents', JSON.stringify(updatedForms));
  }

  // Handler for updating custom question answers
  const handleCustomAnswerChange = (id: number, question: string, answerType: string, answer: string | boolean | number | Date | null) => {
    setCustomAnswers(prevAnswers => {
      const existingAnswerIndex = prevAnswers.findIndex(a => a.id === id);
      let updatedAnswers;
      
      if (existingAnswerIndex > -1) {
        // Update existing answer
        updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = { id, question, answerType, answer };
      } else {
        // Add new answer
        updatedAnswers = [...prevAnswers, { id, question, answerType, answer }];
      }
      
      // Save to localStorage
      localStorage.setItem('prospectCustomAnswers', JSON.stringify(updatedAnswers));
      return updatedAnswers;
    });
  };

  // Render the appropriate step content based on step
  const renderStepContent = () => {
    switch (step) {
      case 'intro':
        return <IntroPage onNext={handleNext} />
      case 'properties':
        return <PropertiesPage 
          onNext={handleNext} 
          onPrevious={handlePrevious}
          initialSelectedProperties={propertiesData.selectedProperties}
        />
      case 'lead_status':
        return <LeadStatusPage 
          onNext={handleNext} 
          onPrevious={handlePrevious}
          initialData={{
            leadStatus: leadStatusData.status,
            leadSource: leadStatusData.source,
          }}
        />
      case 'personal_info':
        return (
          <PersonalInfoPage
            applicantFields={applicationSettings?.applicantFields ?? {}} // Pass settings
            formData={personalInfoData} // Pass state data
            onChange={handlePersonalInfoChange} // Pass general handler
            onPhoneChange={handlePersonalInfoPhoneChange} // Pass phone handler
            // Pass date handlers if implemented
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 'residence':
        if (residenceSubStep === 1) {
          return (
            <ResidenceQuestionPage
              hasRentalHistory={hasRentalHistory}
              onRentalHistorySelection={handleRentalHistorySelection}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        } else {
          // Determine if the current expanded form is valid before passing prop
          const expandedForm = addressForms.find(form => form.isExpanded);
          const canAddAddress = expandedForm ? isAddressFormValid(expandedForm, applicationSettings?.residentialFields) : true; // Allow adding if no form is expanded (shouldn't happen)

          return (
            <ResidenceDetailsPage
              addressForms={addressForms}
              residentialFields={applicationSettings?.residentialFields ?? {}}
              canAddAddress={canAddAddress}
              onAddressFormChange={updateAddressForm}
              onLandlordPhoneChange={handleLandlordPhoneChange}
              onInvalidAddAttempt={notifyIncompleteAddress}
              onToggleAddressForm={toggleAddressForm}
              onRemoveAddressForm={removeAddressForm}
              onAddAddressForm={addAddressForm}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        }
      case 'employment':
        return (
          <EmploymentPage
            employmentForms={employmentForms}
            employmentFields={applicationSettings?.employmentFields ?? {}}
            onEmploymentFormChange={updateEmploymentForm}
            onToggleEmploymentForm={toggleEmploymentForm}
            onRemoveEmploymentForm={removeEmploymentForm}
            onAddEmploymentForm={addEmploymentForm}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 'pets':
        if (petsSubStep === 1) {
          return (
            <PetsQuestionPage
              hasPets={hasPets}
              onPetsSelection={handlePetsSelection}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        } else {
          return (
            <PetsDetailsPage
              petForms={petForms}
              onPetFormChange={updatePetForm}
              onTogglePetForm={togglePetForm}
              onRemovePetForm={removePetForm}
              onAddPetForm={addPetForm}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        }
      case 'vehicles':
        if (vehiclesSubStep === 1) {
          return (
            <VehiclesQuestionPage
              hasVehicles={hasVehicles}
              onVehiclesSelection={handleVehiclesSelection}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        } else {
          return (
            <VehiclesDetailsPage
              vehicleForms={vehicleForms}
              onVehicleFormChange={updateVehicleForm}
              onToggleVehicleForm={toggleVehicleForm}
              onRemoveVehicleForm={removeVehicleForm}
              onAddVehicleForm={addVehicleForm}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        }
      case 'dependents':
        if (dependentsSubStep === 1) {
          return (
            <DependentsQuestionPage
              hasDependents={hasDependents}
              onDependentsSelection={handleDependentsSelection}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        } else if (dependentsSubStep === 2) {
          return (
            <DependentTypeSelectionPage
              selectedType={selectedDependentType}
              onTypeSelection={handleDependentTypeSelection}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        } else {
          return (
            <DependentsDetailsPage
              dependentForms={dependentForms}
              onDependentFormChange={updateDependentForm}
              onToggleDependentForm={toggleDependentForm}
              onRemoveDependentForm={removeDependentForm}
              onAddDependentForm={addDependentForm}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )
        }
      case 'custom_questions':
        // Extract questions from settings, provide empty array if not loaded or missing
        const questions = applicationSettings?.customQuestions?.questions || [];
        return (
          <CustomQuestionsPage 
            questions={questions} 
            answers={customAnswers} 
            onAnswerChange={handleCustomAnswerChange} 
            onNext={handleNext} 
            onPrevious={handlePrevious} 
          />
        )
      case 'summary':
        // Get the dynamically generated step order
        const currentStepOrder = getStepOrder();
        const steps = currentStepOrder.map((stepName, index) => {
          // Check if skipped ONLY if the step is supposed to be shown based on settings
          const isSkipped =
            ((stepName === 'pets' && applicationSettings?.pets?.enabled && hasPets === false) ||
            (stepName === 'vehicles' && applicationSettings?.vehicle?.enabled && hasVehicles === false) ||
            (stepName === 'dependents' && applicationSettings?.dependants?.enabled && hasDependents === false)) ?? false; // Default to false if settings are null/undefined

          return {
            id: index + 1, // ID based on the actual order
            name: stepName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            completed: completedSteps.has(stepName as StepType),
            skipped: isSkipped
          };
        });

        return <SummaryPage steps={steps} onPrevious={handlePrevious} onSubmit={handleSubmit} />
      default:
        return (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Step {step} content</p>
          </div>
        )
    }
  }

  // Render loading state if settings are being fetched
  if (isLoadingSettings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading application settings...</p> 
        {/* You can replace this with a spinner component */}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Stepper sidebar - keeping closer to original */}
      <div className="w-72 border-r bg-muted/10 p-6 overflow-y-auto">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Prospect</h2>
        <div className="relative ml-3">
          {getStepOrder().map((stepName, index) => {
            const isAccessible = isStepAccessible(stepName as StepType);
            const isActive = step === stepName;
            const isCompleted = completedSteps.has(stepName as StepType);
            
            // Handle display name formatting
            const displayName = stepName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            return (
              <div key={stepName} className="relative mb-8">
                {/* Vertical line connecting steps */}
                {index < getStepOrder().length - 1 && (
                  <div className={cn(
                    "absolute left-[14px] top-[28px] h-[calc(100%+4px)] w-0.5 bg-border",
                    isCompleted ? "bg-primary" : ""
                  )} />
                )}

                <button 
                  onClick={() => isAccessible && setStep(stepName as StepType)} 
                  className="group flex items-center gap-3"
                  disabled={!isAccessible}
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-primary/80 text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground",
                      !isAccessible ? "opacity-50" : ""
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : !isAccessible ? <Lock className="h-3 w-3" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground",
                      !isAccessible ? "opacity-50" : ""
                    )}
                  >
                    {displayName}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content area - now with fixed height and scrollable content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl">{renderStepContent()}</div>
        </div>
      </div>
    </div>
  )
}

