import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import GradientBackground from "../../components/GradientBackground";
import TopHeader from "../../components/maleHome/TopHeader";
import PromoBanner from "../../components/maleHome/PromoBanner";
import CategoryTabs, { type Category } from "../../components/maleHome/CategoryTabs";
import FriendCard from "../../components/maleHome/FriendCard";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { MOCK_FRIENDS, type FriendItem } from "../../constants/mockFriends";
import { useOnboardingStore } from "../../store/onboardingStore";

export default function CallHomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [balance] = useState(0.0);
  const { nickname } = useOnboardingStore();

  const handlePressMenu = () => {
    Alert.alert("Menu", "Menu functionality coming soon");
  };

  const handlePressAddMoney = () => {
    Alert.alert("Add Money", "Add money functionality coming soon");
  };

  const handlePressProfile = () => {
    Alert.alert("Profile", "Profile functionality coming soon");
  };

  const handlePressRandom = () => {
    Alert.alert("Random Call", "Random call functionality coming soon");
  };

  const handlePressCall = (friend: FriendItem) => {
    Alert.alert("Call", `Calling ${friend.name}...`);
  };

  // Filter friends based on selected category
  const filteredFriends =
    selectedCategory === "All"
      ? MOCK_FRIENDS
      : MOCK_FRIENDS.filter((friend) => friend.tags.includes(selectedCategory));

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Top Header */}
        <TopHeader
          balance={balance}
          onPressMenu={handlePressMenu}
          onPressAddMoney={handlePressAddMoney}
          onPressProfile={handlePressProfile}
        />

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{nickname || "Guest"} !</Text>
        </View>

        {/* Promo Banner */}
        <View style={styles.bannerContainer}>
          <PromoBanner onPressRandom={handlePressRandom} />
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Select a friend to connect</Text>
        </View>

        {/* Category Tabs */}
        <CategoryTabs value={selectedCategory} onChange={setSelectedCategory} />

        {/* Friends List */}
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendCard friend={item} mode="call" onPressCTA={handlePressCall} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No friends found in this category
              </Text>
            </View>
          }
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    ...typography.display.small,
    fontSize: 28,
    color: colors.text.primary,
  },
  bannerContainer: {
    paddingHorizontal: 24,
  },
  sectionTitleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    ...typography.body.medium,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for bottom tabs
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
