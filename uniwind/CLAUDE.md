# CLAUDE.md - Boilerplate React Native Boilerplate

This file provides guidance for AI assistants working with this codebase.

## Project Overview

Boilerplate is a production-ready React Native boilerplate built with Expo, Uniwind (TailwindCSS), and TypeScript. It includes authentication, payments, notifications, and cloud sync.

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Styling**: Uniwind (Tailwind CSS v4)
- **Navigation**: Expo Router (file-based)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: RevenueCat
- **Icons**: Lucide React Native
- **Language**: TypeScript

## Project Structure

```
/app
  /_layout.tsx              # Root layout with providers
  /index.tsx                # Entry screen
  /(drawer)/(tabs)/         # Main navigation
  /screens/                 # Feature screens
  /locales/                 # i18n (en.json, es.json)

/contexts                   # Global state (Auth, Theme, Language, RevenueCat)
/hooks                      # Custom hooks

/components
  /forms/                   # Form components (Input, Select, DatePicker, etc.)
  /layout/                  # Layout helpers (Divider, Section, List)
  # Core UI (Button, Card, Avatar, Chip, Icon, etc.)

/lib                        # Supabase client & database types
/utils                      # Utilities (useShadow)
/assets                     # Images, fonts, Lottie animations
```

## Commands

```bash
npm install --legacy-peer-deps   # Install dependencies
npx expo start -c                # Start dev server (clean cache)
npx tsc --noEmit                 # Type check
npm run lint                     # ESLint + Prettier check
eas build --profile preview      # Create test build
```

---

## Critical Rules

### 1. Always Use ThemedText (with exceptions)

Use `ThemedText` for 95% of text content:

```typescript
// ✅ CORRECT - Normal text content
import ThemedText from '@/components/ThemedText';
<ThemedText className="text-lg font-bold">Title</ThemedText>

// ❌ WRONG - Raw Text without theme awareness
import { Text } from 'react-native';
<Text>Content</Text>
```

**Exception:** When text is on a fixed background (image overlays, colored backgrounds that don't change between light/dark mode), use explicit colors:

```typescript
// ✅ CORRECT - Text on image overlay or fixed dark background
<ImageBackground source={image}>
  <Text className="text-white font-bold">Overlay Title</Text>
</ImageBackground>

// ✅ CORRECT - Text on fixed colored background
<View className="bg-highlight">
  <Text className="text-white">Button Text</Text>
</View>

// ✅ CORRECT - Text on fixed light background
<View className="bg-white">
  <Text className="text-black">Dark Text</Text>
</View>
```

### 2. Never Use Custom Colors Unless Explicitly Asked

**NEVER** use custom/dynamic colors unless the user specifically requests it. Default to theme colors only (`background`, `secondary`, `highlight`).

```typescript
// ✅ CORRECT - Use theme colors by default
<View className="w-11 h-11 rounded-2xl bg-background items-center justify-center">
  <Icon name={cat.icon} size={20} />
</View>

// ❌ WRONG - Do NOT add dynamic/custom colors unless asked
<View
  className="w-11 h-11 rounded-2xl items-center justify-center"
  style={{ backgroundColor: cat.color + '20' }}
>
  <Icon name={cat.icon} size={20} color={cat.color} />
</View>
```

**Rules:**
- Default icon containers: `bg-background` — no custom color
- Default icons: no `color` prop — use automatic theme color
- `highlight` color: only for primary CTAs and accent elements
- Custom colors (e.g. `cat.color`, hex values): **only when the user explicitly requests colorful UI**
- **NEVER** hardcode hex colors like `#ffffff` or `rgb()`

```typescript
// ✅ CORRECT - Minimal, theme-aware defaults
<View className="bg-background border-border">
<ThemedText className="text-lg">Title</ThemedText>
<Icon name="Bell" />

// ❌ WRONG - Custom colors without being asked
<View style={{ backgroundColor: '#ffffff' }}>
<Text style={{ color: '#000' }}>
<Icon name="Bell" color={colors.icon} />  // Don't pass color unless needed
```

### 3. Use Existing Components First

**ALWAYS** check `/components` before creating new ones. This boilerplate has 40+ ready-to-use components.

### 4. Always Use CardScroller for Horizontal Scrolling

**NEVER** create custom horizontal ScrollViews. Always use `CardScroller`:

```typescript
// ✅ CORRECT - Use CardScroller for ALL horizontal scrolling
import { CardScroller } from '@/components/CardScroller';

<CardScroller space={12}>
  {items.map(item => <Card key={item.id} {...item} />)}
</CardScroller>

// ❌ WRONG - Never create custom horizontal ScrollViews
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {items.map(item => <Card key={item.id} {...item} />)}
</ScrollView>
```

`CardScroller` provides: consistent padding, proper spacing, optional title/see-all link, snap scrolling support.

### 5. Always Add Header to Screens

**ALWAYS** add a `Header` component to new screens with a right icon:

```typescript
// ✅ CORRECT - Screen with Header and right icon
export default function MyScreen() {
  return (
    <>
      <Header
        title="Screen Title"
        rightComponents={[<Icon key="icon" name="Bell" />]}
      />
      <ThemedScroller className="flex-1 bg-background">
        {/* content */}
      </ThemedScroller>
    </>
  );
}
```

**Back button rules:**
- **Tab screens** (`/(drawer)/(tabs)/`): No back button needed - these are top-level
- **Nested screens** (`/screens/`): Always use `showBackButton`
- **Modal screens**: Use `showBackButton` or custom close button

**Right icon rules - ALWAYS add a contextual icon:**
- Store/Shop screens: `Cart`, `ShoppingBag`, or `Search`
- Profile screens: `Settings` or `Edit`
- Home screens: `Bell` or `Search`
- Detail screens: `Share`, `Heart`, or `MoreVertical`
- Settings screens: `HelpCircle` or `Info`
- List screens: `Filter`, `Search`, or `Plus`

```typescript
// Tab screen - with contextual right icon
<Header
  title="Store"
  rightComponents={[<Icon key="cart" name="ShoppingCart" />]}
/>

// Nested screen - back button + right icon
<Header
  showBackButton
  title="Product Details"
  rightComponents={[<Icon key="share" name="Share" />]}
/>
```

### 6. Always Use ActionSheetThemed

**NEVER** use the raw `ActionSheet` component. Always use `ActionSheetThemed` which handles theming automatically:

```typescript
// ✅ CORRECT
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';

const sheetRef = useRef<ActionSheetRef>(null);

<ActionSheetThemed ref={sheetRef} gestureEnabled>
  <View className="px-6 pt-4 pb-4">
    {/* Content */}
  </View>
</ActionSheetThemed>

// ❌ WRONG - Raw ActionSheet
import ActionSheet from 'react-native-actions-sheet';
<ActionSheet containerStyle={{ backgroundColor: colors.background }}>
```

`ActionSheetThemed` automatically applies:
- Theme-aware background color
- Safe area padding
- Consistent border radius
- Gesture handling

### 7. LinearGradient Requires Inline Styles

`expo-linear-gradient` does **NOT** support Tailwind/Uniwind classes. You must use inline styles:

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// ✅ CORRECT - Use inline styles
<LinearGradient
  colors={['transparent', 'rgba(0,0,0,0.7)']}
  style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  }}
