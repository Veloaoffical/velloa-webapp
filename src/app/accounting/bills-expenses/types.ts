// Shared types for bills-expenses components

export interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance?: number
  start_balance?: number
  accounting_start_date?: string
  owner_id?: string
  property_balance?: Array<{
    property_id: string
    property_name: string
    balance: number
    start_balance: number
    accounting_start_date: string
  }>
  active_account?: boolean
  sub_accounts?: Array<{
    id: string
    account_name: string
    account_subtype: string
    account_balance?: number
  }>
}

export interface Property {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  zip?: string
  active?: boolean
}

export interface Unit {
  id: string
  unit_number: string
  property_id: string
}

export interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  tenant?: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    name?: string
  } | null
  property?: {
    name: string
    address: string
  }
  unit?: {
    unit_number: string
  }
  start_date?: string
  end_date?: string
  rent_amount?: string
  lease_term?: string
  deposit_amount?: string
}

export interface Person {
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

export interface ChargeLine {
  line_id: string
  category_id?: string
  category?: string
  description: string
  amount: number
  category_info?: {
    id: string
    account_name: string
    account_type: string
    account_subtype: string
  }
  property_id?: string
  unit_id?: string
}

export interface Charge {
  id: string
  company_id: string
  lease_id: string
  property_id: string
  unit_id: string
  people_id: string
  charge_amount: {
    lines?: ChargeLine[]
    total_amount: number
    accounts_receivable_id?: string
  }
  amount_remaining: {
    lines?: ChargeLine[]
    total_amount: number
    accounts_receivable_id?: string
  }
  due_date: string
  memo?: {
    type: string
    content: string
    root?: {
      type: string
      format: string
      indent: number
      version: number
      children: Array<{
        type: string
        format: string
        indent: number
        version: number
        children: never[]
        direction: string | null
        textStyle: string
        textFormat: number
      }>
      direction: string | null
    }
  } | null
  reference: string
  status: string
  created_at: string
  created_by: string
  share_with_tenants: boolean
  charge_type: string
  lease_contracts?: {
    tenant_name: string
    unit_name: string
    property_name: string
  }[]
}

export interface BillsExpensesClientProps {
  initialAccounts: Account[]
  initialProperties: Property[]
  initialLeases: Lease[]
  initialPeople: Person[]
  initialCharges: Charge[]
} 