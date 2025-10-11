import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    const { action, userId, data } = await req.json()

    switch (action) {
      case 'delete':
        // Delete user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        
        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'update_password':
        // Update user password
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: data.password }
        )
        if (passwordError) throw passwordError
        
        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'update_profile':
        // Update user profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: data.full_name,
            email: data.email
          })
          .eq('user_id', userId)
        
        if (profileError) throw profileError
        
        // Also update auth email if changed
        if (data.email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email: data.email }
          )
          if (emailError) throw emailError
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Profile updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})