>
  <Text className="text-white text-2xl font-bold">Title</Text>
</LinearGradient>

// ❌ WRONG - Tailwind classes don't work on LinearGradient
<LinearGradient
  colors={['transparent', 'rgba(0,0,0,0.7)']}
  className="absolute bottom-0 left-0 right-0 p-6 pt-16 rounded-b-3xl"
>
```

**Note:** Children inside LinearGradient can still use Tailwind classes normally.

### 8. Always Use Existing Components First

**Before creating ANY custom UI, always check `/components` for existing components that fit your needs.** This boilerplate has 40+ components covering most UI patterns.

```typescript
// ✅ CORRECT - Use existing components from the library
<Card variant="overlay" title="Workout" image="..." />
<Button title="Start" iconEnd="ArrowRight" />
<Chip label="Featured" icon="Star" isSelected />
<Avatar src="..." size="lg" />
<ListLink icon="Settings" title="Settings" href="/settings" />
<ImageCarousel images={images} />
<ProgressBar percentage={75} />
<Review rating={4} description="Great!" date="Today" />

// ❌ WRONG - Creating custom components when existing ones work
<View className="...">  // Don't recreate Card
<Pressable className="...">  // Don't recreate Button
```

**Decision flow for ANY UI element:**
1. **Check existing components first** - Review this file's Component Reference section
2. **Try different variants/props** - Most components have variants (Card: classic/overlay/compact, Button: primary/secondary/outline, etc.)
3. **Only create custom if needed** - When existing components truly don't fit (unique layout, special interactions, complex nested content)

**Common component mappings:**
| UI Need | Use Component |
|---------|---------------|
| Cards with images | `Card` (variants: classic, overlay, compact, minimal) |
| Buttons/CTAs | `Button` (variants: primary, secondary, outline, ghost) |
| Horizontal scroll | `CardScroller` |
| List items/settings | `ListLink` |
| Collapsible content | `Expandable` |
| Image sliders | `ImageCarousel` |
| Tags/filters | `Chip` |
| User photos | `Avatar` |
| Form inputs | `Input`, `Select`, `Switch`, `Selectable` |
| Progress indicators | `ProgressBar` |
| Section headers | `Section` |
| Star ratings | `Review` |
| Bottom sheets | `ActionSheetThemed` |

### 9. Create Inline Components for Repetitive UI

When building screens from screenshots, if you see repetitive UI elements (cards, list items, badges, etc.), create an inline component at the top of the same file instead of duplicating JSX:

```typescript
// ✅ CORRECT - Create inline component for repetitive elements
const DestinationCard = ({ title, image, rating, description }: {
    title: string;
    image: string;
    rating: number;
    description: string;
}) => (
    <View style={{ width: 180 }}>
        <ImageBackground source={{ uri: image }} style={{ height: 140 }} imageStyle={{ borderRadius: 16 }}>
            <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full flex-row items-center">
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text className="text-neutral-800 text-xs font-semibold ml-0.5">{rating}</Text>
            </View>
        </ImageBackground>
        <ThemedText className="text-base font-semibold mt-2">{title}</ThemedText>
        <ThemedText className="text-sm opacity-60" numberOfLines={2}>{description}</ThemedText>
    </View>
);

export default function MyScreen() {
    return (
        <CardScroller>
            {destinations.map((d) => (
                <DestinationCard key={d.id} {...d} />
            ))}
        </CardScroller>
    );
}

// ❌ WRONG - Duplicating JSX for each item
export default function MyScreen() {
    return (
        <CardScroller>
            <View style={{ width: 180 }}>
                {/* ... all the JSX repeated ... */}
            </View>
            <View style={{ width: 180 }}>
                {/* ... same JSX again ... */}
            </View>
        </CardScroller>
    );
}
```

**Benefits:**
- Cleaner, more readable code
- Easy to modify all instances at once
- User can later extract to `/components` if needed

### 10. Keep Bottom Tabs Uniform

**NEVER** use custom components, custom styling, or special layouts for tab bar items. All tabs must use the standard `TabButton` with `icon` and optional `isLabelVisible`. No floating buttons, no shadows, no custom views.

```typescript
// ✅ CORRECT - Uniform tab buttons
<TabTrigger name="home" href="/home" asChild>
  <TabButton isLabelVisible={true} icon="Home">Home</TabButton>
</TabTrigger>

<TabTrigger name="profile" href="/profile" asChild>
  <TabButton isLabelVisible={true} icon="User">Profile</TabButton>
</TabTrigger>

// ❌ WRONG - Custom center button with special styling
<TabTrigger name="add" href="/add" asChild>
  <TabButton
    isLabelVisible={false}
    customContent={
      <View className="w-12 h-12 rounded-full bg-highlight items-center justify-center" style={{ ...shadowPresets.large, marginTop: -20 }}>
        <Icon name="Plus" size={24} color="white" />
      </View>
    }
  >
    Add
  </TabButton>
