import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_EMAIL = "fernandomoraisgarcia2011@gmail.com";

type Action =
  | "delete"
  | "update_password"
  | "update_profile"
  | "set_plan"
  | "remove_plan"
  | "set_block"
  | "reset_account";

interface RequestBody {
  action: Action;
  userId: string;
  data?: Record<string, unknown>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // --- AuthN: caller must be an authenticated admin ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Não autenticado" }, 401);

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return json({ error: "Não autenticado" }, 401);

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError) return json({ error: "Falha ao validar permissão" }, 500);
    if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

    const body = (await req.json()) as RequestBody;
    const { action, userId, data } = body ?? {};

    if (!action) return json({ error: "Ação inválida" }, 400);
    if (!userId) return json({ error: "Usuário não informado" }, 400);

    // Protect the master account from destructive actions
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const isMaster = targetProfile?.email === MASTER_EMAIL;
    const destructive: Action[] = ["delete", "reset_account", "set_block"];
    if (isMaster && destructive.includes(action)) {
      return json({ error: "Não é permitido executar esta ação na conta master" }, 403);
    }

    switch (action) {
      case "delete": {
        const { data: purged, error: purgeError } = await supabaseAdmin.rpc(
          "admin_purge_user_data",
          { _user_id: userId, _keep_account: false },
        );
        if (purgeError) throw purgeError;

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return json({ success: true, message: "Usuário e dados removidos", purged });
      }

      case "reset_account": {
        const { data: purged, error: purgeError } = await supabaseAdmin.rpc(
          "admin_purge_user_data",
          { _user_id: userId, _keep_account: true },
        );
        if (purgeError) throw purgeError;

        const newPassword = typeof data?.password === "string" ? data.password : null;
        if (newPassword) {
          if (newPassword.length < 8) return json({ error: "Senha deve ter ao menos 8 caracteres" }, 400);
          const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
          });
          if (error) throw error;
        }

        await supabaseAdmin
          .from("profiles")
          .update({ is_banned: false, blocked: false })
          .eq("user_id", userId);

        return json({ success: true, message: "Conta resetada", purged });
      }

      case "update_password": {
        const password = typeof data?.password === "string" ? data.password : "";
        if (password.length < 8) return json({ error: "Senha deve ter ao menos 8 caracteres" }, 400);

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (error) throw error;
        return json({ success: true, message: "Senha atualizada" });
      }

      case "update_profile": {
        const fullName = typeof data?.full_name === "string" ? data.full_name : undefined;
        const email = typeof data?.email === "string" ? data.email : undefined;

        const payload: Record<string, string> = {};
        if (fullName) payload.full_name = fullName;
        if (email) payload.email = email;
        if (Object.keys(payload).length === 0) return json({ error: "Nada para atualizar" }, 400);

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(payload)
          .eq("user_id", userId);
        if (profileError) throw profileError;

        if (email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email,
            email_confirm: true,
          });
          if (emailError) throw emailError;
        }

        return json({ success: true, message: "Perfil atualizado" });
      }

      case "set_block": {
        const blocked = data?.blocked === true;
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_banned: blocked, blocked })
          .eq("user_id", userId);
        if (error) throw error;

        // Ban at auth level as well so existing sessions cannot refresh
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: blocked ? "876000h" : "none",
        });
        if (authError) throw authError;

        return json({ success: true, message: blocked ? "Usuário bloqueado" : "Usuário desbloqueado" });
      }

      case "set_plan": {
        const planId = typeof data?.plan_id === "string" ? data.plan_id : "";
        if (!planId) return json({ error: "Plano não informado" }, 400);

        const { data: plan, error: planError } = await supabaseAdmin
          .from("plans")
          .select("id, name, duration_days")
          .eq("id", planId)
          .maybeSingle();
        if (planError) throw planError;
        if (!plan) return json({ error: "Plano não encontrado" }, 404);

        const customDays = Number(data?.duration_days);
        const days = Number.isFinite(customDays) && customDays > 0
          ? Math.floor(customDays)
          : (plan.duration_days ?? 30);

        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);

        // Only one active subscription at a time
        const { error: cancelError } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", userId)
          .eq("status", "active");
        if (cancelError) throw cancelError;

        const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: "admin",
        });
        if (insertError) throw insertError;

        return json({
          success: true,
          message: `Plano ${plan.name} aplicado por ${days} dias`,
          expires_at: expiresAt.toISOString(),
        });
      }

      case "remove_plan": {
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", userId)
          .eq("status", "active");
        if (error) throw error;
        return json({ success: true, message: "Plano removido" });
      }

      default:
        return json({ error: "Ação inválida" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    console.error("manage-user error:", message);
    return json({ error: message }, 400);
  }
});
