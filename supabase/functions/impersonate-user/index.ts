import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error('Não autorizado');
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id);

    if (roleError || !roles?.some(r => r.role === 'admin')) {
      throw new Error('Apenas administradores podem fazer login como outros usuários');
    }

    // Get the target user ID from request body
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new Error('Usuário não encontrado');
    }

    console.log('Gerando tokens para o usuário:', userData.user.email);

    // Generate access token for the target user using recovery link
    const { data: tokenData, error: tokenError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email!
    });

    if (tokenError) {
      console.error('Erro ao gerar tokens:', tokenError);
      throw tokenError;
    }

    console.log('Link gerado com sucesso');

    // Extract tokens from the action link URL
    const actionLink = tokenData.properties.action_link;
    const url = new URL(actionLink);
    const access_token = url.searchParams.get('access_token');
    const refresh_token = url.searchParams.get('refresh_token');

    if (!access_token || !refresh_token) {
      console.error('Tokens não encontrados na URL:', actionLink);
      throw new Error('Tokens não foram gerados corretamente');
    }

    console.log('Tokens extraídos com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        user: userData.user,
        access_token,
        refresh_token
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
