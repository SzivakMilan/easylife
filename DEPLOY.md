# Deploy: self-hosted Hetzner szerver (easylife.szivim.com)

Ez a projekt (frontend + Supabase backend) egy saját Hetzner VPS-re kerül,
Docker-ben futó **self-hosted Supabase** stackkel és a szerveren már meglévő
**rendszer nginx + Cloudflare wildcard cert** (`/etc/ssl/cloudflare`) mögé
állítva. Nincs Supabase Cloud, nincs Vercel.

Ez a futtatókönyv egy friss, kontextus nélküli munkamenetnek is elegendő
ahhoz, hogy végigvigye a telepítést. Minden lépés megadja a pontos parancsot;
ahol döntés vagy a szerver tényleges állapotának ellenőrzése szükséges, ott ezt
jelzi.

## Architektúra

```
Internet --443--> nginx (rendszer, Cloudflare wildcard cert)
                     |-- /auth/ /rest/ /storage/ /functions/ /realtime/
                     |      --> 127.0.0.1:8000 (Supabase api-gw, csak localhost-on)
                     |-- /  --> /var/www/easylife/dist (statikus Vite build, SPA fallback)

Supabase self-hosted stack (docker compose, KÜLÖN saját mappában a szerveren,
NEM ebben a repóban) - benne: api-gw (Envoy/Kong), auth, rest (PostgREST),
storage, realtime, functions (Edge Runtime), db (Postgres), studio, stb.
```

A Supabase self-hosted stackhez a hivatalos, aktuális
`supabase/supabase`-beli `docker/` sablont használjuk, **nem** vendorolva be a
teljes compose-fát ebbe a repóba (az gyorsan elavulna) - helyette a hivatalos
bootstrap scriptet futtatjuk a szerveren, és csak egy kis saját override
fájlt (`deploy/supabase-overrides/docker-compose.easylife.yml`) rétegezünk rá
a VAPID push-kulcsokhoz.

## 0. Előfeltételek ellenőrzése a szerveren

```bash
docker --version && docker compose version
ls -la /etc/ssl/cloudflare
```

Ha a Docker nincs telepítve, a lenti `setup.sh` ezt is elintézi. A
`/etc/ssl/cloudflare` alatti fájlneveket (cert + key) jegyezd fel - a
`deploy/nginx/easylife.szivim.com.conf` placeholder névvel
(`cert.pem` / `key.pem`) hivatkozik rájuk, ha más a valódi név, írd át ott.

## 1. Supabase self-hosted stack bootstrapolása

Külön mappában, NEM az app repóban (pl. `/opt/easylife-supabase`):

```bash
mkdir -p /opt/easylife-supabase && cd /opt/easylife-supabase
curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/docker/setup.sh | sh
```

Ez letölti a legfrissebb self-hosted release tag `docker/` tartalmát ebbe a
mappába, és generál egy `.env`-et. Ha a script interaktívan kérdez
(Docker telepítés, stb.), azokra a kérdésekre a helyzetnek megfelelően
válaszolj.

### 1.1 Titkok és kulcsok generálása

```bash
cd /opt/easylife-supabase
sh utils/generate-keys.sh --update-env
sh utils/add-new-auth-keys.sh --update-env
```

Ez feltölti a `.env`-ben: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
`SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`SECRET_KEY_BASE`, `VAULT_ENC_KEY`, stb. **Ne használd a demó/példa
kulcsokat** - ezek a scriptek friss, egyedi kulcsokat generálnak.

### 1.2 `.env` beállítások ehhez a projekthez

Szerkeszd a `/opt/easylife-supabase/.env`-et:

```bash
SUPABASE_PUBLIC_URL=https://easylife.szivim.com
API_EXTERNAL_URL=https://easylife.szivim.com/auth/v1
SITE_URL=https://easylife.szivim.com
ADDITIONAL_REDIRECT_URLS=https://easylife.szivim.com

# Az api-gw kapu CSAK localhoston figyeljen - az nginx proxyz rá, nem szabad
# kívülről elérhetőnek lennie:
API_GW_HTTP_PORT=127.0.0.1:8000