</TabTrigger>
```

### 11. Chip Defaults — No Icons, No Custom Size

When using the `Chip` component, always use the default `size="md"` and never add an `icon` unless explicitly asked.

```typescript
// ✅ CORRECT - Simple chip with defaults
<Chip label="Category" />
<Chip label="Selected" isSelected={true} onPress={toggle} />

// ❌ WRONG - Custom size or icon without being asked
<Chip label="Category" size="lg" icon="Tag" />
<Chip label="Filter" icon="SlidersHorizontal" size="sm" />
```

### 12. Creating New Components

When existing components don't fit your needs, create new ones following these conventions:

```typescript
import { View, Pressable, ViewStyle } from 'react-native';
import useThemeColors from '@/contexts/ThemeColors';
import ThemedText from '@/components/ThemedText';
import Icon, { IconName } from '@/components/Icon';

interface MyComponentProps {
  // Content
  title: string;
  description?: string;
  children?: React.ReactNode;

  // Variants & Sizes
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';

  // State
  disabled?: boolean;
  loading?: boolean;
  isSelected?: boolean;

  // Styling
  className?: string;
  style?: ViewStyle;

  // Actions
  onPress?: () => void;
  href?: string;

  // Icons
  icon?: IconName;
}

export default function MyComponent({
  title,
  description,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  style,
  onPress,
  icon,
}: MyComponentProps) {
  const colors = useThemeColors();

  return (
    <View className={`p-4 rounded-xl bg-secondary ${className}`} style={style}>
      {icon && <Icon name={icon} color={colors.icon} />}
      <ThemedText className="text-lg font-semibold">{title}</ThemedText>
      {description && <ThemedText className="opacity-60">{description}</ThemedText>}
    </View>
  );
}
```

**Key requirements for new components:**
- Use TypeScript interfaces for props
- Use `useThemeColors()` for any dynamic colors in JS
- Use `ThemedText` for text (unless on fixed backgrounds)
- Use Tailwind classes via `className`
- Support `className` and `style` props for customization
- Use existing components internally when possible (Icon, ThemedText, etc.)
- Follow naming conventions (PascalCase for component files)

---

## Available Theme Colors (Tailwind)

```
background    - Main background
secondary     - Cards, elevated surfaces
text          - Primary text (via ThemedText)
border        - Borders and dividers
highlight     - Accent/brand color (#00A6F4)
primary       - Black (light) / White (dark)
invert        - White (light) / Black (dark)
darker        - Darker backgrounds
```

### Changing Theme Colors

When modifying theme colors, you must update **TWO files**:

1. **`/global.css`** - Tailwind CSS variables (for Tailwind classes like `bg-highlight`, `text-primary`)
```css
@layer theme {
  :root {
    @variant light {
      --color-highlight: #00A6F4;  /* Change Tailwind color */
      /* ... */
    }
    @variant dark {
      --color-highlight: #00A6F4;
      /* ... */
    }
  }
}
```

2. **`/contexts/ThemeColors.tsx`** - JS values (for `useThemeColors()`)
```typescript
return {
  highlight: '#00A6F4',  // Change JS color value
  // ...
};
```

**Both files must be updated** to keep Tailwind classes and JS color values in sync.

---

## Spacing Standards

```typescript
// Screen horizontal padding - ALWAYS use for screen content
<View className="px-global">  // 24px

// Standard spacing scale
gap-2    // 8px gap between items
gap-3    // 12px gap
gap-4    // 16px gap
p-4      // 16px padding
py-3     // 12px vertical padding
mb-4     // 16px margin bottom

// Common patterns
<View className="px-global py-4">           // Screen content wrapper
<View className="p-4 rounded-xl bg-secondary">  // Card container
<View className="flex-row items-center gap-3">  // Horizontal row
```

---

## Shadow Utility

Shadows are appropriate on cards, blocks, and elevated UI elements. Always use `shadowPresets.large` — never custom shadow styles.

```typescript
import { shadowPresets } from '@/utils/useShadow';

// ✅ CORRECT - Use shadowPresets.large on cards and elevated blocks
<View style={shadowPresets.large} className="bg-secondary rounded-2xl">
<Card style={shadowPresets.large} ... />

// ❌ WRONG - Custom shadow styles
<View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 }}>
```

---

# Component Reference

## CardScroller

**ALWAYS use for horizontal scrolling content.** This is the standard way to create horizontal carousels.

```typescript
import { CardScroller } from '@/components/CardScroller';

// Basic usage (most common)
<CardScroller space={12}>
  {items.map(item => <Card key={item.id} {...item} />)}
</CardScroller>

// With title
<CardScroller title="Featured" space={10}>
  <Card title="Item 1" image="..." />
  <Card title="Item 2" image="..." />
</CardScroller>

// With snapping
<CardScroller space={12} enableSnapping snapInterval={200}>
  {items.map(item => <Card key={item.id} {...item} />)}
</CardScroller>

// ⚠️ Only add allUrl when user explicitly requests "See all" link
<CardScroller title="Featured" allUrl="/screens/all">
  {/* ... */}
</CardScroller>
```

**Important:** Do NOT add `allUrl` by default. Only include it when the user explicitly asks for a "See all" link.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Section title above scroller |
| allUrl | string | - | URL for "See all" link |
| space | number | 10 | Gap between items |
| enableSnapping | boolean | false | Enable snap scrolling |
| snapInterval | number | 0 | Snap interval in pixels |
| children | ReactNode | required | Scrollable content |

---

## Button

```typescript
import { Button } from '@/components/Button';

// Variants
<Button title="Primary" />                          // Primary (default)
<Button title="Secondary" variant="secondary" />
<Button title="Outline" variant="outline" />
<Button title="Ghost" variant="ghost" />

// Sizes
<Button title="Small" size="small" />
<Button title="Medium" size="medium" />            // Default
<Button title="Large" size="large" />

