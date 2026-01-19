# Release Notes: v2.1.0-angular14

## 🎉 Major Release: Angular 14 Migration with v2.1.0 Features

This release represents a complete migration from Angular 5 (v2.1.0) to Angular 14, while preserving all features and maintaining full Git history from 2017 to present.

### ✨ New Features (v2.1.0 Ported to Angular 14)

#### 1. **Delayed Printing (Timeout)**

- Schedule product printing with configurable delays (20/40/60 minutes)
- Cancel delays on demand
- Visual indicators for delayed items
- Automatic timeout tracking per product

#### 2. **Collapsed View**

- Grouped product display with quantity badges
- Aggregates identical products (by name, status, note, timeout)
- Sorted by status and quantity
- Toggle between normal and collapsed views

#### 3. **Service Charge**

- Quick service fee addition (5%, 10%, 15%, 20%)
- Automatic calculation based on check total
- Integrated into check flow

#### 4. **Kuver Management**

- Quick cover charge addition (1-10 covers)
- One-click kuver product insertion
- Streamlined workflow

#### 5. **User Change**

- Switch order ownership between staff members
- Permission-based access control
- Maintains audit trail

#### 6. **Price Edit**

- Dynamic product price modification
- Numpad interface for quick entry
- Real-time total recalculation
- Preserves original price in product catalog

#### 7. **Product Extras**

- Support for add-ons and modifications
- Extras tracking per product
- Price adjustments for extras

### 🔧 Technical Improvements

- **Angular 14:** Modern framework with improved performance
- **TypeScript:** Enhanced type safety and developer experience
- **Modal Flow:** Improved UX with proper modal transitions
- **Code Quality:** Refactored to Angular 14 best practices
- **Git History:** Complete historical preservation (2017-2026)

### 📊 Migration Stats

- **Commits Migrated:** ~400+ commits
- **History Preserved:** 2017 → 2026
- **Files Changed:** 32 files
- **Lines Added:** +25,070
- **Lines Removed:** -16,070

### 🏗️ Architecture

- **Frontend:** Angular 14.0.6
- **Desktop:** Electron 19.0.8
- **Database:** PouchDB (offline-first)
- **Language:** TypeScript
- **Styling:** SASS

### 📝 Commits in This Release

1. `70915b1` - feat(v2.1.0): add delayed printing feature (timeout)
2. `414440c` - feat(v2.1.0): add collapsed view for check products
3. `0101acd` - feat(v2.1.0): add service charge, kuver, user change and price edit features
4. `5b1a61e` - feat(v2.1.0): add timeout and edited parameters to Order model
5. `0d8bab1` - refactor: add checkTotal helper method for consistency
6. `950e7ef` - fix: improve modal flow and price edit initialization

### 🔗 Related

- **Previous Version:** v1.9.5 (Angular 5)
- **Legacy Branch:** `legacy-v2/master`
- **Migration Branch:** `feature/v2.1.0-features` (merged)

### 🚀 Installation

```bash
git clone https://github.com/QuicklyLTD/quickly-desktop-github.git
cd quickly-desktop-github
npm install
cd app && npm install
npm start
```

### 📖 Documentation

See [README.md](README.md) for full documentation and setup instructions.

---

**Full Changelog:** https://github.com/QuicklyLTD/quickly-desktop-github/compare/v1.9.5...v2.1.0-angular14
