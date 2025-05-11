import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log("Fetching user stats for ID:", userId);
    
    // Get user data - using exact match for user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, image_url')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("User data error:", userError);
      
      // Try to generate dummy data if user not found
      return NextResponse.json({
        user: {
          username: "User " + userId.substring(0, 8),
          image_url: "",
          banner_url: null
        },
        stats: {
          liveries: 0,
          likes: 0,
          saves: 0
        }
      });
    }

    // Count total liveries by user
    const { count: liveriesCount, error: countError } = await supabase
      .from('liveries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error("Liveries count error:", countError);
      
      return NextResponse.json({
        user: {
          ...userData,
          banner_url: null // Adding this since our component expects it
        },
        stats: {
          liveries: 0,
          likes: 0,
          saves: 0
        }
      });
    }

    // Try RPC function first for likes
    const { data: likesData, error: likesError } = await supabase
      .rpc('get_total_user_likes', { user_id_param: userId });

    // Try RPC function first for saves
    const { data: savesData, error: savesError } = await supabase
      .rpc('get_total_user_saves', { user_id_param: userId });

    // If either RPC fails, fall back to manual calculation
    if (likesError || savesError) {
      console.log("Using manual calculation for likes/saves");
      
      // Manual calculation for likes and saves
      const { data: liveries, error: liveriesError } = await supabase
        .from('liveries')
        .select('likes, saves')
        .eq('user_id', userId);
        
      if (liveriesError) {
        console.error("Liveries error:", liveriesError);
        return NextResponse.json({
          user: {
            ...userData, 
            banner_url: null
          },
          stats: {
            liveries: liveriesCount || 0,
            likes: 0,
            saves: 0
          }
        });
      }
      
      // Calculate total likes and saves
      const totalLikes = liveries?.reduce((sum, livery) => sum + (livery.likes || 0), 0) || 0;
      const totalSaves = liveries?.reduce((sum, livery) => sum + (livery.saves || 0), 0) || 0;
      
      return NextResponse.json({
        user: {
          ...userData, 
          banner_url: null
        },
        stats: {
          liveries: liveriesCount || 0,
          likes: totalLikes,
          saves: totalSaves
        }
      });
    }
    
    // If RPCs worked, use their results
    return NextResponse.json({
      user: {
        ...userData, 
        banner_url: null
      },
      stats: {
        liveries: liveriesCount || 0,
        likes: likesData || 0,
        saves: savesData || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
} 