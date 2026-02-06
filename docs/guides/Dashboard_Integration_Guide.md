# Dashboard Component - Integration Guide

**Date:** Feb 1, 2026  
**Component:** Dashboard.jsx (v0.1)  
**Status:** Ready for testing

---

## What You're Getting

A production-quality, responsive Dashboard with:

✅ **XP Progress Bar** - Shows level, total XP, progress to next level  
✅ **Streak Counter** - Days in a row learning  
✅ **Available Lessons** - Clickable cards (navigation stubbed for v0.1)  
✅ **Developer Mode Indicator** - Shows current mode  
✅ **Island Vista Aesthetic** - Ocean gradients, warm accents, distinctive design  
✅ **Mobile-First** - 44px tap targets, responsive grid  
✅ **Loading States** - Handles async data fetching  

---

## File Structure

```
app/src/
├── App.jsx                    # ✅ NEW - Root component
├── components/
│   └── Dashboard.jsx          # ✅ NEW - Main dashboard
├── contexts/
│   └── EngineContext.jsx      # ✅ EXISTING (updated earlier)
└── engine/
    ├── SessionManager.js      # ✅ EXISTING
    ├── SkillTree.js           # ✅ EXISTING
    └── ...                    # Other Phase 1 engines
```

---

## Installation Steps

### Step 1: Copy Files

```bash
# Copy Dashboard component
cp Dashboard.jsx app/src/components/

# Copy App.jsx (or update your existing one)
cp App.jsx app/src/
```

### Step 2: Update main.jsx

Your `main.jsx` should look like this:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 3: Verify Tailwind CSS

Make sure `tailwind.config.js` includes the components path:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ← Includes components/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Step 4: Start Dev Server

```bash
npm run dev
```

Open `http://localhost:5173` (or whatever port Vite shows)

---

## Expected Behavior

### On First Load

**You should see:**
1. Ocean blue gradient background
2. "FutureFit Quest" header
3. Two cards side-by-side (desktop) or stacked (mobile):
   - **XP Card:** Level 1, 0 XP, empty progress bar
   - **Streak Card:** 0 days
4. Available lessons section showing:
   - `module_1_intro` (video)
   - `module_1_quiz` (quiz) - if video is completed
   - etc.

**Developer Mode:** Green dot + "Developer Mode" label in top-right

### When You Click a Lesson

**v0.1 Behavior:**
- Alert pops up: "v0.1: Navigation to [lesson] not yet implemented"
- Console logs: `Navigate to lesson: module_1_quiz`

**v0.2 (Next Step):**
- Will navigate to LessonPlayer component

---

## Testing Checklist

### Visual Tests

- [ ] Background gradient renders (ocean blue theme)
- [ ] XP card shows Level 1, 0 XP
- [ ] Progress bar is empty (0%)
- [ ] Streak card shows 0 days
- [ ] Lesson cards render with correct emojis
- [ ] Developer mode indicator shows green dot

### Responsive Tests

- [ ] Mobile (< 768px): Cards stack vertically
- [ ] Desktop (≥ 768px): XP and Streak cards side-by-side
- [ ] Lesson cards: 1 column mobile, 2 columns desktop
- [ ] All tap targets ≥ 44px (check lesson cards on mobile)

### Data Integration Tests

- [ ] Dashboard loads without errors
- [ ] Console shows no errors
- [ ] Clicking lesson logs to console
- [ ] SessionManager methods called successfully

---

## Troubleshooting

### Issue: "Cannot find module './components/Dashboard'"

**Solution:** Make sure Dashboard.jsx is in `app/src/components/`

```bash
ls app/src/components/Dashboard.jsx
# Should show the file
```

### Issue: "useEngines is not defined"

**Solution:** Make sure EngineContext.jsx is in the right place and exports correctly

```bash
ls app/src/contexts/EngineContext.jsx
# Should show the file
```

### Issue: White screen, no errors

**Solution:** Check browser console (F12). Look for:
- Import path errors
- Tailwind CSS not loading
- React errors

### Issue: Lesson cards not showing

**Solution:** Check that SkillTree.js has `hasQuestion: false` for video nodes

The Dashboard shows ALL nodes (videos, quizzes, etc.), not just questions.

---

## Customization (Optional)

### Change Colors

Edit the gradient classes in Dashboard.jsx:

```javascript
// Current: Ocean blue theme
className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"

// Try: Purple nebula
className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900"

// Try: Forest green
className="bg-gradient-to-br from-emerald-900 via-green-900 to-slate-900"
```

### Add Your Own Font

Add to `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

body {
  font-family: 'Space Grotesk', sans-serif;
}
```

### Adjust Card Sizes

Find the XPCard component and change padding:

```javascript
// Current
className="... p-6 ..."

// Larger
className="... p-8 ..."
```

---

## Next Steps After Dashboard Works

### Option A: Complete a Lesson (Test the Flow)

Right now you can't actually complete lessons because LessonPlayer doesn't exist. But you can test manually:

1. Open browser console
2. Run this:
```javascript
const { sessionManager } = window.__engines; // Exposed for debugging
await sessionManager.handleLessonCompletion('user_001', 'module_1_quiz', {
  submissionUuid: crypto.randomUUID(),
  userAnswer: 'B',
  timeSpentMs: 30000,
  hintsUsed: 0
});
```
3. Refresh Dashboard - XP should update!

### Option B: Build LessonPlayer (Week 2)

Next component: Display a question, accept answer, submit to SessionManager.

**Estimated time:** 2-3 hours

---

## Known Limitations (v0.1)

🟡 **No navigation** - Clicking lessons shows alert (need LessonPlayer)  
🟡 **No actual toggle** - Developer mode is display-only  
🟡 **Hardcoded userId** - Single user ('user_001')  
🟡 **No celebration animations** - Just data display  
🟡 **No error boundaries** - Will crash on SessionManager errors  

**All of these are v0.2+ features** - this is the MVP to validate integration works.

---

## Success Criteria

✅ Dashboard renders without errors  
✅ Data loads from SessionManager  
✅ Cards are responsive (mobile + desktop)  
✅ Lessons are clickable (even if stubbed)  
✅ Design looks polished (not generic)

**If all 5 pass → Phase 2 Dashboard is COMPLETE!**

---

## Questions?

Common ones I expect:

**Q: Why can't I complete lessons yet?**  
A: Need LessonPlayer component (next step). Dashboard is read-only for now.

**Q: Can I change the color scheme?**  
A: Yes! Search for `from-slate-900 via-blue-900` and replace with your gradient.

**Q: The XP bar is always empty?**  
A: Correct - you haven't completed any lessons yet. Use the manual test in "Option A" above.

**Q: Should I commit this now?**  
A: YES! This is a major milestone. Commit Dashboard before building LessonPlayer.

---

**Ready to test?** Run `npm run dev` and let me know what you see! 🚀
