import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+86", name: "China", flag: "🇨🇳" },
];

interface CountryCodeSelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

export default function CountryCodeSelector({
  selectedCode,
  onSelect,
}: CountryCodeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  return (
    <>
      <Pressable
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.code}>{selected.code}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    onSelect(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <Text style={styles.modalCode}>{item.code}</Text>
                  <Text style={styles.modalName}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.background.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 80,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  code: {
    ...typography.body.medium,
    color: colors.text.primary,
    marginRight: 4,
  },
  chevron: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  modalCode: {
    ...typography.body.medium,
    color: colors.text.primary,
    marginRight: 8,
    minWidth: 40,
  },
  modalName: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
  },
});