// With icons
<Button title="Settings" iconStart="Settings" />
<Button title="Next" iconEnd="ChevronRight" />

// Navigation
<Button title="Go to Settings" href="/screens/settings" />

// States
<Button title="Loading" loading={true} />
<Button title="Disabled" disabled={true} />

// Rounded options
<Button title="Pill" rounded="full" />
<Button title="Square" rounded="none" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Button text |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | Visual style |
| size | 'small' \| 'medium' \| 'large' | 'medium' | Button size |
| rounded | 'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' | 'lg' | Border radius |
| iconStart | IconName | - | Icon before text |
| iconEnd | IconName | - | Icon after text |
| href | string | - | Navigation URL |
| loading | boolean | false | Show loading spinner |
| disabled | boolean | false | Disable interaction |
| onPress | () => void | - | Press handler |

---

## Card

```typescript
import Card from '@/components/Card';

// Basic usage
<Card
  title="Card Title"
  description="Description text"
  image="https://example.com/image.jpg"
/>

// Variants
<Card variant="classic" />   // Image on top, content below (default)
<Card variant="overlay" />   // Text overlaid on image with gradient
<Card variant="compact" />   // Smaller card style
<Card variant="minimal" />   // Minimal styling

// With features
<Card
  title="Product"
  description="Amazing product"
  image="https://..."
  price="$99.99"
  rating={4.5}
  badge="New"
  badgeColor="#FF5733"
  hasShadow
  hasFavorite
/>

// Navigation
<Card title="Item" href="/screens/detail" />
<Card title="Item" onPress={() => handlePress()} />

// Custom sizing
<Card
  title="Custom"
  image="..."
  imageHeight={150}
  width={200}
  rounded="xl"
/>

// ⚠️ IMPORTANT: Padding & Title Size Guidelines
// Full-width or large cards (single column): use padding="lg" and titleSize="lg"
<Card
  title="Featured Item"
  image="..."
  padding="lg"
  titleSize="lg"
/>

// CardScroller or grid layouts (multiple cards): use padding="md" and titleSize="md" (defaults)
<CardScroller>
  <Card title="Item 1" image="..." width={180} />  // Uses default md padding/title
  <Card title="Item 2" image="..." width={180} />
</CardScroller>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Card title |
| description | string | - | Card description |
| image | string \| ImageSource | required | Image URL or local source |
| variant | 'classic' \| 'overlay' \| 'compact' \| 'minimal' | 'classic' | Card style |
| hasShadow | boolean | false | Apply shadow |
| hasFavorite | boolean | false | Show favorite heart icon |
| price | string | - | Price display |
| rating | number | - | Star rating (0-5) |
| badge | string | - | Badge text |
| badgeColor | string | '#000' | Badge background color |
| imageHeight | number | 200 | Image height in pixels |
| width | number \| string | '100%' | Card width |
| rounded | 'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full' | '2xl' | Border radius |
| padding | 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Content padding (lg for full-width, md for grids) |
| titleSize | 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' | 'md' | Title text size (lg for full-width, md for grids) |
| href | string | - | Navigation URL |
| onPress | () => void | - | Press handler |
| button | string | - | Button text |
| onButtonPress | () => void | - | Button press handler |

---

## Input

```typescript
import Input from '@/components/forms/Input';

// Variants
<Input label="Email" variant="classic" />      // Labeled input with border
<Input label="Email" variant="underlined" />   // Bottom border only
<Input label="Email" variant="label-inside" /> // Floating label

// Password input
<Input
  label="Password"
  placeholder="Enter password"
  isPassword
/>

// With icon
<Input
  label="Search"
  placeholder="Search..."
  rightIcon="Search"
/>

// Multiline (textarea)
<Input
  label="Description"
  isMultiline
  numberOfLines={4}
/>

// With error
<Input
  label="Email"
  value={email}
  error="Invalid email address"
/>

// Full example
<Input
  label="Username"
  placeholder="Enter username"
  value={username}
  onChangeText={setUsername}
  variant="classic"
  autoCapitalize="none"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Input label |
| placeholder | string | - | Placeholder text |
| value | string | - | Input value |
| onChangeText | (text: string) => void | - | Change handler |
| variant | 'classic' \| 'underlined' \| 'label-inside' \| 'inline' | 'classic' | Input style |
| isPassword | boolean | false | Toggle password visibility |
| isMultiline | boolean | false | Multiline textarea mode |
| numberOfLines | number | - | Number of lines for multiline |
| rightIcon | IconName | - | Icon on right side |
| error | string | - | Error message |
| disabled | boolean | false | Disable input |

---

## Avatar

```typescript
import Avatar from '@/components/Avatar';

// With image
<Avatar src="https://example.com/avatar.jpg" size="lg" />

// With initials (from name)
<Avatar name="John Doe" size="md" />  // Shows "JD"

// Sizes
<Avatar src={url} size="xxs" />  // 20px
<Avatar src={url} size="xs" />   // 24px
<Avatar src={url} size="sm" />   // 32px
<Avatar src={url} size="md" />   // 40px (default)
<Avatar src={url} size="lg" />   // 48px
<Avatar src={url} size="xl" />   // 64px
<Avatar src={url} size="xxl" />  // 80px

// With border
<Avatar src={url} size="lg" border />

// Custom background (for initials)
<Avatar name="Jane" size="md" bgColor="#6366f1" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | - | Image URL |
| name | string | - | Name for initials fallback |
| size | 'xxs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl' | 'md' | Avatar size |
| border | boolean | false | Show border |
| bgColor | string | - | Background color for initials |

---

## Chip

**Always use default `size="md"`. Never add `icon` unless explicitly asked.**

```typescript
import { Chip } from '@/components/Chip';

// ✅ CORRECT - Basic usage with defaults
<Chip label="Category" />

// ✅ CORRECT - Selectable
<Chip
  label="Selected"
  isSelected={selected}
  onPress={() => setSelected(!selected)}
/>

// ✅ CORRECT - With image (if needed)
<Chip label="User" image="https://..." />

