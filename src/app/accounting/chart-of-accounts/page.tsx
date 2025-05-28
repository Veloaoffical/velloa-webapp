"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, ArrowUpDown, ArrowLeft, ChevronRight, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import Link from "next/link"

interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  balance: number
  default_for: string | null
  account_description: string | null
  is_sub_account?: boolean
  parent_account?: string
  subAccounts?: Account[]
}

interface DefaultAccountsData {
  operatingBankAccount: string
  trustBankAccount: string
  clearingAccount: string
  rentalIncome: string
  applicationFee: string
  lateFees: string
  convenienceFeeIncome: string
  securityDeposit: string
  managementFees: string
  ownerContribution: string
  ownerDistribution: string
}

export default function ChartOfAccountsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [defaultAccounts, setDefaultAccounts] = useState<DefaultAccountsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

  // Toggle expansion state of an account
  const toggleAccountExpansion = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(accountId)) {
        newSet.delete(accountId)
      } else {
        newSet.add(accountId)
      }
      return newSet
    })
  }

  // Organize accounts into a hierarchical structure
  const organizeAccounts = (accounts: Account[]) => {
    const mainAccounts = accounts.filter(account => !account.is_sub_account)
    const subAccounts = accounts.filter(account => account.is_sub_account)
    
    return mainAccounts.map(mainAccount => ({
      ...mainAccount,
      subAccounts: subAccounts.filter(subAccount => subAccount.parent_account === mainAccount.id)
    }))
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setIsLoading(true)
      const [accountsResponse, defaultAccountsResponse] = await Promise.all([
        fetch("/api/accounting/chart-of-accounts"),
        fetch("/api/company/settings/default-accounts")
      ])

      if (!accountsResponse.ok) {
        throw new Error("Failed to fetch accounts")
      }
      if (!defaultAccountsResponse.ok) {
        throw new Error("Failed to fetch default accounts")
      }

      const accountsData = await accountsResponse.json()
      const defaultAccountsData = await defaultAccountsResponse.json()

      // Map default accounts to their purposes
      const updatedAccounts = accountsData.map((account: Account) => {
        let defaultFor = null
        if (defaultAccountsData) {
          const defaultPurposes = Object.entries(defaultAccountsData).reduce((acc: { [key: string]: string }, [key, value]) => {
            if (value === account.id) {
              // Convert camelCase to Title Case with spaces
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
              acc[account.id] = formattedKey
            }
            return acc
          }, {})
          defaultFor = defaultPurposes[account.id] || null
        }
        return { ...account, default_for: defaultFor }
      })

      setAccounts(updatedAccounts)
      setDefaultAccounts(defaultAccountsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const organizedAccounts = organizeAccounts(accounts)
  const filteredAccounts = organizedAccounts.filter(account => 
    (account.account_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (account.account_type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (account.account_subtype?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (account.account_description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    account.subAccounts?.some(subAccount => 
      (subAccount.account_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (subAccount.account_type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (subAccount.account_subtype?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (subAccount.account_description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <Link href="/accounting">
              <Button variant="ghost" className="p-2 hover:bg-transparent -ml-2">
                <ArrowLeft className="h-10 w-10" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          </div>
          <div className="ml-10">
            <p className="text-muted-foreground">Organize your financial records with a structured chart of accounts.</p>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="gap-2" 
              variant="default"
              onClick={() => router.push("/accounting/chart-of-accounts/add-account")}
            >
              <Plus className="w-4 h-4" />
              New Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading accounts...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button variant="ghost" className="gap-1 -ml-4 h-8 data-[state=open]:bg-accent">
                      Account Name
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="gap-1 -ml-4 h-8 data-[state=open]:bg-accent">
                      Type
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Default For</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <React.Fragment key={`account-group-${account.id}`}>
                    <TableRow 
                      key={account.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => account.subAccounts?.length ? toggleAccountExpansion(account.id) : null}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {account.subAccounts?.length ? (
                            expandedAccounts.has(account.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <div className="w-4" /> /* Spacer for alignment */
                          )}
                          {account.account_name}
                        </div>
                      </TableCell>
                      <TableCell>{account.account_type} → {account.account_subtype}</TableCell>
                      <TableCell>{account.default_for}</TableCell>
                      <TableCell className="text-muted-foreground">{account.account_description}</TableCell>
                    </TableRow>
                    {expandedAccounts.has(account.id) && account.subAccounts?.map((subAccount) => (
                      <TableRow key={subAccount.id} className="cursor-pointer hover:bg-muted/50 bg-muted/30">
                        <TableCell className="font-medium pl-11">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">└─</span>
                            {subAccount.account_name}
                          </div>
                        </TableCell>
                        <TableCell>{subAccount.account_type} → {subAccount.account_subtype}</TableCell>
                        <TableCell>{subAccount.default_for}</TableCell>
                        <TableCell className="text-muted-foreground">{subAccount.account_description}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 