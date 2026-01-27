import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export type Category = "All" | "Friendship" | "Divorce" | "Relationship" | "Confidence";

interface CategoryTabsProps {
  value: Category;
  onChange: (category: Category) => void;
}

const CATEGORIES: Category[] = ["All", "Friendship", "Divorce", "Relationship", "Confidence"];

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isActive = value === category;
          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {category}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: "relative",
  },
  tabActive: {
    // Active styling handled by indicator
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabText: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.button.primary,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.button.primary,
    borderRadius: 1,
  },
});
