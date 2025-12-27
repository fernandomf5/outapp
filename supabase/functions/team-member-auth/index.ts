import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Simple hash function for password verification
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    const { action, ...data } = await req.json()
    console.log(`Team member auth action: ${action}`)

    switch (action) {
      case 'send_invitation': {
        const { adminUserId, invitedEmail, role, department, teamMemberId } = data
        
        console.log('Sending invitation to:', invitedEmail)

        if (!adminUserId || !invitedEmail) {
          console.error('Missing required fields:', { adminUserId, invitedEmail })
          return new Response(
            JSON.stringify({ success: false, error: 'Admin ID e email são obrigatórios' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Check if there's already a pending invitation for this email
        const { data: existingInvitation } = await supabaseAdmin
          .from('team_invitations')
          .select('id, status')
          .eq('admin_user_id', adminUserId)
          .eq('invited_email', invitedEmail.toLowerCase().trim())
          .eq('status', 'pending')
          .single()

        if (existingInvitation) {
          return new Response(
            JSON.stringify({ success: false, error: 'Já existe um convite pendente para este email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Get admin profile
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', adminUserId)
          .single()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

        // Generate invitation token
        const invitationToken = generateToken()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

        // Create invitation record
        const { data: invitation, error: inviteError } = await supabaseAdmin
          .from('team_invitations')
          .insert({
            admin_user_id: adminUserId,
            invited_email: invitedEmail.toLowerCase().trim(),
            invitation_token: invitationToken,
            status: 'pending',
            expires_at: expiresAt
          })
          .select()
          .single()

        if (inviteError) {
          console.error('Error creating invitation:', inviteError)
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao criar convite: ' + inviteError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Send invitation email
        const acceptUrl = `https://outapp.com.br/aceitar-convite?token=${invitationToken}`
        
        try {
          const emailResponse = await resend.emails.send({
            from: 'OutApp <noreply@resend.dev>',
            to: [invitedEmail],
            subject: `${adminName} convidou você para a equipe`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #6366f1;">Convite para Equipe</h1>
                <p>Olá!</p>
                <p><strong>${adminName}</strong> convidou você para fazer parte da equipe no OutApp.</p>
                ${role ? `<p>Cargo: <strong>${role}</strong></p>` : ''}
                ${department ? `<p>Departamento: <strong>${department}</strong></p>` : ''}
                <p>Clique no botão abaixo para aceitar o convite:</p>
                <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Aceitar Convite
                </a>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">
                  Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
                </p>
              </div>
            `
          })

          console.log('Email sent successfully:', emailResponse)
        } catch (emailError: any) {
          console.error('Error sending email:', emailError)
          // Don't fail the invitation if email fails, user can resend
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Convite enviado com sucesso',
            invitationId: invitation.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'resend_invitation': {
        const { invitationId } = data

        if (!invitationId) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID do convite é obrigatório' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Get invitation
        const { data: invitation, error: inviteError } = await supabaseAdmin
          .from('team_invitations')
          .select('*, admin:profiles!team_invitations_admin_user_id_fkey(full_name, email)')
          .eq('id', invitationId)
          .single()

        if (inviteError || !invitation) {
          return new Response(
            JSON.stringify({ success: false, error: 'Convite não encontrado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // Generate new token and extend expiration
        const newToken = generateToken()
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        await supabaseAdmin
          .from('team_invitations')
          .update({
            invitation_token: newToken,
            expires_at: newExpiresAt,
            status: 'pending'
          })
          .eq('id', invitationId)

        // Send email
        const adminName = (invitation as any).admin?.full_name || (invitation as any).admin?.email || 'Administrador'
        const acceptUrl = `https://outapp.com.br/aceitar-convite?token=${newToken}`

        try {
          await resend.emails.send({
            from: 'OutApp <noreply@resend.dev>',
            to: [invitation.invited_email],
            subject: `${adminName} reenviou o convite para a equipe`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #6366f1;">Convite para Equipe</h1>
                <p>Olá!</p>
                <p><strong>${adminName}</strong> reenviou o convite para você fazer parte da equipe no OutApp.</p>
                <p>Clique no botão abaixo para aceitar o convite:</p>
                <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Aceitar Convite
                </a>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">
                  Este convite expira em 7 dias.
                </p>
              </div>
            `
          })
        } catch (emailError: any) {
          console.error('Error resending email:', emailError)
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Convite reenviado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'cancel_invitation': {
        const { invitationId } = data

        if (!invitationId) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID do convite é obrigatório' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        await supabaseAdmin
          .from('team_invitations')
          .update({ status: 'cancelled' })
          .eq('id', invitationId)

        return new Response(
          JSON.stringify({ success: true, message: 'Convite cancelado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'accept_invitation': {
        const { token } = data

        if (!token) {
          return new Response(
            JSON.stringify({ success: false, error: 'Token é obrigatório' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Find valid invitation
        const { data: invitation, error: inviteError } = await supabaseAdmin
          .from('team_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single()

        if (inviteError || !invitation) {
          return new Response(
            JSON.stringify({ success: false, error: 'Convite inválido ou expirado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Get accepting user from auth header
        const authHeader = req.headers.get('Authorization')
        let acceptingUserId = null

        if (authHeader) {
          const userToken = authHeader.replace('Bearer ', '')
          const { data: { user } } = await supabaseAdmin.auth.getUser(userToken)
          acceptingUserId = user?.id
        }

        // Update invitation status
        await supabaseAdmin
          .from('team_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            accepted_by_user_id: acceptingUserId
          })
          .eq('id', invitation.id)

        // Create team member if not exists
        let teamMemberId = invitation.team_member_id

        if (!teamMemberId) {
          const { data: newMember, error: memberError } = await supabaseAdmin
            .from('team_members')
            .insert({
              user_id: invitation.admin_user_id,
              name: invitation.invited_email.split('@')[0],
              email: invitation.invited_email,
              role: 'Membro',
              department: 'geral',
              status: 'active',
              joined_date: new Date().toISOString(),
              invitation_id: invitation.id
            })
            .select()
            .single()

          if (!memberError && newMember) {
            teamMemberId = newMember.id
          }
        } else {
          // Update existing team member
          await supabaseAdmin
            .from('team_members')
            .update({
              status: 'active'
            })
            .eq('id', teamMemberId)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Convite aceito com sucesso!',
            teamMemberId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_permissions': {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        const { teamMemberId, permissions } = data

        // Verify team member belongs to this user
        const { data: teamMember, error: tmError } = await supabaseAdmin
          .from('team_members')
          .select('id, user_id')
          .eq('id', teamMemberId)
          .eq('user_id', user.id)
          .single()

        if (tmError || !teamMember) {
          return new Response(
            JSON.stringify({ error: 'Membro da equipe não encontrado ou não autorizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        // Delete existing permissions
        await supabaseAdmin
          .from('team_member_permissions')
          .delete()
          .eq('team_member_id', teamMemberId)

        // Insert new permissions
        if (permissions && permissions.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('team_member_permissions')
            .insert(permissions.map((p: any) => ({
              team_member_id: teamMemberId,
              module_key: p.module_key,
              action: p.action,
              is_allowed: true,
              restrictions: p.restrictions || {}
            })))

          if (insertError) {
            console.error('Insert permissions error:', insertError)
            return new Response(
              JSON.stringify({ error: 'Erro ao salvar permissões' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Permissões atualizadas com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        console.error('Unknown action:', action)
        return new Response(
          JSON.stringify({ error: 'Ação inválida: ' + action }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error('Team member auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor: ' + (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})