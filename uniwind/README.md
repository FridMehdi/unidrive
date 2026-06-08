# React Native Uniwind Starter

A React Native template built with Expo, Uniwind (Tailwind CSS v4), and TypeScript. Includes 40+ components, dark/light theming, and a ready-to-use navigation structure.

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Styling**: Uniwind (Tailwind CSS v4)
- **Navigation**: Expo Router (file-based)
- **Icons**: Lucide React Native
- **Language**: TypeScript

## Features

- 40+ reusable UI components (Button, Card, Input, Avatar, Chip, and more)
- Dark/light theming with a single `highlight` brand color
- File-based navigation with drawer + tab layout
- Authentication screens (login, signup, welcome)
- Push notification support

---

## Getting Started

### Prerequisites

- Node.js v20+
- iOS Simulator (Mac) or Android Emulator

### 1. Use This Template

Click **"Use this template"** on GitHub to create a new repo, then clone it:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Run the App

```bash
npx expo start -c
```

---

## Customization

### App Name & Bundle ID

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "ios": { "bundleIdentifier": "com.yourcompany.app" },
    "android": { "package": "com.yourcompany.app" }
  }
}
```

### Brand Color

Update **two files** to change the highlight color:

`global.css`:
```css
@layer theme {
  :root {
    @variant light {
      --color-highlight: #6366f1;
    }
    @variant dark {
      --color-highlight: #6366f1;
    }
  }
}
```

`contexts/ThemeColors.tsx`:
```typescript
highlight: '#6366f1',
```

---

## Project Structure

```
├── app/
│   ├── (drawer)/(tabs)/    # Main tab navigation
│   ├── screens/            # Feature screens
│   └── locales/            # i18n (en.json, es.json)
├── components/             # 40+ reusable UI components
│   ├── forms/              # Input, Select, Switch, Selectable
│   └── layout/             # Section, Divider
├── contexts/               # Theme, Language
├── hooks/                  # Custom hooks
├── utils/                  # Shadows
└── global.css              # Tailwind v4 theme & CSS variables
```

---

## License

Licensed for use in your own projects.
