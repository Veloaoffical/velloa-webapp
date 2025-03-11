'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CalendarWithMonthsInput from "@/components/calendarwithmonthsinput";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PartsLabourItem {
  id: string;
  description: string;
  category: string;
  billDate: Date | undefined;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
}

interface TaskPartsLabourProps {
  taskDetails: {
    parts_labour: string | null;
  };
}

export function TaskPartsLabour({ taskDetails }: TaskPartsLabourProps) {
  console.log('TaskPartsLabour rendered with taskDetails:', taskDetails);
  
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [items, setItems] = useState<PartsLabourItem[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newItem, setNewItem] = useState<PartsLabourItem>({
    id: '',
    description: '',
    category: '',
    quantity: '',
    unitPrice: '',
    total: 0,
    billDate: undefined
  });

  const fetchItems = useCallback(async () => {
    if (!taskDetails.parts_labour) {
      console.log('No parts_labour ID provided');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching items for ID:', taskDetails.parts_labour);
      const response = await fetch(`/api/tasks/parts-labour?id=${taskDetails.parts_labour}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      console.log('Received items:', data.items);
      setItems(data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [taskDetails.parts_labour]);

  useEffect(() => {
    console.log('useEffect triggered with parts_labour:', taskDetails.parts_labour);
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    const numericQuantity = typeof newItem.quantity === 'string' ? 
      parseFloat(newItem.quantity) || 0 : 
      newItem.quantity;
    const numericUnitPrice = typeof newItem.unitPrice === 'string' ? 
      parseFloat(newItem.unitPrice) || 0 : 
      newItem.unitPrice;
    
    const itemToAdd = {
      ...newItem,
      id: crypto.randomUUID(),
      total: numericQuantity * numericUnitPrice
    };

    try {
      const response = await fetch('/api/tasks/bill-expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskDetails.parts_labour,
          action: 'add',
          item: itemToAdd
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      await fetchItems();
      setShowDialog(false);
      setNewItem({
        id: '',
        description: '',
        category: '',
        quantity: '',
        unitPrice: '',
        total: 0,
        billDate: undefined
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAndFilteredItems = filteredItems.sort((a, b) => {
    if (!a.billDate && !b.billDate) return 0;
    if (!a.billDate) return 1;
    if (!b.billDate) return -1;
    
    const dateA = new Date(a.billDate);
    const dateB = new Date(b.billDate);
    
    return sortDirection === 'asc' 
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const removeItem = async (id: string) => {
    try {
      // Find the index in the original items array
      const originalIndex = items.findIndex(item => item.id === id);
      if (originalIndex === -1) {
        throw new Error('Item not found in original list');
      }

      const itemToRemove = items[originalIndex];

      const response = await fetch('/api/tasks/parts-labour', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskDetails.parts_labour,
          action: 'remove',
          itemId: originalIndex
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to remove item');
      }

      await fetchItems();
      toast.success('Item deleted successfully', {
        description: `${itemToRemove.description} has been removed`
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to delete item', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-[400px]">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-[100px]" />
                  <Skeleton className="h-10 w-[100px]" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-12 w-[15%]">Bill Date</TableHead>
                        <TableHead className="h-12 w-[30%]">Description</TableHead>
                        <TableHead className="h-12 w-[15%]">Category</TableHead>
                        <TableHead className="h-12 w-[10%]">Quantity</TableHead>
                        <TableHead className="h-12 w-[12%]">Unit Price</TableHead>
                        <TableHead className="h-12 w-[12%]">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, index) => (
                        <TableRow key={index} className="h-12">
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell colSpan={4} />
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-[400px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search parts and labour..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={isEditMode ? "destructive" : "outline"}
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="gap-2"
                >
                  {isEditMode ? (
                    <>Done</>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
                <Button className="gap-2" onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead 
                        className="h-12 w-[15%] cursor-pointer hover:bg-accent hover:text-accent-foreground font-bold"
                        onClick={toggleSort}
                      >
                        Bill Date {sortDirection === 'asc' ? '↑' : '↓'}
                      </TableHead>
                      <TableHead className="h-12 w-[30%] font-bold">Description</TableHead>
                      <TableHead className="h-12 w-[15%] font-bold">Category</TableHead>
                      <TableHead className="h-12 w-[10%] font-bold">Quantity</TableHead>
                      <TableHead className="h-12 w-[12%] font-bold">Unit Price</TableHead>
                      <TableHead className="h-12 w-[12%] font-bold">Total</TableHead>
                      {isEditMode && <TableHead className="h-12 w-[6%]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No parts and labour items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedAndFilteredItems.map((item) => (
                        <TableRow key={item.id} className="h-12">
                          <TableCell>
                            {item.billDate ? format(new Date(item.billDate), 'PPP') : '-'}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : item.unitPrice}</TableCell>
                          <TableCell>${item.total.toFixed(2)}</TableCell>
                          {isEditMode && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                onClick={() => removeItem(item.id)}
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {sortedAndFilteredItems.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell colSpan={4} />
                        <TableCell className="font-bold">
                          ${sortedAndFilteredItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                        </TableCell>
                        {isEditMode && <TableCell />}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </div>
          </div>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Parts & Labour Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parts">Parts</SelectItem>
                      <SelectItem value="labour">Labour</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Bill Date</Label>
                  <CalendarWithMonthsInput
                    value={newItem.billDate}
                    onChange={(date: Date | undefined) => setNewItem(prev => ({ ...prev, billDate: date }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 