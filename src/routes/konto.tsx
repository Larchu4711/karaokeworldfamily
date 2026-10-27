import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Heart, Mic, ListMusic, LogOut, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/konto")({
  head: () => ({
    meta: [
      { title: "Mi tarjeta de cantante — Pub Manhattan" },
      { name: "description", content: "Tu tarjeta de cantante, likes, actuaciones y canciones favoritas en Pub Manhattan." },
      { property: "og:title", content: "Mi tarjeta de cantante — Pub Manhattan" },
      { property: "og:description", content: "Likes, actuaciones y favoritos de tu noche de karaoke." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, ready } = useAuthUser();
  return (
    <div className="pb-20">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4">{!ready ? null : user ? <Card userId={user.id} /> : <SignIn />}</main>
    </div>
  );
}

function SignIn() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const magic = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/konto` } });
    setBusy(false);
    if (error) toast.error(error.message); else setSent(true);
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/konto" });
    if (r.error) toast.error(t.errGeneric);
  };
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 neon-border">
      <h1 className="text-center font-display text-3xl text-primary neon-text">{t.singerCard}</h1>
      <Button onClick={google} variant="secondary" className="w-full">{t.google}</Button>
      <div className="text-center text-xs text-muted-foreground">— o —</div>
      {sent ? <p className="text-center text-accent">{t.checkEmail}</p> : (
        <form onSubmit={(e) => { e.preventDefault(); magic(); }} className="space-y-3">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} />
          <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : t.magicLink}</Button>
        </form>
      )}
    </div>
  );
}

type Fav = { id: string; video_id: string; song_title: string; thumbnail_url: string | null; duration: string | null };
type Hist = { id: string; song_title: string; status: string; created_at: string };

function Card({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState<{ display_name: string; card_code: string } | null>(null);
  const [name, setName] = useState("");
  const [stats, setStats] = useState({ likes: 0, performances: 0, requests: 0 });
  const [favs, setFavs] = useState<Fav[]>([]);
  const [hist, setHist] = useState<Hist[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("display_name, card_code").eq("id", userId).maybeSingle().then(({ data }) => {
      if (data) { setProfile(data); setName(data.display_name); }
    });
    supabase.rpc("my_singer_stats").then(({ data }) => {
      const s = data?.[0];
      if (s) setStats({ likes: Number(s.likes), performances: Number(s.performances), requests: Number(s.requests) });
    });
    supabase.from("favorite_songs").select("id, video_id, song_title, thumbnail_url, duration").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => setFavs(data ?? []));
    supabase.from("song_requests").select("id, song_title, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setHist(data ?? []));
  }, [userId]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) }).eq("id", userId);
    if (error) toast.error(t.errGeneric); else { toast.success("✓"); localStorage.setItem("pm-name", name.trim()); }
  };
  const removeFav = async (id: string) => {
    await supabase.from("favorite_songs").delete().eq("id", id);
    setFavs((f) => f.filter((x) => x.id !== id));
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  const cardUrl = typeof window !== "undefined" && profile ? `${window.location.origin}/rangliste?singer=${profile.card_code}` : "";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary bg-card p-6 neon-border">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-neon opacity-30 blur-3xl" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="rounded-xl bg-foreground p-3">{cardUrl && <QRCodeSVG value={cardUrl} size={120} />}</div>
          <div className="flex-1 space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-accent">{t.singerCard}</div>
            <div className="font-display text-3xl text-primary neon-text">{profile?.display_name}</div>
            <div className="font-mono text-lg tracking-widest">{profile?.card_code}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Heart className="size-5" />} n={stats.likes} label={t.likes} />
          <Stat icon={<Mic className="size-5" />} n={stats.performances} label={t.performances} />
          <Stat icon={<ListMusic className="size-5" />} n={stats.requests} label={t.requests} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <Button type="submit" disabled={!name.trim()}>{t.editName}</Button>
      </form>

      <section>
        <h2 className="mb-3 text-xl text-accent">{t.favorites}</h2>
        {favs.length === 0 ? <p className="text-sm text-muted-foreground">{t.noFavs}</p> : (
          <ul className="space-y-2">
            {favs.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
                {f.thumbnail_url && <img src={f.thumbnail_url} alt="" className="h-12 w-20 rounded object-cover" loading="lazy" />}
                <span className="line-clamp-2 flex-1 text-sm">{f.song_title}</span>
                <Button size="sm" asChild><Link to="/" search={{ q: f.song_title }}>{t.again}</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => removeFav(f.id)}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {hist.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl text-accent">{t.history}</h2>
          <ul className="space-y-1 text-sm">
            {hist.map((h) => (
              <li key={h.id} className="flex justify-between gap-3 border-b border-border py-1">
                <span className="truncate">{h.song_title}</span>
                <span className="text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="secondary" onClick={signOut}><LogOut className="size-4" />{t.signOut}</Button>
    </div>
  );
}

function Stat({ icon, n, label }: { icon: React.ReactNode; n: number; label: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="flex justify-center text-primary">{icon}</div>
      <div className="font-display text-2xl">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
