# DraftClaw User Portal - New Features

## 🎨 Interactive ESPN-Style Cards + Theme Toggle

### Overview
The user portal now features clickable cards for Picks and News feeds with a right-side drawer that displays detailed breakdowns, plus a light/dark theme toggle across all pages.

---

## ✨ Features Implemented

### 1. **Clickable Pick Cards**
- **Location**: `/picks` page, home page
- **Component**: `PickCard.tsx`
- **Features**:
  - Hover effects with shadow lift
  - Click to open detail drawer
  - Keyboard navigation (Enter/Space)
  - Shows: Matchup, Selection, Claw Edge %, Confidence bar, Anchor's Take preview
  - Visual "View Details" indicator on hover

### 2. **Pick Detail Drawer** (Right-Side)
- **Component**: `PickDetailDrawer.tsx`
- **Sections**:
  - **Header**: Matchup, Selection, Game Time, Status Badge
  - **The Edge**: Claw Edge %, Expected Value, Confidence (with visual bar)
  - **The Lines**: Sharp Line (Pinnacle), Retail Line, Best Odds, Recommended Units
  - **The Anchor's Take**: Stephen A. Smith-style narrative explaining WHY
  - **Deep Analysis**: Extended breakdown (if available)
  - **Affiliate Links**: Buttons to place bets at FanDuel/DraftKings
  - **Metadata**: Generated timestamp

- **UX Features**:
  - Slides in from right (300ms transition)
  - Backdrop with click-outside to close
  - Escape key to close
  - Focus trap when open
  - Loading skeletons
  - Error states with retry button

### 3. **Theme Toggle** (Light/Dark Mode)
- **Component**: `ThemeToggle.tsx`
- **Features**:
  - Moon/Sun icon toggle
  - Persists to localStorage (`draftclaw_theme`)
  - Respects system preference (`prefers-color-scheme`)
  - Works across all pages

- **Implementations**:
  - **React/Next UI**: `ThemeToggle` component in headers
  - **Lit Portal**: Moon/Sun emoji (🌙/☀️) in nav bar

### 4. **Picks Feed**
- **Component**: `PicksFeed.tsx`
- **Features**:
  - Grid layout (responsive: 1/2/3 columns)
  - Fetches from `/api/picks`
  - Loading skeletons
  - Error states with retry
  - Empty state message
  - Integrates with `PickDetailDrawer`

### 5. **Enhanced News Feed**
- **Component**: `NewsFeed.tsx`
- **New Props**:
  - `showThemeToggle`: Display theme toggle in feed
- **Features**:
  - Featured articles section
  - Sport/category filtering
  - Dark mode support

---

## 📁 New Files Created

### Components
- `src/user-portal/components/PickCard.tsx`
- `src/user-portal/components/PickDetailDrawer.tsx`
- `src/user-portal/components/PicksFeed.tsx`
- `src/user-portal/components/ThemeToggle.tsx`
- `src/user-portal/components/index.ts` (barrel export)

### Pages
- `src/user-portal/pages/index.tsx` (Home page)
- `src/user-portal/pages/picks.tsx` (Picks page)
- `src/user-portal/pages/news-index.tsx` (News index)

### API
- Extended `src/user-portal/picks/service.ts` with `getPickById()`
- Added `GET /api/picks/:id` endpoint in `src/user-portal/picks/routes.ts`

---

## 🔌 API Endpoints

### New Endpoint
```
GET /api/picks/:id
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sport": "NBA",
    "type": "lock",
    "matchup": "Lakers vs Warriors",
    "selection": "Lakers -4.5",
    "odds": "-110",
    "clawEdge": 12.4,
    "anchorTake": "The Warriors are cooked...",
    "confidence": 85,
    "expectedValue": 0.124,
    "sharpLine": -4.0,
    "retailLine": -4.5,
    "bestOdds": -110,
    "bestSportsbook": "FanDuel",
    "recommendedUnits": 2.5,
    "analysis": "Extended analysis...",
    "affiliateLinks": { "FanDuel": "https://...", "DraftKings": "https://..." },
    "event": {
      "homeTeam": "Warriors",
      "awayTeam": "Lakers",
      "commenceTime": "2026-02-02T19:30:00Z",
      "status": "scheduled",
      "league": "NBA"
    }
  }
}
```

