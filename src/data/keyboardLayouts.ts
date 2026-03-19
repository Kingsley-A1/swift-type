export type FingerMapping =
  | "pinky"
  | "ring"
  | "middle"
  | "index"
  | "thumb"
  | "action";

export interface KeyConfig {
  id: string;
  mainChar: string;
  shiftChar?: string;
  display?: string;
  widthFlex?: number; // flex-grow units (1 = 1 unit wide, 1.5 = 1.5x, etc.)
  finger: FingerMapping;
}

// ─── SHARED ROWS (same for Windows & Mac) ────────────────────────────────────
const ROW_NUMBERS: KeyConfig[] = [
  { id: "Backquote", mainChar: "`", shiftChar: "~", finger: "pinky" },
  { id: "Digit1", mainChar: "1", shiftChar: "!", finger: "pinky" },
  { id: "Digit2", mainChar: "2", shiftChar: "@", finger: "ring" },
  { id: "Digit3", mainChar: "3", shiftChar: "#", finger: "middle" },
  { id: "Digit4", mainChar: "4", shiftChar: "$", finger: "index" },
  { id: "Digit5", mainChar: "5", shiftChar: "%", finger: "index" },
  { id: "Digit6", mainChar: "6", shiftChar: "^", finger: "index" },
  { id: "Digit7", mainChar: "7", shiftChar: "&", finger: "index" },
  { id: "Digit8", mainChar: "8", shiftChar: "*", finger: "middle" },
  { id: "Digit9", mainChar: "9", shiftChar: "(", finger: "ring" },
  { id: "Digit0", mainChar: "0", shiftChar: ")", finger: "pinky" },
  { id: "Minus", mainChar: "-", shiftChar: "_", finger: "pinky" },
  { id: "Equal", mainChar: "=", shiftChar: "+", finger: "pinky" },
  { id: "Backspace", mainChar: "Backspace", display: "⌫", widthFlex: 2, finger: "action" },
];

const ROW_TOP: KeyConfig[] = [
  { id: "Tab", mainChar: "Tab", display: "Tab", widthFlex: 1.5, finger: "action" },
  { id: "KeyQ", mainChar: "q", shiftChar: "Q", finger: "pinky" },
  { id: "KeyW", mainChar: "w", shiftChar: "W", finger: "ring" },
  { id: "KeyE", mainChar: "e", shiftChar: "E", finger: "middle" },
  { id: "KeyR", mainChar: "r", shiftChar: "R", finger: "index" },
  { id: "KeyT", mainChar: "t", shiftChar: "T", finger: "index" },
  { id: "KeyY", mainChar: "y", shiftChar: "Y", finger: "index" },
  { id: "KeyU", mainChar: "u", shiftChar: "U", finger: "index" },
  { id: "KeyI", mainChar: "i", shiftChar: "I", finger: "middle" },
  { id: "KeyO", mainChar: "o", shiftChar: "O", finger: "ring" },
  { id: "KeyP", mainChar: "p", shiftChar: "P", finger: "pinky" },
  { id: "BracketLeft", mainChar: "[", shiftChar: "{", finger: "pinky" },
  { id: "BracketRight", mainChar: "]", shiftChar: "}", finger: "pinky" },
  { id: "Backslash", mainChar: "\\", shiftChar: "|", widthFlex: 1.5, finger: "pinky" },
];

const ROW_HOME: KeyConfig[] = [
  { id: "CapsLock", mainChar: "CapsLock", display: "Caps", widthFlex: 1.75, finger: "action" },
  { id: "KeyA", mainChar: "a", shiftChar: "A", finger: "pinky" },
  { id: "KeyS", mainChar: "s", shiftChar: "S", finger: "ring" },
  { id: "KeyD", mainChar: "d", shiftChar: "D", finger: "middle" },
  { id: "KeyF", mainChar: "f", shiftChar: "F", finger: "index" },
  { id: "KeyG", mainChar: "g", shiftChar: "G", finger: "index" },
  { id: "KeyH", mainChar: "h", shiftChar: "H", finger: "index" },
  { id: "KeyJ", mainChar: "j", shiftChar: "J", finger: "index" },
  { id: "KeyK", mainChar: "k", shiftChar: "K", finger: "middle" },
  { id: "KeyL", mainChar: "l", shiftChar: "L", finger: "ring" },
  { id: "Semicolon", mainChar: ";", shiftChar: ":", finger: "pinky" },
  { id: "Quote", mainChar: "'", shiftChar: '"', finger: "pinky" },
  { id: "Enter", mainChar: "Enter", display: "Enter", widthFlex: 2.25, finger: "action" },
];

