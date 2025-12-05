
-- Create enum for job status
CREATE TYPE public.job_approval_status AS ENUM ('pending', 'approved', 'revision', 'rejected');

-- Clients table (username/password auth, not email-based)
CREATE TABLE public.aprova_job_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, username)
);

-- Jobs table
CREATE TABLE public.aprova_job_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.aprova_job_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  status job_approval_status DEFAULT 'pending',
  revision_notes TEXT,
  rejection_notes TEXT,
  due_date DATE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments table
CREATE TABLE public.aprova_job_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.aprova_job_jobs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.aprova_job_clients(id) ON DELETE SET NULL,
  is_from_client BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.aprova_job_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.aprova_job_jobs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.aprova_job_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aprova_job_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprova_job_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprova_job_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprova_job_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can manage their own clients" ON public.aprova_job_clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view clients by token" ON public.aprova_job_clients
  FOR SELECT USING (true);

-- RLS Policies for jobs
CREATE POLICY "Users can manage their own jobs" ON public.aprova_job_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view and update jobs" ON public.aprova_job_jobs
  FOR SELECT USING (true);

CREATE POLICY "Public can update job status" ON public.aprova_job_jobs
  FOR UPDATE USING (true);

-- RLS Policies for comments
CREATE POLICY "Users can manage comments on their jobs" ON public.aprova_job_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM aprova_job_jobs WHERE id = job_id AND user_id = auth.uid())
  );

CREATE POLICY "Public can view and create comments" ON public.aprova_job_comments
  FOR SELECT USING (true);

CREATE POLICY "Public can insert comments" ON public.aprova_job_comments
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own notifications" ON public.aprova_job_notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_aprova_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers
CREATE TRIGGER update_aprova_job_clients_updated_at
  BEFORE UPDATE ON public.aprova_job_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_aprova_job_updated_at();

CREATE TRIGGER update_aprova_job_jobs_updated_at
  BEFORE UPDATE ON public.aprova_job_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_aprova_job_updated_at();

-- Trigger to create notification when job status changes
CREATE OR REPLACE FUNCTION public.notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pending' THEN
    INSERT INTO public.aprova_job_notifications (user_id, job_id, client_id, title, message)
    SELECT 
      NEW.user_id,
      NEW.id,
      NEW.client_id,
      CASE NEW.status
        WHEN 'approved' THEN 'Job Aprovado!'
        WHEN 'revision' THEN 'Revisão Solicitada'
        WHEN 'rejected' THEN 'Job Não Aprovado'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'O cliente aprovou o job: ' || NEW.title
        WHEN 'revision' THEN 'O cliente solicitou revisão no job: ' || NEW.title
        WHEN 'rejected' THEN 'O cliente não aprovou o job: ' || NEW.title
      END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_job_status_change
  AFTER UPDATE ON public.aprova_job_jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_status_change();
