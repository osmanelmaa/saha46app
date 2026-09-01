# saha46.app

Saha46 mobil uygulamasının tanıtım ve destek sitesi. Statik HTML + CSS,
derleme adımı yok, JavaScript yalnızca davet sayfasında.

## Sayfalar

| Yol | Dosya | Amaç |
| --- | --- | --- |
| `/` | `index.html` | Tanıtım, nasıl çalışır, özellikler, SSS |
| `/gizlilik/` | `gizlilik/index.html` | KVKK uyumlu gizlilik politikası (App Store zorunlu) |
| `/kosullar/` | `kosullar/index.html` | Kullanım koşulları |
| `/destek/` | `destek/index.html` | App Store "Support URL" |
| `/hesap-silme/` | `hesap-silme/index.html` | Apple'ın istediği hesap silme anlatımı |
| `/davet/[kod]` | `davet/index.html` | Uygulamadan paylaşılan takım davet bağlantıları |
| `/giris-tamam` | `giris-tamam.html` | Supabase doğrulama bağlantısı için kimlik doğrulama köprüsü |

## Yayına almadan önce doldurulacaklar

1. ~~Adres~~ — tamamlandı. Açık adres yerine "Kahramanmaraş, Türkiye"
   yazılıp başvuru kanalı olarak e-posta gösterildi. Veri Sorumlusuna
   Başvuru Usul ve Esasları Hakkında Tebliğ, kayıtlı e-posta adresinden
   yapılan başvuruyu geçerli sayar. Posta yoluyla başvurmak isteyene
   tebligat adresi talep üzerine iletilir — böyle bir talep gelirse
   yanıtsız bırakmayın.
2. **Sunucu bölgesi** — `gizlilik/index.html` → "Verilerin nerede
   saklandığı" başlığı. Şu an "bölge kesinleşmedi" yazıyor. Supabase
   projesi kurulunca gerçek bölge adı yazılmalı (App Store'a çıkmadan
   önce zorunlu). Bölge Türkiye dışındaysa aynı sayfadaki yurt dışına
   aktarım uyarısı geçerlidir.
3. **Mağaza bağlantıları** — üç yerde yer tutucu duruyor, hepsi `TODO`
   ile işaretli: ana sayfadaki iki `store-btn` (şimdilik tıklanamaz,
   "Yakında" rozetli), `davet/index.html` ve `giris-tamam.html`
   dosyalarının sonundaki App Store / Google Play adresleri.

4. ~~Ekran görüntüleri~~ — eklendi: `assets/ilanlar.jpeg`,
   `teklifler.jpeg`, `dizilis.jpeg`, `turnuvalar.jpeg` (~1000×2048).
   Yenilemek istersen aynı adla üzerine yaz; oran korunursa CSS'e
   dokunmaya gerek yok. Dosyalar 100–160 KB; istersen webp'ye çevirip
   `index.html` içindeki uzantıları güncelleyebilirsin.
5. **E-posta** — her yerde `destek@saha46.app` kullanılıyor. Farklı bir
   adres olacaksa toplu değiştir.
6. **Open Graph görseli** — `assets/og.png` (1200×630) gerçek logoyla
   üretilmiştir; istersen tasarım aracıyla değiştirebilirsin.

## Logo

`assets/logo.png` sitenin logosudur (560×560, kare, teal zeminli).
`assets/logo-orijinal.png` dokunulmamış 1024×1024 dosyadır; `logo.png`
onun kenar boşlukları kırpılmış hâlidir. Logo üç yerde kullanılıyor:
üst çubuk (32px), hero (76px) ve favicon / `apple-touch-icon`.
Yeni bir sürüm hazırlarsan kare oranı koru ve `logo.png` üzerine yaz —
başka bir yerde yol değiştirmen gerekmez.

Yer tutucular sayfada turuncu bir rozetle (`.fill`) görünür, gözden kaçmaz.

## Yerelde çalıştırma

    python -m http.server 8000

Sonra http://localhost:8000 adresini aç. Davet sayfasını denemek için
`http://localhost:8000/davet/?kod=ASK-4X7K` kullan (yol biçimi
`/davet/ASK-4X7K` için sunucu yönlendirmesi gerekir).

## İletişim formu

