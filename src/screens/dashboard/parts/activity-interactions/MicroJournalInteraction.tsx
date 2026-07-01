import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ActionButton } from "../SharedControls";
import { isStepComplete, markJournalEntry } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function MicroJournalInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const mode = step.journalMode ?? "text";
  const entry = progress.journalEntries?.[step.id] ?? {};
  const [text, setText] = useState(entry.text ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(entry.tagIds ?? []);
  const completed = isStepComplete(step, progress);

  const textMin = step.textMinLength ?? 0;
  const textMax = step.textMaxLength ?? 200;
  const tagMin = step.minTagCount ?? 0;
  const tagMax = step.maxTagCount ?? (step.tags?.length ?? 1);

  const textValid = useMemo(() => {
    const length = text.trim().length;
    return length >= textMin && length <= textMax;
  }, [text, textMin, textMax]);

  const tagsValid = useMemo(() => {
    if (mode !== "tags" && mode !== "both") return true;
    const validIds = new Set(step.tags?.map((tag) => tag.id) ?? []);
    return (
      selectedTagIds.length >= tagMin &&
      selectedTagIds.length <= tagMax &&
      selectedTagIds.every((id) => validIds.has(id))
    );
  }, [selectedTagIds, tagMin, tagMax, step.tags, mode]);

  function submit() {
    const payload: { text?: string; tagIds?: string[] } = {};
    if ((mode === "text" || mode === "both") && textValid) {
      payload.text = text;
    }
    if ((mode === "tags" || mode === "both") && tagsValid) {
      payload.tagIds = selectedTagIds;
    }
    markJournalEntry(onChange, step.id, payload);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    );
  }

  const canSubmit =
    (mode === "text" ? textValid : mode === "tags" ? tagsValid : textValid && tagsValid) && !completed;

  return (
    <View>
      {(mode === "text" || mode === "both") && (
        <>
          <TextInput
            accessibilityLabel="简短记录"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={textMax}
            editable={!completed}
            style={{
              backgroundColor: "#f4f0e8",
              borderColor: textValid ? "#d8d0c4" : "#a23b3b",
              borderRadius: 8,
              borderWidth: 1,
              color: "#232323",
              fontSize: 14,
              marginTop: 12,
              minHeight: 72,
              padding: 12,
              textAlignVertical: "top"
            }}
            placeholder="写一句…"
          />
          <Text style={{ color: "#746b60", fontSize: 12, marginTop: 6 }}>
            {text.trim().length}/{textMax}
          </Text>
        </>
      )}
      {(mode === "tags" || mode === "both") && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {step.tags?.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={completed}
                onPress={() => toggleTag(tag.id)}
                style={{
                  backgroundColor: selected ? "#232323" : "#f4f0e8",
                  borderColor: selected ? "#232323" : "#d8d0c4",
                  borderRadius: 8,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              >
                <Text
                  style={{
                    color: selected ? "#ffffff" : "#625b52",
                    fontSize: 13,
                    fontWeight: "900" as const
                  }}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <ActionButton
        label={completed ? "已记录" : "提交记录"}
        onPress={submit}
        disabled={!canSubmit}
      />
      {completed ? null : (
        <Text style={styles.helperText}>
          {mode === "text" && `${textMin}-${textMax} 字`}
          {mode === "tags" && `选 ${tagMin}-${tagMax} 个标签`}
          {mode === "both" && `文字 ${textMin}-${textMax} 字，并选 ${tagMin}-${tagMax} 个标签`}
        </Text>
      )}
    </View>
  );
}