// ❌ WRONG - Custom size or icon without being asked
<Chip label="Star" icon="Star" size="lg" />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | required | Chip text |
| icon | IconName | - | Lucide icon name |
| image | string | - | Image URL |
| size | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl' | 'md' | Chip size |
| isSelected | boolean | false | Selected state |
| isBordered | boolean | false | Bordered style |
| onPress | () => void | - | Press handler |

---

## Icon

The Icon component has **built-in theme-aware colors** (white in dark mode, black in light mode). You don't need to specify color for most cases.

```typescript
import Icon from '@/components/Icon';

// Basic usage - color is automatic based on theme
<Icon name="Settings" size={24} />

// Variants
<Icon name="User" variant="plain" />      // Just the icon (default)
<Icon name="User" variant="bordered" />   // Icon with border circle
<Icon name="User" variant="contained" />  // Icon with filled background

// Icon sizes (for variants with backgrounds)
<Icon name="Plus" variant="contained" iconSize="xs" />   // 24px container
<Icon name="Plus" variant="contained" iconSize="s" />    // 32px container
<Icon name="Plus" variant="contained" iconSize="m" />    // 40px container
<Icon name="Plus" variant="contained" iconSize="l" />    // 48px container
<Icon name="Plus" variant="contained" iconSize="xl" />   // 56px container
<Icon name="Plus" variant="contained" iconSize="xxl" />  // 64px container

// Custom color - only when needed (e.g., on fixed backgrounds, accent colors)
<Icon name="Heart" color="#ff0000" />
<Icon name="Check" color="white" />  // On dark fixed background
<Icon name="Heart" color={colors.highlight} fill={colors.highlight} />

// Pressable icon
<Icon name="Plus" onPress={() => handleAdd()} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | IconName | required | Lucide icon name |
| size | number | 24 | Icon size |
| variant | 'plain' \| 'bordered' \| 'contained' | 'plain' | Icon style |
| iconSize | 'xs' \| 's' \| 'm' \| 'l' \| 'xl' \| 'xxl' | 'm' | Container size |
| color | string | theme color | Icon color |
| strokeWidth | number | 2 | Stroke thickness |
| fill | string | - | Fill color |
| onPress | () => void | - | Press handler |

---

## Section

Use for grouping content with titles. **When stacking multiple Sections, use `mt-10` minimum for proper spacing.**

```typescript
import Section from '@/components/layout/Section';

// Basic
<Section title="Featured">
  <Card title="Item" image="..." />
</Section>

// With subtitle
<Section title="Products" subtitle="Our latest collection">
  {/* content */}
</Section>

// With link
<Section
  title="Categories"
  link="/screens/categories"
  linkText="See all"
>
  {/* content */}
</Section>

// With icon
<Section title="Settings" icon="Settings">
  {/* content */}
</Section>

// Title sizes
<Section title="Large Title" titleSize="3xl" />
<Section title="Medium Title" titleSize="lg" />
<Section title="Small Title" titleSize="sm" />

// ⚠️ Multiple sections - use mt-10 minimum between them
<Section title="First Section" className="mt-4">
  {/* content */}
</Section>
<Section title="Second Section" className="mt-10">
  {/* content */}
</Section>
<Section title="Third Section" className="mt-10">
  {/* content */}
</Section>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Section title |
| subtitle | string | - | Subtitle text |
| icon | IconName | - | Icon before title |
| titleSize | 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' | '2xl' | Title size |
| padding | 'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' | 'none' | Vertical padding |
| link | string | - | Link URL |
| linkText | string | - | Link text |
| header | ReactNode | - | Custom header |
| footer | ReactNode | - | Custom footer |
| children | ReactNode | - | Section content |

---

## Header

```typescript
import Header from '@/components/Header';

// ⚠️ ALWAYS use default variant unless explicitly asked otherwise
// Basic with back button (default variant)
<Header showBackButton title="Screen Title" />

// Only use transparent/blurred when explicitly requested:
// Transparent header (for screens with hero images)
<Header variant="transparent" showBackButton />

// Blurred header (for overlay effects)
<Header variant="blurred" title="Title" />

// With right components
<Header
  showBackButton
  title="Profile"
  rightComponents={[
    <Icon key="settings" name="Settings" onPress={openSettings} />,
    <Icon key="share" name="Share" onPress={handleShare} />
  ]}
/>

// With custom left component
<Header
  leftComponent={<Icon name="Menu" onPress={openDrawer} />}
  title="Home"
/>

// With middle component
<Header
  showBackButton
  middleComponent={<SearchInput />}
/>

// Collapsible header (hides on scroll)
<Header title="Title" collapsible scrollY={scrollY} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Header title |
| variant | 'default' \| 'transparent' \| 'blurred' | 'default' | Header style |
| showBackButton | boolean | false | Show back button |
| leftComponent | ReactNode | - | Custom left content |
| middleComponent | ReactNode | - | Custom middle content |
| rightComponents | ReactNode[] | - | Right side components |
| collapsible | boolean | false | Enable scroll hiding |
| scrollY | Animated.Value | - | Scroll position for collapsible |

---

## ListLink

For settings/menu-style list items:

```typescript
import ListLink from '@/components/ListLink';

// Basic
<ListLink title="Profile" href="/screens/profile" />

// With icon and description
<ListLink
  icon="User"
  title="Account"
  description="Manage your account settings"
  href="/screens/account"
  showChevron
/>

// With border
<ListLink
  icon="Bell"
  title="Notifications"
  href="/screens/notifications"
  hasBorder
/>

// With custom action
<ListLink
  icon="LogOut"
  title="Sign Out"
  onPress={handleSignOut}
/>

// Disabled state
<ListLink
  title="Coming Soon"
  disabled
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Item title |
| description | string | - | Description text |
| icon | IconName | - | Left icon |
| href | string | - | Navigation URL |
| onPress | () => void | - | Press handler |
| showChevron | boolean | false | Show right chevron |
| rightIcon | IconName | 'ChevronRight' | Custom right icon |
| hasBorder | boolean | false | Show bottom border |
| disabled | boolean | false | Disable interaction |

