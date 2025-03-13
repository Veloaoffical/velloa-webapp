export interface Property {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
}

export interface Unit {
  unit_id: string;
  unit_name: string;
}

export interface TenantInfo {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email?: string;
  phone?: string;
  unit?: {
    unit_number: string;
    property_name: string;
  };
}

export interface Lease {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_term: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant_id: string | null;
  tenant: TenantInfo | null;
} 