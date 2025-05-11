import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from "@clerk/nextjs/server";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SECRET_KEY!
)

/**
 * Toggle like status for a livery
 */
export async function POST(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user ID
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Validate and parse livery ID
    const liveryId = parseInt(params.id)
    if (isNaN(liveryId)) {
      return NextResponse.json(
        { error: 'Invalid livery ID' }, 
        { status: 400 }
      )
    }

    // Call the Supabase RPC function to toggle the like
    const { data, error } = await supabase.rpc(
      'toggle_like_livery', 
      { livery_id_input: liveryId }
    )

    // Handle any errors
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      )
    }

    // Return the updated likes count
    return NextResponse.json({ 
      success: true,
      liked: data
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}
