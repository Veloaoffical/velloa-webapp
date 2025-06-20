'use client';

import { useState, useId } from "react"
import { Button as ButtonUI } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {CalendarIcon, Printer, FileSpreadsheet, SlidersHorizontal, X, RefreshCw, ChevronLeftIcon, ChevronRightIcon, Plus, FileSignature, Send, Clock } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac"
import { Button, DateRangePicker, Dialog, Group, Popover } from "react-aria-components"
import { parseDate, type CalendarDate } from "@internationalized/date"
import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"

interface Property {
  id: string
  name: string
}

interface Person {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  role: string
  unit_id: string | null
  units?: {
    unit_name: string
    properties: {
      name: string
    }
  } | null
  company: string | null
}

interface SignatureDocument {
  id: string
  document_name: string
  document_type: string
  property: string
  created_date: string
  status: 'pending' | 'sent' | 'signed' | 'declined' | 'expired'
  signers: Array<{
    id: string
    name: string
    email: string
    role: 'tenant' | 'landlord' | 'guarantor'
    signed_at?: string
    status: 'pending' | 'sent' | 'signed' | 'declined'
  }>
  template_id?: string
  submission_id?: string
  expires_at?: string
  signed_at?: string
  created_by: string
  updated_at: string
  lease_id?: string
}

interface SignaturesContentProps {
  leaseId?: string;
  initialSignatures?: SignatureDocument[];
  initialProperties?: Property[];
  initialPeople?: Person[];
}

