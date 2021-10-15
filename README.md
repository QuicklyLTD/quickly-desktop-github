# QDesktop App Cross Platform Version 1.9.2

Uygulama Altyapısı

- Angular v5.0.3
- Angular-CLI v1.6.2
- Electron v1.8.1

## Kurulum

``` bash
git clone https://github.com/KosmosLab/quickly-desktop.git
```
Gerekli Kütüphaneleri yükleme için 

``` bash
npm install
```
Windows için Python27 kurulumda hazır olarak gelmediği için bazı Bazı Node modülleri yüklenirken Python'ı bulamadıklarında hata veriyorlar.

Windows için gerekli build programları kurulu değilse MSBUILD hatası verecektir Alttaki satırı deneyin.
``` bash
npm install --global --production windows-build-tools 
```

Eğer AngularCLI yüklü değil ise .angular-cli.json dosyası bulunmuyor ise alttaki komutu terminale yazın! (İlk etapta gerekli değil)

``` bash
npm install -g @angular/cli
```
## Uygulamayı Başlatmak için

- **1.Terminalde (Webpack'i başlatıp HotReload'ı aktif eder)** -> npm start

Geliştirici Aracı (DevTools) için `main.ts` içerisinde `win.webContents.openDevTools();` komutu bulunmakta. Son aşamada bu kod silinmeli ()! 

## Uygulamayı Build Etmek için

- Geliştirme değişkenleri (environments/index.ts) :  `npm run electron:dev`
- Ürün değişkenleri (environments/index.prod.ts) :  `npm run electron:prod`

Build /dist klasörüne oluşturulur.

## Diğer Terminal Komutları

- `npm run start:web` - Uygulamayı Browserda Açar [localhost:4200](http://localhost:4200) 
- `npm run electron:linux` - Uygulamyı Linux Platformları için derler. (Test Edildi - Çalışıyor)
- `npm run electron:windows` - 32/64 bit Windows işletim sistemi için derler (Test Edilmedi!) 
- `npm run electron:mac` - Uygulamayı Mac platformları için derler `.app` dosyası oluşturur (Test Edilmedi!)

**Uygulama /dist klasöründeki Webpack'in derlediği dosyaları include ederek çalışıyor ara-sıra silip aşşağıdaki komutu kullanarak tekrar oluşturmakta fayda var.**

``` bash
npm cache clean
npm start
```

## NodeJS'in Native Kütüphaneleri için (Yazıcılara Erişim, Dosya Sistemi vs.)

`webpack.config.js` dosyası içerisinde externals objesine eklenmeli!.

```javascript
  "externals": {
    "child_process": 'require(\'child_process\')',
    "electron": 'require(\'electron\')',
    "fs": 'require(\'fs\')'
  },
```

## Tarayıcı Modunda Çalıştırmak

Google Chrome vs tanımlı tarayıcılar için `npm run start:web` komutu 4200 portundan uygulamayı çalıştırır, Electron servislerine, ve Native Kütüphanelere erişemezsin!  
Native Kütüphanelerin işleyişini görmek için `providers/electron.service.ts` dosyasında bir takım kontroller bulunmakta!.

## Test işlemleri

Test dosyaları /e2e dizininde bulunmakta.

Test'i başlatmadan önce : `npm run pree2e`

Daha sonra 
- **1. Terminal** -> localhost:4200 : `npm run start:web`  
- **2. Terminal** -> Protractor'u başlatır : `npm run e2e`

 ## Karma Testleri için

 Webpack Derleme işlemlerinde bağımlıkların sorunsuz çalışıp çalışmadığı test etmek için aşşağıdaki kodu terminale gir.

``` bash
npm test
```

Tarayıcıda açtığı arayüzde Uygulamada bulduğu hataları gösterir.