---

## Expandable

For collapsible/accordion content:

```typescript
import Expandable from '@/components/Expandable';

// Basic
<Expandable title="FAQ Question">
  <ThemedText>This is the answer that shows when expanded.</ThemedText>
</Expandable>

// With icon and description
<Expandable
  icon="HelpCircle"
  title="How does this work?"
  description="Click to learn more"
>
  <View className="gap-2">
    <ThemedText>Step 1: Do this</ThemedText>
    <ThemedText>Step 2: Do that</ThemedText>
  </View>
</Expandable>

// Default expanded
<Expandable title="Open by default" defaultExpanded>
  <ThemedText>This content is visible initially.</ThemedText>
</Expandable>

// Without border
<Expandable title="No Border" hasBorder={false}>
  <ThemedText>Content here</ThemedText>
</Expandable>

// Controlled expansion
<Expandable
  title="Controlled"
  expanded={isOpen}
  onPress={() => setIsOpen(!isOpen)}
>
  <ThemedText>Controlled content</ThemedText>
</Expandable>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Header title |
| description | string | - | Header description |
| icon | IconName | - | Header icon |
| children | ReactNode | - | Expandable content |
| defaultExpanded | boolean | false | Initial expanded state |
| expanded | boolean | - | Controlled expanded state |
| onPress | () => void | - | Toggle callback |
| hasBorder | boolean | true | Show bottom border |

---

## Select

Dropdown selection with ActionSheet:

```typescript
import Select from '@/components/forms/Select';

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

// Basic
<Select
  label="Choose Option"
  options={options}
  value={selected}
  onChange={setSelected}
/>

// Variants (same as Input)
<Select variant="classic" {...props} />
<Select variant="underlined" {...props} />
<Select variant="label-inside" {...props} />
<Select variant="inline" {...props} />

// With placeholder
<Select
  label="Category"
  placeholder="Select a category"
  options={categories}
  value={category}
  onChange={setCategory}
/>

// With error
<Select
  label="Required Field"
  options={options}
  value={value}
  onChange={setValue}
  error="Please select an option"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Field label |
| placeholder | string | 'Select option' | Placeholder text |
| options | {label: string, value: string\|number}[] | required | Options array |
| value | string \| number | - | Selected value |
| onChange | (value) => void | required | Change handler |
| variant | 'classic' \| 'underlined' \| 'label-inside' \| 'inline' | 'inline' | Input style |
| error | string | - | Error message |
| disabled | boolean | false | Disable selection |

---

## Switch

Custom animated toggle switch:

```typescript
import Switch from '@/components/forms/Switch';

// Basic
<Switch
  value={isEnabled}
  onChange={setIsEnabled}
/>

// With label and description
<Switch
  label="Notifications"
  description="Receive push notifications"
  value={notifications}
  onChange={setNotifications}
/>

// With icon
<Switch
  icon="Bell"
  label="Alerts"
  value={alerts}
  onChange={setAlerts}
/>

// Uncontrolled (internal state)
<Switch
  label="Toggle me"
  onChange={(value) => console.log('Changed to:', value)}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | boolean | - | Switch state (controlled) |
| onChange | (value: boolean) => void | - | Change handler |
| label | string | - | Switch label |
| description | string | - | Description text |
| icon | IconName | - | Left icon |
| disabled | boolean | false | Disable interaction |

---

## Selectable

Selection cards with checkmark animation:

```typescript
import Selectable from '@/components/forms/Selectable';

// Basic
<Selectable
  title="Option A"
  selected={selectedOption === 'a'}
  onPress={() => setSelectedOption('a')}
/>

// With icon and description
<Selectable
  icon="Palette"
  title="Design"
  description="Design related interests"
  selected={interests.includes('design')}
  onPress={() => toggleInterest('design')}
/>

// Multiple selection
{options.map(option => (
  <Selectable
    key={option.id}
    icon={option.icon}
    title={option.title}
    description={option.description}
    selected={selectedItems.includes(option.id)}
    onPress={() => toggleItem(option.id)}
  />
))}

// With custom icon component
<Selectable
  customIcon={<MyCustomIcon />}
  title="Custom"
  selected={isSelected}
  onPress={toggle}
/>

// With error
<Selectable
  title="Required"
  selected={false}
  error="Please select an option"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Option title |
| description | string | - | Option description |
| icon | IconName | - | Left icon |
| customIcon | ReactNode | - | Custom icon component |
| selected | boolean | false | Selected state |
| onPress | () => void | - | Press handler |
| error | string | - | Error message |
| iconColor | string | - | Custom icon color |

---

## ImageCarousel

Image slider with pagination:

```typescript
import ImageCarousel from '@/components/ImageCarousel';

const images = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
];

// Basic
<ImageCarousel images={images} />

// With custom height
<ImageCarousel images={images} height={300} />

// Pagination styles
<ImageCarousel images={images} paginationStyle="dots" />    // Default
<ImageCarousel images={images} paginationStyle="numbers" /> // "1 / 3"

// Auto-play
<ImageCarousel
  images={images}
  autoPlay
  autoPlayInterval={3000}
  loop
/>

// Rounded corners
<ImageCarousel images={images} rounded="xl" />
<ImageCarousel images={images} rounded="2xl" />

// With press handler
<ImageCarousel
  images={images}
  onImagePress={(index) => openFullscreen(index)}
/>

// Hide pagination
<ImageCarousel images={images} showPagination={false} />
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| images | string[] | required | Array of image URLs |
| height | number | 200 | Carousel height |
| width | number | - | Carousel width (auto by default) |
| showPagination | boolean | true | Show pagination |
| paginationStyle | 'dots' \| 'numbers' | 'dots' | Pagination style |
| autoPlay | boolean | false | Auto-advance slides |
| autoPlayInterval | number | 3000 | Auto-play interval (ms) |
| loop | boolean | true | Loop slides |
| rounded | 'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full' | 'none' | Border radius |
| onImagePress | (index: number) => void | - | Image press handler |

---

## ProgressBar

Animated progress indicator:

```typescript
import ProgressBar from '@/components/ProgressBar';

