import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { markSelectedOption } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";

export function RevealInteraction({
  step,
  progress,
  onChange,
  reducedMotion
}: ActivityStepInteractionProps) {
  const selectedId = progress.selectedOptions?.[step.id];
  const selectedItem = step.items?.find((item) => item.id === selectedId);
  const completed = Boolean(selectedId);
  const [pressedId, setPressedId] = useState<string | null>(null);

  function reveal(itemId: string) {
    if (completed) return;
    setPressedId(itemId);
    setTimeout(() => {
      markSelectedOption(onChange, step.id, itemId);
      setPressedId(null);
    }, reducedMotion ? 50 : 220);
  }

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      {step.items?.map((item) => {
        const revealed = selectedId === item.id;
        const pressing = pressedId === item.id;
        const missed = completed && !revealed;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: revealed }}
            accessibilityLabel={
              revealed
                ? `已翻开：${item.label}`
                : missed
                  ? "未翻开"
                  : "点击翻开"
            }
            disabled={completed}
            onPress={() => reveal(item.id)}
            style={{
              alignItems: "center",
              backgroundColor: revealed || pressing ? "#fff4c9" : missed ? "#e8e4dc" : "#f4f0e8",
              borderColor: revealed || pressing ? "#d4a838" : missed ? "#d8d0c4" : "#d8d0c4",
              borderRadius: 8,
              borderStyle: missed ? "dashed" as const : "solid" as const,
              borderWidth: 1,
              justifyContent: "center",
              minHeight: 72,
              paddingHorizontal: 12
            }}
          >
            <Text
              style={{
                color: revealed || pressing ? "#8b6b16" : missed ? "#a39a8e" : "#625b52",
                fontSize: 16,
                fontWeight: "900" as const
              }}
            >
              {revealed || pressing ? item.label : missed ? "—" : "翻开看看"}
            </Text>
          </Pressable>
        );
      })}
      {selectedItem?.resultText ? (
        <Text style={{ color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 4 }}>
          {selectedItem.resultText}
        </Text>
      ) : null}
    </View>
  );
}
