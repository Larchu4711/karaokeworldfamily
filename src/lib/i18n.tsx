import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "de" | "en";

const dict = {
  es: {
    djCollapse: "Ocultar resultados", djExpand: "Mostrar resultados", djClose: "Cerrar", sendLike: "Send me a like", ssTitle: "¡Canta con nosotros!", ssStep1: "Escanea el código QR", ssStep2: "Elige tu canción", ssStep3: "Cuando te llamen, ¡sube al escenario!", ssStep4: "Inicia sesión para entrar en el ranking", ssScan: "Escanea para empezar",
    djSearchNoResults: "Sin resultados", 
    djPassword: "Contraseña", djEnter: "Entrar", djWrong: "Contraseña incorrecta", djQueueChanged: "La cola cambió, recargando", djExpired: "Sesión caducada", djLogout: "Salir", djInQueue: "en cola", djShortcuts: "Espacio = play/pausa · N = siguiente · D = hecho · S = saltar · ↑↓ seleccionar", djEmpty: "La cola está vacía 🎤", djLast: "Últimas", djRequeue: "volver a la cola", djScan: "¡Escanea y canta!", djOnStage: "● EN ESCENA", djNextTag: "★ SIGUIENTE", djUp: "Subir", djDown: "Bajar", djPlay: "Play", djNext: "Siguiente", djDone: "Hecho", djSkip: "Saltar", djDelete: "Borrar", djConfirmDelete: "¿Borrar?", djDrag: "Arrastrar", scanToLike: "Escanea y dale like", likeTitle: "Aplaude a quien canta", likeGone: "Esta actuación ya no está disponible.", likeThanks: "¡Like enviado!",
    points: "Puntos", recentPerformances: "Últimas actuaciones", ownLike: "Tu actuación", liked: "Quitar like", stageRestart: "Repetir entrada", stageNext: "Saltar canción", stageStart: "Iniciar show", stageVolume: "Volumen", stageControls: "Control del escenario", stagePaused: "En pausa", stageConnected: "Control conectado", stageDisconnected: "Sin conexión", stageFinish: "Finalizar canción",
    tagline: "Noche de karaoke",
    stageView: "Pantalla del bar", stageEnable: "Activar escenario", stageReady: "El escenario está listo", stageWaiting: "La próxima voz está por llegar", stageLogin: "Entrar como DJ", stageFullscreen: "Pantalla completa", stageExitFullscreen: "Salir de pantalla completa", stagePause: "Pausar", stageResume: "Reproducir", stageRetry: "Reintentar vídeo", stageVideoError: "Este vídeo no se puede reproducir aquí. El DJ puede elegir otro.", stageLocal: "Reproductor en el DJ", stageExternal: "Pantalla del bar activa", stageLoading: "Conectando…", stageVoice: "Brian · ElevenLabs", stageAudioFallback: "Voz del navegador", stageOpen: "Abrir pantalla del bar",
    account: "Mi cuenta", leaderboard: "Ranking", home: "Cantar", dj: "DJ",
    djSearchTitle: "Añadir canción", djSingerName: "Nombre del cantante", djInsertAt: "Posición", djEnd: "Al final", djAddToQueue: "Añadir a la cola", djAdded: "Añadida a la cola", djPreview: "Vista previa", likeAlready: "Ya diste like desde este móvil", likeOwn: "No puedes darte like a ti mismo", likeTap: "Toca el corazón para aplaudir",
    onStage: "En el escenario", like: "Me gusta", signInToLike: "Inicia sesión para dar like",
    searchPh: "Busca una canción o artista…", search: "Buscar", recent: "Buscado recientemente",
    aiTitle: "¿No recuerdas el título?", aiHint: "Escribe un trozo de la letra o describe la canción", aiAsk: "Preguntar a la IA", aiNone: "No encontré nada. Prueba con otras palabras.",
    preview: "Vista previa", choose: "Elegir", yourName: "Tu nombre", send: "Enviar petición", cancel: "Cancelar",
    sent: "¡Petición enviada!", queueTitle: "Tu petición", place: "Puesto", inQueue: "en la cola", waitApprox: "Espera aprox.", min: "min",
    statusWaiting: "En espera", statusNext: "¡Eres el siguiente! Prepárate", statusPlaying: "¡Estás en el escenario!", statusDone: "¡Gracias por cantar!", statusSkipped: "Tu canción fue omitida",
    newRequest: "Pedir otra canción", noResults: "Sin resultados", errQuota: "La búsqueda está saturada, inténtalo en un rato.", errGeneric: "Algo salió mal. Inténtalo de nuevo.",
    upcoming: "Próximos", favorite: "Favorito", addedFav: "Guardado en favoritos",
    signIn: "Iniciar sesión", signOut: "Cerrar sesión", email: "Correo electrónico", magicLink: "Enviar enlace mágico", google: "Continuar con Google", checkEmail: "Revisa tu correo para entrar.",
    singerCard: "Tarjeta de cantante", editName: "Guardar nombre", likes: "Likes", performances: "Actuaciones", requests: "Peticiones",
    favorites: "Canciones favoritas", history: "Historial", again: "Pedir de nuevo", noFavs: "Aún no tienes favoritos.",
    tonight: "Esta noche", month: "Este mes", allTime: "Siempre", noRanking: "Todavía no hay cantantes en el ranking.", songs: "canciones",
    announce: (s: string, t: string) => `¡Ahora en el escenario: ${s} con ${t}!`,
  },
  de: {
    djCollapse: "Treffer einklappen", djExpand: "Treffer anzeigen", djClose: "Schließen", sendLike: "Send me a like", ssTitle: "Sing mit uns!", ssStep1: "QR-Code scannen", ssStep2: "Song aussuchen", ssStep3: "Wenn du aufgerufen wirst: ab auf die Bühne!", ssStep4: "Anmelden, um in der Rangliste mitzumachen", ssScan: "Scannen und loslegen",
    djSearchNoResults: "Keine Treffer", 
    djPassword: "Passwort", djEnter: "Anmelden", djWrong: "Falsches Passwort", djQueueChanged: "Warteschlange geändert, wird neu geladen", djExpired: "Sitzung abgelaufen", djLogout: "Abmelden", djInQueue: "in der Warteschlange", djShortcuts: "Leertaste = Play/Pause · N = als Nächstes · D = fertig · S = überspringen · ↑↓ auswählen", djEmpty: "Die Warteschlange ist leer 🎤", djLast: "Zuletzt", djRequeue: "zurück in die Warteschlange", djScan: "Scannen und singen!", djOnStage: "● AUF DER BÜHNE", djNextTag: "★ ALS NÄCHSTES", djUp: "Nach oben", djDown: "Nach unten", djPlay: "Abspielen", djNext: "Als Nächstes", djDone: "Fertig", djSkip: "Überspringen", djDelete: "Löschen", djConfirmDelete: "Löschen?", djDrag: "Ziehen", scanToLike: "Scannen und liken", likeTitle: "Applaus für den Auftritt", likeGone: "Dieser Auftritt ist nicht mehr verfügbar.", likeThanks: "Like gesendet!",
    points: "Punkte", recentPerformances: "Letzte Auftritte", ownLike: "Dein Auftritt", liked: "Like entfernen", stageRestart: "Show neu starten", stageNext: "Song überspringen", stageStart: "Show starten", stageVolume: "Lautstärke", stageControls: "Bühnensteuerung", stagePaused: "Pausiert", stageConnected: "Steuerung verbunden", stageDisconnected: "Keine Verbindung", stageFinish: "Song beenden",
    XX    stageView: "Bar-Bildschirm", stageEnable: "Bühne aktivieren", stageReady: "Die Bühne ist bereit", stageWaiting: "Die nächste Stimme kommt gleich", stageLogin: "Als DJ anmelden", stageFullscreen: "Vollbild", stageExitFullscreen: "Vollbild verlassen", stagePause: "Pausieren", stageResume: "Abspielen", stageRetry: "Video erneut laden", stageVideoError: "Dieses Video lässt sich hier nicht abspielen. Der DJ kann ein anderes auswählen.", stageLocal: "Player im DJ-Pult", stageExternal: "Bar-Bildschirm aktiv", stageLoading: "Verbinden…", stageVoice: "Brian · ElevenLabs", stageAudioFallback: "Browser-Stimme", stageOpen: "Bar-Bildschirm öffnen",
    account: "Mein Konto", leaderboard: "Rangliste", home: "Singen", dj: "DJ",
    djSearchTitle: "Song hinzufügen", djSingerName: "Name des Sängers", djInsertAt: "Position", djEnd: "Ans Ende", djAddToQueue: "In die Warteschlange", djAdded: "Zur Warteschlange hinzugefügt", djPreview: "Vorschau", likeAlready: "Von diesem Handy schon geliked", likeOwn: "Du kannst dich nicht selbst liken", likeTap: "Tippe aufs Herz für Applaus",
    onStage: "Auf der Bühne", like: "Gefällt mir", signInToLike: "Zum Liken anmelden",
    searchPh: "Song oder Künstler suchen…", search: "Suchen", recent: "Zuletzt gesucht",
    aiTitle: "Titel vergessen?", aiHint: "Schreib eine Textzeile oder beschreib den Song", aiAsk: "KI fragen", aiNone: "Nichts gefunden. Versuch andere Worte.",
    preview: "Vorschau", choose: "Wählen", yourName: "Dein Name", send: "Wunsch absenden", cancel: "Abbrechen",
    sent: "Wunsch eingereicht!", queueTitle: "Dein Wunsch", place: "Platz", inQueue: "in der Warteschlange", waitApprox: "Wartezeit ca.", min: "Min",
    statusWaiting: "Wartet", statusNext: "Du bist als Nächstes dran!", statusPlaying: "Du bist auf der Bühne!", statusDone: "Danke fürs Singen!", statusSkipped: "Dein Song wurde übersprungen",
    newRequest: "Weiteren Song wünschen", noResults: "Keine Ergebnisse", errQuota: "Suche gerade überlastet, bitte später erneut.", errGeneric: "Etwas ist schiefgelaufen.",
    upcoming: "Als Nächstes", favorite: "Favorit", addedFav: "Zu Favoriten hinzugefügt",
    signIn: "Anmelden", signOut: "Abmelden", email: "E-Mail", magicLink: "Magic-Link senden", google: "Weiter mit Google", checkEmail: "Prüfe deine E-Mails zum Anmelden.",
    singerCard: "Sängerkarte", editName: "Name speichern", likes: "Likes", performances: "Auftritte", requests: "Wünsche",
    favorites: "Lieblingssongs", history: "Verlauf", again: "Nochmal wünschen", noFavs: "Noch keine Favoriten.",
    tonight: "Heute Abend", month: "Diesen Monat", allTime: "Allzeit", noRanking: "Noch keine Sänger in der Rangliste.", songs: "Songs",
    announce: (s: string, t: string) => `Jetzt auf der Bühne: ${s} mit ${t}!`,
  },
  en: {
    djCollapse: "Hide results", djExpand: "Show results", djClose: "Close", sendLike: "Send me a like", ssTitle: "Sing with us!", ssStep1: "Scan the QR code", ssStep2: "Pick your song", ssStep3: "When you are called, hit the stage!", ssStep4: "Sign in to join the leaderboard", ssScan: "Scan to start",
    djSearchNoResults: "No results", 
    djPassword: "Password", djEnter: "Sign in", djWrong: "Wrong password", djQueueChanged: "Queue changed, reloading", djExpired: "Session expired", djLogout: "Sign out", djInQueue: "in queue", djShortcuts: "Space = play/pause · N = next · D = done · S = skip · ↑↓ select", djEmpty: "The queue is empty 🎤", djLast: "Recent", djRequeue: "back to queue", djScan: "Scan and sing!", djOnStage: "● ON STAGE", djNextTag: "★ NEXT", djUp: "Move up", djDown: "Move down", djPlay: "Play", djNext: "Next", djDone: "Done", djSkip: "Skip", djDelete: "Delete", djConfirmDelete: "Delete?", djDrag: "Drag", scanToLike: "Scan to like", likeTitle: "Cheer for the singer", likeGone: "This performance is no longer available.", likeThanks: "Like sent!",
    points: "Points", recentPerformances: "Recent performances", ownLike: "Your performance", liked: "Remove like", stageRestart: "Restart show", stageNext: "Skip song", stageStart: "Start show", stageVolume: "Volume", stageControls: "Stage controls", stagePaused: "Paused", stageConnected: "Controls connected", stageDisconnected: "Disconnected", stageFinish: "Finish song",
    XX    stageView: "Bar screen", stageEnable: "Activate stage", stageReady: "The stage is ready", stageWaiting: "The next voice is on its way", stageLogin: "Sign in as DJ", stageFullscreen: "Fullscreen", stageExitFullscreen: "Exit fullscreen", stagePause: "Pause", stageResume: "Play", stageRetry: "Retry video", stageVideoError: "This video cannot play here. The DJ can choose another.", stageLocal: "Player at DJ desk", stageExternal: "Bar screen active", stageLoading: "Connecting…", stageVoice: "Brian · ElevenLabs", stageAudioFallback: "Browser voice", stageOpen: "Open bar screen",
    account: "My account", leaderboard: "Leaderboard", home: "Sing", dj: "DJ",
    djSearchTitle: "Add a song", djSingerName: "Singer name", djInsertAt: "Position", djEnd: "At the end", djAddToQueue: "Add to queue", djAdded: "Added to queue", djPreview: "Preview", likeAlready: "Already liked from this phone", likeOwn: "You can't like yourself", likeTap: "Tap the heart to cheer",
    onStage: "On stage", like: "Like", signInToLike: "Sign in to like",
    searchPh: "Search a song or artist…", search: "Search", recent: "Recent searches",
    aiTitle: "Forgot the title?", aiHint: "Type a lyric fragment or describe the song", aiAsk: "Ask AI", aiNone: "Nothing found. Try other words.",
    preview: "Preview", choose: "Choose", yourName: "Your name", send: "Send request", cancel: "Cancel",
    sent: "Request sent!", queueTitle: "Your request", place: "Place", inQueue: "in the queue", waitApprox: "Approx. wait", min: "min",
    statusWaiting: "Waiting", statusNext: "You're next! Get ready", statusPlaying: "You're on stage!", statusDone: "Thanks for singing!", statusSkipped: "Your song was skipped",
    newRequest: "Request another song", noResults: "No results", errQuota: "Search is busy, try again later.", errGeneric: "Something went wrong.",
    upcoming: "Up next", favorite: "Favorite", addedFav: "Saved to favorites",
    signIn: "Sign in", signOut: "Sign out", email: "Email", magicLink: "Send magic link", google: "Continue with Google", checkEmail: "Check your email to sign in.",
    singerCard: "Singer card", editName: "Save name", likes: "Likes", performances: "Performances", requests: "Requests",
    favorites: "Favorite songs", history: "History", again: "Request again", noFavs: "No favorites yet.",
    tonight: "Tonight", month: "This month", allTime: "All time", noRanking: "No singers on the leaderboard yet.", songs: "songs",
    announce: (s: string, t: string) => `Now on stage: ${s} with ${t}!`,
  },
};

export type Dict = (typeof dict)["es"];

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "es", setLang: () => {}, t: dict.es,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  useEffect(() => {
    const saved = localStorage.getItem("pm-lang") as Lang | null;
    if (saved && saved in dict) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("pm-lang", l);
  };
  return <I18nCtx.Provider value={{ lang, setLang, t: dict[lang] as Dict }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
