import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: async () => {
        const cookieStore = await cookies();
        return cookieStore;
      }
    });

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_admin, is_super_admin, admin_department')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user is an admin
    if (profile.role !== 'administrator' && !profile.is_admin && !profile.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query based on admin type
    let query = supabase
      .from('reimbursement_requests')
      .select(`
        *,
        profiles!reimbursement_requests_user_id_fkey (
          id,
          email,
          full_name,
          department
        ),
        reimbursement_items (*)
      `)
      .order('created_at', { ascending: false });

    // If department admin, only show their department's requests
    if (!profile.is_super_admin && profile.admin_department) {
      query = query.eq('profiles.department', profile.admin_department);
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'submitted' || r.status === 'pending').length || 0,
      approved: requests?.filter(r => r.status === 'approved').length || 0,
      rejected: requests?.filter(r => r.status === 'rejected').length || 0,
      totalAmount: requests?.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0) || 0,
    };

    return NextResponse.json({
      requests: requests || [],
      stats,
    });
  } catch (err) {
    console.error('Admin requests error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}