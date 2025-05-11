"use client";

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider';
import { Livery } from '@/components/livery_card';
import { useSearchParams, useRouter } from 'next/navigation';

export function useLiveries() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial values from URL params
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialPageSize = Number(searchParams.get('pageSize')) || 20;

  // Parse sort parameters from URL
  const sortParam = searchParams.get('sort');
  let initialSortBy = 'created_at';
  let initialSortOrder: 'asc' | 'desc' = 'desc';

  if (sortParam) {
    const [field, order] = sortParam.split('-');
    if (field && order) {
      initialSortBy = field;
      initialSortOrder = order as 'asc' | 'desc';
    }
  }

  const initialSearchQuery = searchParams.get('search') || '';
  const initialAircraftFilter = searchParams.get('aircraft') || null;

  const [liveries, setLiveries] = useState<Livery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortBy, setSortBy] = useState<string>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [aircraftFilter, setAircraftFilter] = useState<string | null>(initialAircraftFilter)
  const supabaseClient = useSupabase()

  // Effect to handle URL changes
  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const sortParam = searchParams.get('sort');
    const search = searchParams.get('search') || '';
    const aircraft = searchParams.get('aircraft') || null;

    let sortBy = 'created_at';
    let sortOrder: 'asc' | 'desc' = 'desc';

    if (sortParam) {
      const [field, order] = sortParam.split('-');
      if (field && order) {
        sortBy = field;
        sortOrder = order as 'asc' | 'desc';
      }
    }

    setPage(page);
    setPageSize(pageSize);
    setSortBy(sortBy);
    setSortOrder(sortOrder);
    setSearchQuery(search);
    setAircraftFilter(aircraft);
  }, [searchParams]);

  // Function to update URL params
  const updateUrlParams = (params: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    router.push(`/liveries?${newParams.toString()}`);
  };

  // Wrapper functions to update both state and URL
  const updatePage = (newPage: number) => {
    setPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const updatePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    updateUrlParams({ pageSize: newPageSize });
  };

  const updateSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateUrlParams({
      sort: `${newSortBy}-${newSortOrder}`,
      page: 1 // Reset to page 1 when sorting changes
    });
  };

  const updateSearch = (newSearch: string) => {
    setSearchQuery(newSearch);
    updateUrlParams({ search: newSearch, page: 1 }); // Reset to page 1 on new search
  };

  const updateAircraftFilter = (newFilter: string | null) => {
    setAircraftFilter(newFilter);
    updateUrlParams({ aircraft: newFilter, page: 1 }); // Reset to page 1 on new filter
  };

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
        query = query.eq('vehicle_name', aircraftFilter)
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
    setPage: updatePage,
    pageSize,
    setPageSize: updatePageSize,
    sortBy,
    sortOrder,
    setSort: updateSort,
    searchQuery,
    setSearchQuery: updateSearch,
    aircraftFilter,
    setAircraftFilter: updateAircraftFilter
  }
}