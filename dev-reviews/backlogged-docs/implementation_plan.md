# Swift Type Polish & Fixes Implementation Plan

This plan details the logic, UI stabilisation, and performance improvements requested before the final push.

## Proposed Changes

### 1. Store & State Updates
#### [MODIFY] [useTypingStore.ts](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/store/useTypingStore.ts)(file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/store/useTypingStore.ts)
- Add `wordCount` (default: 30) to the [TypeState](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/store/useTypingStore.ts#33-72) interface and initial state.
- Expose `wordCount` via [setConfig](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/store/useTypingStore.ts#98-101) to allow user selection when in "Words" mode.

### 2. UI Stabilization & Controls
#### [MODIFY] [Controls.tsx](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/Controls.tsx)(file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/Controls.tsx)
- Dynamically determine the `count` of words to fetch for the session:
  - If `mode === "timed"`, fetch a large number (e.g., 300 words) so they don't run out during a 120s session.
  - If `mode === "words"`, pass the new `wordCount` state to the generation functions.
- Add a new [PillGroup](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/Controls.tsx#9-47) for "Words" when `mode === "words"`, offering options like 10, 25, 50, and 100. This perfectly replaces the "Duration" tab, preventing the UI from cramping and keeping the 3-pill structure beautifully balanced.

### 3. Typing Display Overflow Fix
#### [MODIFY] [TypingDisplay.tsx](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/TypingDisplay.tsx)(file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/TypingDisplay.tsx)
- The text container overflows when showing large amounts of text (e.g., 300 words fetched for 120s mode). 
- I will wrap the text in a scrollable container with a hidden scrollbar (`overflow-y-scroll`, `scrollbar-width: none`).
- Implement a `useEffect` combined with a ref (`scrollIntoView` or `scrollTop` logic) to smoothly auto-scroll the container downwards as the active character goes beyond the visible container line, mimicking premium typing test sites (Monkeytype/Keybr).

### 4. Component Cleanup
#### [MODIFY] [Keyboard.tsx](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/Keyboard.tsx)(file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/Keyboard.tsx)
- Remove the `<FingerGuide />` component rendering.
- Remove the import for [FingerGuide](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/FingerGuide.tsx#48-170).

#### [DELETE] [FingerGuide.tsx](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/FingerGuide.tsx)(file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/FingerGuide.tsx)
- Removing this file completely as requested to get rid of the finger guide files for now.

## Verification Plan

### Automated Tests
- N/A - The core changes are primarily React state, UI rendering, and layout fixes.

### Manual Verification
1. Run `npm run dev` and navigate to the typing interface.
2. Select **Words mode**. Verify the "Duration" tab is replaced by a "Words" tab (10, 25, 50, 100), and the UI pill group container does not jump or look cramped.
3. Start a Words session and verify it accurately terminates after the selected number of words.
4. Select **Timed mode** and **120s** duration. Begin typing. Verify there are enough words fetched that you do not reach the end artificially.
5. In any lengthy test (like 120s), continuously type and verify that the [TypingDisplay](file:///c:/Users/KING%20MADU/Desktop/Swift%20Type/src/components/TypingDisplay.tsx#8-116) gracefully scrolls downwards to keep your active caret in view, without text overflowing outside the boundaries of the text box.
6. Verify the Finger Guide component is no longer visible on the layout above the keyboard.
