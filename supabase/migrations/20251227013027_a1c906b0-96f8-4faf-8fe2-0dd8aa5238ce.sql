-- Enum para tipos de permissão
CREATE TYPE public.permission_action AS ENUM ('create', 'read', 'update', 'delete');

-- Adicionar coluna admin_user_id à tabela team_members existente (renomear user_id para consistência)
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tabela de credenciais de acesso (separada para segurança)
CREATE TABLE IF NOT EXISTS public.team_member_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL UNIQUE REFERENCES public.team_members(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de permissões granulares por módulo
CREATE TABLE IF NOT EXISTS public.team_member_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    action permission_action NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    restrictions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_permission UNIQUE (team_member_id, module_key, action)
);

-- Tabela de sessões de membros da equipe
CREATE TABLE IF NOT EXISTS public.team_member_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_member_credentials_username ON public.team_member_credentials(username);
CREATE INDEX IF NOT EXISTS idx_team_member_permissions_member ON public.team_member_permissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_sessions_token ON public.team_member_sessions(token);
CREATE INDEX IF NOT EXISTS idx_team_member_sessions_expires ON public.team_member_sessions(expires_at);

-- Habilitar RLS
ALTER TABLE public.team_member_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para team_member_credentials
CREATE POLICY "Admins can manage credentials for their team"
ON public.team_member_credentials
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.id = team_member_credentials.team_member_id
        AND tm.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.id = team_member_credentials.team_member_id
        AND tm.user_id = auth.uid()
    )
);

-- Políticas RLS para team_member_permissions
CREATE POLICY "Admins can manage permissions for their team"
ON public.team_member_permissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.id = team_member_permissions.team_member_id
        AND tm.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.id = team_member_permissions.team_member_id
        AND tm.user_id = auth.uid()
    )
);

-- Políticas RLS para team_member_sessions (service role only para autenticação)
CREATE POLICY "Service role can manage sessions"
ON public.team_member_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_team_member_credentials_updated_at
    BEFORE UPDATE ON public.team_member_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar permissão de membro da equipe
CREATE OR REPLACE FUNCTION public.team_member_has_permission(
    _team_member_id UUID,
    _module_key TEXT,
    _action permission_action
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_member_permissions
        WHERE team_member_id = _team_member_id
          AND module_key = _module_key
          AND action = _action
          AND is_allowed = true
    )
$$;

-- Função para obter restrições de permissão
CREATE OR REPLACE FUNCTION public.get_team_member_restrictions(
    _team_member_id UUID,
    _module_key TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT jsonb_object_agg(action::text, restrictions)
         FROM public.team_member_permissions
         WHERE team_member_id = _team_member_id
           AND module_key = _module_key
           AND is_allowed = true),
        '{}'::jsonb
    )
$$;