Destek sayfasındaki form `POST /api/iletisim` adresine gider. Ortak mantık
[`lib/iletisim.mjs`](lib/iletisim.mjs) içindedir: doğrulama, bal küpü ile bot
elemesi ve Resend üzerinden e-posta gönderimi. İki platform sarmalayıcısı
vardır ve hangisine dağıtırsanız o çalışır:

| Platform | Dosya |
| --- | --- |
| Vercel | [`api/iletisim.mjs`](api/iletisim.mjs) |
| Cloudflare Pages | [`functions/api/iletisim.js`](functions/api/iletisim.js) |

Çalışması için üç ortam değişkeni gerekir (Vercel: Settings → Environment
Variables, Cloudflare: Settings → Environment variables):

| Değişken | Örnek | Açıklama |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_...` | resend.com üzerinden alınır |
| `MAIL_TO` | `destek@saha46.app` | mesajların düşeceği adres |
| `MAIL_FROM` | `Saha46 <form@saha46.app>` | Resend'de doğrulanmış alan adından |

Resend'de `saha46.app` alan adını doğrulamanız (DNS'e SPF/DKIM kayıtları)
gerekir, yoksa gönderim reddedilir. Değişkenler tanımlı değilken form
"Form şu an kapalı, lütfen e-posta ile yaz" der; sayfa çalışmaya devam eder.

Mesaj hiçbir yerde saklanmaz, IP yazılmaz (yalnızca ülke kodu).

## Dağıtım

Site **statik**tir; derleme komutu yoktur. Proje ayarlarında şunlar olmalıdır:

- **Framework preset:** Other / None
- **Root Directory:** deponun kökü (`./`) — `admin-src` DEĞİL
- **Build command:** boş
- **Output directory:** `./`

> **Dikkat:** Depoda `admin-src/` içinde bir Next.js projesi var. Vercel ve
> Cloudflare, depoyu içe aktarırken bunu görüp Root Directory olarak
> `admin-src` önerebilir. Kabul ederseniz sitenin kökü yayınlanmaz ve ana
> sayfa **404 NOT_FOUND** verir (panelin `basePath` değeri `/admin`
> olduğu için kök adres o projede de yoktur). Root Directory mutlaka kök
> olmalıdır; panel zaten derlenmiş hâliyle `admin/` klasöründe durur.

`vercel.json` davet yollarını yönlendirir ve `/admin` için `X-Robots-Tag`
başlığı ekler. Cloudflare'de aynı işi `_redirects` ve `_headers` yapar.

## Canlı ortam

| Ne | Nerede |
| --- | --- |
| Alan adı | `saha46.app` — `www` 308 ile çıplak adrese yönlenir |
| DNS | Cloudflare (proxy açık) |
| Barındırma | Vercel, `main` dalından otomatik dağıtım |
| İletişim formu | Vercel Serverless Function → Resend (bölge: `ap-northeast-1`) |
| `destek@saha46.app` | Cloudflare Email Routing ile kişisel Gmail'e yönlendirilir |

DNS'te dikkat edilecek iki nokta:

- Kök alan adında **tek bir SPF kaydı** olabilir. Cloudflare Email Routing
  `v=spf1 include:_spf.mx.cloudflare.net ~all` kaydını ister; Resend
  kurulumunda önerilen `v=spf1 -all` kaydı bununla çakışır ve MX kayıtlarının
  eklenmesini sessizce engeller. Resend'in gönderim SPF'i zaten ayrı bir
  alt alanda (`send.saha46.app`) durur.
- Cloudflare proxy açıkken SSL/TLS modu **Full (strict)** olmalıdır; Flexible
  modda site yönlendirme döngüsüne girer.

## Kimlik doğrulama köprüsü (/giris-tamam)

[`giris-tamam.html`](giris-tamam.html) iki ayrı engeli birden çözer:

1. Mobil tarayıcılar bir web adresinden `saha46://` gibi özel bir şemaya
   otomatik yönlenmeyi engeller; doğrulama bağlantısı doğrudan uygulamaya
   yönlendirdiğinde kullanıcı boş sayfada kalır.
2. Supabase (GoTrue) `exp://` şemasını geçerli saymaz. İzin listesine
   birebir yazılsa bile yönlendirmeyi reddedip Site URL'e düşer. Expo Go
   ile geliştirirken uygulamanın adresi tam da o biçimde üretilir.

