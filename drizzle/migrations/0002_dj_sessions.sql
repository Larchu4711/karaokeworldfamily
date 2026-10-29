CREATE TABLE public.dj_sessions (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dj_sessions TO service_role;
ALTER TABLE public.dj_sessions ENABLE ROW LEVEL SECURITY;