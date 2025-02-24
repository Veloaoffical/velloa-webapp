"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import localFont from 'next/font/local'

const micrFont = localFont({
  src: '../../../../../public/fonts/micrenc.ttf',
  variable: '--font-micr'
})

interface PayeeDetails {
  id: string
  full_name: string
  company_name?: string
}

interface TransactionData {
  lines: {
    unit: string
    category: string
    description: string
    debit_amount: number
    credit_amount: number
    property?: string
    reference?: string
  }[]
  total_amount: number
  payment_method: string
  memo?: string
  check_number?: string
}

interface Transaction {
  id: string
  created_at: string
  transaction_type: string | null
  property: string | null
  nano: string | null
  payee: string | null
  start_date: string | null
  due_date: string | null
  repeat_infinite: boolean | null
  data: TransactionData
  frequency: string | null
  created_by: string | null
  company: string | null
  memo: Record<string, unknown> | null
  frequency_type: string | null
  reference: string | null
  payeeDetails?: PayeeDetails
  propertyDetails?: Map<string, PropertyDetails>
}

interface PropertyDetails {
  id: string
  name: string
  address?: string
  nano?: string
}

export default function CheckPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayeeDetails = async (transactions: Transaction[]): Promise<Transaction[]> => {
    try {
      const payeeIds = [...new Set(transactions.filter(t => t.payee).map(t => t.payee))]
      if (payeeIds.length === 0) return transactions

      const payeeMap = new Map<string, PayeeDetails>()
      const endpoints = [
        '/api/people/owner/search',
        '/api/people/vendor/search',
        '/api/people/tenants/search'
      ]

      const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)))
      const results = await Promise.all(responses.map(r => r.json()))
      const allPeople = results.flat()

      allPeople.forEach(person => {
        if (payeeIds.includes(person.id)) {
          payeeMap.set(person.id, {
            id: person.id,
            full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            company_name: person.company
          })
        }
      })

      return transactions.map(transaction => ({
        ...transaction,
        payeeDetails: transaction.payee ? payeeMap.get(transaction.payee) : undefined
      }))
    } catch (error) {
      console.error('Error fetching payee details:', error)
      return transactions
    }
  }

  const fetchPropertyDetails = async (transactions: Transaction[]): Promise<Transaction[]> => {
    try {
      // Collect all property IDs from transaction lines
      const propertyIds = new Set<string>()
      
      transactions.forEach(transaction => {
        if (transaction.property) {
          propertyIds.add(transaction.property)
        }
        
        transaction.data.lines.forEach(line => {
          if (line.property) {
            propertyIds.add(line.property)
          }
        })
      })
      
      if (propertyIds.size === 0) return transactions
      
      // Fetch property details
      const response = await fetch(`/api/property`)
      if (!response.ok) throw new Error('Failed to fetch properties')
      
      const properties = await response.json()
      const propertyMap = new Map<string, PropertyDetails>()
      
      // Fetch property nano codes
      const nanoResponse = await fetch(`/api/property/nano`)
      let nanoData: Record<string, string> = {}
      
      if (nanoResponse.ok) {
        nanoData = await nanoResponse.json()
      }
      
      interface ApiProperty {
        id: string
        name: string
        address?: string
      }
      
      properties.forEach((property: ApiProperty) => {
        if (propertyIds.has(property.id)) {
          propertyMap.set(property.id, {
            id: property.id,
            name: property.name || '',
            address: property.address || '',
            nano: nanoData[property.id] || ''
          })
        }
      })
      
      return transactions.map(transaction => ({
        ...transaction,
        propertyDetails: propertyMap
      }))
    } catch (error) {
      console.error('Error fetching property details:', error)
      return transactions
    }
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const checkIds = searchParams.get('checks')?.split(',') || []
        
        if (checkIds.length === 0) {
          router.push('/accounting/print-checks')
          return
        }

        const response = await fetch(`/api/accounting/transactions?id=${checkIds.join(',')}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')
        
        const data = await response.json()
        const filteredData = checkIds
          .map(id => data.find((t: Transaction) => t.id === id))
          .filter((t): t is Transaction => t !== undefined)
        
        const transactionsWithPayees = await fetchPayeeDetails(filteredData)
        const transactionsWithProperties = await fetchPropertyDetails(transactionsWithPayees)
        setTransactions(transactionsWithProperties)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [searchParams, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/accounting/print-checks">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Check Preview</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/accounting/print-checks">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Check Preview</h1>
        </div>
        <Button onClick={handlePrint} className="print:hidden">
          <Printer className="h-4 w-4 mr-2" />
          Print Checks
        </Button>
      </div>

      <div className="space-y-8 print:space-y-0 print:p-0 print:-mt-10">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="space-y-4 print:space-y-0 print:mb-0">
            <style jsx global>{`
              @media print {
                @page {
                  margin: 0;
                  size: 8.5in 11in;
                }
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                  margin: 0 0 0 0 !important;
                }
                /* Hide any unwanted elements during print */
                header, nav, aside, .no-print {
                  display: none !important;
                }
                /* Ensure only check content is visible */
                main {
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* Remove any backgrounds or images that might interfere */
                * {
                  background-image: none !important;
                }
              }
            `}</style>
            <div className="print:shadow-none print:border-none print:p-0">
              <div className="p-6 print:p-0">
                {/* First Check Section */}
                <div className="mb-2 print:mb-0">
                  {/* Main Check */}
                  <div className="relative border border-gray-300 bg-white w-[8.5in] h-[3.5in] mx-auto p-6 print:border-none">
                    {/* Date */}
                    <div className="absolute top-[72px] right-8 text-[12px]">
                      <div className="border-gray-400 px-2 py-[2px]">
                        {transaction.start_date
                          ? format(new Date(transaction.start_date), "MM/dd/yyyy")
                          : format(new Date(), "MM/dd/yyyy")}
                      </div>
                    </div>

                   
                    {/* Payee Name */}
                    <div className="absolute left-8 top-32">
                      <div className="text-[13px] pb-[2px] ml-[0.65in]">
                        {transaction.payeeDetails?.full_name || 'Unknown Payee'}
                      </div>
                    </div>

                    {/* Amount in Numbers */}
                    <div className="absolute top-32 right-8">
                      <div className="px-3 py-1 text-right w-36 text-[13px] flex">
                        <span className="mr-1">$</span>
                        <span className="flex-1 text-right">***{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(transaction.data.total_amount).slice(1)}</span>
                      </div>
                    </div>

                    {/* Amount in Words */}
                    <div className="absolute left-8 top-40 flex items-center gap-2">
                      <div className="text-[13px] capitalize w-[5in] flex ml-[0.65in]">
                        <span className="whitespace-nowrap">{numberToWords(transaction.data.total_amount)}</span>
                        <span className="flex-1">{'*'.repeat(4)}</span>
                      </div>
                    </div>

                    {/* Bank Account Address */}
                    <div className="absolute left-8 top-48">
                      <div className="text-[12px] ml-[0.65in]">
                        <div>Saiyan PropMan | Samuel H</div>
                        <div>3425 Northwest 2nd Avenue</div>
                        <div>Miami, Florida 33137</div>
                      </div>
                    </div>

                    {/* Memo Line */}
                    <div className="absolute left-8 bottom-16 text-[12px]">
                      <div className="ml-[0.65in]">
                        <span className="font-semibold"></span> {transaction.data.memo || ''}
                      </div>
                    </div>

                    {/* MICR Line */}
                    <div className="absolute left-[1.58in] bottom-[0.13in] text-2xl tracking-[0.2em]">
                    <span className={`${micrFont.className} text-3xl`}>C</span>
                      <span className={`${micrFont.className} text-3xl`}>004</span>
                      <span className={`${micrFont.className} text-3xl`}>C</span>
                      <span className={`${micrFont.className} text-3xl`}>   </span>
                      <span className={`${micrFont.className} text-3xl`}>A</span>
                      <span className={`${micrFont.className} text-3xl`}>01234</span>
                      <span className={`${micrFont.className} text-3xl`}>D</span>
                      <span className={`${micrFont.className} text-3xl`}>001</span>
                      <span className={`${micrFont.className} text-3xl`}>A</span>
                      <span className={`${micrFont.className} text-3xl`}>   </span>

                      <span className={`${micrFont.className} text-3xl`}>1234</span>
                      <span className={`${micrFont.className} text-3xl`}>D</span>
                      <span className={`${micrFont.className} text-3xl`}>1234567</span>
                      <span className={`${micrFont.className} text-3xl`}>C</span>
                    </div>
                  </div>
                </div>

                {/* Second Check Section - Transaction List */}
                <div className="mb-2 print:mb-0 print:-mt-1">
                  {/* Transaction List */}
                  <div className="relative border border-gray-300 bg-white w-[8.5in] h-[3.5in] mx-auto p-6 print:border-none">
                    <div className="flex justify-between text-[12px] mb-4">
                      <div className="flex gap-4">
                        <div>{transaction.start_date
                          ? format(new Date(transaction.start_date), "MM/dd/yyyy")
                          : format(new Date(), "MM/dd/yyyy")}</div>
                        <div className="font-bold">{transaction.payeeDetails?.full_name || 'Unknown Payee'}</div>
                      </div>
                      <div>#{transaction.reference || transaction.id.slice(0, 6)}</div>
                    </div>

                    <div className="space-y-1 text-[12px]">
                      {transaction.data.lines
                        .filter(line => line.debit_amount > 0) // Only include debit transactions
                        .map((line, index) => (
                        <div key={index} className="grid grid-cols-[80px_80px_150px_100px_120px_80px] gap-1">
                          <div>{line.unit || (line.property && transaction.propertyDetails?.get(line.property)?.nano) || ''}</div>
                          <div>{line.reference || ''}</div>
                          <div className="truncate">
                            {line.property && transaction.propertyDetails?.get(line.property)?.name 
                              ? transaction.propertyDetails.get(line.property)?.name 
                              : line.description || ''}
                          </div>
                          <div>{transaction.transaction_type || 'Transaction'}</div>
                          <div className="text-right">{line.description || 'Flat Fee'}</div>
                          <div className="text-right">{line.debit_amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid grid-cols-[300px_1fr_120px] gap-4 text-[12px] items-start">
                      <div>
                        <div>Saiyan PropMan | Samuel H</div>
                        <div>3425 Northeast 2nd Avenue</div>
                        <div>Miami, Florida</div>
                        <div>United States   33137</div>
                        <div>Operating Account 2</div>
                      </div>
                      <div className="text-right">728 Ocean Drive (2 Owners/Early Post Charges) mana...</div>
                      <div className="text-right">1,350.00</div>
                    </div>
                  </div>
                </div>

                {/* Third Check Section */}
                <div className="mb-2 print:mb-0 print:-mt-1">
                  {/* Transaction List */}
                  <div className="relative border border-gray-300 bg-white w-[8.5in] h-[3.5in] mx-auto p-6 print:border-none">
                    <div className="flex justify-between text-[12px] mb-4">
                      <div className="flex gap-4">
                        <div>{transaction.start_date
                          ? format(new Date(transaction.start_date), "MM/dd/yyyy")
                          : format(new Date(), "MM/dd/yyyy")}</div>
                        <div className="font-bold">{transaction.payeeDetails?.full_name || 'Unknown Payee'}</div>
                      </div>
                      <div>#{transaction.reference || transaction.id.slice(0, 6)}</div>
                    </div>

                    <div className="space-y-1 text-[12px]">
                      {transaction.data.lines
                        .filter(line => line.debit_amount > 0) // Only include debit transactions
                        .map((line, index) => (
                        <div key={index} className="grid grid-cols-[80px_80px_150px_100px_120px_80px] gap-1">
                          <div>{line.unit || (line.property && transaction.propertyDetails?.get(line.property)?.nano) || ''}</div>
                          <div>{line.reference || ''}</div>
                          <div className="truncate">
                            {line.property && transaction.propertyDetails?.get(line.property)?.name 
                              ? transaction.propertyDetails.get(line.property)?.name 
                              : line.description || ''}
                          </div>
                          <div>{transaction.transaction_type || 'Transaction'}</div>
                          <div className="text-right">{line.description || 'Flat Fee'}</div>
                          <div className="text-right">{line.debit_amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid grid-cols-[300px_1fr_120px] gap-4 text-[12px] items-start">
                      <div>
                        <div>Saiyan PropMan | Samuel H</div>
                        <div>3425 Northeast 2nd Avenue</div>
                        <div>Miami, Florida</div>
                        <div>United States   33137</div>
                        <div>Operating Account 2</div>
                      </div>
                      <div className="text-right">728 Ocean Drive (2 Owners/Early Post Charges) mana...</div>
                      <div className="text-right">1,350.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to convert numbers to words
function numberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']

  function convertLessThanOneThousand(n: number): string {
    if (n === 0) return ''

    let result = ''

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred '
      n %= 100
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + ' '
      return result
    }

    if (n > 0) {
      result += ones[n] + ' '
    }

    return result
  }

  if (num === 0) return 'zero'

  let dollars = Math.floor(num)
  const cents = Math.round((num - dollars) * 100)
  let result = ''

  if (dollars >= 1000000) {
    result += convertLessThanOneThousand(Math.floor(dollars / 1000000)) + 'million '
    dollars %= 1000000
  }

  if (dollars >= 1000) {
    result += convertLessThanOneThousand(Math.floor(dollars / 1000)) + 'thousand '
    dollars %= 1000
  }

  result += convertLessThanOneThousand(dollars)
  result = result.trim()

  if (cents > 0) {
    result += ` and ${cents.toString().padStart(2, '0')}`
  } else {
    result += ' and 00/100'
  }

  return result
}