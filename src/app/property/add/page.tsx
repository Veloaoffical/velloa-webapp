'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  RiHome2Line, 
  RiBuilding2Line, 
  RiBuilding4Line,
  RiHomeSmileLine,
  RiStore2Line,
  RiBuilding3Line,
  RiArchiveLine,
  RiQuestionLine,
  RiUploadCloud2Line,
  RiCloseLine,
  RiBasketballLine,
  RiBuildingLine,
  RiVipCrownLine,
  RiCustomerService2Line,
  RiHeartPulseLine,
  RiHomeGearLine,
  RiWalkLine,
  RiTShirt2Line,
  RiSettings5Line,
  RiHotelBedLine,
  RiWifiLine,
  RiTimeLine,
  RiTranslate2,
  RiCarWashingLine,
  RiHome8Line,
  RiParkingBoxLine,
  RiGroupLine,
  RiHotelLine,
  RiCommunityLine,
  RiWaterFlashLine,
  RiGamepadLine,
  RiHomeSmile2Line,
  RiStore3Line,
  RiDoorClosedLine,
  RiRestaurant2Line,
  RiShieldUserLine,
  RiInboxArchiveLine,
  RiRecycleLine,
  RiLeafLine,
  RiSunLine,
  RiShipLine,
  RiDoorLockLine,
  RiBook2Line,
  RiHomeOfficeLine,
  RiTreeLine,
  RiImageLine,
} from "@remixicon/react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Baby, Dumbbell, GlassWater, Cat, Dog, Bird, Fish, Rabbit, CircleCheck, Ban, Plus, Bed, Bath, Ruler, DollarSign, Home, Building, CircleDollarSign, Coins } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";

interface AddressForm {
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface UploadedFile {
  preview: string;
  customName: string;
  size: number;
  name: string;
  type: string;
}

interface PetPolicy {
  petsAllowed: boolean | null;
  allowedPets: string[];
  description: string;
}

interface Unit {
  unitName: string;
  beds: string;
  baths: string;
  size: string;
  marketRent: string;
}

interface BankAccount {
  useDefaultAccount: boolean;
  defaultAccountName?: string;
}

interface ReserveFund {
  hasReserve: boolean | null;
  amount?: string;
}

interface Ownership {
  type: 'full' | 'multiple' | null;
}

export default function AddPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'type' | 'address' | 'photos' | 'amenities' | 'pet-policy' | 'units' | 'bank' | 'reserve' | 'ownership' | 'summary'>('type');
  const [category, setCategory] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressForm>({
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [petPolicy, setPetPolicy] = useState<PetPolicy>({
    petsAllowed: null,
    allowedPets: [],
    description: ''
  });
  const [units, setUnits] = useState<Unit[]>([{
    unitName: '',
    beds: '',
    baths: '',
    size: '',
    marketRent: ''
  }]);
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    useDefaultAccount: true,
    defaultAccountName: "Noam's bank"
  });
  const [reserveFund, setReserveFund] = useState<ReserveFund>({
    hasReserve: null,
    amount: ''
  });
  const [ownership, setOwnership] = useState<Ownership>({
    type: null
  });

  const maxLength = 1000;
  const {
    value: description,
    characterCount,
    handleChange,
    maxLength: limit,
  } = useCharacterLimit({ maxLength });