export default function SignaturesContent({ 
  leaseId,
  initialSignatures = [], 
  initialProperties = [],
  initialPeople = []
}: SignaturesContentProps = {}) {
  const [selectedSignatures, setSelectedSignatures] = useState<Set<string>>(new Set())
  const [signatures] = useState<SignatureDocument[]>(initialSignatures.filter(s => s.lease_id === leaseId))
  const [isLoadingSignatures] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [properties] = useState<Property[]>(initialProperties)
  const [people] = useState<Person[]>(initialPeople)
  const [selectedSigner, setSelectedSigner] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  const tableId = useId()
  const currentDateTime = new Date()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getDateRangeForPeriod = (period: string) => {
    switch (period) {
      case 'day':
        return {
          start: parseDate(format(currentDateTime, "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'last-7-days':
        return {
          start: parseDate(format(subDays(currentDateTime, 7), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'last-30-days':
        return {
          start: parseDate(format(subDays(currentDateTime, 30), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'month':
        return {
          start: parseDate(format(startOfMonth(currentDateTime), "yyyy-MM-dd")),
          end: parseDate(format(endOfMonth(currentDateTime), "yyyy-MM-dd"))
        }
      case 'year':
        return {
          start: parseDate(format(startOfYear(currentDateTime), "yyyy-MM-dd")),
          end: parseDate(format(endOfYear(currentDateTime), "yyyy-MM-dd"))
        }
      case 'all-time':
        return {
          // Using a far past date for start (Jan 1, 1970)
          start: parseDate("1970-01-01"),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      default:
        return {
          start: parseDate(format(subDays(currentDateTime, 7), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
    }
  }

  const [selectedPeriod, setSelectedPeriod] = useState('all-time')
  const [dateRange, setDateRange] = useState(getDateRangeForPeriod('all-time'))

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
    }
  }

  const toggleSignature = (id: string) => {
    const newSelected = new Set(selectedSignatures)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSignatures(newSelected)
  }

  const downloadFileSpreadsheet = () => {
    // Create CSV content
    const headers = ['Date', 'Document Name', 'Type', 'Property', 'Status', 'Signers', 'Signed Date', 'Created By', 'Updated At']
    const csvContent = [
      headers.join(','),
      ...signatures.map(s => [
        s.created_date,
        s.document_name,
        s.document_type,
        s.property,
        s.status,
        s.signers.map(signer => `${signer.name} (${signer.status})`).join('; '),
        s.signed_at || 'N/A',
        s.created_by,
        s.updated_at
      ].join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `signatures_${format(currentDateTime, "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate statistics
  const totalDocuments = signatures.length
  const signedDocuments = signatures.filter(s => s.status === 'signed').length
  const pendingDocuments = signatures.filter(s => s.status === 'pending' || s.status === 'sent').length

  // Calculate pagination values
  const totalPages = Math.ceil(signatures.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSignatures = signatures.slice(indexOfFirstItem, indexOfLastItem)
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'sent':
        return 'text-blue-600 bg-blue-50'
      case 'declined':
        return 'text-red-600 bg-red-50'
      case 'expired':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalDocuments}
                </div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div className="text-primary">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {signedDocuments}
                </div>
                <div className="text-sm text-muted-foreground">Signed Documents</div>
              </div>
              <div className="text-green-600">
                <FileSignature className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingDocuments}
                </div>
                <div className="text-sm text-muted-foreground">Pending Signatures</div>
              </div>
              <div className="text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="flex gap-2 w-full">
            <ButtonUI 
              className="flex-1 text-sm rounded-lg" 
              variant="outline"
              onClick={() => {
                // Handle new document
                console.log('New document')
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </ButtonUI>
            <ButtonUI 
              className="flex-1 text-sm rounded-lg" 
              variant="outline"
              onClick={() => {
                // Handle send reminder
                console.log('Send reminder')
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reminder
            </ButtonUI>
            <ButtonUI 
              className="flex-1 text-sm rounded-lg" 
              variant="outline"
              onClick={() => {
                // Handle bulk actions
                console.log('Bulk actions')
              }}
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Bulk Actions
            </ButtonUI>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Filters */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedPeriod}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger className={cn(dateInputStyle, "w-[180px] text-sm")}>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <DateRangePicker 
                  className="flex items-center gap-2"
                  value={dateRange}
                  onChange={(newRange) => {
                    if (newRange?.start && newRange?.end) {
                      setDateRange(newRange as { start: CalendarDate; end: CalendarDate })
                      setSelectedPeriod('custom')
                    }
                  }}
                >
                  <div className="flex">
                    <Group className={cn(dateInputStyle, "pe-9")}>
                      <DateInput slot="start" unstyled />
                      <span aria-hidden="true" className="px-2 text-muted-foreground/70">
                        -
                      </span>
                      <DateInput slot="end" unstyled />
                    </Group>
                    <Button className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70">
                      <CalendarIcon size={16} strokeWidth={2} />
                    </Button>
                  </div>
                  <Popover
                    className="z-50 rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
                    offset={4}
                  >
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <RangeCalendar 
                        value={dateRange} 
                        onChange={(newRange) => {
                          if (newRange?.start && newRange?.end) {
                            setDateRange(newRange as { start: CalendarDate; end: CalendarDate })
                            setSelectedPeriod('custom')
                          }
                        }}
                      />
                    </Dialog>
                  </Popover>
                </DateRangePicker>

                <Select>
                  <SelectTrigger className={cn(dateInputStyle, "w-[180px] text-sm")}>
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="type">Document Type</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ButtonUI 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(dateInputStyle, "w-9 h-9 p-0", showFilters && "bg-muted")}
                      >
                        {showFilters ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <SlidersHorizontal className="h-4 w-4" />
                        )}
                      </ButtonUI>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showFilters ? 'Hide filters' : 'Show filters'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1" />
                
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.location.reload()} 
                          className={cn(dateInputStyle, "w-9 h-9 p-0")}
                          disabled={isLoadingSignatures}
                        >
                          <RefreshCw className={cn("h-4 w-4", isLoadingSignatures && "animate-spin")} />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh page</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI variant="ghost" size="icon" onClick={downloadFileSpreadsheet} className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                          <FileSpreadsheet className="h-4 w-4" />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export to spreadsheet</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI variant="ghost" size="icon" className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                          <Printer className="h-4 w-4" />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Print report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSigner} onValueChange={setSelectedSigner}>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Signer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Signers</SelectItem>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {[person.first_name, person.last_name].filter(Boolean).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="lease-agreement">Lease Agreement</SelectItem>
                      <SelectItem value="addendum">Addendum</SelectItem>
                      <SelectItem value="disclosure">Disclosure</SelectItem>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-b"></div>
          </div>

          {/* Table */}
          <div className="space-y-2 overflow-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">
                    <Checkbox 
                      id={tableId}
                      checked={selectedSignatures.size === currentSignatures.length && currentSignatures.length > 0}
                      onCheckedChange={() => {
                        if (selectedSignatures.size === currentSignatures.length && currentSignatures.length > 0) {
                          // Deselect all current page items
                          const newSelected = new Set(selectedSignatures)
                          currentSignatures.forEach(s => newSelected.delete(s.id))
                          setSelectedSignatures(newSelected)
                        } else {
                          // Select all current page items
                          const newSelected = new Set(selectedSignatures)
                          currentSignatures.forEach(s => newSelected.add(s.id))
                          setSelectedSignatures(newSelected)
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Document Name</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Property</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Signers</TableHead>
                  <TableHead className="whitespace-nowrap">Signed Date</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSignatures ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Fetching signatures...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : signatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSignature className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No signature documents found</p>
                        <p className="text-xs text-muted-foreground">Create your first document to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentSignatures.map((signature) => (
                    <TableRow key={signature.id} className="has-[[data-state=checked]]:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <Checkbox 
                          id={`table-checkbox-${signature.id}`}
                          checked={selectedSignatures.has(signature.id)}
                          onCheckedChange={() => toggleSignature(signature.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {signature.created_date ? format(new Date(signature.created_date), 'MM/dd/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap max-w-[200px] truncate">
                        {signature.document_name || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{signature.document_type || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {properties.find(p => p.id === signature.property)?.name || signature.property || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize",
                          getStatusColor(signature.status)
                        )}>
                          {signature.status}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap max-w-[200px]">
                        <div className="space-y-1">
                          {signature.signers.map((signer, index) => (
                            <div key={index} className="text-xs">
                              <span className="font-medium">{signer.name}</span>
                              <span className={cn(
                                "ml-2 px-1 py-0.5 rounded text-xs",
                                getStatusColor(signer.status)
                              )}>
                                {signer.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {signature.signed_at ? format(new Date(signature.signed_at), 'MM/dd/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ButtonUI variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <FileSignature className="h-4 w-4" />
                                </ButtonUI>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {signature.status !== 'signed' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ButtonUI variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Send className="h-4 w-4" />
                                  </ButtonUI>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send Reminder</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="bg-muted">
                <TableRow className="hover:bg-transparent">
                </TableRow>
              </TableFooter>
            </Table>
            
            {/* Pagination */}
            {signatures.length > 0 && (
              <div className="flex items-center justify-between space-x-1 py-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    {format(currentDateTime, "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="ml-auto">
                  <Pagination>
                    <PaginationContent className="gap-3">
                      <PaginationItem>
                        <PaginationLink
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                          onClick={prevPage}
                          aria-label="Go to previous page"
                          aria-disabled={currentPage === 1 ? true : undefined}
                          role={currentPage === 1 ? "link" : undefined}
                        >
                          <ChevronLeftIcon size={16} aria-hidden="true" />
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <p className="text-muted-foreground text-sm" aria-live="polite">
                          Page <span className="text-foreground">{currentPage}</span> of{" "}
                          <span className="text-foreground">{totalPages}</span>
                        </p>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                          onClick={nextPage}
                          aria-label="Go to next page"
                          aria-disabled={currentPage === totalPages ? true : undefined}
                          role={currentPage === totalPages ? "link" : undefined}
                        >
                          <ChevronRightIcon size={16} aria-hidden="true" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}