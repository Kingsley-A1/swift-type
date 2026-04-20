import assert from "node:assert/strict";
import { resolveSwiftAIToolParts } from "../src/lib/swift-ai-tool-parts.ts";

function main() {
  const createGoal = resolveSwiftAIToolParts([
    {
      type: "tool-createGoal",
      state: "output-available",
      output: JSON.stringify({ success: true, goalTitle: "Complete 3 sessions today" }),
      toolCallId: "goal-1",
    },
  ]);
  assert.equal(createGoal.length, 1);
  assert.equal(createGoal[0]?.kind, "create-goal");
  assert.equal(createGoal[0]?.label, "Complete 3 sessions today · View Goals");

  const navigate = resolveSwiftAIToolParts([
    {
      type: "tool-navigateTo",
      state: "input-available",
      input: { target: "reviews", label: "Open Reviews Panel" },
      toolCallId: "nav-1",
    },
  ]);
  assert.equal(navigate.length, 1);
  assert.equal(navigate[0]?.kind, "navigate");
  assert.equal(navigate[0]?.label, "Open Reviews Panel");

  const session = resolveSwiftAIToolParts([
    {
      type: "tool-startSession",
      state: "input-available",
      input: { mode: "timed", level: "intermediate", duration: 60 },
      toolCallId: "session-1",
    },
  ]);
  assert.equal(session.length, 1);
  assert.equal(session[0]?.kind, "start-session");
  assert.equal(session[0]?.label, "Start timed session");

  const malformed = resolveSwiftAIToolParts([
    {
      type: "tool-navigateTo",
      state: "output-available",
      output: "{bad json",
      toolCallId: "broken-1",
    },
  ]);
  assert.equal(malformed.length, 1);
  assert.equal(malformed[0]?.kind, "error");

  console.log("Swift AI Session 1 smoke passed");
}

main();