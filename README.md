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

## Yayına almadan önce doldurulacaklar

1. **Adres** — `gizlilik/index.html` ve `kosullar/index.html` içinde
   `[ADRES]` yazan yerler (KVKK veri sorumlusu adresi).
2. **Sunucu bölgesi** — `gizlilik/index.html` içinde `[BÖLGE]`
   (Supabase projesinin bölgesi). Bölge Türkiye dışındaysa aynı sayfadaki
   yurt dışına aktarım uyarısı geçerlidir.
3. **Mağaza bağlantıları** — `index.html` içindeki iki `store-btn`
   bağlantısı (şimdilik `#` ve "Yakında" rozetli) ve `davet/index.html`
   başındaki `APP_STORE` / `GOOGLE_PLAY` değişkenleri.
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

Destek sayfasındaki form `POST /api/iletisim` adresine gider. Bu uç nokta
bir **Cloudflare Pages Function**: [`functions/api/iletisim.js`](functions/api/iletisim.js).
Mesajı doğrular, bal küpü alanıyla botları eler ve Resend üzerinden
e-posta olarak gönderir. Hiçbir yerde veritabanına yazılmaz.

Çalışması için Cloudflare Pages → Settings → Environment variables
altında üç değişken gerekir:

| Değişken | Örnek | Açıklama |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_...` | resend.com üzerinden alınır |
| `MAIL_TO` | `destek@saha46.app` | mesajların düşeceği adres |
| `MAIL_FROM` | `Saha46 <form@saha46.app>` | Resend'de doğrulanmış alan adından |

Resend'de `saha46.app` alan adını doğrulaman (DNS'e SPF/DKIM kayıtları)
gerekir, yoksa gönderim reddedilir. Değişkenler tanımlı değilken form
"Form şu an kapalı, lütfen e-posta ile yaz" der; sayfa çalışmaya devam eder.

Yerelde denemek için: `npx wrangler pages dev .`
(Düz `python -m http.server` ile form gönderimi çalışmaz, sayfanın geri
kalanı çalışır.)

## Dağıtım

- **Cloudflare Pages** (form bunu gerektirir): build komutu yok, output
  dizini `/`. `_redirects` davet yollarını, `functions/` klasörü de
  iletişim formunu kendiliğinden ayağa kaldırır.
- **Vercel:** Framework "Other", build komutu yok, output dizini kök.
  `vercel.json` davet yollarını `davet/index.html` dosyasına yönlendirir.
  Dikkat: Vercel `functions/` klasörünü çalıştırmaz — iletişim formunu
  Vercel'de kullanmak istersen aynı kodu `api/iletisim.js` altına
  taşımak gerekir.

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

**Panel tamamen sahte veriyle çalışır.** Sunucu, veritabanı ve gerçek kimlik
doğrulama yoktur. Giriş ekranı herhangi bir e-posta ve şifreyi kabul eder.
Onayla / reddet / askıya al işlemleri listeleri gerçekten günceller, ancak
yalnızca bellekte: sayfa yenilenince başlangıç durumuna döner. Her sayfanın
üstünde bunu söyleyen kalıcı bir şerit vardır.

### Ekranlar

| Yol | İşlev |
| --- | --- |
| `/admin/giris` | Sahte giriş |
| `/admin` | Özet — 4 sayı kartı, bekleyen şikayetler, son işlemler |
| `/admin/sikayetler` | Ana iş kuyruğu: filtre, yan panel, hedef geçmişi, aksiyonlar |
| `/admin/gelmeyenler` | Takıma göre gruplanmış gelmeme bildirimleri |
| `/admin/ilanlar` | Tüm ilanlar, Türkçe karakter duyarlı arama |
| `/admin/kullanicilar` | Kullanıcı ve takım sekmeleri + detay sayfaları |
| `/admin/turnuvalar` | Turnuvalar, başvuru kararları, yeni turnuva formu |
| `/admin/duyuru` | Duyuru hazırlama ve önizleme (gönderim sahte) |
| `/admin/kayitlar` | İşlem kaydı (audit log) |

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