// Basic
<ProgressBar percentage={75} />

// Custom colors
<ProgressBar
  percentage={50}
  fillColor="bg-green-500"
  backgroundColor="bg-gray-200"
/>

// Custom height
<ProgressBar percentage={80} height={12} />

// Square corners
<ProgressBar percentage={60} rounded={false} />

// With animation delay
<ProgressBar
  percentage={90}
  duration={1500}  // Animation duration
  delay={500}      // Delay before animation starts
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| percentage | number | required | Progress value (0-100) |
| height | number | 8 | Bar height |
| backgroundColor | string | 'bg-black/20' | Background class |
| fillColor | string | 'bg-highlight' | Fill color class |
| rounded | boolean | true | Rounded corners |
| duration | number | 1000 | Animation duration (ms) |
| delay | number | 0 | Animation delay (ms) |

---

## MultiStep

Multi-step wizard/onboarding flow:

```typescript
import MultiStep, { Step } from '@/components/MultiStep';

<MultiStep
  onComplete={() => router.back()}
  onClose={() => router.back()}
  showHeader={true}
  showStepIndicator={true}
>
  <Step title="Welcome">
    <View className="flex-1 px-global justify-center">
      <ThemedText className="text-3xl font-bold">Welcome!</ThemedText>
    </View>
  </Step>

  <Step title="Your Name">
    <View className="flex-1 px-global pt-8">
      <ThemedText className="text-2xl font-bold mb-4">What's your name?</ThemedText>
      <Input placeholder="Enter your name" />
    </View>
  </Step>

  <Step title="Interests" optional>
    <View className="flex-1 px-global pt-8">
      <ThemedText className="text-2xl font-bold mb-4">Select interests</ThemedText>
      {/* Selection content */}
    </View>
  </Step>

  <Step title="Complete">
    <View className="flex-1 px-global justify-center items-center">
      <Icon name="Check" size={48} />
      <ThemedText className="text-2xl font-bold mt-4">All set!</ThemedText>
    </View>
  </Step>
</MultiStep>

// With step validation
<MultiStep
  onComplete={handleComplete}
  onStepChange={(nextStep) => {
    // Return false to prevent navigation
    if (nextStep === 2 && !nameValid) {
      return false;
    }
    return true;
  }}
>
  {/* Steps */}
</MultiStep>
```

**Props (MultiStep):**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | Step components | required | Step elements |
| onComplete | () => void | required | Completion handler |
| onClose | () => void | - | Close button handler |
| showHeader | boolean | true | Show header |
| showStepIndicator | boolean | true | Show progress bar |
| onStepChange | (nextStep: number) => boolean | - | Validate step change |

**Props (Step):**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | required | Step title |
| optional | boolean | false | Allow skipping this step |
| children | ReactNode | required | Step content |

---

## Review

Star rating review component:

```typescript
import Review from '@/components/Review';

<Review
  rating={4}
  description="Great product! Really happy with my purchase."
  date="Jan 15, 2025"
  username="John D."
  avatar="https://example.com/avatar.jpg"
/>

// Without avatar
<Review
  rating={5}
  description="Excellent service"
  date="2 days ago"
  username="Jane S."
/>

// Minimal (no user info)
<Review
  rating={3}
  description="Average experience"
  date="Last week"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rating | number | required | Star rating (0-5) |
| description | string | required | Review text |
| date | string | required | Review date |
| username | string | - | Reviewer name |
| avatar | string | - | Reviewer avatar URL |

---

## ActionSheetThemed

Themed action sheet modal:

```typescript
import ActionSheetThemed, { ActionSheetItem } from '@/components/ActionSheetThemed';
import { useRef } from 'react';
import { ActionSheetRef } from 'react-native-actions-sheet';

const actionSheetRef = useRef<ActionSheetRef>(null);

// Open action sheet
<Button title="Open Menu" onPress={() => actionSheetRef.current?.show()} />

// Action sheet content
<ActionSheetThemed ref={actionSheetRef}>
  <View className="p-4">
    <ActionSheetItem
      icon="Edit"
      title="Edit"
      onPress={() => {
        actionSheetRef.current?.hide();
        handleEdit();
      }}
    />
    <ActionSheetItem
      icon="Share"
      title="Share"
      onPress={() => {
        actionSheetRef.current?.hide();
        handleShare();
      }}
    />
    <ActionSheetItem
      icon="Trash"
      title="Delete"
      onPress={() => {
        actionSheetRef.current?.hide();
        handleDelete();
      }}
    />
  </View>
</ActionSheetThemed>
```

---

## ThemedText

Always use for text content:

```typescript
import ThemedText from '@/components/ThemedText';

<ThemedText>Regular text</ThemedText>
<ThemedText className="text-lg font-bold">Bold title</ThemedText>
<ThemedText className="text-sm opacity-60">Muted/secondary text</ThemedText>
<ThemedText className="text-2xl font-semibold mb-4">Heading</ThemedText>
<ThemedText numberOfLines={2}>Truncated text...</ThemedText>
```

---

## ThemedScroller

Scrollable container with theme background. **Already includes `px-global` padding** - do NOT add it to children.

```typescript
import ThemedScroller from '@/components/ThemeScroller';

// ✅ CORRECT - ThemedScroller handles horizontal padding
<ThemedScroller className="flex-1 bg-background">
  <Section title="Content">
    {/* content - no px-global needed */}
  </Section>
</ThemedScroller>

// ❌ WRONG - Don't add px-global to ThemedScroller or its children
<ThemedScroller className="flex-1 bg-background px-global">
<View className="px-global">  // Redundant!
```

---

## AnimatedView

Animated wrapper with preset animations:

```typescript
import AnimatedView from '@/components/AnimatedView';

<AnimatedView type="fadeIn" delay={100}>
  <Card title="Animated card" image="..." />
</AnimatedView>

<AnimatedView animation="bounceIn" duration={500}>
  <Icon name="Check" />
