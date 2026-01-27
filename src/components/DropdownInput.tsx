import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface DropdownOption {
  id: string;
  name: string;
}

interface DropdownInputProps {
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
}

export default function DropdownInput({
  placeholder,
  value,
  options,
  onSelect,
}: DropdownInputProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.name === value);
  const displayText = selectedOption?.name || placeholder;

  const handleSelect = (optionName: string) => {
    onSelect(optionName);
    setIsModalVisible(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.dropdownButton,
          pressed && styles.dropdownButtonPressed,
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text
          style={[
            styles.dropdownText,
            !value && styles.dropdownPlaceholder,
          ]}
        >
          {displayText}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {placeholder}</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.optionItem,
                    value === option.name && styles.optionItemSelected,
                    pressed && styles.optionItemPressed,
                  ]}
                  onPress={() => handleSelect(option.name)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option.name && styles.optionTextSelected,
                    ]}
                  >
                    {option.name}
                  </Text>
                  {value === option.name && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    backgroundColor: colors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonPressed: {
    opacity: 0.8,
  },
  dropdownText: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.input.placeholder,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.secondary,
    fontWeight: "300",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.input.border,
  },
  modalTitle: {
    ...typography.body.large,
    fontWeight: "600",
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  optionsList: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionItemSelected: {
    backgroundColor: "#FFF5F9",
  },
  optionItemPressed: {
    backgroundColor: colors.background.light,
  },
  optionText: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.button.primary,
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 20,
    color: colors.button.primary,
    fontWeight: "bold",
  },
});