DASHBOARD_USERNAME=<válassz egy admin usernevet>
DASHBOARD_PASSWORD=<generálj egy erős jelszót: openssl rand -base64 24>
```

**SMTP nem szükséges**: az app jelszavas belépést használ (nem magic linket),
így nincs szükség e-mail kézbesítésre a bejelentkezéshez. Állítsd be:

```bash
ENABLE_EMAIL_AUTOCONFIRM=true
```

Ez ugyanaz a beállítás, mint a helyi fejlesztésben a `supabase/config.toml`
`enable_confirmations = false` sora - új fiók regisztrálásakor nincs
"erősítsd meg az e-mailed" lépés, azonnal bejelentkezik. A hamis
`supabase-mail` konténer így nem jelent problémát (semmi nem küld rajta
keresztül e-mailt, amire a felhasználóknak szükségük lenne).

### 1.3 Indítás

```bash
cd /opt/easylife-supabase
sh run.sh start
sh run.sh status
```

Minden szolgáltatásnak `healthy`/`running` állapotban kell lennie, mielőtt
továbbmész.

## 2. Alkalmazás migrációk alkalmazása

Az app repóban (ahova ezt a DEPLOY.md-t is klónoztad) lévő
`supabase/migrations/*.sql` fájlokat kell sorban lefuttatni a most indult
Postgres ellen (NEM a `supabase db push` CLI-vel, mert az Supabase Cloud-hoz
köt - itt a futó konténerbe közvetlenül psql-ezünk):

```bash
cd <app repo gyökere>
for f in supabase/migrations/*.sql; do
  echo "=== $f ==="
  docker exec -i supabase-db psql -U postgres -d postgres < "$f"
done
```

(A konténer neve a self-hosted compose-ban `supabase-db` - ha a
`docker compose ps` ettől eltérőt mutat `/opt/easylife-supabase` alól, azt
használd.)

**Fontos**: az utolsó migráció
(`20251111191000_schedule_reminders.sql`) a helyi fejlesztői demó
`service_role` JWT-t és a `http://api.supabase.internal:8000/functions/v1/...`
belső hostnevet ütemezi be `pg_cron`-nal - ez a self-hosted topológiában NEM
ugyanaz. A 4. lépésben ezt újra kell ütemezni a valódi kulccsal és elérési
úttal.

## 3. Edge Function telepítése

A self-hosted Edge Runtime a `volumes/functions/` mappából szolgálja ki a
függvényeket (nincs `supabase functions deploy` Cloud-CLI self-hostnál):

```bash
cp -r <app repo>/supabase/functions/send-reminders /opt/easylife-supabase/volumes/functions/
```

### 3.1 VAPID kulcsok (éles)

Generálj **új, éles** VAPID kulcspárt (NE a helyi dev kulcsokat használd) -
ugyanazzal a módszerrel, amit a projekt helyi fejlesztésnél is használt
(Node beépített `crypto` modulja, nem `web-push` CLI):

```bash
node -e "
const { generateKeyPairSync } = require('crypto');
const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});
const b64url = (buf) => buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+\$/,'');
console.log('PUBLIC :', b64url(publicKey.slice(-65)));
console.log('PRIVATE:', b64url(privateKey.slice(-32)));
"
```

(Ha ez az egysoros nem ad helyes formátumot, nézd meg pontosan hogyan
generálta a projekt a helyi kulcsokat - a lényeg, hogy a publikus kulcs 65
bájt és `0x04`-gyel kezdődik nyers formában, a privát kulcs 32 bájt, mindkettő
base64url-kódolva.)

### 3.2 Saját override hozzáadása a functions konténerhez

```bash
cd /opt/easylife-supabase
cp <app repo>/deploy/supabase-overrides/docker-compose.easylife.yml .
cat >> .env <<'EOF'

VAPID_PUBLIC_KEY=<generált publikus kulcs>
VAPID_PRIVATE_KEY=<generált privát kulcs>
VAPID_SUBJECT=mailto:milanszivak@gmail.com
EOF
sh run.sh config add easylife
sh run.sh recreate functions
```

### 3.3 `pg_cron` ütemezés frissítése a valódi kulccsal/elérési úttal

A `functions` konténer a compose-hálózaton `functions` néven érhető el a
`db` konténerből, 9000-es porton (nem kell az api-gw-n keresztülmenni):

```bash
docker exec -it supabase-db psql -U postgres -d postgres -c "
select cron.unschedule('send-reminders');
select cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  \$\$
  select net.http_post(
    url := 'http://functions:9000/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <a .env-ben generált SERVICE_ROLE_KEY>'
    )
  );
  \$\$
);
"
```

(A `<...>` helyére a `/opt/easylife-supabase/.env`-ben lévő valódi
`SERVICE_ROLE_KEY` értéke kerül: `grep ^SERVICE_ROLE_KEY= .env`.)

## 4. Frontend build

Az app repóban:

```bash
pnpm install
cat > .env.production.local <<EOF
VITE_SUPABASE_URL=https://easylife.szivim.com
VITE_SUPABASE_ANON_KEY=<az /opt/easylife-supabase/.env-ben lévő ANON_KEY>
VITE_VAPID_PUBLIC_KEY=<a 3.1-ben generált publikus VAPID kulcs>
EOF
pnpm build
```

A build a `dist/` mappába kerül.

```bash
mkdir -p /var/www/easylife
cp -r dist/* /var/www/easylife/dist/ 2>/dev/null || cp -r dist /var/www/easylife/dist
```

## 5. nginx

```bash
cp deploy/nginx/easylife.szivim.com.conf /etc/nginx/sites-available/easylife.szivim.com.conf
```

Ellenőrizd (és ha kell, javítsd) benne a `ssl_certificate` /
`ssl_certificate_key` sorokat a 0. lépésben megnézett valódi fájlnevekre,
majd:

```bash
ln -s /etc/nginx/sites-available/easylife.szivim.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 6. Ellenőrzés

- `https://easylife.szivim.com` betölti az appot
- Bejelentkezés magic linkkel (ha az SMTP valós, lásd 1.2) célba ér
- Supabase Studio **szándékosan nincs** nyilvánosan kitéve; eléréshez:
  `ssh -L 8000:127.0.0.1:8000 <szerver>` majd `http://localhost:8000` a saját
  gépen, a `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`-del
- `docker exec -it supabase-db psql -U postgres -d postgres -c "select * from cron.job;"`
  mutatja az ütemezett `send-reminders` jobot

## Frissítés (új kód push után)

```bash
cd <app repo>
git pull
pnpm install
pnpm build
cp -r dist/* /var/www/easylife/dist/
```

Új migráció esetén csak az új fájlt kell lefuttatni a 2. lépés mintájára.
