# Otthon

Családi szervező PWA: egy hely a család hétköznapi ügyeinek - határidők, időpontok,
költségvetés és számlák. Mobilra optimalizált, a kezdőképernyőhöz adható (PWA).

## Tech stack

- **Frontend:** Vite + React + TypeScript, Tailwind CSS, React Router
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions, RLS)
- **PWA:** `vite-plugin-pwa`, egyedi Service Worker (offline app shell + push értesítések)
- **Animációk:** Framer Motion
- **Dátumkezelés:** `date-fns` magyar locale-lal

## Előfeltételek

- Node.js 20+ és [pnpm](https://pnpm.io)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (a helyi Supabase-hez)

## Helyi fejlesztés

```bash
pnpm install
cp .env.example .env.local
```

Töltsd ki a `.env.local`-t. Első indításkor a helyi Supabase-t is el kell indítani:

```bash
pnpm db:start
```

Ez kiírja a helyi `API_URL`-t és `ANON_KEY`-t - ezeket másold a `.env.local`
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` mezőibe (`API_URL` általában
`http://127.0.0.1:54321`). A `VITE_VAPID_PUBLIC_KEY`-hez lásd a
[Push értesítések](#push-értesítések) szakaszt.

```bash
pnpm dev
```

- App: http://localhost:5173
- Supabase Studio (adatbázis admin felület): http://127.0.0.1:54323
- Mailpit (helyi tesztelésnél ide futnak be a bejelentkező e-mailek, mert nincs
  valódi e-mail küldés helyben): http://127.0.0.1:54324

Leállítás: `pnpm db:stop`. Teljes visszaállítás (minden migráció újrafuttatása,
adatvesztéssel): `pnpm db:reset`.

### Tesztelés telefonról ugyanazon a Wi-Fi-n

```bash
pnpm dev --host
```

A kiírt `Network` URL-t (pl. `http://192.168.x.x:5173`) nyisd meg a telefonod
böngészőjében. Ehhez a `.env.local`-ban a `VITE_SUPABASE_URL`-t is erre a helyi
hálózati címre kell állítani (nem `127.0.0.1`-re, mert az a telefon szemszögéből
saját magát jelentené), és a `supabase/config.toml` `auth.additional_redirect_urls`
listájába fel kell venni ugyanezt a címet `:5173` porttal, majd `pnpm db:stop` +
`pnpm db:start` a változás érvényesítéséhez.

## Adatbázis-séma

A teljes séma és az RLS szabályok a `supabase/migrations` mappában vannak, sorban
alkalmazva. Új migráció hozzáadásakor:

```bash
supabase migration new <név>
```

majd a fájlt közvetlenül alkalmazhatod helyben:

```bash
docker exec -i supabase_db_<projekt> psql -U postgres -d postgres < supabase/migrations/<fájl>.sql
```

Típusok frissítése a sémából: `pnpm db:types`.

## Push értesítések

A rendszer VAPID kulcspárral működik. Helyi fejlesztéshez már be van állítva egy
pár (`.env.local` + `supabase/functions/.env`) - ezekkel helyben tesztelhető a
feliratkozás és az `send-reminders` Edge Function. **Éles projektnél generálj
új, saját kulcspárt** (lásd lent).

A `send-reminders` függvény 15 percenként fut (helyben `pg_cron`-nal ütemezve),
megnézi a közelgő határidőket/időpontokat/számla-esedékességeket, és push
értesítést küld az érintett háztartás tagjainak.

## Éles Supabase projekt létrehozása

1. Hozz létre egy projektet a [supabase.com](https://supabase.com) dashboardon.
2. Jelentkezz be a CLI-vel és kösd össze a projekttel:
   ```bash
   supabase login
   supabase link --project-ref <a-te-project-ref-ed>
   ```
3. Told fel a migrációkat:
   ```bash
   supabase db push
   ```
4. Generálj **új** VAPID kulcspárt az éles környezethez (ne használd a helyi
   fejlesztői kulcsokat!), majd állítsd be titokként:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:te@example.com
   ```
5. Told fel az Edge Function-t:
   ```bash
   supabase functions deploy send-reminders
   ```
6. A `send-reminders` ütemezését a helyi migráció (`20251111191000_schedule_reminders.sql`)
   a helyi demó service_role kulccsal állította be - ez éles projektnél **nem
   működik**. Állítsd be újra a Dashboard **Database → Cron Jobs** felületén,
   vagy a Vault-ban tárolt, valódi service_role kulccsal.
7. **Authentication → URL Configuration**: állítsd be a Site URL-t és add hozzá
   a redirect URL-ek közé a végleges Vercel domaint (lásd lent), különben a
   bejelentkező e-mail linkek rossz helyre fognak mutatni.
8. A Storage bucket (`bills`) és az RLS szabályai a migrációval automatikusan
   létrejönnek.

## Deploy Vercelre

1. Told fel a repót GitHube-ra (ha még nincs ott).
2. A [vercel.com](https://vercel.com)-on importáld a repót - a Vite projektet
   automatikusan felismeri, külön konfiguráció nem szükséges.
3. Állítsd be a környezeti változókat a Vercel projekt **Settings → Environment
   Variables** alatt (az éles Supabase projekt adataival):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
4. Deploy. Az első sikeres deploy után menj vissza a Supabase Auth beállításokhoz,
   és vedd fel a kapott Vercel domaint a redirect URL-ek közé (lásd fent, 7. pont).

## PWA telepítés

Az app Safarin (iOS) vagy Chrome-on (Android) a "Kezdőképernyőhöz adás"
funkcióval telepíthető - az appon belül a **Beállítások** oldalon található egy
lépésről lépésre útmutató. iOS-en a push értesítések **csak** a telepített
(kezdőképernyőről indított) változatban működnek.
