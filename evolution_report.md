# QUICKLY Desktop: Evrim ve Değişim Raporu (Angular 5 -> 14)

Bu rapor, `quickly-desktop` projesinin başlangıç (Angular 5) hali ile güncel (Angular 14) hali arasındaki mimari, iş mantığı ve CRUD süreçlerindeki değişimleri veriye dayalı olarak sunar.

## 1. Mimari ve Çalışma Prensipleri (Architectural Shifts)

| Dosya / Bileşen          | İlk Durum (Angular 5)                                  | Güncel Durum (Angular 14)                                                                          | Değişim Amacı                                                                  |
| :----------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Dizin Yapısı**         | Monolitik (Kök dizinde `main.ts`, `src/app/services/`) | Katmanlı (Electron ana süreci `app/` altında, Angular servisleri `src/app/core/services/` altında) | Modern boilerplate standartlarına uyum ve güvenli süreç ayrımı.                |
| **Dependency Injection** | Standart Constructor Injection.                        | `inject()` fonksiyonu kullanımı (örn: `main.service.ts:L19`).                                      | Angular 14'ün modern ve daha esnek DI yöntemine geçiş.                         |
| **Ortam Yönetimi**       | `main.ts` içinde basit `serve` bayrağı.                | `seedE2EDatabase` ile kapsamlı test verisi kurulumu (`main.service.ts:L126`).                      | E2E testleri için deterministik bir çalışma ortamı sağlamak.                   |
| **Hata Yönetimi**        | `console.log` tabanlı basit hata raporlama.            | `FileLogService` ile kalıcı dosya loglaması (`main.service.ts:L368`).                              | Üretim ortamında hata takibini (troubleshooting) profesyonel seviyeye taşımak. |

## 2. CRUD İşlemleri ve Veri Yönetimi (Data Evolution)

### PouchDB ve Senkronizasyon

- **Silinen Veri Filtreleme:** Güncel sürümde `replicateDB` (`main.service.ts:L731`) ve `replicateFrom` (`main.service.ts:L741`) metodlarına `{ selector: { _deleted: { $exists: false } } }` filtresi eklenmiştir.
  - **Amaç:** Senkronizasyon sırasında silinmiş dökümanların trafiği ve belleği gereksiz işgal etmesini önlemek.
- **Veri Tutarlılığı (Integrity):** `cleanupMissingTableRefs` (`main.service.ts:L399`) adında yeni bir metod eklenmiştir.
  - **Amaç:** Masa silindiğinde o masaya ait açık hesapların (`checks`) veya kredilerin (`credits`) yetim kalmasını engellemek için otomatik temizlik yapmak.
- **Veritabanı Normalizasyonu:** `legacyDbNameMap` (`main.service.ts:L26`) ve `normalizeDbName` (`main.service.ts:L373`) eklenmiştir.
  - **Amaç:** Eski sürümdeki `report`, `user` gibi tablon isimlerinin yeni sürümdeki `reports`, `users` gibi çoğul isimlere sorunsuz migrate edilmesini sağlamak.

## 3. İş Mantığı Değişimleri (Business Logic)

### Oturum ve Yetkilendirme (`auth.service.ts`)

- **Güvenlik Kontrolleri:** `setPermissions` (`L59`) ve `isAuthed` (`L73`) metodlarına kapsamlı `null` veri ve yetki objesi kontrolleri eklenmiştir.
- **RxJS Standartları:** `Subject` importu modern RxJS 6+ standartlarına çekilmiştir (`L3`).

### Uygulama Durumu ve Ekran Kilidi (`application.service.ts`)

- **UX İyileştirmesi:** `screenLock` metoduna (`L59-62`) modal açıkken ekranın kilitlenmesini engelleyen kontrol eklenmiştir.
  - **Mantık:** Eğer kullanıcı bir işlem yapıyorsa (modal açıksa), zaman aşımı olsa bile ekranın aniden kapanması engellenmiştir.

## 4. Dosya Bazlı Değişim Özeti

- [main.ts](file:///Users/guvensoft/Desktop/QUICKLY%20%C3%96ZG%C3%9CR/quickly-desktop/app/main.ts): Sabit pencere boyutlarından (`1366x768`), sistem ekran boyutuna (`workAreaSize`) dinamik geçiş yapıldı. `killall cidshow` gibi sistem seviyesi komutlar daha kontrollü hale getirildi.
- [package.json](file:///Users/guvensoft/Desktop/QUICKLY%20%C3%96ZG%C3%9CR/quickly-desktop/package.json): Webpack 3'ten Webpack 5'e, Angular 5'ten Angular 14'e kritik versiyon yükseltmeleri yapıldı. Node.js mimarisi `app/` dizinine taşındı.

> [!IMPORTANT]
> Tüm bu değişimler, projenin sadece kod bazında değil, çalışma prensibi olarak da daha korumacı (defensive coding), hataya dayanıklı ve test edilebilir bir yapıya evrildiğini kanıtlamaktadır.
