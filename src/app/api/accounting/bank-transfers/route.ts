import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface BankTransferRequest {
  source_property_id: string
  source_unit_id?: string
  source_account_id: string
  receiving_property_id: string
  receiving_unit_id?: string
  receiving_account_id: string
  transfer_date: string
  amount: number
  memo?: string
  reference: string
}

export async function POST(request: Request) {
  try {
    console.log('🚀 ============= BANK TRANSFER CREATION START =============');
    const supabase = await createClient()
    const body = await request.json() as BankTransferRequest

    console.log('📥 Received data:', JSON.stringify(body, null, 2));

    const {
      source_property_id,
      source_unit_id,
      source_account_id,
      receiving_property_id,
      receiving_unit_id,
      receiving_account_id,
      transfer_date,
      amount,
      memo,
      reference
    } = body

    // Validate required fields
    if (!source_property_id || !source_account_id || !receiving_property_id || !receiving_account_id || !transfer_date || !amount || !reference) {
      console.error('❌ Missing required fields:', { source_property_id, source_account_id, receiving_property_id, receiving_account_id, transfer_date, amount, reference });
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Create two transactions - one for each property
    console.log('📝 Creating source transaction...');
    const { data: sourceTransaction, error: sourceTransactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "bank_transfer",
        property: source_property_id,
        company: companyMember.company_id,
        created_by: companyMember.id,
        start_date: transfer_date,
        memo: memo ? JSON.parse(memo) : null,
        data: {
          reference,
          total_amount: amount,
          direction: "outgoing",
          source_account_id,
          source_unit_id,
          receiving_property_id,
          receiving_account_id,
          receiving_unit_id
        }
      })
      .select()
      .single()

    if (sourceTransactionError) {
      console.error('❌ Error creating source transaction:', {
        error: sourceTransactionError,
        message: sourceTransactionError.message,
        details: sourceTransactionError.details,
        hint: sourceTransactionError.hint,
        code: sourceTransactionError.code
      });
      throw sourceTransactionError;
    }

    console.log('📝 Creating receiving transaction...');
    const { data: receivingTransaction, error: receivingTransactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "bank_transfer",
        property: receiving_property_id,
        company: companyMember.company_id,
        created_by: companyMember.id,
        start_date: transfer_date,
        memo: memo ? JSON.parse(memo) : null,
        data: {
          reference,
          total_amount: amount,
          direction: "incoming",
          source_property_id,
          source_account_id,
          source_unit_id,
          receiving_account_id,
          receiving_unit_id
        }
      })
      .select()
      .single()

    if (receivingTransactionError) {
      console.error('❌ Error creating receiving transaction:', {
        error: receivingTransactionError,
        message: receivingTransactionError.message,
        details: receivingTransactionError.details,
        hint: receivingTransactionError.hint,
        code: receivingTransactionError.code
      });
      
      // Try to rollback the source transaction
      if (sourceTransaction) {
        await supabase
          .from("transaction")
          .delete()
          .eq("id", sourceTransaction.id)
      }
      
      throw receivingTransactionError;
    }

    console.log('✅ Bank transfer created successfully:', {
      sourceTransaction,
      receivingTransaction
    });
    
    return NextResponse.json({
      source_transaction: sourceTransaction,
      receiving_transaction: receivingTransaction
    })
  } catch (error) {
    console.error("❌ Error creating bank transfer:", error)
    return NextResponse.json(
      { error: "Failed to create bank transfer", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  } finally {
    console.log('🏁 ============= BANK TRANSFER CREATION END =============');
  }
} 