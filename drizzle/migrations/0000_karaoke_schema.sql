CREATE TABLE public.song_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  singer_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  video_id TEXT NOT NULL,
  channel_title TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  position DOUBLE PRECISION NOT NULL DEFAULT (extract(epoch from now()) * 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX song_requests_order_idx ON public.song_requests (status, position, created_at);
CREATE INDEX song_requests_user_idx ON public.song_requests (user_id);
GRANT SELECT, INSERT ON public.song_requests TO anon, authenticated;
GRANT ALL ON public.song_requests TO service_role;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view the queue" ON public.song_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can add a song request" ON public.song_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(singer_name)) BETWEEN 1 AND 60
  AND length(trim(song_title)) BETWEEN 1 AND 200
  AND length(trim(video_id)) BETWEEN 1 AND 40
  AND status = 'waiting'
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER song_requests_touch BEFORE UPDATE ON public.song_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.song_requests;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Cantante',
  card_code TEXT NOT NULL UNIQUE DEFAULT ('PM-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT display_name_len CHECK (length(trim(display_name)) BETWEEN 1 AND 40)
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_guest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), nullif(split_part(NEW.email, '@', 1), ''), 'Cantante'), 40))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_guest();

CREATE TABLE public.performance_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.song_requests(id) ON DELETE CASCADE,
  liker_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, liker_id)
);
GRANT SELECT, INSERT, DELETE ON public.performance_likes TO authenticated;
GRANT ALL ON public.performance_likes TO service_role;
ALTER TABLE public.performance_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own likes read" ON public.performance_likes FOR SELECT TO authenticated USING (liker_id = auth.uid());
CREATE POLICY "Like others performances" ON public.performance_likes FOR INSERT TO authenticated
WITH CHECK (
  liker_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.song_requests s
    WHERE s.id = request_id AND (s.user_id IS NULL OR s.user_id <> auth.uid())
      AND s.status IN ('playing', 'done')
      AND s.updated_at > now() - interval '12 hours'
  )
);
CREATE POLICY "Remove own like" ON public.performance_likes FOR DELETE TO authenticated USING (liker_id = auth.uid());

CREATE TABLE public.favorite_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  song_title TEXT NOT NULL,
  channel_title TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorite_songs TO authenticated;
GRANT ALL ON public.favorite_songs TO service_role;
ALTER TABLE public.favorite_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites read" ON public.favorite_songs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own favorites add" ON public.favorite_songs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own favorites remove" ON public.favorite_songs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.dj_set_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current text; v_next uuid;
BEGIN
  IF p_status NOT IN ('waiting','next','playing','done','skipped') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_status');
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('song_requests_queue'));
  SELECT status INTO v_current FROM public.song_requests WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF p_status = 'playing' THEN
    UPDATE public.song_requests SET status = 'done' WHERE status = 'playing' AND id <> p_id;
  ELSIF p_status = 'next' THEN
    UPDATE public.song_requests SET status = 'waiting' WHERE status = 'next' AND id <> p_id;
  END IF;
  UPDATE public.song_requests SET status = p_status WHERE id = p_id;
  IF v_current = 'playing' AND p_status IN ('done','skipped') THEN
    SELECT id INTO v_next FROM public.song_requests
    WHERE status IN ('next','waiting')
    ORDER BY (status = 'next') DESC, position ASC, created_at ASC LIMIT 1;
    IF v_next IS NOT NULL THEN
      UPDATE public.song_requests SET status = 'playing' WHERE id = v_next;
    END IF;
  END IF;
  RETURN jsonb_build_object('ok', true, 'advanced', v_next);
END; $$;

