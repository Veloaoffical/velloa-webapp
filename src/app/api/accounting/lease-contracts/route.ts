import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Property {
  id: string;
  name: string;
  address_line_1?: string;
  address_line_2?: string | null;
  city?: string;
  state?: string;
  zip?: string;
}

interface Unit {
  unit_id: string;
  unit_number?: string;
  unit_name?: string;
}

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

    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error('❌ Auth error:', sessionError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('❌ Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // First process any rollovers, then fetch lease contracts with related data
    await supabase.rpc('auto_process_lease_rollovers');
    
    const { data: leases, error: leasesError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_term,
        deposit_amount,
        property_id,
        unit_id,
        tenant_id,
        lease_status,
        property:properties(
          id,
          name,
          address_line_1,
          address_line_2,
          city,
          state,
          zip
        ),
        unit:units(
          unit_id,
          unit_name
        )
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false });

    if (leasesError) {
      console.error('❌ Error fetching lease contracts:', leasesError);
      return NextResponse.json({ error: 'Failed to fetch lease contracts' }, { status: 500 });
    }

    // Collect all tenant IDs from the leases
    const tenantIds: string[] = [];
    leases.forEach(lease => {
      if (lease.tenant_id) {
        try {
          const tenantData = typeof lease.tenant_id === 'string' 
            ? JSON.parse(lease.tenant_id) 
            : lease.tenant_id;
          
          // Handle both new array format (UUID strings) and old object format
          let tenantId: string | null = null;
          if (Array.isArray(tenantData)) {
            // New structure: array of UUID strings
            tenantId = typeof tenantData[0] === 'string' ? tenantData[0] : tenantData[0]?.id;
          } else if (typeof tenantData === 'string') {
            // Single tenant ID as string
            tenantId = tenantData;
          } else if (tenantData && tenantData.id) {
            // Old structure: object with id field
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

    // Fetch tenant details from the people table if we have tenant IDs
    const tenantDetailsMap: Record<string, TenantInfo> = {};
    
    if (tenantIds.length > 0) {
      const { data: tenants, error: tenantsError } = await supabase
        .from('people')
        .select('id, first_name, last_name, email, phone')
        .in('id', tenantIds);
      
      if (tenantsError) {
        console.error('❌ Error fetching tenant details:', tenantsError);
      } else if (tenants) {
        // Create a map of tenant ID to tenant details
        tenants.forEach(tenant => {
          tenantDetailsMap[tenant.id] = {
            id: tenant.id,
            first_name: tenant.first_name,
            last_name: tenant.last_name,
            email: tenant.email,
            phone: tenant.phone
          };
        });
      }
    }

    // Transform the data to match the frontend interface
    const transformedLeases = leases.map(lease => {
      // Parse tenant information from JSON string if it exists
      let tenant: TenantInfo | null = null;
      if (lease.tenant_id) {
        try {
          // The tenant_id field might be a JSON string or already a parsed object
          const tenantData = typeof lease.tenant_id === 'string' 
            ? JSON.parse(lease.tenant_id) 
            : lease.tenant_id;
          
          // Handle both new array format (UUID strings) and old object format
          let tenantId: string | null = null;
          if (Array.isArray(tenantData)) {
            // New structure: array of UUID strings
            tenantId = typeof tenantData[0] === 'string' ? tenantData[0] : tenantData[0]?.id;
          } else if (typeof tenantData === 'string') {
            // Single tenant ID as string
            tenantId = tenantData;
          } else if (tenantData && tenantData.id) {
            // Old structure: object with id field
            tenantId = tenantData.id;
          }
          
          // Use tenant details from the people table if available
          if (tenantId && tenantDetailsMap[tenantId]) {
            tenant = tenantDetailsMap[tenantId];
          } else if (tenantId) {
            // Fallback to the data in the lease contract
            tenant = {
              id: tenantId,
              name: tenantId,
              first_name: '',
              last_name: ''
            };
          }
        } catch (e) {
          console.error('Error parsing tenant data:', e);
        }
      }

      // Create a formatted address from the available address fields
      let formattedAddress = '';
      if (lease.property) {
        // Type assertion to handle property as a single object, not an array
        const propertyData = lease.property as unknown as Property;
        
        const addressParts = [
          propertyData.address_line_1,
          propertyData.address_line_2,
          [
            propertyData.city,
            propertyData.state,
            propertyData.zip
          ].filter(Boolean).join(', ')
        ].filter(Boolean);
        
        formattedAddress = addressParts.join(', ');
      }

      // Type assertion for unit data
      const unitData = lease.unit as unknown as Unit;

      // Determine tenant name from available data
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
        property_name: lease.property ? (lease.property as unknown as Property).name || 'Unknown Property' : 'Unknown Property',
        unit_name: unitData?.unit_name || 'Unknown Unit',
        property: {
          name: lease.property ? (lease.property as unknown as Property).name || 'Unknown Property' : 'Unknown Property',
          address: formattedAddress
        },
        unit: {
          unit_number: unitData?.unit_name || 'Unknown Unit'
        },
        tenant: tenant,
        start_date: lease.start_date,
        end_date: lease.end_date,
        rent_amount: lease.rent_amount || '0',
        lease_term: lease.lease_term,
        deposit_amount: lease.deposit_amount || '0'
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