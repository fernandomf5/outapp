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
      case 'login': {
        const { username, password } = data
        const normalizedEmail = String(username ?? '').toLowerCase().trim()
        console.log('Login attempt for username:', normalizedEmail)

        if (!normalizedEmail || !password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Usuário e senha são obrigatórios' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Find team member by email
        const { data: teamMember, error: tmError } = await supabaseAdmin
          .from('team_members')
          .select('id,name,email,status,linked_user_id,user_id')
          .eq('email', normalizedEmail)
          .eq('status', 'active')
          .maybeSingle()

        if (tmError || !teamMember) {
          console.error('Team member not found:', tmError)
          return new Response(
            JSON.stringify({ success: false, error: 'Usuário não encontrado ou inativo' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Check if linked user exists (invite accepted)
        if (!teamMember.linked_user_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Este membro ainda não aceitou o convite da equipe' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Validate password using Supabase Auth (email + senha do usuário)
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (authError || !authData?.user) {
          console.error('Invalid credentials:', authError)
          return new Response(
            JSON.stringify({ success: false, error: 'Usuário ou senha incorretos' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        if (authData.user.id !== teamMember.linked_user_id) {
          console.error('User mismatch for team member login')
          return new Response(
            JSON.stringify({ success: false, error: 'Esta conta não está vinculada a este acesso de equipe' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Keep the Supabase session tokens to return to the client
        // This allows RLS policies to work via auth.uid()
        const supabaseAccessToken = authData.session?.access_token
        const supabaseRefreshToken = authData.session?.refresh_token

        // Generate our own session token for team member context
        const sessionToken = generateToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

        // Store session in database
        const { error: sessionError } = await supabaseAdmin
          .from('team_member_sessions')
          .insert({
            team_member_id: teamMember.id,
            token: sessionToken,
            expires_at: expiresAt,
          })

        if (sessionError) {
          console.error('Error creating session:', sessionError)
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao criar sessão' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // Get permissions for this team member
        const { data: permissions } = await supabaseAdmin
          .from('team_member_permissions')
          .select('module_key, action, is_allowed, restrictions')
          .eq('team_member_id', teamMember.id)

        // Get admin name
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', teamMember.user_id)
          .maybeSingle()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

        console.log('Login successful for team member:', teamMember.id)

        return new Response(
          JSON.stringify({
            success: true,
            token: sessionToken,
            expiresAt,
            // Return Supabase session so client can set it for RLS
            supabaseAccessToken,
            supabaseRefreshToken,
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              adminUserId: teamMember.user_id,
              adminName,
            },
            permissions: permissions || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate': {
        const { token } = data
        console.log('Validating session token')

        if (!token) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Token é obrigatório' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        // Find valid session
        const { data: session, error: sessionError } = await supabaseAdmin
          .from('team_member_sessions')
          .select('id, team_member_id, expires_at, revoked_at')
          .eq('token', token)
          .maybeSingle()

        if (sessionError || !session) {
          console.error('Session not found:', sessionError)
          return new Response(
            JSON.stringify({ valid: false, error: 'Sessão não encontrada' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if session is expired or revoked
        if (new Date(session.expires_at) < new Date() || session.revoked_at) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Sessão expirada' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: teamMember, error: tmError } = await supabaseAdmin
          .from('team_members')
          .select('id, name, email, user_id, status')
          .eq('id', session.team_member_id)
          .maybeSingle()

        if (tmError || !teamMember) {
          console.error('Team member not found for session:', tmError)
          return new Response(
            JSON.stringify({ valid: false, error: 'Membro não encontrado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (teamMember.status !== 'active') {
          return new Response(
            JSON.stringify({ valid: false, error: 'Membro inativo' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get permissions
        const { data: permissions } = await supabaseAdmin
          .from('team_member_permissions')
          .select('module_key, action, is_allowed, restrictions')
          .eq('team_member_id', teamMember.id)

        // Get admin name
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', teamMember.user_id)
          .maybeSingle()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

        return new Response(
          JSON.stringify({
            valid: true,
            teamMember: {
              id: teamMember.id,
              name: teamMember.name,
              email: teamMember.email,
              adminUserId: teamMember.user_id,
              adminName,
            },
            permissions: permissions || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'logout': {
        const { token } = data
        console.log('Logging out session')

        if (token) {
          // Revoke the session
          await supabaseAdmin
            .from('team_member_sessions')
            .update({ revoked_at: new Date().toISOString() })
            .eq('token', token)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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

        // Get admin profile
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', adminUserId)
          .maybeSingle()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

        // Check if there's already a pending invitation for this email
        const { data: existingInvitation } = await supabaseAdmin
          .from('team_invitations')
          .select('id')
          .eq('admin_user_id', adminUserId)
          .eq('invited_email', invitedEmail.toLowerCase().trim())
          .eq('status', 'pending')
          .maybeSingle()

        // If there is already a pending invite, we simply reissue a token and resend the email
        if (existingInvitation?.id) {
          const invitationToken = generateToken()
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

          const { error: updateError } = await supabaseAdmin
            .from('team_invitations')
            .update({
              invitation_token: invitationToken,
              expires_at: expiresAt,
            })
            .eq('id', existingInvitation.id)

          if (updateError) {
            console.error('Error updating existing invitation:', updateError)
            return new Response(
              JSON.stringify({ success: false, error: 'Erro ao atualizar convite existente: ' + updateError.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          const acceptUrl = `https://outapp.com.br/aceitar-convite?token=${invitationToken}`

          try {
            const emailResponse = await resend.emails.send({
              from: 'OutApp <noreply@outapp.com.br>',
              to: [invitedEmail],
              subject: `${adminName} reenviou o convite para a equipe`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #6366f1;">Convite para Equipe</h1>
                  <p>Olá!</p>
                  <p><strong>${adminName}</strong> reenviou o convite para você fazer parte da equipe no OutApp.</p>
                  ${role ? `<p>Cargo: <strong>${role}</strong></p>` : ''}
                  ${department ? `<p>Departamento: <strong>${department}</strong></p>` : ''}
                  <p>Clique no botão abaixo para aceitar o convite:</p>
                  <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Aceitar Convite
                  </a>
                  <p style="margin-top: 20px; color: #666; font-size: 12px;">Este convite expira em 7 dias.</p>
                </div>
              `,
            })
            console.log('Email resent successfully:', emailResponse)
          } catch (emailError: any) {
            console.error('Error resending email (existing invitation):', emailError)
          }

          return new Response(
            JSON.stringify({
              success: true,
              resent: true,
              message: 'Convite já estava pendente e foi reenviado',
              invitationId: existingInvitation.id,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

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
            from: 'OutApp <noreply@outapp.com.br>',
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
            from: 'OutApp <noreply@outapp.com.br>',
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
          .update({ status: 'rejected' })
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

        // Get admin profile separately
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', invitation.admin_user_id)
          .maybeSingle()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

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
              invitation_id: invitation.id,
              linked_user_id: acceptingUserId
            })
            .select()
            .single()

          if (!memberError && newMember) {
            teamMemberId = newMember.id
          }
        } else {
          // Update existing team member with linked user
          await supabaseAdmin
            .from('team_members')
            .update({
              status: 'active',
              linked_user_id: acceptingUserId
            })
            .eq('id', teamMemberId)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Convite aceito com sucesso!',
            teamMemberId,
            adminName
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

      case 'check_invitation': {
        const { token } = data

        if (!token) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Token é obrigatório' }),
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
          .maybeSingle()

        if (inviteError) {
          console.error('Error checking invitation:', inviteError)
          return new Response(
            JSON.stringify({ valid: false, error: 'Erro ao verificar convite' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        if (!invitation) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Convite inválido ou expirado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get admin profile separately
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', invitation.admin_user_id)
          .maybeSingle()

        const adminName = adminProfile?.full_name || adminProfile?.email || 'Administrador'

        return new Response(
          JSON.stringify({ 
            valid: true, 
            adminName,
            invitedEmail: invitation.invited_email
          }),
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