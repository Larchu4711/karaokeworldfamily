CREATE OR REPLACE FUNCTION public.guest_like(p_request_id uuid, p_device text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_liker uuid; v_singer uuid; v_ok boolean;
BEGIN
  IF auth.uid() IS NOT NULL THEN v_liker := auth.uid();
  ELSE
    IF p_device IS NULL OR p_device !~ '^[0-9a-fA-F-]{32,36}$' THEN RETURN jsonb_build_object('ok', false, 'reason', 'device'); END IF;
    v_liker := md5('pm-device:' || lower(p_device))::uuid;
  END IF;
  SELECT s.user_id, (s.status IN ('playing','done') AND s.updated_at > now() - interval '12 hours')
    INTO v_singer, v_ok FROM public.song_requests s WHERE s.id = p_request_id;
  IF NOT FOUND OR NOT v_ok THEN RETURN jsonb_build_object('ok', false, 'reason', 'gone'); END IF;
  IF v_singer IS NOT NULL AND v_singer = v_liker THEN RETURN jsonb_build_object('ok', false, 'reason', 'own'); END IF;
  INSERT INTO public.performance_likes(request_id, liker_id) VALUES (p_request_id, v_liker) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  RETURN jsonb_build_object('ok', true, 'already', false);
END; $$;
REVOKE ALL ON FUNCTION public.guest_like(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_like(uuid, text) TO anon, authenticated;