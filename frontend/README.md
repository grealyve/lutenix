Harika bir proje! Lutenix ASOC Dashboard'un React ile frontend'ini geliştirmek için detaylı bir yol haritası ve `README.md` taslağı aşağıdadır.

---

# Lutenix ASOC Dashboard - Frontend

Bu proje, Lutenix ASOC (Application Security Orchestration and Correlation) platformunun React tabanlı frontend uygulamasıdır. Semgrep, OWASP ZAP ve Acunetix gibi güvenlik araçlarından gelen verileri yönetmek, taramaları başlatmak, bulguları görüntülemek ve raporlar oluşturmak için bir arayüz sağlar.

## Özellikler (Screenshots Temel Alınarak)

*   **Kimlik Doğrulama:** Güvenli kullanıcı girişi.
*   **Dashboard:** Varlık ve zafiyet sayıları özeti, zafiyet dağılımını gösteren pasta grafik.
*   **Araç Entegrasyonları (Semgrep, OWASP ZAP, Acunetix):**
    *   **Varlıklar/Deployments:** Hedef URL'leri veya repoları listeleme, ekleme, silme.
    *   **Taramalar:** Taramaları listeleme (hedef, durum, zafiyet sayıları), başlatma, durdurma, silme.
    *   **Bulgular:** Tespit edilen zafiyetleri listeleme (ID, Zafiyet Adı, Varlık/Konum, Risk Seviyesi).
    *   **Raporlar (Genel ve Araç Bazında):** Raporları listeleme, oluşturma (belirli varlıklar veya tüm varlıklar için), silme, indirme (HTML formatında).
*   **Ayarlar:**
    *   **Şirket Ayarları:** Şirket adı, entegre araçların API anahtarları ve port bilgileri.
    *   **Profil Ayarları:** Kullanıcı adı, e-posta adresi ve parola yönetimi.
*   **Admin Paneli:**
    *   Kullanıcı Yönetimi: Kullanıcıları listeleme, oluşturma, silme, admin yetkisi verme/alma.
*   **Şirket Yönetimi:**
    *   Şirket Oluşturma.
    *   Kullanıcıları Şirketlere Ekleme/İlişkilendirme.
*   **Genel UI Özellikleri:**
    *   Sol Menü Navigasyonu (Genişletilebilir)
    *   Üst Bar (Logo, Kullanıcı Bilgisi)
    *   Tablolar (Sıralama, Filtreleme, Sayfalama, Seçim Kutuları)
    *   Formlar (Validasyonlu)
    *   Modal Pencereler (Onaylar için olabilir)
    *   Grafikler (Pasta Grafik)

## Teknoloji Stack'i (Önerilen)

