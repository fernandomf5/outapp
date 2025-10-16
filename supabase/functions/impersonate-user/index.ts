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

  console.log('=== Início da requisição de impersonation ===');

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
    console.log('Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    console.log('Admin user obtido:', adminUser?.email, 'Erro:', authError?.message);
    
    if (authError || !adminUser) {
      throw new Error('Não autorizado');
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id);

    console.log('Roles do usuário:', roles, 'Erro:', roleError?.message);

    if (roleError || !roles?.some(r => r.role === 'admin')) {
      throw new Error('Apenas administradores podem fazer login como outros usuários');
    }

    // Get the target user ID from request body
    const { userId } = await req.json();
    console.log('User ID alvo:', userId);

    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    
    console.log('Dados do usuário alvo:', userData?.user?.email, 'Erro:', userError?.message);
    
    if (userError || !userData.user) {
      throw new Error('Usuário não encontrado');
    }

    console.log('Gerando magic link para o usuário:', userData.user.email);

    const origin = req.headers.get('origin') || '';

    // Gerar magic link para o usuário alvo e redirecionar de volta ao app
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo: origin ? `${origin}/dashboard` : undefined,
      }
    });

    if (linkError) {
      console.error('Erro ao gerar magic link:', linkError);
      throw linkError;
    }

    const actionLink = linkData.properties.action_link;
    console.log('Magic link gerado:', actionLink);

    console.log('=== Impersonation (magic link) pronta ===');

    return new Response(
      JSON.stringify({
        success: true,
        user: userData.user,
        action_link: actionLink
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('=== Erro na impersonation ===');
    console.error('Erro completo:', error);
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
