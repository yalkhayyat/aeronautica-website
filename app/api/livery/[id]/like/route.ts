import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from "@clerk/nextjs/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const liveryId = parseInt(params.id)
    if (isNaN(liveryId)) {
      return NextResponse.json({ error: 'Invalid livery ID' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('toggle_like', { livery_id: liveryId, user_id: userId })

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'P0002') {
        return NextResponse.json({ error: 'Livery not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data === null) {
      return NextResponse.json({ error: 'Like operation failed' }, { status: 500 })
    }

    return NextResponse.json({ likes: data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