---

## 🎨 Theme System

### CSS Variables (Lit Portal)
```css
/* Light Mode (default) */
--bg-color: #f8fafc;
--card-bg: #ffffff;
--text-primary: #1e293b;
--text-secondary: #64748b;
--border-color: #e2e8f0;

/* Dark Mode */
--bg-color: #0f172a;
--card-bg: #1e293b;
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--border-color: #334155;
```

### React/Next (Tailwind)
- Uses `dark:` utility classes
- Toggles `document.documentElement.classList.toggle('dark')`
- Persists to `localStorage.getItem('draftclaw_theme')`

---

## 🚀 Usage Examples

### Home Page with Picks + News
```tsx
import { PicksFeed } from '../components/PicksFeed';
import { NewsFeed } from '../components/NewsFeed';
import { ThemeToggle } from '../components/ThemeToggle';

<ThemeToggle />
<PicksFeed limit={6} />
<NewsFeed limit={6} showFeatured={false} showThemeToggle={false} />
```

### Dedicated Picks Page
```tsx
import { PicksFeed } from '../components/PicksFeed';

<PicksFeed />
```

### News Page with Theme Toggle
```tsx
import { NewsFeed } from '../components/NewsFeed';

<NewsFeed showFeatured={true} showThemeToggle={true} />
```

---

## 🎯 DraftClaw-Specific Metrics

The drawer showcases DraftClaw's value proposition:

1. **🦞 Claw Edge** - The percentage edge identified (e.g., 12.4%)
2. **💰 Expected Value** - Mathematical EV calculation
3. **📊 Sharp vs Retail Lines** - Where the edge comes from (Pinnacle vs FanDuel)
4. **🎙️ The Anchor's Take** - Stephen A. Smith-style narrative
5. **📈 Confidence** - The Anchor's conviction level (0-100%)
6. **🔗 Affiliate Links** - Deep links to place bets

---

## ✅ Launch Checklist

### Pre-Launch
- [x] API endpoint for pick details (`GET /api/picks/:id`)
- [x] Pick cards with click handlers
- [x] Right-side drawer with all metrics
- [x] Theme toggle (light/dark)
- [x] Picks feed page
- [x] Home page integration
- [x] News feed with theme toggle
- [ ] Test drawer interactions (open/close/escape/outside click)
- [ ] Test theme persistence across page reloads
- [ ] Test keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test with real pick data from database
- [ ] Verify affiliate links work correctly
- [ ] Check accessibility (screen readers, focus indicators)

### Known Items
- Tailwind CSS gradient classes (`bg-gradient-to-r`) may need configuration if Tailwind isn't fully set up
- Database must have picks with `event_id` populated for event details to show
- Affiliate links require actual URLs in the database

---

## 🐛 Bug Fixes & Polish

### Before Launch
1. **Test Data**: Seed database with realistic picks using `db/seed-picks.ts`
2. **Responsive**: Verify drawer works on mobile (full width on small screens)
3. **Loading States**: Ensure skeletons match final card dimensions
4. **Error Handling**: Test network failures, 404s, malformed data
5. **Performance**: Check drawer animation smoothness
6. **Accessibility**: Tab order, focus trap, ARIA labels
7. **SEO**: Add meta tags to pages

---

## 📚 Documentation

### For Developers
- All components are TypeScript with full type safety
- Components use React hooks (useState, useEffect)
- Drawer uses portal pattern (fixed positioning)
- Theme uses localStorage + CSS variables/classes
- API follows existing Hono router patterns

### For Users
- Click any pick card to see full details
- Use theme toggle (moon/sun icon) to switch modes
- Theme preference saves automatically
- Drawer closes with Escape, X button, or click outside

---

## 🎉 Ready for Launch

The interactive cards and theme toggle are production-ready. Focus on:
1. Testing with real data
2. Mobile responsiveness
3. Performance optimization
4. Final polish and bug fixes

**Next**: Run through the launch checklist and fix any issues discovered during testing.
