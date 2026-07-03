import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { markSelectedOption } from "./interactionProgress";
import { StepSummary } from "./StepSummary";
import type { ActivityStepInteractionProps } from "./types";

export function ShufflePickInteraction({
  step,
  progress,
  onChange,
  disabled
}: ActivityStepInteractionProps) {
  const selectedId = progress.selectedOptions?.[step.id];
  const selectedItem = step.items?.find((item) => item.id === selectedId);
  const completed = Boolean(selectedId);

  const itemsRef = useRef(
    [...(step.items ?? [])].sort(() => Math.random() - 0.5)
  );
  const items = itemsRef.current;

  if (disabled) {
    return <StepSummary step={step} progress={progress} />;
  }

  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {items.map((item, index) => {
        const revealed = selectedId === item.id;
        const hidden = completed && !revealed;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: revealed }}
            accessibilityLabel={
              revealed
                ? `已抽到 ${item.label}`
                : hidden
                  ? `未抽中，第 ${index + 1} 张`
                  : `第 ${index + 1} 张，点击抽取`
            }
            disabled={completed || disabled}
            onPress={() => markSelectedOption(onChange, step.id, item.id)}
            style={{
              alignItems: "center",
              backgroundColor: revealed ? "#232323" : hidden ? "#e8e4dc" : "#f4f0e8",
              borderColor: revealed ? "#232323" : hidden ? "#d8d0c4" : "#d8d0c4",
              borderRadius: 8,
              borderStyle: hidden ? "dashed" as const : "solid" as const,
              borderWidth: 1,
              justifyContent: "center",
              minHeight: 48,
              paddingHorizontal: 12
            }}
          >
            <Text
              style={{
                color: revealed ? "#ffffff" : hidden ? "#a39a8e" : "#625b52",
                fontSize: 14,
                fontWeight: "900" as const
              }}
            >
              {revealed ? item.label : hidden ? "—" : "???"}
            </Text>
          </Pressable>
        );
      })}
      {selectedItem?.resultText ? (
        <Text style={{ color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 8 }}>
          {selectedItem.resultText}
        </Text>
      ) : completed ? (
        <Text style={{ color: "#746b60", fontSize: 13, lineHeight: 19, marginTop: 8 }}>
          已抽到：{selectedItem?.label}
        </Text>
      ) : null}
    </View>
  );
}
