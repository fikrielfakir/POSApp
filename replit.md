# replit.md

## Overview

POSApp is an offline-first Point of Sale (POS) mobile application built with React Native and Expo. It enables small businesses to manage sales, products, inventory, contacts, expenses, purchases, field force operations, and follow-ups — all without requiring an internet connection. Data is stored locally using SQLite, and the app supports initial data seeding via QR code scanning from a companion web dashboard. The app includes PIN-based authentication, invoice generation, reporting, and multi-language support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Mobile App)
- **Framework**: React Native 0.81 with Expo SDK 54 (managed workflow with new architecture enabled)
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation v7 with a combination of:
  - Native Stack navigator (root: Setup → PIN Lock → Main)
  - Drawer navigator (sidebar menu for all modules)
  - Bottom Tab navigator (quick access to POS, Products, Sales, Contacts, More)
- **UI Library**: React Native Paper (Material Design 3) for theming, plus custom styled components
- **State Management**: Zustand with Immer middleware for the shopping cart (`cartStore`); Zustand for auth state (`authStore`)
- **Forms**: React Hook Form with Zod validation (dependencies installed, used in form screens)
- **Internationalization**: i18next with react-i18next and expo-localization
- **Animations**: React Native Reanimated for gesture-based interactions

### Data Layer
- **Database**: SQLite via `expo-sqlite` (synchronous API, WAL mode, foreign keys enabled)
- **Schema**: Raw SQL migrations in `src/core/database/migrations.ts` — tables include `products`, `categories`, `brands`, `contacts`, `sales`, `sale_items`, `stock_movements`, `purchases`, `purchase_items`, `expenses`, `sell_returns`, `followups`, `field_visits`, `attendance`, `stock_transfers`, `warehouses`, `app_meta`
- **Data Access**: Custom repository pattern — each feature has its own repository file (e.g., `saleRepository.ts`, `productRepository.ts`, `contactRepository.ts`) that wraps raw SQL queries through shared helpers in `dbHelpers.ts`
- **ID Generation**: `nanoid` (non-secure variant) for generating 10-character alphanumeric IDs
- **No ORM**: Direct SQL queries with `expo-sqlite`'s `runSync`, `getAllSync`, `getFirstSync` methods

### Authentication & Security
- **PIN Lock**: 6-digit PIN stored in `expo-secure-store`, with lockout after 5 failed attempts (30-second cooldown)
- **Auto-lock**: App re-locks after configurable minutes of inactivity (background detection via AppState)
- **Setup Flow**: First-run setup wizard that seeds initial data via QR code scanning before requiring PIN creation

### QR Code Data Transfer
- **Purpose**: Transfer business data (products, contacts, categories, settings) from a web dashboard to the mobile app
- **Encoding**: JSON → pako gzip compression → base64 → chunked into multiple QR codes for large payloads
- **Decoding**: `qrDecoder.ts` parses individual QR frames; `chunkAssembler.ts` reassembles multi-QR sessions; `dataSeeder.ts` inserts into SQLite
- **Payload Types**: `pos_init` (full setup), `pos_update`, `pos_add_products`, `pos_add_contacts`, `pos_stock_transfer`

### Feature Modules (in `src/features/`)
- **Sales/POS**: Cart management, checkout with multiple payment methods, invoice generation
- **Products**: CRUD, stock adjustment, low-stock alerts, category/brand management
- **Contacts**: Customer and supplier management
- **Purchases**: Purchase orders with receive-and-stock-update workflow
- **Expenses**: Expense tracking with categories
- **Returns**: Sell returns linked to original sales with stock restoration
- **Reports**: Sales, stock, expense, and profit/loss reports with period filtering
- **Field Force**: Attendance clock-in/out, field visit tracking, map placeholder
- **Follow-ups**: Task management for calls, visits, emails with priority and status tracking
- **Settings**: Company info, currency, tax configuration, PIN management

### Project Structure
```
src/
├── core/           # Shared infrastructure
│   ├── database/   # SQLite setup, migrations, helpers, types
│   ├── pdf/        # HTML invoice generation
│   ├── qr/         # QR code encoding/decoding/seeding
│   ├── store/      # Zustand stores (auth)
│   └── utils/      # Secure storage wrapper
├── features/       # Feature modules (screens + repositories)
│   ├── auth/       # PIN lock, PIN setup, auto-lock hook
│   ├── sales/      # POS, cart, checkout, invoices
│   ├── products/   # Product CRUD, stock
│   ├── contacts/   # Contact management
│   ├── purchases/  # Purchase orders
│   ├── expenses/   # Expense tracking
│   ├── returns/    # Sell returns
│   ├── reports/    # Various reports
│   ├── fieldforce/ # Field operations
│   ├── followups/  # Follow-up tasks
│   ├── settings/   # App configuration
│   ├── setup/      # First-run wizard
│   └── dashboard/  # Home dashboard
├── navigation/     # Navigator definitions and route types
└── shared/
    ├── theme/      # Design tokens, theme context
    └── i18n/       # Translation files
```

### Path Aliases
Configured in `tsconfig.json`: `@app/*`, `@features/*`, `@core/*`, `@shared/*`, `@navigation/*`

### Proxy Server
`proxy-server.js` is a simple HTTP proxy that forwards port 5000 to Metro bundler on port 8081, adding CORS headers for web development in Replit.

## External Dependencies

### Expo Modules
- `expo-sqlite` — Local SQLite database
- `expo-secure-store` — Encrypted key-value storage for PIN
- `expo-camera` — QR code scanning during setup
- `expo-image-picker` — Product image capture
- `expo-file-system` — File operations
- `expo-sharing` — Share invoices/reports
- `expo-localization` — Device locale detection
- `expo-location` — GPS for field force features
- `expo-notifications` — Follow-up reminders
- `expo-image` — Optimized image display

### Key Libraries
- `zustand` — Lightweight state management
- `immer` — Immutable state updates (zustand middleware)
- `react-native-paper` — Material Design UI components
- `pako` — Gzip compression/decompression for QR payloads
- `nanoid` — Short unique ID generation
- `zod` — Schema validation
- `react-hook-form` + `@hookform/resolvers` — Form handling
- `i18next` + `react-i18next` — Internationalization
- `date-fns` — Date formatting
- `react-native-svg` — SVG rendering

### No External Backend
The app is fully offline. There is no REST API, no cloud database, and no server-side component. All data lives in the local SQLite database on the device. The only external data input mechanism is QR code scanning.