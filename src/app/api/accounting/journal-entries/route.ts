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
  lines: JournalEntryLine[]
  memo?: string
  reference: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json() as JournalEntryRequest

    const {
      property_id,
      entry_type,
      entry_date,
      lines,
      memo,
      reference
    } = body

    // Validate the entry
    if (!property_id || !entry_date || !lines || lines.length === 0 || !reference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate debits and credits balance
    const totalDebits = lines.reduce((sum: number, line: JournalEntryLine) => sum + (parseFloat(line.debits) || 0), 0)
    const totalCredits = lines.reduce((sum: number, line: JournalEntryLine) => sum + (parseFloat(line.credits) || 0), 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json(
        { error: "Debits and credits must be equal" },
        { status: 400 }
      )
    }

    // Validate reference number uniqueness
    const { data: existingEntry, error: referenceError } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("reference", reference)
      .single()

    if (referenceError && referenceError.code !== "PGRST116") {
      throw referenceError
    }

    if (existingEntry) {
      return NextResponse.json(
        { error: "Reference number already exists" },
        { status: 400 }
      )
    }

    // Insert the journal entry
    const { data: journalEntry, error: journalError } = await supabase
      .from("journal_entries")
      .insert({
        property_id,
        entry_type,
        entry_date,
        memo,
        reference,
        total_amount: totalDebits // Since debits = credits, either can be used
      })
      .select()
      .single()

    if (journalError) throw journalError

    // Insert the journal entry lines
    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(
        lines.map((line: JournalEntryLine) => ({
          journal_entry_id: journalEntry.id,
          category: line.category,
          unit: line.unit,
          description: line.description,
          debit_amount: parseFloat(line.debits) || 0,
          credit_amount: parseFloat(line.credits) || 0
        }))
      )

    if (linesError) throw linesError

    return NextResponse.json(journalEntry)
  } catch (error) {
    console.error("Error creating journal entry:", error)
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    )
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