*   **Framework/Library:** [React](https://reactjs.org/) (v18+)
*   **Build Tool:** [Vite](https://vitejs.dev/) (Hızlı geliştirme ve build süreçleri için)
*   **Routing:** [React Router DOM](https://reactrouter.com/) (v6+)
*   **State Management:**
    *   [React Context API](https://reactjs.org/docs/context.html) (Basit ve orta karmaşıklıkta state için)
    *   *Alternatif:* [Zustand](https://github.com/pmndrs/zustand) veya [Redux Toolkit](https://redux-toolkit.js.org/) (Daha karmaşık global state yönetimi için)
*   **UI Component Library:**
    *   [Material UI (MUI)](https://mui.com/) (Kapsamlı, Google Material Design tabanlı)
    *   *Alternatif:* [Ant Design](https://ant.design/), [Chakra UI](https://chakra-ui.com/) (Projeye uygun birini seçebilirsiniz, görseller MUI veya benzerine yakın duruyor)
*   **API Calls:** [Axios](https://axios-http.com/) (Promise tabanlı HTTP istemcisi)
*   **Form Handling:** [React Hook Form](https://react-hook-form.com/) (Performanslı ve kolay form yönetimi)
*   **Charting:** [Recharts](https://recharts.org/) veya [Chart.js](https://www.chartjs.org/) (React wrapper ile)
*   **Styling:**
    *   UI Kütüphanesinin kendi çözümü (örn. MUI's `sx` prop, styled-components/emotion)
    *   *Alternatif:* [CSS Modules](https://github.com/css-modules/css-modules), [Tailwind CSS](https://tailwindcss.com/)
*   **Linting/Formatting:** ESLint, Prettier (Genellikle Vite/CRA ile hazır gelir)
*   **Icons:** UI Kütüphanesinin ikonları (örn. `@mui/icons-material`) veya [React Icons](https://react-icons.github.io/react-icons/)

## Proje Yapısı (Önerilen - Feature-Based)

```
lutenix-frontend/
├── public/             # Statik dosyalar (index.html, favicon vb.)
├── src/
│   ├── assets/         # Resimler, fontlar, logolar
│   ├── components/     # Tekrar kullanılabilir UI bileşenleri (Button, Input, Table, Modal, Layout...)
│   │   ├── common/     # Genel amaçlı bileşenler (Button, Input, Spinner...)
│   │   ├── layout/     # Ana sayfa düzenleri (Sidebar, Header, MainLayout...)
│   │   └── ui/         # Daha spesifik UI elemanları (DataGrid, ChartWrapper...)
│   ├── contexts/       # React Context API state yönetimi (AuthContext, SettingsContext...)
│   ├── features/       # Ana uygulama özellikleri/modülleri
│   │   ├── auth/       # Login, kimlik doğrulama mantığı
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── LoginPage.jsx
│   │   ├── dashboard/  # Ana Dashboard ekranı
│   │   │   ├── components/ (Örn. VulnerabilityChart)
│   │   │   └── DashboardPage.jsx
│   │   ├── semgrep/    # Semgrep ile ilgili sayfalar ve bileşenler
│   │   │   ├── DeploymentsPage.jsx
│   │   │   ├── ScansPage.jsx
│   │   │   └── FindingsPage.jsx
│   │   ├── owaspzap/   # OWASP ZAP ile ilgili sayfalar ve bileşenler
│   │   │   ├── AssetsPage.jsx
│   │   │   ├── ScansPage.jsx
│   │   │   └── FindingsPage.jsx
│   │   ├── acunetix/   # Acunetix ile ilgili sayfalar ve bileşenler
│   │   │   ├── AssetsPage.jsx
│   │   │   ├── ScansPage.jsx
│   │   │   └── FindingsPage.jsx
│   │   ├── reports/    # Raporlama ile ilgili sayfalar
│   │   │   ├── ReportsListPage.jsx
│   │   │   └── GenerateReportPage.jsx
│   │   ├── settings/   # Ayarlar sayfaları
│   │   │   ├── CompanySettingsPage.jsx
│   │   │   └── ProfileSettingsPage.jsx
│   │   └── admin/      # Admin paneli sayfaları
│   │       ├── UserManagementPage.jsx
│   │       ├── CompanyManagementPage.jsx # Veya CompanyRelation/Creation
│   │   ├── hooks/          # Tekrar kullanılabilir custom hook'lar (useAuth, useApi, useTable...)
│   │   ├── lib/            # Yardımcı fonksiyonlar, sabitler
│   │   │   ├── api.js      # Axios instance ve API çağrıları
│   │   │   ├── constants.js# Sabit değerler (API endpointleri, roller vb.)
│   │   │   └── utils.js    # Genel yardımcı fonksiyonlar (formatlama vb.)
│   │   ├── routes/         # Rota tanımlamaları
│   │   │   ├── index.jsx   # Ana Rota yapılandırması
│   │   │   └── ProtectedRoute.jsx # Kimlik doğrulaması gerektiren rotalar için wrapper
│   │   ├── styles/         # Global stiller, tema yapılandırması
│   │   │   ├── theme.js    # UI Kütüphanesi tema objesi
│   │   │   └── global.css  # Global CSS reset veya stiller
│   │   ├── App.jsx         # Ana uygulama bileşeni, routing'i ve layout'u ayarlar
│   │   └── main.jsx        # Uygulamanın giriş noktası (React DOM render)
│   ├── .env                # Ortam değişkenleri (API URL vb.) - Git'e eklenmemeli!
│   ├── .env.example        # Ortam değişkenleri şablonu
│   ├── .eslintrc.cjs       # ESLint yapılandırması
│   ├── .gitignore          # Git tarafından takip edilmeyecek dosyalar
│   ├── .prettierrc.json    # Prettier yapılandırması
│   ├── index.html          # Vite için ana HTML dosyası
│   ├── package.json        # Proje bağımlılıkları ve script'leri
│   ├── vite.config.js      # Vite yapılandırması
│   └── README.md           # Bu dosya
```

## Kurulum ve Başlatma

1.  **Projeyi Klonlama:**
    ```bash
    git clone <repository-url>
    cd lutenix-frontend
    ```

2.  **Bağımlılıkları Yükleme:**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Ortam Değişkenlerini Ayarlama:**
    *   `.env.example` dosyasını kopyalayıp `.env` adında yeni bir dosya oluşturun.
    *   `.env` dosyasını backend API adresiniz gibi gerekli bilgilerle doldurun.
        ```.env
        VITE_API_BASE_URL=http://localhost:8000/api # Örnek backend API adresi
        ```

4.  **Geliştirme Sunucusunu Başlatma:**
    ```bash
    npm run dev
    # veya
    yarn dev
    ```
    Uygulama genellikle `http://localhost:5173` (Vite varsayılanı) adresinde açılacaktır.

## Kullanılabilir Script'ler

*   `npm run dev` veya `yarn dev`: Geliştirme modunda Vite sunucusunu başlatır.
*   `npm run build` veya `yarn build`: Üretim için optimize edilmiş statik dosyaları `dist` klasörüne oluşturur.
*   `npm run lint` veya `yarn lint`: ESLint ile kod stilini kontrol eder.
*   `npm run preview` veya `yarn preview`: `build` sonrası üretim build'ini lokalde test etmek için sunucu başlatır.

## Geliştirme Yol Haritası (Adımlar)

1.  **Temel Kurulum:** Vite ile React projesi oluşturma, temel bağımlılıkları (React Router, Axios, UI Kütüphanesi) ekleme.
2.  **Proje Yapısını Oluşturma:** Yukarıda önerilen klasör yapısını oluşturma.
3.  **Temel Layout:** `MainLayout` (Sidebar, Header içeren) ve `AuthLayout` (Login sayfası için) bileşenlerini oluşturma.
4.  **Routing Ayarları:** `react-router-dom` kullanarak temel sayfalar (Login, Dashboard, Settings vb.) için rotaları tanımlama. `ProtectedRoute` oluşturarak yetkisiz erişimi engelleme.
5.  **Kimlik Doğrulama (Auth):**
    *   Login sayfası UI'ını oluşturma (`features/auth/LoginPage.jsx`).
    *   `AuthContext` oluşturarak kullanıcı oturum bilgilerini (token, kullanıcı detayları) global olarak yönetme.
    *   Login/Logout API entegrasyonlarını yapma (`lib/api.js` içinde).
6.  **Temel UI Bileşenleri:** Sık kullanılacak `Button`, `Input`, `Table`, `Modal` gibi bileşenleri `components/common` altına (veya UI kütüphanesinden kullanarak) hazırlama/yapılandırma.
7.  **Dashboard:** Dashboard sayfasını (`features/dashboard/DashboardPage.jsx`) oluşturma. Gerekli API çağrılarını yaparak (varlık/zafiyet sayısı) verileri gösterme. Pasta grafik bileşenini (`Recharts` vb.) entegre etme.
8.  **Ayarlar:**
    *   Profil Ayarları sayfası ve formu (`features/settings/ProfileSettingsPage.jsx`).
    *   Şirket Ayarları sayfası ve formu (`features/settings/CompanySettingsPage.jsx`).
    *   İlgili API entegrasyonları.
9.  **Admin Paneli:**
    *   Kullanıcı Yönetimi tablosu ve işlemleri (listeleme, ekleme, silme, yetki değiştirme) (`features/admin/UserManagementPage.jsx`).
    *   Şirket Yönetimi (oluşturma, kullanıcı ekleme) (`features/admin/CompanyManagementPage.jsx`).
    *   Admin yetkisine göre menü/sayfa erişimlerini kontrol etme.
10. **Araç Modülleri (Semgrep, ZAP, Acunetix):**
    *   Her araç için ana navigasyon yapısını (Sidebar'da genişletilebilir menü) oluşturma.
    *   Her araç için `Assets/Deployments`, `Scans`, `Findings`, `Reports` (varsa) alt sayfalarını oluşturma.
    *   Bu sayfalarda listeleme (tablolarla), ekleme/oluşturma (formlarla/modallarla), silme, başlatma/durdurma gibi işlevleri implemente etme.
    *   İlgili API endpoint'lerini `lib/api.js` içine ekleme ve sayfalarda kullanma. Tablolar için veri çekme, sayfalama, sıralama mantığını implemente etme (tercihen `useTable` gibi bir custom hook ile).
11. **Raporlama:**
    *   Genel Raporlar sayfası (`features/reports/ReportsListPage.jsx`) - Oluşturulmuş raporları listeleme ve indirme linkleri.
    *   Rapor Oluşturma sayfası (`features/reports/GenerateReportPage.jsx`) - Form ile rapor adı ve URL seçimi, API'ye istek gönderme.
12. **İyileştirmeler:**
    *   Yükleme durumları (loading spinners) ekleme.
    *   Hata yönetimi (API hatalarını kullanıcıya gösterme).
    *   Form validasyonları ekleme (`react-hook-form` ile).
    *   Tablolara sıralama ve filtreleme özellikleri ekleme.
    *   Responsive tasarım (farklı ekran boyutlarına uyum).
13. **Test:** Temel bileşenler ve işlevler için unit/integration testleri yazma (örn. [Vitest](https://vitest.dev/) veya [React Testing Library](https://testing-library.com/)).
14. **Build ve Deploy:** Üretim build'i alma ve bir sunucuya deploy etme.

---

Bu yol haritası ve yapı, projenizi organize bir şekilde geliştirmenize yardımcı olacaktır. Başarılar!

## Authentication System

The application uses JWT (JSON Web Token) authentication to secure the dashboard.

### Login

- The system authenticates users through the API endpoint: `http://localhost:4040/api/v1/users/login`
- Users need to provide an email and password
- Upon successful authentication, a JWT token is stored in localStorage

### Protected Routes

- All dashboard routes are protected and require authentication
- Unauthenticated users will be redirected to the login page
- The system automatically checks token expiration
- If a token expires, the user will be logged out and redirected to the login page

### Making Authenticated API Calls

To make API calls that require authentication, use the utility functions in `src/utils/api.js`:

```javascript
import apiCall from '../utils/api';

// Example API call with authentication
const getAssets = async () => {
  try {
    const data = await apiCall('/assets');
    return data;
  } catch (error) {
    console.error('Error fetching assets:', error);
  }
};
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## License

This project is licensed under the MIT License - see the LICENSE file for details.