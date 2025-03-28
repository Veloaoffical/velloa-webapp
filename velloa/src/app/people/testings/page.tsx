"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  name: string // For dependents
  isExpanded: boolean
}

export default function ProspectManagement() {
  const [currentStep, setCurrentStep] = useState(2) // Set to Properties step
  const [hasRentalHistory, setHasRentalHistory] = useState<boolean | null>(null)
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [hasVehicles, setHasVehicles] = useState<boolean | null>(null)
  const [hasDependents, setHasDependents] = useState<boolean | null>(null)
  const [selectedDependentType, setSelectedDependentType] = useState<DependentType>(null)

  const [residenceSubStep, setResidenceSubStep] = useState(1) // 1 for rental history question, 2 for address details
  const [petsSubStep, setPetsSubStep] = useState(1) // 1 for pets question, 2 for pet details
  const [vehiclesSubStep, setVehiclesSubStep] = useState(1) // 1 for vehicles question, 2 for vehicle details
  const [dependentsSubStep, setDependentsSubStep] = useState(1) // 1 for dependents question, 2 for type selection, 3 for details

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

  const steps = [
    { id: 1, name: "Intro", completed: true, skipped: false },
    { id: 2, name: "Properties", completed: true, skipped: false },
    { id: 3, name: "Lead Status", completed: true, skipped: false },
    { id: 4, name: "Personal Info", completed: true, skipped: false },
    { id: 5, name: "Residence", completed: true, skipped: false },
    { id: 6, name: "Employment", completed: true, skipped: false },
    { id: 7, name: "Pets", completed: true, skipped: hasPets === false },
    { id: 8, name: "Vehicles", completed: true, skipped: hasVehicles === false },
    { id: 9, name: "Dependents", completed: true, skipped: hasDependents === false },
    { id: 10, name: "Custom Questions", completed: false, skipped: false },
    { id: 11, name: "Summary", completed: false, skipped: false },
  ]

  const handleNext = () => {
    if (currentStep === 5 && residenceSubStep === 1 && hasRentalHistory !== null) {
      setResidenceSubStep(2)
      return
    }

    if (currentStep === 7 && petsSubStep === 1) {
      if (hasPets === true) {
        setPetsSubStep(2)
        return
      } else if (hasPets === false) {
        // If they have no pets, move to the next step
        setCurrentStep(currentStep + 1)
        return
      }
    }

    if (currentStep === 8 && vehiclesSubStep === 1) {
      if (hasVehicles === true) {
        setVehiclesSubStep(2)
        return
      } else if (hasVehicles === false) {
        // If they have no vehicles, move to the next step
        setCurrentStep(currentStep + 1)
        return
      }
    }

    if (currentStep === 9) {
      if (dependentsSubStep === 1) {
        if (hasDependents === true) {
          setDependentsSubStep(2)
          return
        } else if (hasDependents === false) {
          // If they have no dependents, move to the next step
          setCurrentStep(currentStep + 1)
          return
        }
      } else if (dependentsSubStep === 2 && selectedDependentType !== null) {
        // Add a new dependent form based on the selected type
        const newId = dependentForms.length > 0 ? Math.max(...dependentForms.map((form) => form.id)) + 1 : 1

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
            name: "",
            isExpanded: true,
          },
        ])

        setDependentsSubStep(3)
        return
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      setResidenceSubStep(1)
      setPetsSubStep(1)
      setVehiclesSubStep(1)
      setDependentsSubStep(1)
    }
  }

  const handlePrevious = () => {
    if (currentStep === 5 && residenceSubStep === 2) {
      setResidenceSubStep(1)
      return
    }

    if (currentStep === 7 && petsSubStep === 2) {
      setPetsSubStep(1)
      return
    }

    if (currentStep === 8 && vehiclesSubStep === 2) {
      setVehiclesSubStep(1)
      return
    }

    if (currentStep === 9) {
      if (dependentsSubStep === 3) {
        // If we're on the details page and there are no dependents (user clicked "Previous" after clicking "Add Occupant")
        // or if we're adding a new dependent (user clicked "Add Occupant" then "Previous")
        if (dependentForms.length === 0 || dependentForms[dependentForms.length - 1].firstName === "") {
          setDependentsSubStep(2)
          return
        }
        // Otherwise, stay on the details page
      } else if (dependentsSubStep === 2) {
        setDependentsSubStep(1)
        return
      }
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log("Application submitted!")
    // You could redirect to a success page or show a success message
    alert("Application submitted successfully!")
  }

  const handleRentalHistorySelection = (hasHistory: boolean) => {
    setHasRentalHistory(hasHistory)
  }

  const handlePetsSelection = (hasPetsValue: boolean) => {
    setHasPets(hasPetsValue)
  }

  const handleVehiclesSelection = (hasVehiclesValue: boolean) => {
    setHasVehicles(hasVehiclesValue)
  }

  const handleDependentsSelection = (hasDependentsValue: boolean) => {
    setHasDependents(hasDependentsValue)
  }

  const handleDependentTypeSelection = (type: DependentType) => {
    setSelectedDependentType(type)
  }

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

  const updateEmploymentForm = (id: number, field: string, value: any) => {
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

  const updatePetForm = (id: number, field: string, value: any) => {
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

  const updateVehicleForm = (id: number, field: string, value: any) => {
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

  const updateDependentForm = (id: number, field: string, value: any) => {
    setDependentForms(dependentForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  // Render the appropriate step content based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <IntroPage onNext={handleNext} />
      case 2:
        return <PropertiesPage onNext={handleNext} onPrevious={handlePrevious} />
      case 3:
        return <LeadStatusPage onNext={handleNext} onPrevious={handlePrevious} />
      case 4:
        return <PersonalInfoPage onNext={handleNext} onPrevious={handlePrevious} />
      case 5:
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
      case 6:
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
      case 7:
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
      case 8:
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
      case 9:
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
      case 11:
        return <SummaryPage steps={steps} onPrevious={handlePrevious} onSubmit={handleSubmit} />
      default:
        return (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Step {currentStep} content</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Stepper sidebar - keeping closer to original */}
      <div className="w-72 border-r bg-muted/10 p-6 overflow-y-auto">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Prospect</h2>
        <div className="relative ml-3">
          {steps.map((step) => (
            <div key={step.id} className="relative mb-8">
              {/* Vertical line connecting steps */}
              {step.id < steps.length && (
                <div className="absolute left-[14px] top-[28px] h-[calc(100%+4px)] w-0.5 bg-border" />
              )}

              <button onClick={() => setCurrentStep(step.id)} className="group flex items-center gap-3">
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : step.completed
                        ? "bg-primary/80 text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground",
                  )}
                >
                  {step.completed ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    currentStep === step.id
                      ? "text-primary"
                      : step.completed
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </span>
              </button>
            </div>
          ))}
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