  const maxPetDescLength = 1000;
  const {
    value: petDescription,
    characterCount: petDescriptionCount,
    handleChange: handlePetDescriptionChange,
    maxLength: petDescLimit,
  } = useCharacterLimit({ maxLength: maxPetDescLength });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    onDrop: (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        preview: URL.createObjectURL(file),
        customName: file.name,
        size: file.size,
        name: file.name,
        type: file.type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  });

  const removeFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles(files => files.filter(file => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const handleNameChange = (index: number, newName: string) => {
    setUploadedFiles(files => files.map((file, i) => 
      i === index 
        ? { ...file, customName: newName }
        : file
    ));
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [uploadedFiles]);

  const handleNext = () => {
    if (step === 'type' && category && propertyType) {
      setStep('address');
    } else if (step === 'address') {
      setStep('photos');
    } else if (step === 'photos') {
      setStep('amenities');
    } else if (step === 'amenities') {
      setStep('pet-policy');
    } else if (step === 'pet-policy') {
      setStep('units');
    } else if (step === 'units') {
      setStep('bank');
    } else if (step === 'bank') {
      setStep('reserve');
    } else if (step === 'reserve') {
      setStep('ownership');
    } else if (step === 'ownership') {
      setStep('summary');
    }
  };

  const handleBack = () => {
    if (step === 'summary') {
      setStep('ownership');
    } else if (step === 'ownership') {
      setStep('reserve');
    } else if (step === 'reserve') {
      setStep('bank');
    } else if (step === 'bank') {
      setStep('units');
    } else if (step === 'units') {
      setStep('pet-policy');
    } else if (step === 'pet-policy') {
      setStep('amenities');
    } else if (step === 'amenities') {
      setStep('photos');
    } else if (step === 'photos') {
      setStep('address');
    } else if (step === 'address') {
      setStep('type');
    } else if (category) {
      setCategory(null);
      setPropertyType(null);
    }
  };

  const handleBackToProperties = () => {
    router.push('/property'); // or whatever your properties page route is
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(current => 
      current.includes(amenity)
        ? current.filter(a => a !== amenity)
        : [...current, amenity]
    );
  };

  const togglePetType = (type: string) => {
    setPetPolicy(prev => ({
      ...prev,
      allowedPets: prev.allowedPets.includes(type)
        ? prev.allowedPets.filter(t => t !== type)
        : [...prev.allowedPets, type]
    }));
  };

  const handleUnitChange = (index: number, field: keyof Unit, value: string) => {
    setUnits(currentUnits => {
      const newUnits = [...currentUnits];
      
      if (field === 'beds' || field === 'baths') {
        // Convert to number and round to nearest 0.5
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          const roundedValue = Math.round(numValue * 2) / 2;
          newUnits[index] = {
            ...newUnits[index],
            [field]: roundedValue.toString()
          };
        }
      } else if (field === 'size') {
        // Only allow numbers
        const numValue = value.replace(/[^\d]/g, '');
        newUnits[index] = {
          ...newUnits[index],
          [field]: numValue
        };
      } else {
        newUnits[index] = {
          ...newUnits[index],
          [field]: value
        };
      }
      
      return newUnits;
    });
  };

  const addUnit = () => {
    setUnits(currentUnits => [
      ...currentUnits,
      {
        unitName: '',
        beds: '',
        baths: '',
        size: '',
        marketRent: ''
      }
    ]);
  };

  const removeUnit = (index: number) => {
    setUnits(currentUnits => currentUnits.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/property/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          propertyType,
          address,
          description,
          uploadedFiles,
          selectedAmenities,
          petPolicy,
          units,
          bankAccount,
          reserveFund,
          ownership
        })
      });

      if (response.ok) {
        router.push('/property');
      } else {
        const errorData = await response.text();
        console.error('Failed to create property:', errorData);
        // Here you would typically show an error message to the user
        // using your preferred notification system
      }
    } catch (error) {
      console.error('Error creating property:', error);
      // Here you would typically show an error message to the user
      // using your preferred notification system
    }
  };

  return (
    <div className="mx-auto p-6">
      <div className="bg-white rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-semibold">Add your property</h1>
              <div className="text-sm text-gray-600">
                {step === 'type' ? 'Property Type' : 
                 step === 'address' ? 'General Info' : 
                 step === 'photos' ? 'Photos' : 
                 step === 'amenities' ? 'Amenities' : 
                 step === 'pet-policy' ? 'Pet Policy' : 
                 step === 'units' ? 'Units' : 
                 step === 'bank' ? 'Bank Account' : 
                 step === 'reserve' ? 'Reserve Funds' : 
                 step === 'ownership' ? 'Ownership' : 'Summary'}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6">
              <div className={`h-full bg-green-600 rounded-full transition-all duration-300 ${
                step === 'type' ? 'w-[10%]' : 
                step === 'address' ? 'w-[20%]' : 
                step === 'photos' ? 'w-[30%]' : 
                step === 'amenities' ? 'w-[40%]' :
                step === 'pet-policy' ? 'w-[50%]' :
                step === 'units' ? 'w-[60%]' :
                step === 'bank' ? 'w-[70%]' :
                step === 'reserve' ? 'w-[80%]' :
                step === 'ownership' ? 'w-[90%]' : 'w-full'
              }`}></div>
            </div>

            {step === 'type' ? (
              <div className="space-y-12">
                <div className="space-y-8">
                  <p className="text-center text-gray-600">
                    Which kind of property do you manage?
                  </p>
                  
                  <RadioGroup 
                    className="grid grid-cols-2 gap-4 max-w-2xl mx-auto" 
                    value={category || ''}
                    onValueChange={(value) => setCategory(value)}
                  >
                    {/* Residential */}
                    <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                      <RadioGroupItem
                        id="property-residential"
                        value="residential"
                        className="sr-only after:absolute after:inset-0"
                      />
                      <RiHome2Line className="opacity-60" size={32} aria-hidden="true" />
                      <p className="text-sm font-medium leading-none text-foreground">Residential</p>
                    </label>
                    
                    {/* Commercial */}
                    <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                      <RadioGroupItem
                        id="property-commercial"
                        value="commercial"
                        className="sr-only after:absolute after:inset-0"
                      />
                      <RiBuilding2Line className="opacity-60" size={32} aria-hidden="true" />
                      <p className="text-sm font-medium leading-none text-foreground">Commercial</p>
                    </label>
                  </RadioGroup>
                </div>

                <div className={`space-y-8 ${!category ? 'opacity-50 pointer-events-none' : ''}`}>
                  <p className="text-center text-gray-600">
                    Which type best describes your property?
                  </p>
                  
                  <RadioGroup 
                    className="grid grid-cols-4 gap-4 max-w-4xl mx-auto" 
                    value={propertyType || ''}
                    onValueChange={setPropertyType}
                  >
                    {category === 'residential' ? (
                      <>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-house"
                            value="house"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiHome2Line className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">House</p>
                        </label>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-apartment"
                            value="apartment"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiBuilding4Line className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Apartment</p>
                        </label>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-townhouse"
                            value="townhouse"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiHomeSmileLine className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Townhouse</p>
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-office"
                            value="office"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiBuilding2Line className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Office</p>
                        </label>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-retail"
                            value="retail"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiStore2Line className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Retail</p>
                        </label>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-industrial"
                            value="industrial"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiBuilding3Line className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Industrial</p>
                        </label>
                        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                          <RadioGroupItem
                            id="type-storage"
                            value="storage"
                            className="sr-only after:absolute after:inset-0"
                          />
                          <RiArchiveLine className="opacity-60" size={32} aria-hidden="true" />
                          <p className="text-sm font-medium leading-none text-foreground">Storage</p>
                        </label>
                      </>
                    )}
                    <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                      <RadioGroupItem
                        id="type-other"
                        value="other"
                        className="sr-only after:absolute after:inset-0"
                      />
                      <RiQuestionLine className="opacity-60" size={32} aria-hidden="true" />
                      <p className="text-sm font-medium leading-none text-foreground">Other</p>
                    </label>
                  </RadioGroup>
                </div>
              </div>
            ) : step === 'address' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Street 1</label>
                    <input
                      type="text"
                      value={address.street1}
                      onChange={(e) => setAddress({ ...address, street1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Street 2</label>
                    <input
                      type="text"
                      value={address.street2}
                      onChange={(e) => setAddress({ ...address, street2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">State/Province</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter state or province"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Zip/Postal Code</label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter zip code"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <Label htmlFor="property-description">Description</Label>
                  <Textarea
                    id="property-description"
                    value={description}
                    maxLength={maxLength}
                    onChange={handleChange}
                    aria-describedby="characters-left-description"
                    placeholder="Add a description of your property..."
                    className="min-h-[150px]"
                  />
                  <p
                    id="characters-left-description"
                    className="text-right text-xs text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="tabular-nums">{limit - characterCount}</span> characters left
                  </p>
                </div>
              </div>
            ) : step === 'photos' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <p className="text-center text-xl font-semibold">
                    Add photos of your property
                  </p>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'}`}>
                    <input {...getInputProps()} />
                    <RiUploadCloud2Line className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {isDragActive ? 'Drop the files here...' : 'Drag and drop photos here, or click to select files'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Supported formats: JPEG, PNG, WebP
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-6">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-gray-300">
                          <div className="h-16 w-16 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={file.preview}
                              alt={`Upload preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <input
                              type="text"
                              value={file.customName}
                              onChange={(e) => handleNameChange(index, e.target.value)}
                              className="text-xs font-medium text-gray-900 w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                            />
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeFile(file)}
                            className="flex-shrink-0 p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <RiCloseLine className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'amenities' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <p className="text-center text-xl font-semibold">
                    Select amenities included in this property
                  </p>
                  <div className="grid grid-cols-4 gap-4">
                    {/* Basketball Court */}
                    <button
                      onClick={() => toggleAmenity('basketball')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('basketball')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiBasketballLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Basketball Court</p>
                    </button>

                    {/* Business Center */}
                    <button
                      onClick={() => toggleAmenity('business')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('business')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiBuildingLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Business Center</p>
                    </button>

                    {/* Club Discount */}
                    <button
                      onClick={() => toggleAmenity('club')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('club')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiVipCrownLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Club Discount</p>
                    </button>

                    {/* Concierge */}
                    <button
                      onClick={() => toggleAmenity('concierge')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('concierge')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiCustomerService2Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Concierge</p>
                    </button>

                    {/* Fitness Center */}
                    <button
                      onClick={() => toggleAmenity('fitness')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('fitness')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHeartPulseLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Fitness Center</p>
                    </button>

                    {/* Furnished Available */}
                    <button
                      onClick={() => toggleAmenity('furnished')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('furnished')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHomeGearLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Furnished Available</p>
                    </button>

                    {/* Jogging/Walking Trails */}
                    <button
                      onClick={() => toggleAmenity('trails')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('trails')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiWalkLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Jogging/Walking Trails</p>
                    </button>

                    {/* Laundry */}
                    <button
                      onClick={() => toggleAmenity('laundry')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('laundry')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiTShirt2Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Laundry</p>
                    </button>

                    {/* On-Site Maintenance */}
                    <button
                      onClick={() => toggleAmenity('maintenance')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('maintenance')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiSettings5Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">On-Site Maintenance</p>
                    </button>

                    {/* Pet-Rent Required */}
                    <button
                      onClick={() => toggleAmenity('pet-rent')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('pet-rent')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHotelBedLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Pet-Rent Required</p>
                    </button>

                    {/* High Speed */}
                    <button
                      onClick={() => toggleAmenity('high-speed')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('high-speed')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiWifiLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">High Speed</p>
                    </button>

                    {/* Availability 24 Hours */}
                    <button
                      onClick={() => toggleAmenity('24-hours')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('24-hours')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiTimeLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Availability 24 Hours</p>
                    </button>

                    {/* Bilingual */}
                    <button
                      onClick={() => toggleAmenity('bilingual')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('bilingual')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiTranslate2 className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Bilingual</p>
                    </button>

                    {/* Car Wash Area */}
                    <button
                      onClick={() => toggleAmenity('car-wash')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('car-wash')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiCarWashingLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Car Wash Area</p>
                    </button>

                    {/* Club House */}
                    <button
                      onClick={() => toggleAmenity('club-house')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('club-house')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHome8Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Club House</p>
                    </button>

                    {/* Parking */}
                    <button
                      onClick={() => toggleAmenity('parking')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('parking')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiParkingBoxLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Parking</p>
                    </button>

                    {/* Group Exercise */}
                    <button
                      onClick={() => toggleAmenity('group-exercise')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('group-exercise')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiGroupLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Group Exercise</p>
                    </button>

                    {/* Housekeeping */}
                    <button
                      onClick={() => toggleAmenity('housekeeping')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('housekeeping')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHotelLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Housekeeping</p>
                    </button>

                    {/* On-Site Management */}
                    <button
                      onClick={() => toggleAmenity('on-site-management')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('on-site-management')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiCommunityLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">On-Site Management</p>
                    </button>

                    {/* Pool */}
                    <button
                      onClick={() => toggleAmenity('pool')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('pool')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiWaterFlashLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Pool</p>
                    </button>

                    {/* Gaming Stations */}
                    <button
                      onClick={() => toggleAmenity('gaming')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('gaming')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiGamepadLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Gaming Stations</p>
                    </button>

                    {/* Multi-Use Room */}
                    <button
                      onClick={() => toggleAmenity('multi-use-room')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('multi-use-room')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHomeOfficeLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Multi-Use Room</p>
                    </button>

                    {/* Short Term Lease */}
                    <button
                      onClick={() => toggleAmenity('short-term-lease')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('short-term-lease')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHomeSmile2Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Short Term Lease</p>
                    </button>

                    {/* Storage Space */}
                    <button
                      onClick={() => toggleAmenity('storage-space')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('storage-space')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiStore3Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Storage Space</p>
                    </button>

                    {/* Access Wells */}
                    <button
                      onClick={() => toggleAmenity('access-wells')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('access-wells')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <GlassWater className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Access Wells</p>
                    </button>

                    {/* Boat Docks */}
                    <button
                      onClick={() => toggleAmenity('boat-docks')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('boat-docks')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiShipLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Boat Docks</p>
                    </button>

                    {/* Child Care */}
                    <button
                      onClick={() => toggleAmenity('child-care')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('child-care')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Baby className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Child Care</p>
                    </button>

                    {/* Conference Room */}
                    <button
                      onClick={() => toggleAmenity('conference-room')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('conference-room')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiBuilding4Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Conference Room</p>
                    </button>

                    {/* Door Attendant */}
                    <button
                      onClick={() => toggleAmenity('door-attendant')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('door-attendant')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiDoorLockLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Door Attendant</p>
                    </button>

                    {/* Free Weights */}
                    <button
                      onClick={() => toggleAmenity('free-weights')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('free-weights')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Dumbbell className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Free Weights</p>
                    </button>

                    {/* Gate */}
                    <button
                      onClick={() => toggleAmenity('gate')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('gate')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiDoorClosedLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Gate</p>
                    </button>

                    {/* Guest Room */}
                    <button
                      onClick={() => toggleAmenity('guest-room')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('guest-room')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiHotelBedLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Guest Room</p>
                    </button>

                    {/* House Sitting */}
                    <button
                      onClick={() => toggleAmenity('house-sitting')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('house-sitting')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Baby className="opacity-60" size={24} />
                      <p className="text-xs font-medium">House Sitting</p>
                    </button>

                    {/* Lake Access */}
                    <button
                      onClick={() => toggleAmenity('lake-access')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('lake-access')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiWaterFlashLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Lake Access</p>
                    </button>

                    {/* Lake Front */}
                    <button
                      onClick={() => toggleAmenity('lake-front')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('lake-front')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiWaterFlashLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Lake Front</p>
                    </button>

                    {/* Library */}
                    <button
                      onClick={() => toggleAmenity('library')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('library')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiBook2Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Library</p>
                    </button>

                    {/* Meal Service */}
                    <button
                      onClick={() => toggleAmenity('meal-service')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('meal-service')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiRestaurant2Line className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Meal Service</p>
                    </button>

                    {/* Night Patrol */}
                    <button
                      onClick={() => toggleAmenity('night-patrol')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('night-patrol')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiShieldUserLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Night Patrol</p>
                    </button>

                    {/* Package Receiving */}
                    <button
                      onClick={() => toggleAmenity('package-receiving')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('package-receiving')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiInboxArchiveLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Package Receiving</p>
                    </button>

                    {/* Play Ground */}
                    <button
                      onClick={() => toggleAmenity('play-ground')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('play-ground')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiTreeLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Play Ground</p>
                    </button>

                    {/* Recycling */}
                    <button
                      onClick={() => toggleAmenity('recycling')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('recycling')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiRecycleLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Recycling</p>
                    </button>

                    {/* Smoke Free */}
                    <button
                      onClick={() => toggleAmenity('smoke-free')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('smoke-free')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiLeafLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Smoke Free</p>
                    </button>

                    {/* Sundeck */}
                    <button
                      onClick={() => toggleAmenity('sundeck')}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        selectedAmenities.includes('sundeck')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RiSunLine className="opacity-60" size={24} />
                      <p className="text-xs font-medium">Sundeck</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : step === 'pet-policy' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <p className="text-center text-xl font-semibold">
                    Pet Policy
                  </p>

                  {/* Pets Allowed Toggle */}
                  <div className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                      Set your pet policy for this property
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <button
                        onClick={() => setPetPolicy(prev => ({ ...prev, petsAllowed: true }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                          petPolicy.petsAllowed === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CircleCheck className="w-6 h-6" />
                        <span className="text-sm">Pets Allowed</span>
                      </button>
                      <button
                        onClick={() => setPetPolicy(prev => ({ ...prev, petsAllowed: false }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                          petPolicy.petsAllowed === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Ban className="w-6 h-6" />
                        <span className="text-sm">No Pets Allowed</span>
                      </button>
                    </div>
                  </div>

                  {petPolicy.petsAllowed === null && (
                    <p className="text-center text-sm text-red-500">
                    </p>
                  )}

                  {petPolicy.petsAllowed && petPolicy.allowedPets.length === 0 && (
                    <p className="text-center text-sm text-red-500">
                      Please select at least one type of pet that is allowed
                    </p>
                  )}

                  {petPolicy.petsAllowed && (
                    <div className="space-y-8">
                      {/* Allowed Pet Types */}
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-gray-700">Allowed Pet Types</p>
                        <div className="grid grid-cols-5 gap-4">
                          <button
                            onClick={() => togglePetType('dog')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              petPolicy.allowedPets.includes('dog')
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Dog className="w-6 h-6" />
                            <span className="text-sm">Dogs</span>
                          </button>
                          <button
                            onClick={() => togglePetType('cat')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              petPolicy.allowedPets.includes('cat')
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Cat className="w-6 h-6" />
                            <span className="text-sm">Cats</span>
                          </button>
                          <button
                            onClick={() => togglePetType('bird')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              petPolicy.allowedPets.includes('bird')
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Bird className="w-6 h-6" />
                            <span className="text-sm">Birds</span>
                          </button>
                          <button
                            onClick={() => togglePetType('fish')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              petPolicy.allowedPets.includes('fish')
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Fish className="w-6 h-6" />
                            <span className="text-sm">Fish</span>
                          </button>
                          <button
                            onClick={() => togglePetType('other')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                              petPolicy.allowedPets.includes('other')
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Rabbit className="w-6 h-6" />
                            <span className="text-sm">Other</span>
                          </button>
                        </div>
                      </div>

                      {/* Pet Policy Description */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Pet Policy Description</label>
                        <Textarea
                          value={petDescription}
                          maxLength={maxPetDescLength}
                          onChange={handlePetDescriptionChange}
                          placeholder="Describe your pet policy, including any restrictions, fees, or special requirements..."
                          className="min-h-[150px]"
                        />
                        <p
                          className="text-right text-xs text-muted-foreground"
                          role="status"
                          aria-live="polite"
                        >
                          <span className="tabular-nums">{petDescLimit - petDescriptionCount}</span> characters left
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'units' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Let&apos;s add the units for the property</p>
                    <p className="text-sm text-gray-600">Add all your units below.</p>
                  </div>

                  <div className="space-y-6">
                    {units.map((unit, index) => (
                      <div key={index} className="space-y-4">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                          <div className="relative">
                            <Input
                              value={unit.unitName}
                              onChange={(e) => handleUnitChange(index, 'unitName', e.target.value)}
                              placeholder="Unit Name"
                              className="peer ps-9"
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                              <Home size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={unit.beds}
                              onChange={(e) => handleUnitChange(index, 'beds', e.target.value)}
                              placeholder="Beds"
                              className="peer ps-9"
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                              <Bed size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={unit.baths}
                              onChange={(e) => handleUnitChange(index, 'baths', e.target.value)}
                              placeholder="Baths"
                              className="peer ps-9"
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                              <Bath size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              value={unit.size}
                              onChange={(e) => handleUnitChange(index, 'size', e.target.value)}
                              placeholder="Size"
                              className="peer ps-9"
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                              <Ruler size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              value={unit.marketRent}
                              onChange={(e) => handleUnitChange(index, 'marketRent', e.target.value)}
                              placeholder="Market Rent"
                              className="peer ps-9"
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                              <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                          {index > 0 ? (
                            <button
                              onClick={() => removeUnit(index)}
                              className="text-red-500 hover:text-red-700 text-sm px-3 w-20 text-center"
                            >
                              Remove
                            </button>
                          ) : (
                            <div className="w-20" />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={addUnit}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another Unit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'bank' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Property Bank Account</p>
                    <p className="text-sm text-gray-600">Which bank accounts should be used for this property?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={() => setBankAccount(prev => ({ ...prev, useDefaultAccount: true }))}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        bankAccount.useDefaultAccount
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Building className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">Use company default account</p>
                    </button>

                    <button
                      onClick={() => setBankAccount(prev => ({ ...prev, useDefaultAccount: false }))}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        !bankAccount.useDefaultAccount
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">Specify bank account</p>
                    </button>
                  </div>

                  {bankAccount.useDefaultAccount && (
                    <div className="mt-8">
                      <div className="max-w-2xl mx-auto p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">{bankAccount.defaultAccountName}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Default Account
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-center mt-4">
                        Your company&apos;s default bank account can be modified at any time through your{' '}
                        <Link href="/settings" className="text-green-600 hover:text-green-700">
                          Company Settings
                        </Link>
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'reserve' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Reserve Funds</p>
                    <p className="text-sm text-gray-600">Would you like to maintain a minimum balance (&quot;Reserve&quot;) for this property?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={() => setReserveFund(prev => ({ ...prev, hasReserve: true }))}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        reserveFund.hasReserve === true
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CircleDollarSign className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">Set a Reserve fund for this property</p>
                    </button>

                    <button
                      onClick={() => setReserveFund({ hasReserve: false, amount: '' })}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        reserveFund.hasReserve === false
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Ban className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">No Reserve fund for this property</p>
                    </button>
                  </div>

                  {reserveFund.hasReserve === true && (
                    <div className="max-w-md mx-auto space-y-2">
                      <Label htmlFor="reserve-amount">Minimum balance amount</Label>
                      <div className="relative">
                        <Input
                          id="reserve-amount"
                          className="peer pe-12 ps-6"
                          placeholder="0.00"
                          type="text"
                          value={reserveFund.amount}
                          onChange={(e) => setReserveFund(prev => ({ ...prev, amount: e.target.value }))}
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
                          $
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm text-muted-foreground peer-disabled:opacity-50">
                          USD
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'ownership' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Ownership of the Property</p>
                    <p className="text-sm text-gray-600">How is the Ownership of the property divided?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={() => setOwnership({ type: 'full' })}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        ownership.type === 'full'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CircleDollarSign className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">Full Ownership</p>
                    </button>

                    <button
                      onClick={() => setOwnership({ type: 'multiple' })}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                        ownership.type === 'multiple'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Coins className="w-8 h-8 opacity-60" />
                      <p className="text-sm font-medium">Multiple Owners</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : step === 'summary' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  {/* Property Type Summary */}
                  <h2 className="text-2xl font-semibold text-center">Summary</h2>
                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <div className="space-y-4">
                    <p className="text-xl font-semibold">Property Type</p>
                    <p className="text-center text-gray-600">Which kind of property do you manage?</p>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        category === 'residential' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiHome2Line className="opacity-60" size={32} />
                        <p className="text-sm font-medium">Residential</p>
                      </div>
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        category === 'commercial' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiBuilding2Line className="opacity-60" size={32} />
                        <p className="text-sm font-medium">Commercial</p>
                      </div>
                    </div>
                     <p className="text-center text-gray-600">Which type best describes your property?</p>
                    <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        propertyType === 'house' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiHome2Line className="opacity-60" size={32} />
                        <p className="text-sm font-medium">House</p>
                      </div>
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        propertyType === 'apartment' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiBuilding4Line className="opacity-60" size={32} />
                        <p className="text-sm font-medium">Apartment</p>
                      </div>
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        propertyType === 'townhouse' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiHomeSmileLine className="opacity-60" size={32} />
                        <p className="text-sm font-medium">Townhouse</p>
                      </div>
                      <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center ${
                        propertyType === 'other' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <RiQuestionLine className="opacity-60" size={32} />
                        <p className="text-sm font-medium">Other</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Address Details</p>

                  {/* Address Summary */}
                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Street 1</label>
                          <input
                            type="text"
                            value={address.street1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Street 2</label>
                          <input
                            type="text"
                            value={address.street2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            value={address.city}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">State/Province</label>
                          <input
                            type="text"
                            value={address.state}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Zip/Postal Code</label>
                          <input
                            type="text"
                            value={address.zipCode}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Country</label>
                          <input
                            type="text"
                            value={address.country}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled
                          />
                        </div>
                      </div>
                      

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={description}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[150px]"
                          disabled
                        />
                        <p className="text-right text-xs text-gray-500">
                          {limit - description.length} characters left
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Photos</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      
                      {uploadedFiles.length > 0 ? (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative group w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200">
                              <div className="h-16 w-16 relative rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={file.preview}
                                  alt={file.customName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-grow">
                                <p className="text-sm font-medium truncate">{file.customName}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                          <RiImageLine className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500">No photos uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Amenities</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      {selectedAmenities.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                          {selectedAmenities.map((amenity) => (
                            <div
                              key={amenity}
                              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-green-500 bg-green-50"
                            >
                              {amenity === 'basketball' && <RiBasketballLine className="opacity-60" size={24} />}
                              {amenity === 'business' && <RiBuildingLine className="opacity-60" size={24} />}
                              {amenity === 'club' && <RiVipCrownLine className="opacity-60" size={24} />}
                              {amenity === 'concierge' && <RiCustomerService2Line className="opacity-60" size={24} />}
                              {amenity === 'fitness' && <RiHeartPulseLine className="opacity-60" size={24} />}
                              {amenity === 'furnished' && <RiHomeGearLine className="opacity-60" size={24} />}
                              {amenity === 'trails' && <RiWalkLine className="opacity-60" size={24} />}
                              {amenity === 'laundry' && <RiTShirt2Line className="opacity-60" size={24} />}
                              {amenity === 'maintenance' && <RiSettings5Line className="opacity-60" size={24} />}
                              {amenity === 'pet-rent' && <RiHotelBedLine className="opacity-60" size={24} />}
                              {amenity === 'high-speed' && <RiWifiLine className="opacity-60" size={24} />}
                              {amenity === '24-hours' && <RiTimeLine className="opacity-60" size={24} />}
                              {amenity === 'bilingual' && <RiTranslate2 className="opacity-60" size={24} />}
                              {amenity === 'car-wash' && <RiCarWashingLine className="opacity-60" size={24} />}
                              {amenity === 'club-house' && <RiHome8Line className="opacity-60" size={24} />}
                              {amenity === 'parking' && <RiParkingBoxLine className="opacity-60" size={24} />}
                              {amenity === 'group-exercise' && <RiGroupLine className="opacity-60" size={24} />}
                              {amenity === 'housekeeping' && <RiHotelLine className="opacity-60" size={24} />}
                              {amenity === 'on-site-management' && <RiCommunityLine className="opacity-60" size={24} />}
                              {amenity === 'pool' && <RiWaterFlashLine className="opacity-60" size={24} />}
                              {amenity === 'gaming' && <RiGamepadLine className="opacity-60" size={24} />}
                              {amenity === 'multi-use-room' && <RiHomeOfficeLine className="opacity-60" size={24} />}
                              {amenity === 'short-term-lease' && <RiHomeSmile2Line className="opacity-60" size={24} />}
                              {amenity === 'storage-space' && <RiStore3Line className="opacity-60" size={24} />}
                              {amenity === 'access-wells' && <GlassWater className="opacity-60" size={24} />}
                              {amenity === 'boat-docks' && <RiShipLine className="opacity-60" size={24} />}
                              {amenity === 'child-care' && <Baby className="opacity-60" size={24} />}
                              {amenity === 'conference-room' && <RiBuilding4Line className="opacity-60" size={24} />}
                              {amenity === 'door-attendant' && <RiDoorLockLine className="opacity-60" size={24} />}
                              {amenity === 'free-weights' && <Dumbbell className="opacity-60" size={24} />}
                              {amenity === 'gate' && <RiDoorClosedLine className="opacity-60" size={24} />}
                              {amenity === 'guest-room' && <RiHotelBedLine className="opacity-60" size={24} />}
                              {amenity === 'house-sitting' && <Baby className="opacity-60" size={24} />}
                              {amenity === 'lake-access' && <RiWaterFlashLine className="opacity-60" size={24} />}
                              {amenity === 'lake-front' && <RiWaterFlashLine className="opacity-60" size={24} />}
                              {amenity === 'library' && <RiBook2Line className="opacity-60" size={24} />}
                              {amenity === 'meal-service' && <RiRestaurant2Line className="opacity-60" size={24} />}
                              {amenity === 'night-patrol' && <RiShieldUserLine className="opacity-60" size={24} />}
                              {amenity === 'package-receiving' && <RiInboxArchiveLine className="opacity-60" size={24} />}
                              {amenity === 'play-ground' && <RiTreeLine className="opacity-60" size={24} />}
                              {amenity === 'recycling' && <RiRecycleLine className="opacity-60" size={24} />}
                              {amenity === 'smoke-free' && <RiLeafLine className="opacity-60" size={24} />}
                              {amenity === 'sundeck' && <RiSunLine className="opacity-60" size={24} />}
                              <p className="text-xs font-medium capitalize">{amenity.replace(/-/g, ' ')}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">No amenities selected</p>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Pet Policy</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                          petPolicy.petsAllowed === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <CircleCheck className="w-6 h-6" />
                          <span className="text-sm">Pets Allowed</span>
                        </div>
                        <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                          petPolicy.petsAllowed === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}>
                          <Ban className="w-6 h-6" />
                          <span className="text-sm">No Pets Allowed</span>
                        </div>
                      </div>

                      {petPolicy.petsAllowed && (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-700">Allowed Pet Types</p>
                            <div className="grid grid-cols-5 gap-4">
                              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                petPolicy.allowedPets.includes('dog')
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}>
                                <Dog className="w-6 h-6" />
                                <span className="text-sm">Dogs</span>
                              </div>
                              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                petPolicy.allowedPets.includes('cat')
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}>
                                <Cat className="w-6 h-6" />
                                <span className="text-sm">Cats</span>
                              </div>
                              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                petPolicy.allowedPets.includes('bird')
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}>
                                <Bird className="w-6 h-6" />
                                <span className="text-sm">Birds</span>
                              </div>
                              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                petPolicy.allowedPets.includes('fish')
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}>
                                <Fish className="w-6 h-6" />
                                <span className="text-sm">Fish</span>
                              </div>
                              <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                petPolicy.allowedPets.includes('other')
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}>
                                <Rabbit className="w-6 h-6" />
                                <span className="text-sm">Other</span>
                              </div>
                            </div>
                          </div>

                          {petDescription && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Pet Policy Description</p>
                              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                <p className="text-sm text-gray-600">{petDescription}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Units</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      {units.length > 0 ? (
                        <div className="space-y-4">
                          {units.map((unit, index) => (
                            <div key={index} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 items-center p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                  <Home className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-sm font-medium">{unit.unitName || 'Unnamed Unit'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bed className="w-4 h-4" />
                                <span>{unit.beds} {Number(unit.beds) === 1 ? 'Bed' : 'Beds'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bath className="w-4 h-4" />
                                <span>{unit.baths} {Number(unit.baths) === 1 ? 'Bath' : 'Baths'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Ruler className="w-4 h-4" />
                                <span>{unit.size} sqft</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>${unit.marketRent}/month</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                          <Building className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500">No units added</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Bank Account</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          bankAccount.useDefaultAccount
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <Building className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">Use company default account</p>
                        </div>

                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          !bankAccount.useDefaultAccount
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <DollarSign className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">Specify bank account</p>
                        </div>
                      </div>

                      {bankAccount.useDefaultAccount && (
                        <div className="mt-4">
                          <div className="max-w-2xl mx-auto p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Building className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium">{bankAccount.defaultAccountName}</p>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                Default Account
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Reserve Funds</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          reserveFund.hasReserve === true
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <CircleDollarSign className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">Set a Reserve fund for this property</p>
                        </div>

                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          reserveFund.hasReserve === false
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <Ban className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">No Reserve fund for this property</p>
                        </div>
                      </div>

                      {reserveFund.hasReserve && reserveFund.amount && (
                        <div className="mt-4">
                          <div className="max-w-2xl mx-auto p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <CircleDollarSign className="w-6 h-6 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium">Minimum Balance Amount</p>
                                <p className="text-sm text-gray-600">${reserveFund.amount} USD</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="w-[calc(100%+8rem)] -mx-16" />
                  <p className="text-xl font-semibold">Ownership</p>

                  <div className="space-y-8 max-w-4xl mx-auto">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          ownership.type === 'full'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <CircleDollarSign className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">Full Ownership</p>
                        </div>

                        <div className={`relative flex flex-col items-center gap-3 rounded-lg border px-6 py-6 ${
                          ownership.type === 'multiple'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}>
                          <Coins className="w-8 h-8 opacity-60" />
                          <p className="text-sm font-medium">Multiple Owners</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex justify-end gap-4 mt-auto">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md text-center w-32"
            onClick={step === 'type' ? handleBackToProperties : handleBack}
          >
            Back
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-center text-white w-32 ${
              ((step === 'type' && category && propertyType) || 
               step === 'address' || 
               step === 'photos' ||
               step === 'amenities' ||
               (step === 'pet-policy' && (
                 petPolicy.petsAllowed === false || 
                 (petPolicy.petsAllowed === true && petPolicy.allowedPets.length > 0)
               )) ||
               (step === 'units' && units.some(unit => unit.unitName)) ||
               step === 'bank' ||
               (step === 'reserve' && reserveFund.hasReserve !== null) ||
               (step === 'ownership' && ownership.type !== null) ||
               step === 'summary')
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={step === 'summary' ? handleSubmit : handleNext}
            disabled={
              (step === 'type' && (!category || !propertyType)) ||
              (step === 'pet-policy' && (
                petPolicy.petsAllowed === null || 
                (petPolicy.petsAllowed === true && petPolicy.allowedPets.length === 0)
              )) ||
              (step === 'units' && !units.some(unit => unit.unitName)) ||
              (step === 'reserve' && reserveFund.hasReserve === null) ||
              (step === 'ownership' && ownership.type === null)
            }
          >
            {step === 'summary' ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 