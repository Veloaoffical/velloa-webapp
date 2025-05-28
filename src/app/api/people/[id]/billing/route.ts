import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: personId } = await params;

    // Fetch charges for the person
    const { data: charges, error } = await supabase
      .from('charges')
      .select(`
        id,
        charge_amount,
        amount_remaining,
        status,
        bill_date,
        due_date,
        created_at,
        memo,
        reference,
        charge_type,
        property:properties!property_id (
          name
        ),
        unit:units!unit_id (
          unit_name
        ),
        people:people!people_id (
          first_name,
          last_name
        )
      `)
      .eq('people_id', personId)
      .order('bill_date', { ascending: false });

    if (error) {
      console.error('Error fetching billing items:', error);
      return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }

    // Extract all category IDs from charges to fetch account names in batch
    const categoryIds = new Set<string>();
    (charges || []).forEach(charge => {
      if (charge.charge_amount && typeof charge.charge_amount === 'object') {
        const chargeAmountData = charge.charge_amount as { lines?: Array<{ category?: string }> };
        if (chargeAmountData.lines && Array.isArray(chargeAmountData.lines)) {
          chargeAmountData.lines.forEach(line => {
            if (line.category) {
              categoryIds.add(line.category);
            }
          });
        }
      }
    });

    // Fetch account names for all categories in batch
    const categoryMap = new Map<string, string>();
    if (categoryIds.size > 0) {
      const { data: categories } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name')
        .in('id', Array.from(categoryIds));

      if (categories) {
        categories.forEach(category => {
          categoryMap.set(category.id, category.account_name);
        });
      }
    }

    const billingItems = (charges || []).map(charge => {
      // Extract amount from total_amount in charge_amount
      const chargeAmountData = charge.charge_amount as { total_amount?: number; lines?: Array<{ category?: string; description?: string }> };
      const chargeAmount = chargeAmountData?.total_amount || 0;
      
      // Extract open balance from total_amount in amount_remaining
      const amountRemainingData = charge.amount_remaining as { total_amount?: number };
      const amountRemaining = amountRemainingData?.total_amount || 0;
      
      // Get account name from category
      let accountName = 'Unknown';
      if (chargeAmountData?.lines && Array.isArray(chargeAmountData.lines) && chargeAmountData.lines.length > 0) {
        const categoryId = chargeAmountData.lines[0].category;
        if (categoryId && categoryMap.has(categoryId)) {
          accountName = categoryMap.get(categoryId) || 'Unknown';
        }
      }

      // Get property and unit data
      const propertyData = Array.isArray(charge.property) ? charge.property[0] : charge.property;
      const unitData = Array.isArray(charge.unit) ? charge.unit[0] : charge.unit;
      
      // Determine charge type
      const chargeType = charge.charge_type || 'other';
      let billingType: 'rent' | 'utilities' | 'maintenance' | 'late_fee' | 'deposit' | 'other' = 'other';
      
      if (chargeType.toLowerCase().includes('rent')) billingType = 'rent';
      else if (chargeType.toLowerCase().includes('utilities') || chargeType.toLowerCase().includes('utility')) billingType = 'utilities';
      else if (chargeType.toLowerCase().includes('maintenance') || chargeType.toLowerCase().includes('repair')) billingType = 'maintenance';
      else if (chargeType.toLowerCase().includes('late') || chargeType.toLowerCase().includes('fee')) billingType = 'late_fee';
      else if (chargeType.toLowerCase().includes('deposit')) billingType = 'deposit';

      // Extract description from charge_amount lines or fallback to memo
      let description = chargeType || 'Charge';
      if (chargeAmountData?.lines && Array.isArray(chargeAmountData.lines) && chargeAmountData.lines.length > 0) {
        description = chargeAmountData.lines[0].description || description;
      } else if (charge.memo && typeof charge.memo === 'object' && (charge.memo as { description?: string }).description) {
        description = (charge.memo as { description?: string }).description;
      } else if (charge.memo && typeof charge.memo === 'string') {
        description = charge.memo;
      }

      return {
        id: charge.id,
        invoice_number: charge.reference || `INV-${charge.id.slice(-8).toUpperCase()}`,
        description,
        amount: chargeAmount,
        open_balance: amountRemaining,
        status: charge.status === 'paid' ? 'paid' as const : 
                charge.status === 'draft' ? 'draft' as const :
                amountRemaining === 0 ? 'paid' as const :
                new Date(charge.due_date || charge.bill_date) < new Date() ? 'overdue' as const : 'pending' as const,
        bill_date: charge.bill_date || charge.created_at,
        due_date: charge.due_date,
        paid_date: charge.status === 'paid' ? charge.created_at : null,
        created_at: charge.created_at,
        type: billingType,
        account_name: accountName,
        property: propertyData ? { name: propertyData.name } : null,
        unit: unitData ? { unit_name: unitData.unit_name } : null
      };
    });

    return NextResponse.json(billingItems);
  } catch (error) {
    console.error('Error in billing API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 