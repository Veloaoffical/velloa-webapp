import * as React from "react";
import { useState, useEffect, useId, useCallback } from 'react';
import { 
  Plus,
  Trash2,
  DollarSign,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ExpenseCategory {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype: string;
  }[];
}

interface ManagementFee {
  type: string;
  amount: number;
  frequency?: string;
  expenseCategory?: string;
  revenueAccount?: string;
  description?: string;
}

interface MinimumFee {
  enabled: boolean;
  amount: number;
  expenseCategory?: string;
}

interface PayoutCategory {
  id: string;
  account_name: string;
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

const AddManagementFeeDialog = ({ 
  open, 
  onOpenChange,
  onSave,
  initialFee
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (fee: ManagementFee) => void;
  initialFee?: ManagementFee;
}) => {
  const [feeType, setFeeType] = useState(initialFee?.type || "");
  const [amount, setAmount] = useState(initialFee?.amount?.toString() || "");
  const [expenseCategory, setExpenseCategory] = useState(initialFee?.expenseCategory || "");
  const [revenueAccount, setRevenueAccount] = useState(initialFee?.revenueAccount || "");
  const [revenueCategories, setRevenueCategories] = useState<ExpenseCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch('/api/accounting/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch expense categories');
        }
        const data = await response.json();
        const filteredExpenseCategories = data.filter((category: ExpenseCategory) => category.account_type === "Expense");
        const filteredRevenueCategories = data.filter((category: ExpenseCategory) => category.account_type === "Revenue");
        console.log('Expense categories loaded:', filteredExpenseCategories);
        console.log('Revenue categories loaded:', filteredRevenueCategories);
        setExpenseCategories(filteredExpenseCategories);
        setRevenueCategories(filteredRevenueCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      fetchExpenseCategories();
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      type: feeType,
      amount: parseFloat(amount),
      expenseCategory,
      revenueAccount: feeType !== "Flat" ? revenueAccount : undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Management Fee</DialogTitle>
        </DialogHeader>
        
        {/* Top grid with 70/30 split */}
        <div className="grid grid-cols-10 gap-4 mb-4">
          <div className="col-span-7 space-y-2">
            <Label htmlFor="feeType" className="text-sm font-medium flex items-center gap-1">
              Fee Type
              <span className="text-red-500">*</span>
            </Label>
            <Select value={feeType} onValueChange={setFeeType}>
              <SelectTrigger id="feeType" className="w-full">
                <SelectValue placeholder="Select Fee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Percentage of payments collected (Cash Basis)</SelectItem>
                <SelectItem value="Accrual">Percentage of charges posted (Accrual Basis)</SelectItem>
                <SelectItem value="Flat">Flat Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-3 space-y-2">
            <Label htmlFor="fee" className="text-sm font-medium flex items-center gap-1">
              Fee Amount
              <span className="text-red-500">*</span>
            </Label>
            {feeType === "Flat" ? (
              <MoneyInput 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Fee Amount"
              />
            ) : (
              <PercentageInput 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Fee Amount"
              />
            )}
          </div>
        </div>
        
        {/* Bottom grid remains the same 50/50 split */}
        <div className="grid grid-cols-2 gap-4">
          {feeType !== "Flat" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="revenueAccount" className="text-sm font-medium">
                  Revenue Category
                </Label>
                <Select value={revenueAccount} onValueChange={setRevenueAccount} disabled={isLoadingCategories}>
                  <SelectTrigger id="revenueAccount">
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Revenue Category"}>
                      {revenueAccount && revenueCategories.reduce((name, category) => {
                        if (category.id === revenueAccount) {
                          return category.account_name;
                        }
                        if (category.sub_accounts) {
                          const subAccount = category.sub_accounts.find(sub => sub.id === revenueAccount);
                          if (subAccount) {
                            return `${category.account_name}: ${subAccount.account_name}`;
                          }
                        }
                        return name;
                      }, "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(
                      revenueCategories
                        .reduce((acc, category) => {
                          if (!acc[category.account_type]) {
                            acc[category.account_type] = [];
                          }
                          acc[category.account_type].push(category);
                          return acc;
                        }, {} as Record<string, ExpenseCategory[]>)
                    ).map(([type, cats]) => (
                      <SelectGroup key={type}>
                        <SelectLabel>{type}</SelectLabel>
                        <Separator className="my-1" />
                        {cats.map((category) => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.id}>
                              <div className="flex flex-col">
                                <span>{category.account_name}</span>
                                <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                              </div>
                            </SelectItem>
                            {category.sub_accounts && category.sub_accounts.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="pl-4 text-xs">
                                  {category.account_name} Sub-accounts
                                </SelectLabel>
                                {category.sub_accounts.map((subAccount) => (
                                  <SelectItem 
                                    key={subAccount.id} 
                                    value={subAccount.id}
                                    className="pl-6"
                                  >
                                    <div className="flex flex-col">
                                      <span>{subAccount.account_name}</span>
                                      <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </React.Fragment>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenseCategory" className="text-sm font-medium">
                  Expense Category
                </Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory} disabled={isLoadingCategories}>
                  <SelectTrigger id="expenseCategory">
                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"}>
                      {expenseCategory && expenseCategories.reduce((name, category) => {
                        if (category.id === expenseCategory) {
                          return category.account_name;
                        }
                        if (category.sub_accounts) {
                          const subAccount = category.sub_accounts.find(sub => sub.id === expenseCategory);
                          if (subAccount) {
                            return `${category.account_name}: ${subAccount.account_name}`;
                          }
                        }
                        return name;
                      }, "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(
                      expenseCategories
                        .reduce((acc, category) => {
                          if (!acc[category.account_type]) {
                            acc[category.account_type] = [];
                          }
                          acc[category.account_type].push(category);
                          return acc;
                        }, {} as Record<string, ExpenseCategory[]>)
                    ).map(([type, cats]) => (
                      <SelectGroup key={type}>
                        <SelectLabel>{type}</SelectLabel>
                        <Separator className="my-1" />
                        {cats.map((category) => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.id}>
                              <div className="flex flex-col">
                                <span>{category.account_name}</span>
                                <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                              </div>
                            </SelectItem>
                            {category.sub_accounts && category.sub_accounts.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="pl-4 text-xs">
                                  {category.account_name} Sub-accounts
                                </SelectLabel>
                                {category.sub_accounts.map((subAccount) => (
                                  <SelectItem 
                                    key={subAccount.id} 
                                    value={subAccount.id}
                                    className="pl-6"
                                  >
                                    <div className="flex flex-col">
                                      <span>{subAccount.account_name}</span>
                                      <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </React.Fragment>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="col-span-2 space-y-2">
              <Label htmlFor="expenseCategory" className="text-sm font-medium">
                Expense Category
              </Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory} disabled={isLoadingCategories}>
                <SelectTrigger id="expenseCategory">
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select Category"}>
                    {expenseCategory && expenseCategories.reduce((name, category) => {
                      if (category.id === expenseCategory) {
                        return category.account_name;
                      }
                      if (category.sub_accounts) {
                        const subAccount = category.sub_accounts.find(sub => sub.id === expenseCategory);
                        if (subAccount) {
                          return `${category.account_name}: ${subAccount.account_name}`;
                        }
                      }
                      return name;
                    }, "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(
                    expenseCategories
                      .reduce((acc, category) => {
                        if (!acc[category.account_type]) {
                          acc[category.account_type] = [];
                        }
                        acc[category.account_type].push(category);
                        return acc;
                      }, {} as Record<string, ExpenseCategory[]>)
                  ).map(([type, cats]) => (
                    <SelectGroup key={type}>
                      <SelectLabel>{type}</SelectLabel>
                      <Separator className="my-1" />
                      {cats.map((category) => (
                        <React.Fragment key={category.id}>
                          <SelectItem value={category.id}>
                            <div className="flex flex-col">
                              <span>{category.account_name}</span>
                              <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                            </div>
                          </SelectItem>
                          {category.sub_accounts && category.sub_accounts.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="pl-4 text-xs">
                                {category.account_name} Sub-accounts
                              </SelectLabel>
                              {category.sub_accounts.map((subAccount) => (
                                <SelectItem 
                                  key={subAccount.id} 
                                  value={subAccount.id}
                                  className="pl-6"
                                >
                                  <div className="flex flex-col">
                                    <span>{subAccount.account_name}</span>
                                    <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </React.Fragment>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={!feeType || !amount || !expenseCategory}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddPayoutCategoryDialog = ({ 
  open, 
  onOpenChange,
  onSave,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (category: PayoutCategory) => void;
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [revenueCategories, setRevenueCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch('/api/accounting/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setRevenueCategories(data.filter((category: ExpenseCategory) => category.account_type === "Revenue"));
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleSave = () => {
    if (!selectedAccount) return;
    
    const account = revenueCategories.find((acc) => acc.id === selectedAccount);
    if (!account) return;
    
    onSave({
      id: selectedAccount,
      account_name: account.account_name
    });
    onOpenChange(false);
    setSelectedAccount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Payout Category</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revenueAccount" className="text-sm font-medium flex items-center gap-1">
              Revenue Account
              <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={isLoadingCategories}>
              <SelectTrigger id="revenueAccount">
                <SelectValue placeholder={isLoadingCategories ? "Loading accounts..." : "Select Revenue Account"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(
                  revenueCategories
                    .reduce((acc, category) => {
                      if (!acc[category.account_subtype]) {
                        acc[category.account_subtype] = [];
                      }
                      acc[category.account_subtype].push(category);
                      return acc;
                    }, {} as Record<string, ExpenseCategory[]>)
                ).map(([subtype, cats]) => (
                  <SelectGroup key={subtype}>
                    <SelectLabel>{subtype}</SelectLabel>
                    <Separator className="my-1" />
                    {cats.map((category) => (
                      <React.Fragment key={category.id}>
                        <SelectItem value={category.id}>
                          <div className="flex flex-col">
                            <span>{category.account_name}</span>
                            <span className="text-xs text-muted-foreground">{category.account_type}</span>
                          </div>
                        </SelectItem>
                        {category.sub_accounts && category.sub_accounts.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="pl-4 text-xs">
                              {category.account_name} Sub-accounts
                            </SelectLabel>
                            {category.sub_accounts.map((subAccount) => (
                              <SelectItem 
                                key={subAccount.id} 
                                value={subAccount.id}
                                className="pl-6"
                              >
                                <div className="flex flex-col">
                                  <span>{subAccount.account_name}</span>
                                  <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </React.Fragment>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!selectedAccount}
          >
            Add Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ManagementFeeContentProps {
  isEnabled: boolean;
  managementFees: ManagementFee[];
  minimumFee?: MinimumFee;
  payoutCategories?: PayoutCategory[];
  onSettingsChange: (settings: Partial<{
    managementFees: ManagementFee[];
    minimumFee?: MinimumFee;
    payoutCategories?: PayoutCategory[];
  }>) => Promise<void>;
}

// Helper function for deep comparison of arrays
const areArraysEqual = (arr1: unknown[], arr2: unknown[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  
  return arr1.every((item, index) => {
    if (typeof item === 'object' && item !== null && typeof arr2[index] === 'object' && arr2[index] !== null) {
      return JSON.stringify(item) === JSON.stringify(arr2[index]);
    }
    return item === arr2[index];
  });
};

export const ManagementFeeContent = ({
  isEnabled,
  managementFees: initialManagementFees,
  minimumFee: initialMinimumFee = { enabled: false, amount: 0 },
  payoutCategories: initialPayoutCategories = [],
  onSettingsChange
}: ManagementFeeContentProps): React.ReactElement => {
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [editingFeeIndex, setEditingFeeIndex] = useState<number | null>(null);
  const [managementFees, setManagementFees] = useState<ManagementFee[]>(initialManagementFees);
  const [minimumFee, setMinimumFee] = useState<MinimumFee>(initialMinimumFee);
  const [payoutCategories, setPayoutCategories] = useState<PayoutCategory[]>(initialPayoutCategories);
  const [isSaving, setIsSaving] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState("1000.00");
  const [isEditingSimulation, setIsEditingSimulation] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<ExpenseCategory[]>([]);
  const [isAddingPayoutCategory, setIsAddingPayoutCategory] = useState(false);

  // Store previous props in a ref to compare
  const prevPropsRef = React.useRef({
    initialManagementFees,
    initialMinimumFee,
    initialPayoutCategories
  });

  // Use a ref to track if this is the first render
  const isFirstRender = React.useRef(true);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/accounting/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        // Filter and set categories
        setExpenseCategories(data.filter((category: ExpenseCategory) => category.account_type === "Expense"));
        setRevenueCategories(data.filter((category: ExpenseCategory) => category.account_type === "Revenue"));
        // We'll use all revenue categories instead of just income accounts
        setRevenueCategories(data.filter((category: ExpenseCategory) => category.account_type === "Revenue"));
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []); // Run once when component mounts

  useEffect(() => {
    // Only run this effect on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Initialize state from props on first render
      setManagementFees(initialManagementFees);
      setMinimumFee(initialMinimumFee);
      setPayoutCategories(initialPayoutCategories);
      
      // Update the ref with initial props
      prevPropsRef.current = {
        initialManagementFees,
        initialMinimumFee,
        initialPayoutCategories
      };
      
      return;
    }
    
    // For subsequent renders, only update state if props have changed
    const prevProps = prevPropsRef.current;
    
    // Use deep comparison for objects
    const feesChanged = !areArraysEqual(initialManagementFees, prevProps.initialManagementFees);
    if (feesChanged) {
      setManagementFees(initialManagementFees);
    }
    
    // Deep comparison for minimum fee
    const minFeeChanged = 
      initialMinimumFee?.enabled !== prevProps.initialMinimumFee?.enabled ||
      initialMinimumFee?.amount !== prevProps.initialMinimumFee?.amount ||
      initialMinimumFee?.expenseCategory !== prevProps.initialMinimumFee?.expenseCategory;
    
    if (minFeeChanged) {
      setMinimumFee(initialMinimumFee);
    }
    
    // Deep comparison for payout categories
    const payoutCategoriesChanged = !areArraysEqual(initialPayoutCategories, prevProps.initialPayoutCategories);
    if (payoutCategoriesChanged) {
      setPayoutCategories(initialPayoutCategories);
    }
    
    // Update the ref with current props
    prevPropsRef.current = {
      initialManagementFees,
      initialMinimumFee,
      initialPayoutCategories
    };
  }, [initialManagementFees, initialMinimumFee, initialPayoutCategories]);

  const handleMinimumFeeToggle = useCallback((checked: boolean) => {
    setMinimumFee((prev) => ({ ...prev, enabled: checked }));
  }, []);

  const handleMinimumFeeAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    setMinimumFee((prev) => ({ ...prev, amount: newAmount }));
  }, []);

  const handleMinimumFeeCategoryChange = useCallback((value: string) => {
    setMinimumFee((prev) => ({ ...prev, expenseCategory: value }));
  }, []);

  const handleAddPayoutCategory = (newCategory: PayoutCategory) => {
    if (payoutCategories.some((cat) => cat.id === newCategory.id)) {
      toast.error("This account is already added");
      return;
    }
    setPayoutCategories((prev) => [...prev, newCategory]);
  };

  const handleRemovePayoutCategory = useCallback((id: string) => {
    setPayoutCategories((prev) => prev.filter((cat) => cat.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const settings: Partial<{
        managementFees: ManagementFee[];
        minimumFee?: MinimumFee;
        payoutCategories?: PayoutCategory[];
      }> = {
        managementFees,
        minimumFee,
        payoutCategories
      };
      
      await onSettingsChange(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving management fee settings:', error);
      toast.error('Failed to save management fee settings');
    } finally {
      setIsSaving(false);
    }
  }, [managementFees, minimumFee, payoutCategories, onSettingsChange]);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'None';
    
    // Look for the category in the expense categories
    const category = expenseCategories.find(cat => cat.id === categoryId);
    if (category) {
      return category.account_name;
    }

    // Look in sub-accounts if not found in main categories
    for (const mainCategory of expenseCategories) {
      if (mainCategory.sub_accounts) {
        const subAccount = mainCategory.sub_accounts.find(sub => sub.id === categoryId);
        if (subAccount) {
          return `${mainCategory.account_name}: ${subAccount.account_name}`;
        }
      }
    }
    
    return 'Unknown Category';
  };

  const getRevenueCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'None';
    
    // Look for the category in the revenue categories
    const category = revenueCategories.find(cat => cat.id === categoryId);
    if (category) {
      return category.account_name;
    }

    // Look in sub-accounts if not found in main categories
    for (const mainCategory of revenueCategories) {
      if (mainCategory.sub_accounts) {
        const subAccount = mainCategory.sub_accounts.find(sub => sub.id === categoryId);
        if (subAccount) {
          return `${mainCategory.account_name}: ${subAccount.account_name}`;
        }
      }
    }
    
    return 'Unknown Category';
  };

  const handleAddFee = (newFee: ManagementFee): void => {
    setManagementFees([...managementFees, newFee]);
  };

  const handleEditFee = (index: number): void => {
    setEditingFeeIndex(index);
    setIsEditingFee(true);
  };

  const handleUpdateFee = (updatedFee: ManagementFee): void => {
    if (editingFeeIndex !== null) {
      const updatedFees = [...managementFees];
      updatedFees[editingFeeIndex] = updatedFee;
      setManagementFees(updatedFees);
      setEditingFeeIndex(null);
    }
  };

  const handleDeleteFee = (index: number): void => {
    setManagementFees(managementFees.filter((_, i) => i !== index));
  };

  const calculateFeeAmount = (fee: ManagementFee, baseAmount: number): number => {
    if (fee.type === "Flat") return fee.amount;
    
    let feeAmount = (fee.amount / 100) * baseAmount;
    
    // Adjust for frequency if needed
    switch (fee.frequency) {
      case "Quarterly":
        feeAmount = feeAmount / 3; // Show monthly equivalent
        break;
      case "Annually":
        feeAmount = feeAmount / 12; // Show monthly equivalent
        break;
      default: // Monthly or undefined
        break;
    }
    
    return feeAmount;
  };

  const calculateManagementFees = (): number => {
    if (!isEnabled || !managementFees || managementFees.length === 0) return 0;

    const amount = parseFloat(simulationAmount || "0");
    if (isNaN(amount)) return 0;

    let totalFees = 0;

    managementFees.forEach(fee => {
      if (!fee) return;
      
      let feeAmount = 0;

      if (fee.type === "Flat") {
        feeAmount = fee.amount || 0;
      } else if (fee.type === "Cash" || fee.type === "Accrual") {
        feeAmount = ((fee.amount || 0) / 100) * amount;
      }

      // Adjust for frequency if needed
      switch (fee.frequency) {
        case "Monthly":
          // Monthly fee is already correct
          break;
        case "Quarterly":
          feeAmount = feeAmount / 3; // Show monthly equivalent
          break;
        case "Annually":
          feeAmount = feeAmount / 12; // Show monthly equivalent
          break;
      }

      totalFees += feeAmount;
    });

    // Apply minimum fee if enabled and calculated fees are less than minimum
    if (minimumFee.enabled && totalFees < minimumFee.amount) {
      return minimumFee.amount;
    }

    return totalFees;
  };

  const totalManagementFees = calculateManagementFees();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Set Up Your Management Fee Structure</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure management fees to automatically calculate and charge based on your fee structure.
                  </p>
                </div>

                <div>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsAddingFee(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Management Fee
                  </Button>
                </div>

                {managementFees.length > 0 && (
                  <div className="space-y-4">
                    {managementFees.map((fee, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-6 w-6 min-w-6 rounded-full text-green-700 text-sm font-medium bg-primary/10">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {fee.type === "Flat" ? (
                                  `$${fee.amount.toFixed(2)} (Flat Fee) to ${getCategoryName(fee.expenseCategory)}`
                                ) : (
                                  `${fee.amount}% (${fee.type === "Cash" ? "Cash Basis" : "Accrual Basis"}) from ${getRevenueCategoryName(fee.revenueAccount)} to ${getCategoryName(fee.expenseCategory)}`
                                )}
                              </h4>
                            
                              {fee.type === "Flat" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Fixed monthly fee: ${calculateFeeAmount(fee, 0).toFixed(2)}
                                  {fee.frequency && fee.frequency !== "Monthly" && (
                                    <span className="ml-1">
                                      (shown as monthly equivalent, {fee.frequency.toLowerCase()} fee: ${fee.amount.toFixed(2)})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditFee(index)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFee(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            
            {/* Minimum Fee Section */}
            <Card className="p-6 mt-8">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Set a Minimum Fee</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a minimum fee to ensure a minimum payment is received, regardless of the fees calculated above.
                    </p>
                  </div>
                  <Switch
                    checked={minimumFee.enabled}
                    onCheckedChange={handleMinimumFeeToggle}
                    id="minimum-fee-toggle"
                  />
                </div>
                
                {minimumFee.enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="minimumFeeAmount" className="text-sm font-medium flex items-center gap-1">
                        Minimum Fee <span className="text-red-500">*</span>
                      </Label>
                      <MoneyInput 
                        value={minimumFee.amount.toString()}
                        onChange={handleMinimumFeeAmountChange}
                        placeholder="500.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minimumFeeCategory" className="text-sm font-medium">
                        Expense Category <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={minimumFee.expenseCategory} 
                        onValueChange={handleMinimumFeeCategoryChange}
                      >
                        <SelectTrigger id="minimumFeeCategory">
                          <SelectValue placeholder="Management Fees">
                            {minimumFee.expenseCategory ? getCategoryName(minimumFee.expenseCategory) : "Management Fees"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {Object.entries(
                            expenseCategories
                              .reduce((acc, category) => {
                                if (!acc[category.account_type]) {
                                  acc[category.account_type] = [];
                                }
                                acc[category.account_type].push(category);
                                return acc;
                              }, {} as Record<string, ExpenseCategory[]>)
                          ).map(([type, cats]) => (
                            <SelectGroup key={type}>
                              <SelectLabel>{type}</SelectLabel>
                              <Separator className="my-1" />
                              {cats.map((category) => (
                                <React.Fragment key={category.id}>
                                  <SelectItem value={category.id}>
                                    <div className="flex flex-col">
                                      <span>{category.account_name}</span>
                                      <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                                    </div>
                                  </SelectItem>
                                  {category.sub_accounts && category.sub_accounts.length > 0 && (
                                    <SelectGroup>
                                      <SelectLabel className="pl-4 text-xs">
                                        {category.account_name} Sub-accounts
                                      </SelectLabel>
                                      {category.sub_accounts.map((subAccount) => (
                                        <SelectItem 
                                          key={subAccount.id} 
                                          value={subAccount.id}
                                          className="pl-6"
                                        >
                                          <div className="flex flex-col">
                                            <span>{subAccount.account_name}</span>
                                            <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  )}
                                </React.Fragment>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Set Up Payout Categories</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payout Categories designate which payouts are retained entirely by your business. Once paid, these
                    amounts are excluded from the period&apos;s Profit & Loss and Cash Flow Statement.
                  </p>
                </div>

                <div>
                  <Button 
                    onClick={() => setIsAddingPayoutCategory(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payout Category
                  </Button>
                </div>

                {payoutCategories.length > 0 && (
                  <div className="space-y-4">
                    {payoutCategories.map((category) => (
                      <Card key={category.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-6 w-6 min-w-6 rounded-full text-green-700 text-sm font-medium bg-primary/10">
                              <DollarSign className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium">{category.account_name}</h4>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePayoutCategory(category.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="col-span-1">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Simulation</h3>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingSimulation(!isEditingSimulation)}
              >
                Edit inputs
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Preview your fee structure according to your setup. Click &quot;Edit Inputs&quot; to change the sample values.
            </p>

            <div className="space-y-4">
              {/* Management Fees Section */}
              {managementFees.map((fee, index) => (
                <div key={index} className="grid grid-cols-[auto,1.5fr,auto,auto,auto,auto] gap-3 items-center">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary text-secondary-foreground text-sm">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    {isEditingSimulation ? (
                      <div className="w-full">
                        <MoneyInput
                          value={simulationAmount}
                          onChange={(e) => setSimulationAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-foreground bg-secondary p-2 rounded-md">
                        {simulationAmount}
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center">×</div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                    {fee.type === "Flat" 
                      ? "Flat Fee" 
                      : `${fee.amount.toFixed(3)}%`
                    }
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center">=</div>
                  <div className="text-sm text-foreground text-right flex items-center">
                    ${calculateFeeAmount(fee, parseFloat(simulationAmount)).toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${totalManagementFees.toFixed(2)}</span>
                </div>
              </div>

              {/* Payout Accounts Section */}
              {payoutCategories.length > 0 && (
                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Payout Accounts:</div>
                  {payoutCategories.map((category, index) => (
                    <div key={index} className="grid grid-cols-[1fr,auto] gap-4 items-center mb-2">
                      <div className="text-sm text-muted-foreground">{category.account_name}</div>
                      {isEditingSimulation ? (
                        <MoneyInput
                          value="1000.00"
                          onChange={() => {}}
                          placeholder="0.00"
                        />
                      ) : (
                        <div className="text-sm text-foreground text-right">
                          $1,000.00
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${(totalManagementFees + (payoutCategories.length * 1000)).toFixed(2)}</span>
                </div>
              </div>

              {minimumFee.enabled && totalManagementFees === minimumFee.amount && totalManagementFees > 0 && (
                <p className="text-xs text-destructive mt-2">
                  Minimum fee applied because calculated fees were lower than the minimum.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <AddManagementFeeDialog 
        open={isAddingFee} 
        onOpenChange={setIsAddingFee}
        onSave={handleAddFee}
      />

      {editingFeeIndex !== null && (
        <AddManagementFeeDialog 
          open={isEditingFee} 
          onOpenChange={setIsEditingFee}
          onSave={handleUpdateFee}
          initialFee={managementFees[editingFeeIndex]}
        />
      )}

      <AddPayoutCategoryDialog 
        open={isAddingPayoutCategory}
        onOpenChange={setIsAddingPayoutCategory}
        onSave={handleAddPayoutCategory}
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