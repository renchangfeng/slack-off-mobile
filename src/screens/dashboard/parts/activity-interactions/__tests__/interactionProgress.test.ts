import { describe, expect, it } from "vitest";
import {
  isStepComplete,
  markTapPattern,
  shouldLockChoiceSelection
} from "../interactionProgress";
import type { ActivityStep } from "../types";

function makeStep(type: ActivityStep["type"], overrides: Partial<ActivityStep> = {}): ActivityStep {
  return {
    id: "step",
    type,
    title: "T",
    description: "D",
    required: true,
    ...overrides
  } as ActivityStep;
}

describe("isStepComplete", () => {
  it("ack requires completedStepIds", () => {
    const step = makeStep("ack");
    expect(isStepComplete(step, {})).toBe(false);
    expect(isStepComplete(step, { completedStepIds: ["step"] })).toBe(true);
  });

  it("timer requires enough seconds", () => {
    const step = makeStep("timer", { durationSeconds: 5 });
    expect(isStepComplete(step, { timerSeconds: { step: 4 } })).toBe(false);
    expect(isStepComplete(step, { timerSeconds: { step: 5 } })).toBe(true);
  });

  it("choice requires selected option", () => {
    const open = makeStep("choice", {
      options: [
        { id: "a", label: "A", resultText: "" },
        { id: "b", label: "B", resultText: "" }
      ]
    });
    expect(isStepComplete(open, { choiceAnswers: { step: "unknown" } })).toBe(false);
    expect(isStepComplete(open, { choiceAnswers: { step: "a" } })).toBe(true);

    const step = makeStep("choice", {
      options: [
        { id: "a", label: "A", resultText: "" },
        { id: "b", label: "B", resultText: "" }
      ],
      correctOptionId: "b"
    });
    expect(isStepComplete(step, { choiceAnswers: { step: "a" } })).toBe(false);
    expect(isStepComplete(step, { choiceAnswers: { step: "b" } })).toBe(true);
  });

  it("tap-pattern requires required taps", () => {
    const step = makeStep("tap-pattern", { requiredTaps: 3 });
    expect(isStepComplete(step, { tapCounts: { step: 2 } })).toBe(false);
    expect(isStepComplete(step, { tapCounts: { step: 3 } })).toBe(true);
  });

  it("sort requires all items and optional correct order", () => {
    const step = makeStep("sort", {
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ]
    });
    expect(isStepComplete(step, { sortedItemIds: { step: ["a"] } })).toBe(false);
    expect(isStepComplete(step, { sortedItemIds: { step: ["b", "a"] } })).toBe(true);

    const exact = makeStep("sort", {
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ],
      correctOrder: ["a", "b"]
    });
    expect(isStepComplete(exact, { sortedItemIds: { step: ["b", "a"] } })).toBe(false);
    expect(isStepComplete(exact, { sortedItemIds: { step: ["a", "b"] } })).toBe(true);
  });

  it("breath requires required rounds", () => {
    const step = makeStep("breath", { requiredRounds: 2 });
    expect(isStepComplete(step, { breathRounds: { step: 1 } })).toBe(false);
    expect(isStepComplete(step, { breathRounds: { step: 2 } })).toBe(true);
  });

  it("reaction requires success count", () => {
    const step = makeStep("reaction", { requiredSuccessCount: 2 });
    expect(isStepComplete(step, { reactionResults: { step: { successCount: 1, attempts: 3 } } })).toBe(false);
    expect(isStepComplete(step, { reactionResults: { step: { successCount: 2, attempts: 3 } } })).toBe(true);
  });

  it("micro-journal validates text length", () => {
    const step = makeStep("micro-journal", {
      journalMode: "text",
      textMinLength: 3,
      textMaxLength: 10
    });
    expect(isStepComplete(step, { journalEntries: { step: { text: "hi" } } })).toBe(false);
    expect(isStepComplete(step, { journalEntries: { step: { text: "hello" } } })).toBe(true);
  });

  it("micro-journal both mode requires valid text and tags", () => {
    const step = makeStep("micro-journal", {
      journalMode: "both",
      textMinLength: 3,
      textMaxLength: 10,
      tags: [
        { id: "calm", label: "Calm", resultText: "" },
        { id: "tired", label: "Tired", resultText: "" }
      ],
      minTagCount: 1,
      maxTagCount: 1
    });
    expect(isStepComplete(step, { journalEntries: { step: { text: "hello" } } })).toBe(false);
    expect(isStepComplete(step, { journalEntries: { step: { tagIds: ["calm"] } } })).toBe(false);
    expect(isStepComplete(step, { journalEntries: { step: { text: "hello", tagIds: ["calm"] } } })).toBe(true);
  });

  it("shuffle-pick and reveal require valid selected item", () => {
    const step = makeStep("shuffle-pick", {
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" }
      ]
    });
    expect(isStepComplete(step, { selectedOptions: { step: "c" } })).toBe(false);
    expect(isStepComplete(step, { selectedOptions: { step: "b" } })).toBe(true);
  });
});

describe("shouldLockChoiceSelection", () => {
  it("locks open-ended choices after any valid selection", () => {
    const step = makeStep("choice", {
      options: [
        { id: "a", label: "A", resultText: "" },
        { id: "b", label: "B", resultText: "" }
      ]
    });

    expect(shouldLockChoiceSelection(step, {})).toBe(false);
    expect(shouldLockChoiceSelection(step, { choiceAnswers: { step: "a" } })).toBe(true);
  });

  it("keeps correct-answer choices editable until the correct option is selected", () => {
    const step = makeStep("choice", {
      options: [
        { id: "a", label: "A", resultText: "" },
        { id: "b", label: "B", resultText: "" }
      ],
      correctOptionId: "b"
    });

    expect(shouldLockChoiceSelection(step, { choiceAnswers: { step: "a" } })).toBe(false);
    expect(shouldLockChoiceSelection(step, { choiceAnswers: { step: "b" } })).toBe(true);
  });
});

describe("markTapPattern", () => {
  it("sets tap count", () => {
    let progress = {};
    markTapPattern((value) => {
      progress = typeof value === "function" ? value(progress) : value;
    }, "step", 4);
    expect(progress).toEqual({ tapCounts: { step: 4 } });
  });
});