Sayfa, Supabase'in kabul ettiği bir https adresidir: adresteki kodu alır
ve uygulamanın gerçek adresine taşır. Uygulama kendi adresini `app`
parametresiyle gönderir; parametre yoksa `saha46://` varsayılır.

Supabase → Authentication → URL Configuration:

| Ayar | Değer |
| --- | --- |
| Site URL | `https://saha46.app` |
| Redirect URLs | `https://saha46.app/**` ve `saha46://**` |

`exp://**` yazmaya gerek yok — Supabase zaten kabul etmiyor, köprü sayfası
bu yüzden var.

**Bu dosya mobil uygulama deposunda `web/giris-tamam.html` olarak durur ve
buraya olduğu gibi kopyalanır.** Değiştirmek gerekirse kaynak orasıdır;
iki kopya birbirinden ayrılmamalı. Sayfanın adresi değişirse uygulamadaki
`BRIDGE_URL` de değişmeli (`lib/auth.ts`).

İçindeki `app` parametresi yalnızca `saha46://` ve `exp://` şemalarını
kabul eder; bu kontrol kaldırılırsa açık yönlendirme (open redirect) açığı
oluşur. Değerler hem sorgu dizesinde (`?`) hem adres parçasında (`#`)
gelebildiği için ikisi de okunur.

Mağaza bağlantıları hâlâ yer tutucudur; dosyanın sonundaki `TODO`
satırında işaretli.

## Tasarım sistemi

Tüm renk, yarıçap, gölge ve tipografi değerleri `assets/style.css`
başındaki CSS değişkenlerinde. Uygulamanın tokenlarıyla birebir aynıdır.

