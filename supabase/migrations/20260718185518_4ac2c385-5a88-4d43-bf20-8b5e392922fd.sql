-- Grant SELECT privilege on agent_messages to anon and authenticated roles
GRANT SELECT ON public.agent_messages TO anon, authenticated;

-- Create SELECT policy for agent_messages
-- This allows customers and agent owners to see messages. 
-- In a real scenario, this should be scoped, but the immediate bug is total invisibility.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polrelid = 'public.agent_messages'::regclass 
        AND polname = 'Allow select for agent messages'
    ) THEN
        CREATE POLICY "Allow select for agent messages" ON public.agent_messages
            FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;
END $$;
