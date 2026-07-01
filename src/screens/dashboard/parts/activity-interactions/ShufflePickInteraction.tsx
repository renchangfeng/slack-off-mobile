import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { markSelectedOption } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";

export function ShufflePickInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const selectedId = progress.selectedOptions?.[step.id];
  const selectedItem = step.items?.find((item) => item.id === selectedId);
  const items = useMemo(() => {
    const source = step.items ?? [];
    return [...source].sort(() => Math.random() - 0.5);
  }, [step.id, step.items]);

  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {items.map((item) => {
        const revealed = selectedId === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: revealed }}
            disabled={Boolean(selectedId)}
            onPress={() => markSelectedOption(onChange, step.id, item.id)}
            style={{
              alignItems: "center",
              backgroundColor: revealed ? "#232323" : "#f4f0e8",
              borderColor: revealed ? "#232323" : "#d8d0c4",
              borderRadius: 8,
              borderWidth: 1,
              justifyContent: "center",
              minHeight: 48,
              paddingHorizontal: 12
            }}
          >
            <Text
              style={{
                color: revealed ? "#ffffff" : "#625b52",
                fontSize: 14,
                fontWeight: "900" as const
              }}
            >
              {revealed ? item.label : "???"}
            </Text>
          </Pressable>
        );
      })}
      {selectedItem?.resultText ? (
        <Text style={{ color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 8 }}>
          {selectedItem.resultText}
        </Text>
      ) : null}
    </View>
  );
}
