import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Clerk webhook secret for verification
const webhookSecret = process.env.CLERK_USER_CREATED_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  // Get the headers
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
  }

  // Get the body
  const body = await req.text()

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 })
  }

  // Only subscribed to user.created
  if (evt.type !== "user.created") {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  // Handle the webhook
  const { id, username, image_url, created_at } = evt.data

  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: id,
        username: username,
        image_url: image_url,
        created_at: new Date(created_at).toISOString(),
      })
      .single()

    if (error) throw error
    
    console.log('User added successfully')
    return NextResponse.json({ message: 'User added successfully'}, { status: 200 })
  } catch (error) {
    console.error('Error adding user to Supabase:', error)
    return NextResponse.json({ error: 'Error adding user to database' }, { status: 500 })
  }
}