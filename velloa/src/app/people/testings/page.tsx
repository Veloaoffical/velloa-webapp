"use client"

import { useState, useEffect } from "react"
import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Import page components
import IntroPage from "./steps/intro-page"
import PropertiesPage from "./steps/properties-page"
import LeadStatusPage from "./steps/lead-status-page"
import PersonalInfoPage from "./steps/personal-info-page"
import ResidenceQuestionPage from "./steps/residence-question-page"
import ResidenceDetailsPage from "./steps/residence-details-page"
import EmploymentPage from "./steps/employment-page"
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

type StepType = 'intro' | 'properties' | 'lead_status' | 'personal_info' | 'residence' | 'employment' | 'pets' | 'vehicles' | 'dependents' | 'custom_questions' | 'summary'

export default function ProspectManagement() {
  const [step, setStep] = useState<StepType>('properties') // Start at Properties step
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set(['intro' as StepType]))
  
  // --- Settings state: Initialize as null, will be fetched --- 
  const [applicationSettings, setApplicationSettings] = useState<ApplicationSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
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
    if (step === 'residence' && residenceSubStep === 1 && hasRentalHistory !== null) {
      setResidenceSubStep(2);
      return;
    }

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
        setDependentForms([
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
        ]);

        setDependentsSubStep(3);
        return;
      }
    }

    // Mark current step as completed
    markStepCompleted(step);
    
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
    }
    // ==========================================

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
    }
    // ========================================

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
  }

  const handlePetsSelection = (hasPetsValue: boolean) => {
    setHasPets(hasPetsValue);
  }

  const handleVehiclesSelection = (hasVehiclesValue: boolean) => {
    setHasVehicles(hasVehiclesValue);
  }

  const handleDependentsSelection = (hasDependentsValue: boolean) => {
    setHasDependents(hasDependentsValue);
  }

  const handleDependentTypeSelection = (type: DependentType) => {
    setSelectedDependentType(type);
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
    setAddressForms([
      ...collapsedForms,
      {
        id: newId,
        isPrimary: false,
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
        isExpanded: true,
      },
    ])
  }

  const removeAddressForm = (id: number) => {
    // Don't allow removing the primary address
    if (addressForms.find((form) => form.id === id)?.isPrimary) {
      return
    }
    setAddressForms(addressForms.filter((form) => form.id !== id))
  }

  const toggleAddressForm = (id: number) => {
    setAddressForms(addressForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form)))
  }

  const updateAddressForm = (id: number, field: string, value: string) => {
    setAddressForms(addressForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

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
    setEmploymentForms([
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
      },
    ])
  }

  const removeEmploymentForm = (id: number) => {
    setEmploymentForms(employmentForms.filter((form) => form.id !== id))
  }

  const toggleEmploymentForm = (id: number) => {
    setEmploymentForms(
      employmentForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form)),
    )
  }

  const updateEmploymentForm = (id: number, field: string, value: unknown) => {
    setEmploymentForms(employmentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  const addPetForm = () => {
    // Collapse all existing forms
    const collapsedForms = petForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = petForms.length > 0 ? Math.max(...petForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    setPetForms([
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
    ])
  }

  const removePetForm = (id: number) => {
    setPetForms(petForms.filter((form) => form.id !== id))
  }

  const togglePetForm = (id: number) => {
    setPetForms(petForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form)))
  }

  const updatePetForm = (id: number, field: string, value: unknown) => {
    setPetForms(petForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  const addVehicleForm = () => {
    // Collapse all existing forms
    const collapsedForms = vehicleForms.map((form) => ({
      ...form,
      isExpanded: false,
    }))

    const newId = vehicleForms.length > 0 ? Math.max(...vehicleForms.map((form) => form.id)) + 1 : 1

    // Add new expanded form
    setVehicleForms([
      ...collapsedForms,
      {
        id: newId,
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        isExpanded: true,
      },
    ])
  }

  const removeVehicleForm = (id: number) => {
    setVehicleForms(vehicleForms.filter((form) => form.id !== id))
  }

  const toggleVehicleForm = (id: number) => {
    setVehicleForms(vehicleForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form)))
  }

  const updateVehicleForm = (id: number, field: string, value: unknown) => {
    setVehicleForms(vehicleForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  const addDependentForm = () => {
    // Reset to type selection step
    setDependentsSubStep(2)
    setSelectedDependentType(null)
  }

  const removeDependentForm = (id: number) => {
    setDependentForms(dependentForms.filter((form) => form.id !== id))

    // If no dependents left, go back to type selection
    if (dependentForms.length <= 1) {
      setDependentsSubStep(2)
    }
  }

  const toggleDependentForm = (id: number) => {
    setDependentForms(dependentForms.map((form) => (form.id === id ? { ...form, isExpanded: !form.isExpanded } : form)))
  }

  const updateDependentForm = (id: number, field: string, value: string | number | boolean) => {
    setDependentForms(dependentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  // Handler for updating custom question answers
  const handleCustomAnswerChange = (id: number, question: string, answerType: string, answer: string | boolean | number | Date | null) => {
    setCustomAnswers(prevAnswers => {
      const existingAnswerIndex = prevAnswers.findIndex(a => a.id === id);
      if (existingAnswerIndex > -1) {
        // Update existing answer
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = { id, question, answerType, answer };
        return updatedAnswers;
      } else {
        // Add new answer
        return [...prevAnswers, { id, question, answerType, answer }];
      }
    });
  };

  // Render the appropriate step content based on step
  const renderStepContent = () => {
    switch (step) {
      case 'intro':
        return <IntroPage onNext={handleNext} />
      case 'properties':
        return <PropertiesPage onNext={handleNext} onPrevious={handlePrevious} />
      case 'lead_status':
        return <LeadStatusPage onNext={handleNext} onPrevious={handlePrevious} />
      case 'personal_info':
        return <PersonalInfoPage onNext={handleNext} onPrevious={handlePrevious} />
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
          return (
            <ResidenceDetailsPage
              addressForms={addressForms}
              onAddressFormChange={updateAddressForm}
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