Kural: `--brand` (#0097B2) ve `--accent` (#00BF63) yalnızca **dolgu**
olarak kullanılır. Açık zemin üzerindeki metin ve ikonlarda
`--primary-ink` (#00738A) ve `--accent-ink` (#0B7A43) kullanılır —
saf marka renkleri beyaz üzerinde 4.5:1 kontrastı tutturmaz.

## Yönetim paneli (/admin)

Kaynak: `admin-src/` (Next.js 16 App Router + TypeScript).
Yayınlanan çıktı: `admin/` (statik HTML, elle düzenlenmez).

**Panel canlı veriyle çalışır.** Kimlik doğrulama ve tüm veriler
Supabase'ten gelir; yapılan her işlem kalıcıdır ve `audit_log` tablosuna
yazılır.
Onayla / reddet / askıya al işlemleri listeleri gerçekten günceller, ancak
yalnızca bellekte: sayfa yenilenince başlangıç durumuna döner. Her sayfanın
üstünde bunu söyleyen kalıcı bir şerit vardır.

### Yönetici girişi

Giriş Supabase e-posta/şifre ile yapılır ([`lib/oturum.ts`](admin-src/lib/oturum.ts)).
Girişten sonra `profiles` tablosundan rol okunur; panele yalnızca
`role = 'admin'` **ve** `status = 'active'` olan hesaplar alınır. Bu, veritabanındaki
`is_admin()` yardımcısının baktığı alanın aynısıdır — panel kendi yetki kuralını
uydurmaz.

Bir hesabı yönetici yapmak için (Supabase → SQL Editor; veri güncellemesidir,
şema değişikliği değil):

    update profiles set role = 'admin' where email = 'ornek@saha46.app';

Bağlantı bilgileri `admin-src/.env.local` dosyasından okunur ve depoya
girmez:

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...

Değerler mobil depodaki `eas.json` içindeki `EXPO_PUBLIC_*` karşılıklarıdır.
Yalnızca **anon public** anahtar kullanılır; tarayıcıya gömülmesi tasarım
gereğidir ve RLS tarafından korunur. `service_role` anahtarı panele asla
konmaz — RLS'i tamamen atlar.

Panel statik dışa aktarıldığı için bu değerler **derleme sırasında** gömülür:
`.env.local` dosyası olmadan `npm run yayinla` çalıştırılırsa giriş ekranı
"Panel yapılandırılmamış" uyarısı verir.

Arayüzdeki denetim yalnızca ekranı gizler; asıl koruma RLS'tedir. Panelin bir
şeyi görememesi politikayı gevşetmek için gerekçe değildir — önce
`is_admin()`'in o hesap için doğru döndüğü kontrol edilmelidir.

### Ekranlar

| Yol | İşlev | Kaynak |
| --- | --- | --- |
| `/admin/giris` | Yönetici girişi | `auth` + `profiles.role` |
| `/admin` | Özet — sayı kartları, öncelikli şikayetler, son işlemler | türetilmiş |
| `/admin/sikayetler` | Ana iş kuyruğu | `reports` |
| `/admin/gelmeyenler` | Gelmeme bildirimleri, takıma göre gruplu | `match_ratings.no_show` |
| `/admin/ilanlar` | Tüm ilanlar, Türkçe duyarlı arama | `listings` |
| `/admin/kullanicilar` | Kullanıcı ve takım sekmeleri, yan panelde ayrıntı | `profiles`, `teams`, `team_members` |
| `/admin/kayitlar` | İşlem kaydı | `audit_log` |

Turnuvalar ve duyuru ekranları kaldırıldı: `tournaments` ile
`tournament_entries` tabloları `0007` ile düşürüldü, duyuru için de tablo
yok.

### Yazma işlemleri ve RLS

Panel `service_role` kullanmaz; her istek giriş yapan yöneticinin
oturumuyla gider ve RLS'teki `is_admin()` dallarından geçer.

| İşlem | Tablo | Durum |
| --- | --- | --- |
| Şikayet çöz / reddet | `reports` update | çalışıyor |
| İlan kaldır (`is_open = false`) | `listings` update | çalışıyor |
| Askıya al / askıyı kaldır | `profiles` update | çalışıyor |
| Yönetici yetkisi ver / al | `profiles` update | çalışıyor |
| Uyarı, ilan kısıtı | `audit_log` insert | yalnızca kayda geçer |

**Şema desteği bekleyen iki iş:**

1. *Gelmeme bildirimini geçersiz sayma.* `match_ratings` yazma politikası
   `with check (is_team_member(rater_team_id) and ...)` diyor; `is_admin()`
   yok, bu yüzden yönetici haksız bir bildirimi kaldıramıyor. Arayüzde
   neden yapılamadığı yazılı.
2. *İlan verme kısıtı.* Takımı kısıtlayacak bir alan yok; karar yalnızca
   `audit_log`'a yazılıyor, ilan vermeyi teknik olarak engellemiyor.

Hesap silme panelde yok: `profiles` için delete politikası yok ve olmamalı —
kullanıcı hesabını uygulamadaki `delete_my_account` RPC'siyle kendisi siler.

### Kod düzeni

- `lib/tipler.ts` — veri modeli. `Team`, `Listing`, `Offer`, `Match` mobil
  uygulamadan birebir alınmıştır; **alan adları değiştirilmemelidir**.
  `Profile`, `Report`, `AuditLog`, `Tournament` panelle birlikte eklendi.
- `lib/mock/veri.ts` — tüm sahte veri tek dosyada. Deterministik üretilir
  (tohumlu üreteç), böylece her derlemede aynı liste çıkar.
- `lib/mock/sabitler.ts` — ilçeler, sahalar, isimler ve `BUGUN` sabiti.
  Demo verisi `Date.now()` kullanmaz; "bugün" 24.08.2026 kabul edilir.
- `lib/durum.tsx` — tüm işlemler burada. Sunucu bağlanınca yalnızca bu
  dosyadaki işlevlerin gövdesi değişecek, ekranlar aynı kalacak.
- `lib/bicim.ts` — tarih/para biçimleme ve Türkçe karakterlere duyarlı arama
  (`toLowerCase` yerine `localeCompare` tabanlı).

### Geliştirme ve yayınlama

    cd admin-src
    npm install
    npm run dev        # http://localhost:3000/admin
    npm run yayinla    # derler ve ../admin klasörüne kopyalar

`npm run yayinla` çalıştırmadan sitedeki panel güncellenmez. `admin/`
klasörü derleme çıktısıdır; içindeki dosyaları elle düzenlemeyin.

### Arama motorlarına kapalı

Üç katman: `robots.txt` içinde `Disallow: /admin/`, her sayfada
`noindex, nofollow` meta etiketi ve sunucu başlığı (`vercel.json` ile
Vercel'de, `_headers` ile Cloudflare Pages'te `X-Robots-Tag`).
Bunlar dizine eklenmeyi engeller ama **erişimi engellemez** — panel herkese
açıktır. Gerçek veriye bağlanmadan önce mutlaka gerçek kimlik doğrulama
eklenmelidir.
