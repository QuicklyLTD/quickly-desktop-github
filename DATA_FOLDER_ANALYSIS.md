# DATA KLASÖRÜ ANALİZ RAPORU

## Quickly Desktop v2.1.0 - Veri Yönetimi Mimarisi

---

## 📁 **KLASÖR YAPISI**

```
/Users/guvensoft/Desktop/app/data/
├── backup/                    # Günlük yedek dosyaları (842 adet .qdat)
├── config.json               # PouchDB/Express-PouchDB yapılandırması
├── customer.png              # Müşteri/Mağaza logosu
├── db.dat                    # Ana veritabanı dump dosyası
├── dvvvvb.dat               # Eski/yedek veritabanı dump
├── log.txt                   # Express-PouchDB sunucu logları (434 MB!)
└── 1566605096088.qdat       # Tek başına yedek dosyası
```

---

## 🎯 **DOSYA GÖREVLERİ VE KULLANIM ALANLARI**

### 1. **config.json** (74 bytes)

**Görev:** PouchDB/Express-PouchDB sunucu yapılandırması

**Oluşturulma:**

- İlk uygulama başlatıldığında `express-pouchdb` tarafından otomatik oluşturulur
- Eğer yoksa default ayarlarla oluşturulur

**Kullanım Yerleri:**

```javascript
// Dosya: main/appServer.js (Line 18)
expressPouch(PouchDB.defaults(serverOpts), {
  logPath: "./data/log.txt",
  configPath: "./data/config.json",
});
```

**İçerik:** PouchDB sunucu ayarları (CORS, auth, replication vb.)

---

### 2. **log.txt** (434 MB!)

**Görev:** Express-PouchDB sunucu HTTP request/response logları

**Oluşturulma:**

- Express-PouchDB başlatıldığında otomatik oluşturulur
- Her HTTP isteği bu dosyaya yazılır

**Kullanım Yerleri:**

```javascript
// Dosya: node_modules/express-pouchdb/lib/logging-infrastructure.js (Line 83)
var logPath = app.opts.logPath || "./log.txt";
```

**Yazma Zamanı:**

- Her PouchDB HTTP isteğinde (GET, PUT, POST, DELETE)
- Replication işlemlerinde
- Sync operasyonlarında

**⚠️ UYARI:** 434 MB boyutunda! Periyodik temizleme gerekebilir.

---

### 3. **db.dat** (909 KB)

**Görev:** Tüm PouchDB veritabanlarının JSON dump'ı

**Oluşturulma:**

- Gün sonu işlemlerinde
- Backup operasyonlarında
- Manuel export işlemlerinde

**Yazma İşlemleri:**

#### **A) Gün Sonu Backup (SyncService)**

```javascript
// Dosya: main.bundle.js (Line 2725)
// Class: SyncService
// Method: backupDB()

this.electronService.fileSystem.writeFile(
  this.electronService.appRealPath + '/data/db.dat',
  JSON.stringify(cleanDocs),
  err => { ... }
)
```

**Çağrılma Zamanı:**

- Gün sonu işlemi tamamlandığında
- `endDayListener()` tetiklendiğinde
- Manuel backup talep edildiğinde

#### **B) Okuma İşlemleri**

**1. Uygulama Başlangıcında (AppComponent)**

```javascript
// Dosya: main.bundle.js (Line 931)
// Class: AppComponent
// Method: ngOnInit() veya initAppSettings()

this.electronService.fileSystem.readFile("./data/db.dat", (err, data) => {
  // Veritabanı restore işlemi
});
```

**2. Veri Kurtarma (SellingScreenComponent)**

```javascript
// Dosya: main.bundle.js (Line 13315)
// Class: SellingScreenComponent

this.electronService.fileSystem.readFile("./data/db.dat", (err, data) => {
  // Acil durum veri kurtarma
});
```

**İçerik Yapısı:**

```json
{
  "checks": [...],
  "products": [...],
  "categories": [...],
  "tables": [...],
  "users": [...],
  "settings": [...],
  "reports": [...],
  "cashbox": [...],
  "customers": [...]
}
```

---

### 4. **backup/\*.qdat** (842 dosya, ~300-1500 KB/dosya)