</AnimatedView>
```

---

# Navigation

## Link-based (Preferred)

```typescript
import { Link } from 'expo-router';

<Link href="/screens/settings" asChild>
  <Pressable className="p-4">
    <ThemedText>Settings</ThemedText>
  </Pressable>
</Link>
```

## Programmatic

```typescript
import { router } from 'expo-router';

router.push('/screens/note-detail');
router.push({ pathname: '/screens/note-detail', params: { id: note.id } });
router.replace('/screens/home');
router.back();
```

## Component href Prop

Many components support `href` directly:

```typescript
<Button title="Settings" href="/screens/settings" />
<Card title="Item" href="/screens/detail" />
<ListLink title="Profile" href="/screens/profile" />
```

---

# State Management

## Using Contexts

```typescript
// Authentication
import { useAuth } from '@/contexts/AuthContext';
const { user, profile, signIn, signOut } = useAuth();

// Theme
import { useTheme } from '@/contexts/ThemeContext';
const { theme, toggleTheme } = useTheme();

// Theme colors (for JS values)
import useThemeColors from '@/contexts/ThemeColors';
const colors = useThemeColors();
<Icon color={colors.icon} />

// Translations
import { useTranslation } from '@/hooks/useTranslation';
const { t } = useTranslation();

// Payments
import { useRevenueCat } from '@/contexts/RevenueCatContext';
const { isProUser, offerings, purchasePackage } = useRevenueCat();
```

---

# Common Patterns

## Screen Layout

```typescript
// Tab screen (top-level) - no back button
export default function TabScreen() {
  return (
    <>
      <Header title="Home" />
      <ThemedScroller className="flex-1 bg-background">
        <Section title="Section" className="mt-4 mb-4">
          {/* Content - no px-global needed, ThemedScroller handles it */}
        </Section>
      </ThemedScroller>
    </>
  );
}

// Nested screen - with back button
export default function NestedScreen() {
  return (
    <>
      <Header showBackButton title="Screen Title" />
      <ThemedScroller className="flex-1 bg-background">
        <Section title="Section" className="mt-4 mb-4">
          {/* Content */}
        </Section>
      </ThemedScroller>
    </>
  );
}
```

## Horizontal Scrolling Section

```typescript
<Section title="Featured" className="mt-4">
  <CardScroller space={12}>
    {items.map((item) => (
      <Card
        key={item.id}
        title={item.title}
        image={item.image}
        width={200}
      />
    ))}
  </CardScroller>
</Section>
```

## Form Screen with Bottom Button

```typescript
export default function FormScreen() {
  return (
    <>
      <Header showBackButton title="Form" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ThemedScroller className="flex-1 bg-background">
          <Input label="Field" value={value} onChangeText={setValue} />
        </ThemedScroller>
        <View className="px-global py-4">
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
```

## Settings List

```typescript
<View>
  <ListLink icon="User" title="Profile" href="/screens/profile" showChevron hasBorder />
  <ListLink icon="Bell" title="Notifications" href="/screens/notifications" showChevron hasBorder />
  <ListLink icon="Shield" title="Privacy" href="/screens/privacy" showChevron hasBorder />
  <ListLink icon="LogOut" title="Sign Out" onPress={signOut} />
</View>
```

## FAQ/Accordion

```typescript
{faqs.map((faq, index) => (
  <Expandable
    key={index}
    title={faq.question}
    hasBorder={index < faqs.length - 1}
  >
    <ThemedText>{faq.answer}</ThemedText>
  </Expandable>
))}
```

---

# Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `CardScroller.tsx` |
| Screens | kebab-case | `note-detail.tsx`, `user-profile.tsx` |
| Hooks | camelCase with `use` | `useThemeColors`, `useTranslation` |
| Contexts | PascalCase + Context | `AuthContext.tsx`, `ThemeContext.tsx` |
| Utilities | camelCase | `useShadow.ts` |

---

# Do's and Don'ts

## ✅ Do

- Use `ThemedText` for all text content
- Use `CardScroller` for all horizontal scrolling
- Use `useThemeColors()` for dynamic colors in JS
- Use Tailwind classes via `className` prop
- Use `shadowPresets.large` for shadows on cards and elevated blocks
- Use existing components from `/components`
- Follow the established file structure
- Use TypeScript interfaces for props
- Use `px-global` for screen horizontal padding (but NOT inside ThemedScroller - it's built-in)
- Always add `Header` component to screens
- Test in both light and dark modes

## ❌ Don't

- Don't use `<Text>` directly - use `ThemedText`
- Don't use hardcoded colors (`#ffffff`, `rgb()`)
- Don't use inline styles for basic layouts
- Don't create new horizontal scrollers - use `CardScroller`
- Don't create new color values without adding to theme
- Don't ignore TypeScript errors
- Don't create duplicate components - check existing ones first
- Don't use deprecated React Native APIs

---

---

# Demo Mode

The app includes an optional demo mode for showcasing without requiring Supabase setup.

## Enabling Demo Mode

Set in `.env.local`:
```
EXPO_PUBLIC_DEMO_MODE=true
```

## How It Works

- Shows "Try Demo" button on welcome screen
- Uses local AsyncStorage instead of Supabase
- Users can fully test the app without backend setup
- Data persists locally on device

## Files Involved

- `AuthContext.tsx` - `signInAsDemo()`, `isDemoMode`, `demoModeAvailable`
- `welcome.tsx` - "Try Demo" button (conditional on `demoModeAvailable`)

## For Customers

Demo mode is **disabled by default** (not in `.env.example`). Customers can enable it for their own demos by adding `EXPO_PUBLIC_DEMO_MODE=true` to their environment.

---

# Testing Checklist

Before submitting changes:

1. [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
2. [ ] ESLint passes (`npm run lint`)
3. [ ] Component works in light mode
4. [ ] Component works in dark mode
5. [ ] Component is responsive (different screen sizes)
6. [ ] No hardcoded colors or values
7. [ ] Uses ThemedText for all text
8. [ ] Uses existing components where possible
9. [ ] Follows naming conventions
