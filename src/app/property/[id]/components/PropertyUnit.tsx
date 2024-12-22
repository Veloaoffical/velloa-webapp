"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Home, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PropertyUnitProps {
  propertyId: string;
}

interface Unit {
  id: string
  name: string
  tenant: string
  beds: number
  baths: number
  marketRent: number
  size: string
  status: "occupied" | "vacant"
}

export const columns: ColumnDef<Unit>[] = [
  {
    accessorKey: "unit_name",
    header: "Unit Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Home className="w-5 h-5 text-green-600" />
        </div>
        <div>
          {row.getValue("unit_name")}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "tenant",
    header: "Tenant",
    cell: ({ row }) => <div>{row.getValue("tenant")}</div>,
  },
  {
    accessorKey: "beds",
    header: "Beds",
    cell: ({ row }) => <div>{row.getValue("beds")}</div>,
  },
  {
    accessorKey: "baths",
    header: "Baths",
    cell: ({ row }) => <div>{row.getValue("baths")}</div>,
  },
  {
    accessorKey: "marketRent",
    header: "Market Rent ($)",
    cell: ({ row }) => <div>${row.getValue("marketRent")}</div>,
  },
  {
    accessorKey: "size",
    header: "Size (sq ft)",
    cell: ({ row }) => <div>{row.getValue("size")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "occupied" | "vacant"
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === "occupied" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )
    },
  },
]

export function PropertyUnit({ propertyId }: PropertyUnitProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [units, setUnits] = React.useState<Unit[]>([])

  React.useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Updated API endpoint path
        const response = await fetch(`/api/property/${propertyId}/units`)
        if (!response.ok) {
          throw new Error('Failed to fetch units')
        }
        
        const data = await response.json()
        setUnits(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch units')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnits()
  }, [propertyId])

  const table = useReactTable({
    data: units,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-600">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="w-full">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search units..."
              value={(table.getColumn("unit_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("unit_name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  const statusColumn = table.getColumn("status")
                  if (statusColumn?.getFilterValue() === "occupied") {
                    statusColumn.setFilterValue("vacant")
                  } else if (statusColumn?.getFilterValue() === "vacant") {
                    statusColumn.setFilterValue(undefined)
                  } else {
                    statusColumn?.setFilterValue("occupied")
                  }
                }}
              >
                {table.getColumn("status")?.getFilterValue()
                  ? `Showing ${table.getColumn("status")?.getFilterValue()} units`
                  : "Filter by status"}
              </Button>
              <Button>
                <Plus className="h-4 w-4" />
                New Unit
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Loading units...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No units found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} unit(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
