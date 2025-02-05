import * as React from "react";
import Link from 'next/link';
import { useState, useEffect, useId } from 'react';
import { 
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface LateFee {
  type: string;
  amount: number;
  frequency: string;
  gracePeriod?: number;
  revenueAccount: string;
  description?: string;
}

const MoneyInput = ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => {
  const id = useId();
  return (
    <div className="relative">
      <Input 
        id={id}
        className="peer ps-9" 
        placeholder={placeholder || "0.00"}
        value={value}
        onChange={onChange}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
        <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
      </div>
    </div>
  );
};

const PercentageInput = ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => {
  const id = useId();
  return (
    <div className="relative">
      <Input 
        id={id}
        className="peer pe-9" 
        placeholder={placeholder || "0.00"}
        value={value}
        onChange={onChange}
      />
      <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
        <span className="text-sm">%</span>
      </div>
    </div>
  );
};

const AddLateFeeDialog = ({ 
  open, 
  onOpenChange,
  onSave
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (fee: LateFee) => void;
}) => {
  const [feeType, setFeeType] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [gracePeriod, setGracePeriod] = useState("");
  const [revenueAccount, setRevenueAccount] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    onSave({
      type: feeType,
      amount: parseFloat(amount),
      frequency,
      gracePeriod: gracePeriod ? parseInt(gracePeriod) : undefined,
      revenueAccount,
      description
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Late Fee</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="feeType" className="text-sm font-medium flex items-center gap-1">
              Fee Type
              <span className="text-red-500">*</span>
            </Label>
            <Select value={feeType} onValueChange={setFeeType}>
              <SelectTrigger id="feeType" className="w-full">
                <SelectValue placeholder="Select Fee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee" className="text-sm font-medium flex items-center gap-1">
              {feeType === "Percentage" ? "Percentage" : "Fee ($)"}
              <span className="text-red-500">*</span>
            </Label>
            {feeType === "Percentage" ? (
              <PercentageInput 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter percentage"
              />
            ) : (
              <MoneyInput 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-sm font-medium flex items-center gap-1">
              Frequency
              <span className="text-red-500">*</span>
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="One Time">One Time</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gracePeriod" className="text-sm font-medium">
              Grace Period (days)
            </Label>
            <Input 
              id="gracePeriod" 
              placeholder="Enter days"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="revenueAccount" className="text-sm font-medium flex items-center gap-1">
              Revenue Account
              <span className="text-red-500">*</span>
            </Label>
            <Select value={revenueAccount} onValueChange={setRevenueAccount}>
              <SelectTrigger id="revenueAccount">
                <SelectValue placeholder="Select Revenue Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Late Fee Income">Late Fee Income</SelectItem>
                <SelectItem value="Other Income">Other Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea 
              id="description" 
              placeholder="Enter a description (optional)" 
              className="resize-none h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={80}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length} / 80
            </div>
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSave}
              disabled={!feeType || !amount || !frequency || !revenueAccount}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface LateFeeContentProps {
  isEnabled: boolean;
  lateFees: LateFee[];
  maxDailyFeesEnabled: boolean;
  maxMonthlyFeesEnabled: boolean;
  minBalanceEnabled: boolean;
  applyToMostRecentEnabled: boolean;
  applyToSpecificEnabled: boolean;
  maxDailyAmount: string;
  maxMonthlyAmount: string;
  minBalanceAmount: string;
  selectedChargeTypes: string;
  onSettingsChange: (settings: Partial<{
    lateFees: LateFee[];
    maxDailyFeesEnabled: boolean;
    maxMonthlyFeesEnabled: boolean;
    minBalanceEnabled: boolean;
    applyToMostRecentEnabled: boolean;
    applyToSpecificEnabled: boolean;
    maxDailyAmount: string;
    maxMonthlyAmount: string;
    minBalanceAmount: string;
    selectedChargeTypes: string;
  }>) => Promise<void>;
}

export const LateFeeContent: React.FC<LateFeeContentProps> = ({
  isEnabled,
  lateFees: initialLateFees,
  maxDailyFeesEnabled: initialMaxDailyFeesEnabled,
  maxMonthlyFeesEnabled: initialMaxMonthlyFeesEnabled,
  minBalanceEnabled: initialMinBalanceEnabled,
  applyToMostRecentEnabled: initialApplyToMostRecentEnabled,
  applyToSpecificEnabled: initialApplyToSpecificEnabled,
  maxDailyAmount: initialMaxDailyAmount,
  maxMonthlyAmount: initialMaxMonthlyAmount,
  minBalanceAmount: initialMinBalanceAmount,
  selectedChargeTypes: initialSelectedChargeTypes,
  onSettingsChange
}) => {
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [lateFees, setLateFees] = useState<LateFee[]>(initialLateFees);
  const [maxDailyFeesEnabled, setMaxDailyFeesEnabled] = useState(initialMaxDailyFeesEnabled);
  const [maxMonthlyFeesEnabled, setMaxMonthlyFeesEnabled] = useState(initialMaxMonthlyFeesEnabled);
  const [minBalanceEnabled, setMinBalanceEnabled] = useState(initialMinBalanceEnabled);
  const [applyToMostRecentEnabled, setApplyToMostRecentEnabled] = useState(initialApplyToMostRecentEnabled);
  const [applyToSpecificEnabled, setApplyToSpecificEnabled] = useState(initialApplyToSpecificEnabled);
  const [maxDailyAmount, setMaxDailyAmount] = useState(initialMaxDailyAmount);
  const [maxMonthlyAmount, setMaxMonthlyAmount] = useState(initialMaxMonthlyAmount);
  const [minBalanceAmount, setMinBalanceAmount] = useState(initialMinBalanceAmount);
  const [simulationAmount, setSimulationAmount] = useState("1000.00");
  const [simulationDays, setSimulationDays] = useState("10");
  const [isEditingSimulation, setIsEditingSimulation] = useState(false);
  const [selectedChargeTypes, setSelectedChargeTypes] = useState(initialSelectedChargeTypes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Update local state when props change
    setLateFees(initialLateFees);
    setMaxDailyFeesEnabled(initialMaxDailyFeesEnabled);
    setMaxMonthlyFeesEnabled(initialMaxMonthlyFeesEnabled);
    setMinBalanceEnabled(initialMinBalanceEnabled);
    setApplyToMostRecentEnabled(initialApplyToMostRecentEnabled);
    setApplyToSpecificEnabled(initialApplyToSpecificEnabled);
    setMaxDailyAmount(initialMaxDailyAmount);
    setMaxMonthlyAmount(initialMaxMonthlyAmount);
    setMinBalanceAmount(initialMinBalanceAmount);
    setSelectedChargeTypes(initialSelectedChargeTypes);
  }, [
    initialLateFees,
    initialMaxDailyFeesEnabled,
    initialMaxMonthlyFeesEnabled,
    initialMinBalanceEnabled,
    initialApplyToMostRecentEnabled,
    initialApplyToSpecificEnabled,
    initialMaxDailyAmount,
    initialMaxMonthlyAmount,
    initialMinBalanceAmount,
    initialSelectedChargeTypes
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSettingsChange({
        lateFees,
        maxDailyFeesEnabled,
        maxMonthlyFeesEnabled,
        minBalanceEnabled,
        applyToMostRecentEnabled,
        applyToSpecificEnabled,
        maxDailyAmount,
        maxMonthlyAmount,
        minBalanceAmount,
        selectedChargeTypes
      });
    } catch (error) {
      console.error('Error saving late fee settings:', error);
      toast.error('Failed to save late fee settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFee = (newFee: LateFee) => {
    setLateFees([...lateFees, newFee]);
  };

  const handleDeleteFee = (index: number) => {
    setLateFees(lateFees.filter((_, i) => i !== index));
  };

  const calculateLateFees = () => {
    if (!isEnabled || !lateFees || lateFees.length === 0) return 0;

    const amount = parseFloat(simulationAmount || "0");
    const days = parseInt(simulationDays || "0");
    
    if (isNaN(amount) || isNaN(days)) return 0;
    
    // Check minimum balance requirement
    if (minBalanceEnabled && minBalanceAmount && parseFloat(minBalanceAmount) > amount) {
      return 0;
    }

    let totalFees = 0;

    lateFees.forEach(fee => {
      if (!fee) return;
      
      let feesForThisFee = 0;

      if (fee.type === "Fixed") {
        switch (fee.frequency) {
          case "One Time":
            feesForThisFee = fee.amount || 0;
            break;
          case "Daily":
            feesForThisFee = (fee.amount || 0) * days;
            break;
          case "Weekly":
            feesForThisFee = (fee.amount || 0) * Math.floor(days / 7);
            break;
          case "Monthly":
            feesForThisFee = (fee.amount || 0) * Math.floor(days / 30);
            break;
        }
      } else if (fee.type === "Percentage") {
        const percentageAmount = ((fee.amount || 0) / 100) * amount;
        switch (fee.frequency) {
          case "One Time":
            feesForThisFee = percentageAmount;
            break;
          case "Daily":
            feesForThisFee = percentageAmount * days;
            break;
          case "Weekly":
            feesForThisFee = percentageAmount * Math.floor(days / 7);
            break;
          case "Monthly":
            feesForThisFee = percentageAmount * Math.floor(days / 30);
            break;
        }
      }

      // Apply grace period if set
      if (fee.gracePeriod && days <= fee.gracePeriod) {
        feesForThisFee = 0;
      }

      totalFees += feesForThisFee;
    });

    // Apply maximum daily fees limit
    if (maxDailyFeesEnabled && maxDailyAmount) {
      const maxDaily = parseFloat(maxDailyAmount);
      if (!isNaN(maxDaily)) {
        totalFees = Math.min(totalFees, maxDaily * days);
      }
    }

    // Apply maximum monthly fees limit
    if (maxMonthlyFeesEnabled && maxMonthlyAmount) {
      const maxMonthly = parseFloat(maxMonthlyAmount);
      if (!isNaN(maxMonthly)) {
        totalFees = Math.min(totalFees, maxMonthly * Math.ceil(days / 30));
      }
    }

    return totalFees;
  };

  const totalLateFees = calculateLateFees();
  const totalDue = parseFloat(simulationAmount) + totalLateFees;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Set Up Your Late Fee Structure</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up late fee schedules to automate charges for tenants who pay late.
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsAddingFee(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Late Fee
              </Button>
            </div>

            {lateFees.length > 0 && (
              <div className="space-y-4">
                {lateFees.map((fee, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{fee.type} Fee</h4>
                          <span className="text-sm text-muted-foreground">
                            {fee.type === "Percentage" ? `${fee.amount}%` : `$${fee.amount}`} • {fee.frequency}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fee.gracePeriod} days grace period • {fee.revenueAccount}
                        </p>
                        {fee.description && (
                          <p className="text-sm text-muted-foreground">{fee.description}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteFee(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Fee Limitations & Restrictions</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Set restrictions on how late fees are applied to avoid over or undercharging tenants.{" "}
              <Link href="#" className="text-green-600 hover:underline">Learn more</Link>.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Maximum Daily Fees</h4>
                    <p className="text-sm text-muted-foreground">
                      Late fees charged will never exceed the entered amount per day.
                    </p>
                  </div>
                  <Switch 
                    checked={maxDailyFeesEnabled}
                    onCheckedChange={setMaxDailyFeesEnabled}
                  />
                </div>
                {maxDailyFeesEnabled && (
                  <div className="w-[200px]">
                    <MoneyInput
                      value={maxDailyAmount}
                      onChange={(e) => setMaxDailyAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Maximum Monthly Fees</h4>
                    <p className="text-sm text-muted-foreground">
                      Late fees charged will never exceed the entered amount per month.
                    </p>
                  </div>
                  <Switch 
                    checked={maxMonthlyFeesEnabled}
                    onCheckedChange={setMaxMonthlyFeesEnabled}
                  />
                </div>
                {maxMonthlyFeesEnabled && (
                  <div className="w-[200px]">
                    <MoneyInput
                      value={maxMonthlyAmount}
                      onChange={(e) => setMaxMonthlyAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Minimum Balance to Apply Fees</h4>
                    <p className="text-sm text-muted-foreground">
                      Late fees will only be charged if the tenant&apos;s balance exceeds the entered amount.
                    </p>
                  </div>
                  <Switch 
                    checked={minBalanceEnabled}
                    onCheckedChange={setMinBalanceEnabled}
                  />
                </div>
                {minBalanceEnabled && (
                  <div className="w-[200px]">
                    <MoneyInput
                      value={minBalanceAmount}
                      onChange={(e) => setMinBalanceAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Only Apply to Most Recent Charge</h4>
                  <p className="text-sm text-muted-foreground">
                    Late fees will only be applied to the most recent overdue charge.
                  </p>
                </div>
                <Switch 
                  checked={applyToMostRecentEnabled}
                  onCheckedChange={setApplyToMostRecentEnabled}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Apply Only on Specific Outstanding Charges</h4>
                    <p className="text-sm text-muted-foreground">
                      Specify which accounts to consider when charging late fees.
                    </p>
                  </div>
                  <Switch 
                    checked={applyToSpecificEnabled}
                    onCheckedChange={setApplyToSpecificEnabled}
                  />
                </div>
                {applyToSpecificEnabled && (
                  <div className="w-full">
                    <Select
                      value={selectedChargeTypes}
                      onValueChange={setSelectedChargeTypes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select charge types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other Charges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Simulation</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingSimulation(!isEditingSimulation)}
              >
                {isEditingSimulation ? "Done" : "Edit Inputs"}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Use this tool to test your fee structure with sample data.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Amount Due</span>
                {isEditingSimulation ? (
                  <MoneyInput
                    value={simulationAmount}
                    onChange={(e) => setSimulationAmount(e.target.value)}
                  />
                ) : (
                  <span>${parseFloat(simulationAmount).toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Days Late</span>
                {isEditingSimulation ? (
                  <Input
                    className="w-24 text-right"
                    value={simulationDays}
                    onChange={(e) => setSimulationDays(e.target.value)}
                  />
                ) : (
                  <span>{simulationDays}</span>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Late Fees</span>
                  <span>${totalLateFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Total Due</span>
                  <span>${totalDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AddLateFeeDialog 
        open={isAddingFee} 
        onOpenChange={setIsAddingFee}
        onSave={handleAddFee}
      />

      <div className="mt-8 flex justify-end">
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <Separator className="mt-6" />
    </div>
  );
}; 