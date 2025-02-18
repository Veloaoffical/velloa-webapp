import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface JournalEntryLine {
  category: string
  unit: string
  description: string
  debits: string
  credits: string
}

interface JournalEntryRequest {
  property_id: string
  entry_type: "one_time" | "recurring"
  entry_date: string
  start_date?: string
  end_date?: string
  frequency?: string
  repeat_infinite?: boolean
  lines: JournalEntryLine[]
  memo?: string
  reference: string
}

export async function POST(request: Request) {
  try {
    console.log('🚀 ============= JOURNAL ENTRY CREATION START =============');
    const supabase = await createClient()
    const body = await request.json() as JournalEntryRequest

    console.log('📥 Received data:', JSON.stringify(body, null, 2));

    const {
      property_id,
      entry_type,
      entry_date,
      start_date,
      end_date,
      frequency,
      repeat_infinite,
      lines,
      memo,
      reference
    } = body

    // Validate the entry
    if (!property_id || !entry_date || !lines || lines.length === 0 || !reference) {
      console.error('❌ Missing required fields:', { property_id, entry_date, lines, reference });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate debits and credits balance
    const totalDebits = lines.reduce((sum: number, line: JournalEntryLine) => sum + (parseFloat(line.debits) || 0), 0)
    const totalCredits = lines.reduce((sum: number, line: JournalEntryLine) => sum + (parseFloat(line.credits) || 0), 0)

    console.log('💰 Totals:', { totalDebits, totalCredits });

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      console.error('❌ Debits and credits do not balance:', { totalDebits, totalCredits });
      return NextResponse.json(
        { error: "Debits and credits must be equal" },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 Auth User:', {
      id: user?.id,
      email: user?.email,
      role: user?.role
    });

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the user's profile
    console.log('🔍 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile:', {
      exists: !!profile,
      data: profile,
      error: profileError
    });

    if (profileError || !profile) {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // Get the user's company member record using profile ID
    console.log('🔍 Getting company membership with profile ID:', profile.id);
    const { data: companyMember, error: companyError } = await supabase
      .from("company_members")
      .select("id, company_id")
      .eq("id", profile.id)
      .single()

    console.log('🏢 Company Member:', {
      exists: !!companyMember,
      data: companyMember,
      error: companyError,
      profileId: profile.id
    });

    if (companyError || !companyMember) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json(
        { error: "User is not a member of any company" },
        { status: 403 }
      )
    }

    console.log('📝 Creating transaction...');
    // Insert the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "journal_entry",
        property: property_id,
        company: companyMember.company_id,
        created_by: companyMember.id,
        start_date: entry_type === "one_time" ? entry_date : start_date,
        due_date: end_date,
        repeat_infinite: repeat_infinite,
        frequency: frequency,
        memo: memo ? JSON.parse(memo) : null,
        vendor: null,
        data: {
          reference,
          total_amount: totalDebits,
          lines: lines.map(line => ({
            category: line.category,
            unit: line.unit,
            description: line.description,
            debit_amount: parseFloat(line.debits) || 0,
            credit_amount: parseFloat(line.credits) || 0
          }))
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Error creating transaction:', {
        error: transactionError,
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        code: transactionError.code
      });
      throw transactionError;
    }

    console.log('✅ Transaction created successfully:', transaction);
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("❌ Error creating journal entry:", error)
    return NextResponse.json(
      { error: "Failed to create journal entry", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  } finally {
    console.log('🏁 ============= JOURNAL ENTRY CREATION END =============');
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const property_id = searchParams.get("property_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    let query = supabase
      .from("journal_entries")
      .select(`
        *,
        property:properties(name),
        lines:journal_entry_lines(*)
      `)

    if (property_id) {
      query = query.eq("property_id", property_id)
    }

    if (start_date) {
      query = query.gte("entry_date", start_date)
    }

    if (end_date) {
      query = query.lte("entry_date", end_date)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch journal entries" },
      { status: 500 }
    )
  }
} 