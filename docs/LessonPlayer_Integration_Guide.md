# LessonPlayer Component - Integration Guide

**Date:** Feb 5, 2026  
**Component:** LessonPlayer.jsx (v0.1 Standard)  
**Status:** Ready for testing

---

## What You're Getting

A complete interactive learning component:

✅ **3 Question Types** - Multiple choice, numeric, text input  
✅ **Timer** - Tracks time spent on each question  
✅ **Hint System** - Counter with score penalty  
✅ **Instant Feedback** - Correct/incorrect with custom messages  
✅ **Auto-Navigation** - 2-second delay after correct answers  
✅ **Manual Retry** - Button for incorrect answers  
✅ **Island Vista Design** - Matches Dashboard aesthetic  
✅ **Mobile-First** - 44px tap targets, responsive  

---

## Installation

### Step 1: Copy Files

```bash
# Copy LessonPlayer component
cp LessonPlayer.jsx app/src/components/

# Update App.jsx (navigation logic added)
cp App.jsx app/src/

# Update Dashboard.jsx (click handlers connected)
cp Dashboard.jsx app/src/components/
```

### Step 2: Restart Dev Server

```bash
# In app/ directory:
npm run dev
```

---

## How It Works - The Flow

```
Dashboard
  ↓ User clicks lesson card
  ↓ App.jsx handles navigation
LessonPlayer
  ↓ User answers question
  ↓ SessionManager validates
  ↓ Shows result screen
  ↓ 2 seconds pass (if correct)
  ↓ Auto-navigates back
Dashboard (XP updated!)
```

---

## Testing Checklist

### Test 1: Multiple Choice Question

1. Open Dashboard
2. Click "Data vs. Information" (quiz)
3. Should see:
   - Question text
   - 4 radio button options
   - Timer counting up
   - "Get Hint" and "Submit Answer" buttons

4. Select option B (correct answer)
5. Click "Submit Answer"
6. Should see:
   - 🎉 "Correct!" message
   - Time taken and XP earned
   - "Continuing in 2s..." countdown
7. Waits 2 seconds, returns to Dashboard
8. Dashboard shows:
   - XP increased to 10
   - Streak still 0 (need consecutive days)
   - "Data vs. Information" marked completed

---

### Test 2: Numeric Question

1. Complete "Data vs. Information" first
2. Dashboard should now show "Excel Logic Basics"
3. Click it
4. Question: "If cell A1 contains 10 and B1 contains 20, what does =A1+B1 return?"
5. Type `30` in the number input
6. Submit
7. Should see success screen
8. Returns to Dashboard with +10 XP (total 20)

---

### Test 3: Text Question

1. Complete first two lessons
2. Dashboard shows "Python for Non-Coders"
3. Click it
4. Question: "What keyword do you use to create a function in Python?"
5. Type `def` (case-sensitive!)
6. Submit
7. Success screen, +10 XP (total 30)

---

### Test 4: Incorrect Answer

1. Go to any lesson
2. Select/type wrong answer
3. Submit
4. Should see:
   - 💭 "Not Quite" message
   - "Try Again or Continue" button (no auto-navigation)
   - 0 XP earned
5. Click button, returns to Dashboard
6. Lesson still available (can retry)

---

### Test 5: Hint System

1. Start any lesson
2. Click "Get Hint" button
3. Alert shows: "Hint feature coming in v0.2..."
4. Hint counter increases (visible in header)
5. Submit correct answer
6. XP awarded is reduced by 2 per hint used
   - 0 hints = 10 XP
   - 1 hint = 8 XP
   - 2 hints = 6 XP

---

### Test 6: Timer

1. Start any lesson
2. Wait 30 seconds before submitting
3. Header shows: ⏱️ 0:30
4. Submit answer
5. Result screen shows "Time Taken: 0:30"

---

### Test 7: Navigation

1. Start a lesson
2. Click "← Back to Dashboard" in header
3. Should return to Dashboard immediately
4. No data saved (answer not submitted)
5. Lesson still available

---

## Expected Behavior

### First Time Flow (Clean State)

**Dashboard shows:**
- Level 1, 0 XP, 0 streak
- Available: "Data vs. Information" (first quiz)

**After completing 1 lesson:**
- Level 1, 10 XP, 0 streak
- Available: "Excel Logic Basics" (unlocked)
- Completed: "Data vs. Information" (grayed out)

**After completing 3 lessons:**
- Level 1, 30 XP, 0 streak
- All lessons completed
- "All lessons completed!" message

---

## Troubleshooting

### Issue: "Node not found" error

**Cause:** SkillTree.js doesn't have the nodeId  
**Solution:** Check that lesson IDs match between Dashboard and SkillTree

### Issue: Submit button disabled

**Cause:** No answer selected/typed  
**Solution:** This is correct - answer required before submission

### Issue: Timer shows weird numbers

**Cause:** React StrictMode double-mounting in dev  
**Solution:** This is normal in dev mode, works fine in production

### Issue: Can't see result screen

**Check console for errors**  
**Verify:** SessionManager is responding correctly

### Issue: Auto-navigation not working

**Check:** Is the answer correct? Auto-nav only happens for correct answers  
**Check:** Console for errors in setTimeout

---

## Mobile Testing

- [ ] All buttons ≥ 44px tall
- [ ] Radio buttons easy to tap
- [ ] Text input has good focus state
- [ ] Timer visible in header
- [ ] Result screen fits on small screens

---

## What's NOT in v0.1

🟡 **Video lessons** - Skipped (will show message)  
🟡 **Actual hint text** - Just counts hints  
🟡 **Celebration animations** - Data only, no confetti  
🟡 **URL routing** - State-based only  
🟡 **Progress bar** - No "Question X of Y"  
🟡 **Keyboard shortcuts** - Must click Submit  

All of these are v0.2+ features.

---

## Success Criteria

✅ Can start a lesson from Dashboard  
✅ Can answer all 3 question types  
✅ Correct answer → success screen → auto-navigate  
✅ Incorrect answer → result screen → manual continue  
✅ XP increases after completion  
✅ Timer and hints track correctly  
✅ Back button returns to Dashboard  

**If all 7 pass → LessonPlayer is COMPLETE!**

---

## Next Steps After Testing

### Option A: Add More Content
Create more lessons in SkillTree.js

### Option B: Add Video Player
Implement actual video embedding for type: 'video' lessons

### Option C: Enhance Feedback
Add celebration animations, better error messages

### Option D: Mobile Polish
Test on actual mobile devices, refine touch interactions

---

## Testing Script (Run All Tests)

```javascript
// Open browser console on Dashboard
// Run this to complete all lessons automatically:

const { sessionManager } = window.__engines; // Assuming you expose this for debugging

// Test data for each lesson
const tests = [
  { nodeId: 'module_1_quiz', answer: 'B' },
  { nodeId: 'module_2_excel', answer: 30 },
  { nodeId: 'module_3_python', answer: 'def' }
];

for (const test of tests) {
  await sessionManager.handleLessonCompletion('user_001', test.nodeId, {
    submissionUuid: crypto.randomUUID(),
    userAnswer: test.answer,
    timeSpentMs: 30000,
    hintsUsed: 0
  });
}

console.log('All lessons completed! Refresh Dashboard to see updated XP.');
```

---

**Ready to test?** Click a lesson card and let me know what you see! 🚀
