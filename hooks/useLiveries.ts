import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider';
import { Livery } from '@/components/livery_card';

export function useLiveries(initialPage = 1, initialPageSize = 12) {
  const [liveries, setLiveries] = useState<Livery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [aircraftFilter, setAircraftFilter] = useState<string | null>(null)
  const supabaseClient = useSupabase()

  useEffect(() => {
    async function fetchLiveries() {
      setLoading(true)
      setError(null)

      let query = supabaseClient
        .from('liveries')
        .select('*', { count: 'exact' })

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      if (aircraftFilter) {
        query = query.eq('aircraft', aircraftFilter)
      }

      // First, get the total count
      const { count, error: countError } = await query

      if (countError) {
        console.error('Error fetching liveries count:', countError)
        setError('Failed to fetch liveries count')
        setLoading(false)
        return
      }

      setTotalCount(count || 0)

      // Then, get the paginated data
      const { data, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error('Error fetching liveries:', error)
        setError('Failed to fetch liveries')
      } else {
        setLiveries(data as Livery[])
      }

      setLoading(false)
    }

    fetchLiveries()
  }, [supabaseClient, page, pageSize, sortBy, sortOrder, searchQuery, aircraftFilter])

  return { 
    liveries, 
    loading, 
    error, 
    totalCount, 
    page, 
    setPage, 
    pageSize, 
    setPageSize, 
    sortBy, 
    setSortBy, 
    sortOrder, 
    setSortOrder,
    searchQuery,
    setSearchQuery,
    aircraftFilter,
    setAircraftFilter
  }
}