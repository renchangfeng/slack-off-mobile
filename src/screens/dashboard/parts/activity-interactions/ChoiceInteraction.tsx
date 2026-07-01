import { Pressable, Text, View } from "react-native";
import { markChoice, shouldLockChoiceSelection } from "./interactionProgress";
import type { ActivityStepInteractionProps } from "./types";
import styles from "../../styles";

export function ChoiceInteraction({
  step,
  progress,
  onChange,
  reducedMotion: _reducedMotion
}: ActivityStepInteractionProps) {
  const selectedId = progress.choiceAnswers?.[step.id];
  const selectedOption = step.options?.find((option) => option.id === selectedId);
  const shouldLockSelection = shouldLockChoiceSelection(step, progress);

  return (
    <View>
      <View style={styles.choiceGrid}>
        {step.options?.map((option) => {
          const selected = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={shouldLockSelection}
              onPress={() => markChoice(onChange, step.id, option.id)}
              style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
            >
              <Text
                style={[
                  styles.choiceButtonText,
                  selected && styles.choiceButtonTextSelected
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selectedOption ? (
        <Text style={styles.helperText}>{selectedOption.resultText}</Text>
      ) : null}
    </View>
  );
}
