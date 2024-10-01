import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from './useClerkSupabaseClient'

export interface Livery {
    id: number;
    created_at: string;
    user_id: string;
    title: string;
    likes: number;
    image: string;
}

export function useLiveries() {
  const [liveries, setLiveries] = useState<Livery[]>([])
  const { user } = useUser()
  const supabaseClient = useClerkSupabaseClient()

  useEffect(() => {
    async function fetchLiveries() {
        const { data, error } = await supabaseClient
        .from('liveries')
        .select('*')
        .order('created_at', { ascending: false })      

        if (error) {
          console.error('Error fetching liveries:', error)
        } else {
          setLiveries(data as Livery[])
        }
    }

    if (user) {
      fetchLiveries()
    }
  }, [user, supabaseClient])

  return { liveries }
}