CREATE OR REPLACE FUNCTION public.dj_reorder(p_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active uuid[]; v_given uuid[];
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('song_requests_queue'));
  SELECT coalesce(array_agg(id ORDER BY id), '{}') INTO v_active
  FROM public.song_requests WHERE status IN ('waiting','next','playing');
  SELECT coalesce(array_agg(DISTINCT x ORDER BY x), '{}') INTO v_given FROM unnest(p_ids) AS x;
  IF v_active IS DISTINCT FROM v_given OR cardinality(v_given) <> cardinality(p_ids) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'stale');
  END IF;
  UPDATE public.song_requests s SET position = o.ord * 1000
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, ord) WHERE s.id = o.id;
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.leaderboard(p_period text)
RETURNS TABLE (singer_id uuid, display_name text, card_code text, likes bigint, performances bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH since AS (
    SELECT CASE p_period
      WHEN 'night' THEN now() - interval '12 hours'
      WHEN 'month' THEN date_trunc('month', now())
      ELSE '-infinity'::timestamptz END AS t
  ),
  per_req AS (
    SELECT s.id, s.user_id, s.status, s.updated_at,
      (SELECT count(*) FROM public.performance_likes l, since WHERE l.request_id = s.id AND l.created_at >= since.t) AS likes
    FROM public.song_requests s WHERE s.user_id IS NOT NULL
  )
  SELECT p.id, p.display_name, p.card_code,
    coalesce(sum(r.likes),0)::bigint AS likes,
    count(*) FILTER (WHERE r.status = 'done' AND r.updated_at >= (SELECT t FROM since))::bigint AS performances
  FROM public.profiles p JOIN per_req r ON r.user_id = p.id
  GROUP BY p.id
  HAVING coalesce(sum(r.likes),0) > 0 OR count(*) FILTER (WHERE r.status = 'done' AND r.updated_at >= (SELECT t FROM since)) > 0
  ORDER BY likes DESC, performances DESC
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.my_singer_stats()
RETURNS TABLE (likes bigint, performances bigint, requests bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.performance_likes l JOIN public.song_requests s ON s.id = l.request_id WHERE s.user_id = auth.uid()),
    (SELECT count(*) FROM public.song_requests WHERE user_id = auth.uid() AND status = 'done'),
    (SELECT count(*) FROM public.song_requests WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.like_counts(p_ids uuid[])
RETURNS TABLE (request_id uuid, likes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT request_id, count(*) FROM public.performance_likes WHERE request_id = ANY(p_ids) GROUP BY request_id;
$$;

REVOKE ALL ON FUNCTION public.dj_set_status(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dj_reorder(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_guest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dj_set_status(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.dj_reorder(uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.my_singer_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_singer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.like_counts(uuid[]) TO anon, authenticated;

CREATE TABLE public.stage_control (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 paused boolean NOT NULL DEFAULT false,
 volume integer NOT NULL DEFAULT 100 CHECK (volume BETWEEN 0 AND 100),
 revision bigint NOT NULL DEFAULT 0,
 restart_revision bigint NOT NULL DEFAULT 0,
 external boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stage_control TO service_role;
ALTER TABLE public.stage_control ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.dj_stage_command(p_command text, p_volume integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.stage_control;
BEGIN
 IF p_command NOT IN ('play','pause','restart','volume','external','local') THEN RAISE EXCEPTION 'bad_command'; END IF;
 INSERT INTO public.stage_control(id) VALUES(true) ON CONFLICT DO NOTHING;
 UPDATE public.stage_control SET
 paused = CASE WHEN p_command = 'pause' THEN true WHEN p_command IN ('play','restart') THEN false ELSE paused END,
 volume = CASE WHEN p_command = 'volume' THEN greatest(0,least(100,p_volume)) ELSE volume END,
 external = CASE WHEN p_command = 'external' THEN true WHEN p_command = 'local' THEN false ELSE external END,
 restart_revision = restart_revision + CASE WHEN p_command = 'restart' THEN 1 ELSE 0 END,
 revision = revision + 1, updated_at = now() WHERE id = true RETURNING * INTO v;
 RETURN to_jsonb(v);
END; $$;
REVOKE ALL ON FUNCTION public.dj_stage_command(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dj_stage_command(text, integer) TO service_role;
CREATE OR REPLACE FUNCTION public.dj_complete_current(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('song_requests_queue'));
 IF NOT EXISTS (SELECT 1 FROM public.song_requests WHERE id=p_id AND status='playing') THEN RETURN jsonb_build_object('ok',false,'reason','stale'); END IF;
 RETURN public.dj_set_status(p_id,'done');
END; $$;
REVOKE ALL ON FUNCTION public.dj_complete_current(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dj_complete_current(uuid) TO service_role;