**Görev:** Günlük otomatik yedeklemeler

**Dosya Adı Formatı:** `{timestamp}.qdat` (örn: `1566605096088.qdat`)

- Timestamp: Unix epoch (milisaniye)
- Örnek: 1566605096088 = 24 Ağustos 2019, 00:18:16

**Oluşturulma:**

#### **A) Backup Yazma (ElectronService)**

```javascript
// Dosya: main.bundle.js (Line 11644-11669)
// Class: ElectronService
// Method: backupData(data, date)

backupData(data, date) {
  fs.exists(this.appRealPath + '/data/backup/', (exists) => {
    if (!exists) {
      // Klasör yoksa oluştur
      fs.mkdir(this.appRealPath + '/data/backup/', (err) => {
        fs.writeFile(
          this.appRealPath + '/data/backup/' + date,
          json,
          (err) => { ... }
        )
      })
    } else {
      // Klasör varsa direkt yaz
      fs.writeFile(
        this.appRealPath + '/data/backup/' + date,
        json,
        (err) => { ... }
      )
    }
  })
}
```

**Çağrılma Akışı:**

1. **Gün Sonu Tetikleyicisi (SyncService)**

```javascript
// Dosya: main.bundle.js (Line 2683)
// Class: SyncService
// Method: endDay()

this.electronService.backupData(this.backupData, finalDate);
```

2. **Backup Verisi Hazırlama**

```javascript
// Dosya: main.bundle.js (Line 2444-2683)
// Class: SyncService

this.backupData = [];

// Checks backup
this.backupData.push(checksBackup); // Line 2535

// Cashbox backup
this.backupData.push(cashboxBackup); // Line 2562

// Reports backup
this.backupData.push(reportsBackup); // Line 2592

// Logs backup (3 farklı tip)
this.backupData.push(logsBackup); // Lines 2622, 2651, 2667
```

#### **B) Backup Okuma**

```javascript
// Dosya: main.bundle.js (Line 11669-11675)
// Class: ElectronService
// Method: getBackup(filename)

fs.exists(this.appRealPath + "/data/backup/" + filename, (exists) => {
  if (exists) {
    fs.readFile(this.appRealPath + "/data/backup/" + filename, (err, data) => {
      let buffer = data.toString();
      let backup = JSON.parse(buffer);
      resolve(backup);
    });
  }
});
```

**Kullanım Senaryoları:**

- Gün sonu işlemlerinde otomatik yedekleme
- Veri kaybı durumunda kurtarma
- Geçmiş verilere erişim
- Raporlama ve analiz

**İçerik Yapısı:**

```json
[
  {
    "type": "checks",
    "data": [...]
  },
  {
    "type": "cashbox",
    "data": [...]
  },
  {
    "type": "reports",
    "data": [...]
  },
  {
    "type": "logs",
    "data": [...]
  }
]
```

---

### 5. **customer.png** (9.9 KB)

**Görev:** Müşteri/Mağaza logosu (fiş ve raporlarda kullanılır)

**Oluşturulma:**

- Ayarlar ekranından logo yüklendiğinde
- İlk kurulum sırasında default logo

**Yazma İşlemleri:**

#### **A) Logo Upload (ElectronService)**

```javascript
// Dosya: main.bundle.js (Line 11617-11635)
// Class: ElectronService
// Method: uploadLogo(binaryData)

fs.exists(this.appRealPath + '/data/', (exists) => {
  if (!exists) {
    fs.mkdir(this.appRealPath + '/data/', (err) => {
      fs.writeFile(
        this.appRealPath + '/data/customer.png',
        binaryData,
        function (err) { ... }
      )
    })
  } else {
    fs.writeFile(
      this.appRealPath + '/data/customer.png',
      binaryData,
      function (err) { ... }
    )
  }
})
```

**Okuma İşlemleri:**

#### **A) Fiş Yazdırma (PrinterService)**

```javascript
// Dosya: main.bundle.js (Line 6709)
// Class: PrinterService

this.logo = this.electron.appRealPath + "/data/customer.png";
```

#### **B) Rapor Ekranı (ReportsComponent)**

