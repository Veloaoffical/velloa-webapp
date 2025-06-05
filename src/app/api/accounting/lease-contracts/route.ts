import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TenantInfo {
  id: string;
  tenant_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export async function GET() {
  try {
    console.log('🔍 Fetching lease contracts for accounting');
    const supabase = await createClient();

    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      console.error('❌ Auth error:', sessionError || 'No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('❌ Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    await supabase.rpc('auto_process_lease_rollovers');
    
    const { data: leases, error: leasesError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_type,
        deposits,
        tenant_id,
        lease_status,
        property:properties (
          id,
          name
        ),
        unit:units (
          unit_id,
          unit_name
        )
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false });

    if (leasesError) {
      console.error('❌ Error fetching lease contracts:', leasesError);
      return NextResponse.json({ error: 'Failed to fetch lease contracts', details: leasesError.message }, { status: 500 });
    }

    if (!leases) {
      return NextResponse.json([], { status: 200 });
    }

    const tenantIds: string[] = [];
    leases.forEach(lease => {
      if (lease.tenant_id) {
        try {
          const tenantData = typeof lease.tenant_id === 'string' 
            ? JSON.parse(lease.tenant_id) 
            : lease.tenant_id;
          
          let tenantId: string | null = null;
          if (Array.isArray(tenantData)) {
            tenantId = typeof tenantData[0] === 'string' ? tenantData[0] : tenantData[0]?.id;
          } else if (typeof tenantData === 'string') {
            tenantId = tenantData;
          } else if (tenantData && tenantData.id) {
            tenantId = tenantData.id;
          }
          
          if (tenantId) {
            tenantIds.push(tenantId);
          }
        } catch (e) {
          console.error('Error parsing tenant data:', e);
        }
      }
    });

    const { data: tenants, error: tenantsError } = tenantIds.length > 0 
      ? await supabase.from('people').select('id, first_name, last_name, email, phone').eq('company_id', companyMember.company_id).in('id', tenantIds)
      : { data: [], error: null };

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: 'Failed to fetch tenants', details: tenantsError.message }, { status: 500 });
    }

    const tenantsMap = new Map(tenants?.map(t => [t.id, t]));

    const transformedLeases = leases.map(lease => {
      const property = Array.isArray(lease.property) ? lease.property[0] : lease.property;
      const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
      
      let tenant: TenantInfo | null = null;
      if (lease.tenant_id) {
        try {
          const tenantDataArr = typeof lease.tenant_id === 'string' 
            ? JSON.parse(lease.tenant_id) 
            : lease.tenant_id;
            
          let tenantId: string | null = null;
          if (Array.isArray(tenantDataArr)) {
            tenantId = typeof tenantDataArr[0] === 'string' ? tenantDataArr[0] : tenantDataArr[0]?.id;
          } else if (typeof tenantDataArr === 'string') {
            tenantId = tenantDataArr;
          } else if (tenantDataArr && tenantDataArr.id) {
            tenantId = tenantDataArr.id;
          }

          if (tenantId && tenantsMap.has(tenantId)) {
            const tenantData = tenantsMap.get(tenantId);
            if (tenantData) {
              tenant = {
                id: tenantData.id,
                first_name: tenantData.first_name,
                last_name: tenantData.last_name,
                email: tenantData.email,
                phone: tenantData.phone
              };
            }
          } else if (tenantId) {
            tenant = { id: tenantId, name: tenantId, first_name: '', last_name: '' };
          }
        } catch (e) {
          console.error('Error parsing tenant data:', e);
        }
      }

      let tenantName = 'Unknown Tenant';
      if (tenant) {
        if (tenant.first_name && tenant.last_name) {
          tenantName = `${tenant.first_name} ${tenant.last_name}`.trim();
        } else if (tenant.name) {
          tenantName = tenant.name;
        }
      }

      return {
        id: lease.id,
        tenant_name: tenantName,
        property_name: property?.name || 'Unknown Property',
        unit_name: unit?.unit_name || 'Unknown Unit',
        property: property ? {
          name: property.name || 'Unknown Property'
        } : null,
        unit: unit ? {
          unit_number: unit.unit_name || 'Unknown Unit'
        } : null,
        tenant: tenant,
        start_date: lease.start_date,
        end_date: lease.end_date,
        rent_amount: lease.rent_amount || '0',
        lease_type: lease.lease_type,
      };
    });

    console.log(`✅ Successfully fetched ${transformedLeases.length} lease contracts`);
    return NextResponse.json(transformedLeases);
  } catch (error) {
    console.error('❌ Error in lease contracts route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 