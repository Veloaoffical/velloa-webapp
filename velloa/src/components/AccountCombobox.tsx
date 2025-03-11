"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface SubAccount {
  id: string
  account_name: string
  account_subtype: string
  account_balance: number
}

interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance: number
  sub_accounts?: SubAccount[]
  is_sub_account?: boolean
  parent_account?: string
}

interface AccountComboboxProps {
  accounts: Account[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  className?: string
  showAllOption?: boolean
}

export default function AccountCombobox({ 
  accounts, 
  value, 
  onValueChange, 
  isLoading,
  className,
  showAllOption = true
}: AccountComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Normalize accounts to handle both flat and hierarchical structures
  const normalizedAccounts = React.useMemo(() => {
    // Check if we have a flat structure (chart-of-accounts API)
    const hasFlatStructure = accounts.some(a => a.is_sub_account === true)
    
    if (hasFlatStructure) {
      // Convert flat structure to hierarchical
      const mainAccounts = accounts.filter(a => !a.is_sub_account)
      
      return mainAccounts.map(mainAccount => {
        const subAccounts = accounts
          .filter(a => a.is_sub_account && a.parent_account === mainAccount.id)
          .map(sa => ({
            id: sa.id,
            account_name: sa.account_name,
            account_subtype: sa.account_subtype,
            account_balance: sa.account_balance
          }))
        
        return {
          ...mainAccount,
          sub_accounts: subAccounts.length > 0 ? subAccounts : undefined
        }
      })
    }
    
    // Already in hierarchical structure (categories API)
    return accounts
  }, [accounts])

  // Function to find an account (including sub-accounts) by ID
  const findAccountById = (id: string): Account | SubAccount | undefined => {
    // First check main accounts
    const mainAccount = normalizedAccounts.find(a => a.id === id)
    if (mainAccount) return mainAccount

    // Then check sub-accounts
    for (const account of normalizedAccounts) {
      if (account.sub_accounts) {
        const subAccount = account.sub_accounts.find(sa => sa.id === id)
        if (subAccount) return subAccount
      }
    }

    // If not found in normalized accounts, check original accounts (for flat structure)
    return accounts.find(a => a.id === id)
  }

  // Filter accounts based on search
  const filteredAccounts = normalizedAccounts.filter(account => {
    const searchLower = search.toLowerCase()
    
    // Check if main account matches
    const mainAccountMatches = 
      account.account_name.toLowerCase().includes(searchLower) ||
      account.account_type.toLowerCase().includes(searchLower)

    // If main account matches or no search term, include it and its matching sub-accounts
    if (!search || mainAccountMatches) return true

    // If main account doesn't match but has sub-accounts, check them
    if (account.sub_accounts) {
      return account.sub_accounts.some(subAccount =>
        subAccount.account_name.toLowerCase().includes(searchLower)
      )
    }

    return false
  })

  // Group accounts by their main categories
  const groupedAccounts = React.useMemo(() => {
    const groups: Record<string, Account[]> = {
      'Assets': [],
      'Liabilities': [],
      'Equity': [],
      'Income': [],
      'Expense': [],
      'Other': []
    }

    filteredAccounts.forEach(account => {
      // Normalize account types to main categories
      const type = account.account_type.toLowerCase()
      if (type.includes('asset')) {
        groups['Assets'].push(account)
      } else if (type.includes('liability')) {
        groups['Liabilities'].push(account)
      } else if (type.includes('equity')) {
        groups['Equity'].push(account)
      } else if (type.includes('income') || type.includes('revenue')) {
        groups['Income'].push(account)
      } else if (type.includes('expense')) {
        groups['Expense'].push(account)
      } else {
        groups['Other'].push(account)
      }
    })

    // Filter out empty groups
    return Object.entries(groups)
      .filter(([, accounts]) => accounts.length > 0)
      .map(([groupName, accounts]) => ({
        name: groupName,
        accounts
      }))
  }, [filteredAccounts])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background hover:bg-background",
            className
          )}
        >
          {value && value !== 'all' ? (
            <span className="truncate">
              {findAccountById(value)?.account_name || 'All Accounts'}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading accounts..." : "Select account"}
            </span>
          )}
          <ChevronDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] p-0" align="start">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredAccounts.length === 0 ? (
              <div className="py-6 text-center text-sm">No accounts found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                {showAllOption && (
                  <>
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onValueChange('all')
                        setOpen(false)
                      }}
                    >
                      All Accounts
                      {value === 'all' && <CheckIcon size={16} className="ml-auto" />}
                    </div>
                    <Separator className="my-1" />
                  </>
                )}
                {!isLoading && groupedAccounts.map((group) => (
                  <React.Fragment key={group.name}>
                    {/* Group Header */}
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {group.name}
                    </div>
                    
                    {/* Accounts in this group */}
                    {group.accounts.map((account) => (
                      <React.Fragment key={account.id}>
                        {/* Main Account */}
                        <div
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            onValueChange(account.id)
                            setOpen(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{account.account_name}</span>
                            <span className="text-sm text-muted-foreground">
                              Balance: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(account.account_balance)}
                            </span>
                          </div>
                          {value === account.id && <CheckIcon size={16} className="ml-auto" />}
                        </div>
                        
                        {/* Sub Accounts */}
                        {account.sub_accounts?.map((subAccount) => (
                          <div
                            key={subAccount.id}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground pl-12"
                            onClick={() => {
                              onValueChange(subAccount.id)
                              setOpen(false)
                            }}
                          >
                            <div className="flex flex-col w-full">
                              <div className="flex items-center">
                                <span className="h-4 w-8 border-l-2 border-b-2 border-muted-foreground/30 absolute left-2 top-1/2 -translate-y-1/2"></span>
                                <span className="font-medium">{subAccount.account_name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Balance: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(subAccount.account_balance)}
                              </span>
                            </div>
                            {value === subAccount.id && <CheckIcon size={16} className="ml-auto shrink-0" />}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                    
                    <Separator className="my-1" />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 