const ROW_BOTTOM: KeyConfig[] = [
  { id: "ShiftLeft", mainChar: "Shift", display: "Shift", widthFlex: 2.5, finger: "action" },
  { id: "KeyZ", mainChar: "z", shiftChar: "Z", finger: "pinky" },
  { id: "KeyX", mainChar: "x", shiftChar: "X", finger: "ring" },
  { id: "KeyC", mainChar: "c", shiftChar: "C", finger: "middle" },
  { id: "KeyV", mainChar: "v", shiftChar: "V", finger: "index" },
  { id: "KeyB", mainChar: "b", shiftChar: "B", finger: "index" },
  { id: "KeyN", mainChar: "n", shiftChar: "N", finger: "index" },
  { id: "KeyM", mainChar: "m", shiftChar: "M", finger: "index" },
  { id: "Comma", mainChar: ",", shiftChar: "<", finger: "middle" },
  { id: "Period", mainChar: ".", shiftChar: ">", finger: "ring" },
  { id: "Slash", mainChar: "/", shiftChar: "?", finger: "pinky" },
  { id: "ShiftRight", mainChar: "Shift", display: "Shift", widthFlex: 2.5, finger: "action" },
];

// ─── SPACE ROW VARIANTS ───────────────────────────────────────────────────────
const SPACE_ROW_WINDOWS: KeyConfig[] = [
  { id: "ControlLeft", mainChar: "Control", display: "Ctrl", widthFlex: 1.25, finger: "action" },
  { id: "MetaLeft", mainChar: "Meta", display: "Win", widthFlex: 1.25, finger: "action" },
  { id: "AltLeft", mainChar: "Alt", display: "Alt", widthFlex: 1.25, finger: "action" },
  { id: "Space", mainChar: " ", display: " ", widthFlex: 6, finger: "thumb" },
  { id: "AltRight", mainChar: "Alt", display: "Alt", widthFlex: 1.25, finger: "action" },
  { id: "MetaRight", mainChar: "Meta", display: "Win", widthFlex: 1.25, finger: "action" },
  { id: "ControlRight", mainChar: "Control", display: "Ctrl", widthFlex: 1.25, finger: "action" },
];

const SPACE_ROW_MAC: KeyConfig[] = [
  { id: "fn", mainChar: "fn", display: "fn", widthFlex: 1, finger: "action" },
  { id: "ControlLeft", mainChar: "Control", display: "control", widthFlex: 1.25, finger: "action" },
  { id: "AltLeft", mainChar: "Alt", display: "option", widthFlex: 1.25, finger: "action" },
  { id: "MetaLeft", mainChar: "Meta", display: "command", widthFlex: 1.75, finger: "action" },
  { id: "Space", mainChar: " ", display: " ", widthFlex: 5, finger: "thumb" },
  { id: "MetaRight", mainChar: "Meta", display: "command", widthFlex: 1.75, finger: "action" },
  { id: "AltRight", mainChar: "Alt", display: "option", widthFlex: 1.25, finger: "action" },
  { id: "ArrowLeft", mainChar: "ArrowLeft", display: "◄", widthFlex: 1, finger: "action" },
  { id: "ArrowRight", mainChar: "ArrowRight", display: "►", widthFlex: 1, finger: "action" },
];

// ─── EXPORTED LAYOUTS ─────────────────────────────────────────────────────────
export const WINDOWS_LAYOUT: KeyConfig[][] = [
  ROW_NUMBERS,
  ROW_TOP,
  ROW_HOME,
  ROW_BOTTOM,
  SPACE_ROW_WINDOWS,
];

export const MAC_LAYOUT: KeyConfig[][] = [
  ROW_NUMBERS,
  ROW_TOP,
  ROW_HOME,
  ROW_BOTTOM,
  SPACE_ROW_MAC,
];

// Keep old export for backward compat
export const QWERTY_LAYOUT = WINDOWS_LAYOUT;
