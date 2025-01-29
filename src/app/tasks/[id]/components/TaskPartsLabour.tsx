'use server';

import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from "@/components/ui/card";
import { TaskPartsLabourClient } from "./TaskPartsLabourClient";

interface PartsLabourItem {
  id: string;
  description: string;
  category: string;
  billDate: Date | undefined;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
}

interface BillExpenseItem {
  description: string;
  category: string;
  bill_date: string | null;
  quantity: string | number;
  unit_price: string | number;
  total: string | number;
}

interface BillExpense {
  id: string;
  data: BillExpenseItem[] | null;
}

interface TaskPartsLabourProps {
  taskDetails: {
    parts_labour: string | null;
    parts_labour_items?: PartsLabourItem[];
  };
  onUpdate?: (items: PartsLabourItem[]) => void;
}

async function getPartsLabourData(partsLabourId: string | null): Promise<{ items: PartsLabourItem[] } | null> {
  if (!partsLabourId) {
    console.log('No partsLabourId provided');
    return null;
  }
  
  console.log('Fetching data for partsLabourId:', partsLabourId);
  const supabase = await createClient();
  
  const { data: billExpenses, error } = await supabase
    .from('bill_expenses')
    .select('id, data')
    .eq('id', partsLabourId)
    .single<BillExpense>();

  if (error) {
    console.error('Error fetching bill expenses:', error);
    return null;
  }

  console.log('Raw bill expenses data:', billExpenses);

  // Map the items from the data JSONB field
  if (billExpenses?.data) {
    const mappedItems = {
      items: billExpenses.data.map((item) => ({
        id: crypto.randomUUID(), // Generate an ID since it's not in the original data
        description: item.description,
        category: item.category,
        billDate: item.bill_date ? new Date(item.bill_date) : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
      }))
    };
    console.log('Mapped items:', mappedItems);
    return mappedItems;
  }

  console.log('No items found in data');
  return { items: [] };
}

export async function TaskPartsLabour({ taskDetails, onUpdate }: TaskPartsLabourProps) {
  console.log('TaskPartsLabour received taskDetails:', taskDetails);
  const partsLabourData = await getPartsLabourData(taskDetails.parts_labour);
  console.log('Processed partsLabourData:', partsLabourData);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <TaskPartsLabourClient 
            taskDetails={{
              ...taskDetails,
              parts_labour_items: partsLabourData?.items || []
            }} 
            onUpdate={onUpdate} 
          />
        </CardContent>
      </Card>
    </div>
  );
} 