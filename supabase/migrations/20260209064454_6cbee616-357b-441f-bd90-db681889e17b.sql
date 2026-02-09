-- Create enum for key status
CREATE TYPE public.key_status AS ENUM ('active', 'disabled');

-- Create API keys table
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL,
    key_value TEXT NOT NULL UNIQUE,
    status key_status NOT NULL DEFAULT 'active',
    uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search logs table
CREATE TABLE public.search_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    query_param TEXT,
    response_status INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table for tracking
CREATE TABLE public.devices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    device_name TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    ip_address TEXT,
    location TEXT,
    status key_status NOT NULL DEFAULT 'active',
    logins INTEGER NOT NULL DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create public read policy for api_keys (for key validation)
CREATE POLICY "Allow public read for key validation" 
ON public.api_keys 
FOR SELECT 
USING (true);

-- Create public insert/update for api_keys (admin managed via password, not auth)
CREATE POLICY "Allow public insert for api_keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for api_keys" 
ON public.api_keys 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for api_keys" 
ON public.api_keys 
FOR DELETE 
USING (true);

-- Search logs policies
CREATE POLICY "Allow public read for search_logs" 
ON public.search_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for search_logs" 
ON public.search_logs 
FOR INSERT 
WITH CHECK (true);

-- Devices policies
CREATE POLICY "Allow public read for devices" 
ON public.devices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for devices" 
ON public.devices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for devices" 
ON public.devices 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete for devices" 
ON public.devices 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for api_keys
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment key usage
CREATE OR REPLACE FUNCTION public.increment_key_usage(key_val TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.api_keys 
    SET uses = uses + 1, updated_at = now()
    WHERE key_value = key_val AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;