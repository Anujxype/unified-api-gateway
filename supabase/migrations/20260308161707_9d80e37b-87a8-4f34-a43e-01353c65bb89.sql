
-- Add new columns to api_keys for expiration, scoping, and IP whitelisting
ALTER TABLE public.api_keys 
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS allowed_ips text[] DEFAULT NULL;

-- Create login_logs table for realtime notifications
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  key_value text NOT NULL,
  device_info text DEFAULT NULL,
  ip_address text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_logs
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for login_logs
CREATE POLICY "Allow public insert for login_logs" ON public.login_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for login_logs" ON public.login_logs FOR SELECT USING (true);

-- Enable realtime for login_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_logs;