```javascript
// Dosya: main.bundle.js (Line 11903)
// Class: ReportsComponent

this.storeLogo = this.electron.appRealPath + "/data/customer.png";
```

**Kullanım Yerleri:**

- Adisyon/Fiş yazdırma
- Gün sonu raporları
- Z raporu
- Müşteri ekranı

---

### 6. **dvvvvb.dat** (694 KB)

**Görev:** Eski/yedek veritabanı dump dosyası

**Analiz:**

- Boyut: 694 KB (db.dat'tan küçük)
- Muhtemelen eski bir backup veya test verisi
- Kod tarafında referans bulunamadı
- Manuel olarak oluşturulmuş olabilir

**Öneri:** Silinebilir veya arşivlenebilir

---

### 7. **1566605096088.qdat** (1.3 MB)

**Görev:** Tek başına yedek dosyası

**Analiz:**

- Tarih: 24 Ağustos 2019, 00:18:16
- Boyut: 1.3 MB (normal backup'lardan büyük)
- backup/ klasörü dışında
- Muhtemelen manuel kopyalama veya test

**Öneri:** backup/ klasörüne taşınabilir

---

## 🔄 **VERI AKIŞI VE YAŞAM DÖNGÜSÜ**

### **1. Uygulama Başlangıcı**

```
AppComponent.ngOnInit()
  ↓
initAppSettings()
  ↓
db.dat okuma (varsa)
  ↓
PouchDB'ye restore
  ↓
Express-PouchDB sunucu başlatma
  ↓
config.json + log.txt oluşturma
```

### **2. Normal Çalışma**

```
Kullanıcı İşlemleri
  ↓
PouchDB (Memory/IndexedDB)
  ↓
Express-PouchDB Server
  ↓
log.txt'ye yazma
  ↓
Remote Sync (varsa)
```

### **3. Gün Sonu**

```
endDayListener() tetiklenir
  ↓
SyncService.endDay()
  ↓
Backup verisi hazırlama:
  - checks
  - cashbox
  - reports
  - logs (3 tip)
  ↓
ElectronService.backupData()
  ↓
data/backup/{timestamp}.qdat yazma
  ↓
db.dat güncelleme
  ↓
Remote upload (varsa)
  ↓
Program yeniden başlatma
```

### **4. Veri Kurtarma**

```
Hata/Veri Kaybı
  ↓
db.dat okuma
  ↓
VEYA
  ↓
backup/{timestamp}.qdat seçimi
  ↓
ElectronService.getBackup()
  ↓
PouchDB'ye restore
```

---

## 📊 **SINIFLAR VE FONKSİYONLAR**

### **1. SyncService**

**Dosya:** `main.bundle.js`

**Metodlar:**

- `endDay()` - Gün sonu işlemleri
- `backupDB()` - db.dat oluşturma
- `uploadBackup()` - Remote backup upload

**Veri Yazma:**

- ✅ `data/db.dat`
- ✅ `data/backup/*.qdat` (dolaylı)

---

### **2. ElectronService**

**Dosya:** `main.bundle.js`

**Metodlar:**

- `backupData(data, date)` - Backup dosyası yazma
- `getBackup(filename)` - Backup dosyası okuma
- `uploadLogo(binaryData)` - Logo yükleme

**Veri Yazma:**

- ✅ `data/backup/*.qdat`
- ✅ `data/customer.png`

**Veri Okuma:**

- ✅ `data/backup/*.qdat`

---

### **3. AppComponent**

**Dosya:** `main.bundle.js`

**Metodlar:**

- `ngOnInit()` - Uygulama başlangıcı
- `initAppSettings()` - Ayarları yükleme

**Veri Okuma:**

- ✅ `data/db.dat`

---

### **4. SellingScreenComponent**

**Dosya:** `main.bundle.js`

**Metodlar:**

- Acil veri kurtarma metodları

**Veri Okuma:**

- ✅ `data/db.dat`

---

### **5. PrinterService**

**Dosya:** `main.bundle.js`

**Metodlar:**

- Fiş yazdırma metodları

**Veri Okuma:**

- ✅ `data/customer.png`

---

### **6. ReportsComponent**

**Dosya:** `main.bundle.js`

**Metodlar:**

- Rapor oluşturma metodları

**Veri Okuma:**

- ✅ `data/customer.png`

---

### **7. Express-PouchDB (Node.js)**

**Dosya:** `main/appServer.js`

**Metodlar:**

- HTTP sunucu başlatma
- PouchDB routing

**Veri Yazma:**

- ✅ `data/log.txt` (otomatik)
- ✅ `data/config.json` (otomatik)

---

## ⏰ **ZAMANLAMA VE TETİKLEYİCİLER**

### **1. Uygulama Başlangıcı**

- `config.json` oluşturma/okuma
- `log.txt` oluşturma
- `db.dat` okuma (varsa)
- `customer.png` yükleme

### **2. Gün Sonu (Otomatik)**

- Her gün sonu işleminde
- `endDayListener()` tetiklendiğinde
- Backup oluşturma: `{timestamp}.qdat`
- `db.dat` güncelleme

### **3. Manuel İşlemler**

- Logo yükleme → `customer.png`
- Manuel backup → `{timestamp}.qdat`
- Veri kurtarma → `db.dat` veya `*.qdat` okuma

### **4. Sürekli (Runtime)**

- Her HTTP isteğinde → `log.txt` yazma
- Replication işlemlerinde → `log.txt` yazma

---

## 🔍 **BACKUP DOSYALARI ANALİZİ**

### **Tarih Aralığı:**

- **İlk Backup:** 1522826804872 (4 Nisan 2018)
- **Son Backup:** 1599954090107 (13 Eylül 2020)
- **Toplam Süre:** ~2.5 yıl

### **Dosya Boyutları:**

- **Minimum:** 131 KB
- **Maximum:** 1.6 MB
- **Ortalama:** ~450 KB

### **Backup Sıklığı:**

- Günlük otomatik backup
- Bazı günlerde birden fazla backup (test/hata durumları)

### **Toplam Veri:**

- 842 dosya × ~450 KB = **~379 MB**

---

## ⚠️ **ÖNERİLER VE İYİLEŞTİRMELER**

### **1. Log Dosyası Temizliği**

```javascript
// log.txt 434 MB! Periyodik temizleme ekle:
// Örnek: Her gün sonu eski logları sil veya arşivle
```

### **2. Backup Rotasyonu**

```javascript
// 842 backup dosyası var!
// Öneri: Son 30 günü tut, eskilerini sil/arşivle
// Veya: Haftalık/aylık backup'lara dönüştür
```

### **3. db.dat Versiyonlama**

```javascript
// db.dat üzerine yazılıyor
// Öneri: db.dat.old gibi yedek tut
```

### **4. Hata Yönetimi**

```javascript
// Tüm fs işlemlerinde error handling ekle
// Disk dolu, izin yok gibi durumları handle et
```

### **5. Compression**

```javascript
// .qdat dosyaları JSON
// Öneri: gzip ile sıkıştır, %60-70 yer tasarrufu
```

---

## 📈 **PERFORMANS ETKİSİ**

### **Disk Kullanımı:**

- `log.txt`: 434 MB
- `backup/`: ~379 MB
- `db.dat`: 909 KB
- **TOPLAM:** ~814 MB

### **I/O İşlemleri:**

- **Okuma:** Uygulama başlangıcı (db.dat)
- **Yazma:** Her HTTP isteği (log.txt), Gün sonu (backup)
- **Kritik:** log.txt sürekli yazma (performans etkisi)

---

## 🎯 **SONUÇ**

Data klasörü, Quickly Desktop uygulamasının **kalıcı veri depolama** katmanıdır:

1. **config.json** → PouchDB yapılandırması
2. **log.txt** → HTTP request logları (TEMİZLENMELİ!)
3. **db.dat** → Ana veritabanı dump
4. **backup/\*.qdat** → Günlük yedeklemeler (ROTASYON GEREKLİ!)
5. **customer.png** → Mağaza logosu

**Kritik Sınıflar:**

- `SyncService` → Backup ve gün sonu
- `ElectronService` → Dosya I/O işlemleri
- `AppComponent` → Başlangıç veri yükleme

**Önemli:** Log ve backup dosyaları düzenli temizlenmeli!
