import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientBackground from "../../components/GradientBackground";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { MOCK_HISTORY, type HistoryItem } from "../../constants/mockFriends";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const handlePressMore = () => {
    Alert.alert("More", "More options coming soon");
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const { friend, time, duration } = item;
    const isOnline = friend.status === "online";
    const isBusy = friend.status === "busy";

    return (
      <View style={styles.historyCard}>
        {/* Time + Duration */}
        <View style={styles.timeRow}>
          <Image
            source={require("../../../assets/images/phone_icon.png")}
            style={styles.timeIcon}
            resizeMode="contain"
          />
          <Text style={styles.timeText}>
            {time} • {duration}
          </Text>
        </View>

        {/* Friend Info */}
        <View style={styles.friendRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={friend.avatar}
              style={styles.avatar}
              resizeMode="cover"
            />
            {isOnline && <View style={styles.onlineDot} />}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            {/* Name + Verified */}
            <View style={styles.nameRow}>
              <Text style={styles.name}>{friend.name}</Text>
              {friend.verified && (
                <Image
                  source={require("../../../assets/images/verified_icon.png")}
                  style={styles.verifiedIcon}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Tags */}
            <Text style={styles.tags}>{friend.tags.join(" • ")}</Text>

            {/* Age + City */}
            <Text style={styles.location}>
              {friend.age} yrs  |  {friend.city}, {friend.state}
            </Text>

            {/* Languages */}
            <View style={styles.languagesRow}>
              <Image
                source={require("../../../assets/images/language_Icon.png")}
                style={styles.languageIconImage}
                resizeMode="contain"
              />
              <Text style={styles.languages}>{friend.languages.join(" • ")}</Text>
            </View>

            {/* Rating + Status */}
            <View style={styles.bottomRow}>
              <View style={styles.ratingContainer}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.rating}>{friend.rating}</Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  isOnline && styles.statusPillOnline,
                  isBusy && styles.statusPillBusy,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isOnline && styles.statusDotOnline,
                    isBusy && styles.statusDotBusy,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isOnline && styles.statusTextOnline,
                    isBusy && styles.statusTextBusy,
                  ]}
                >
                  {friend.status === "online"
                    ? "Online"
                    : friend.status === "busy"
                    ? "Busy"
                    : "Offline"}
                </Text>
              </View>
            </View>
          </View>

        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.dateLabel}</Text>
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity onPress={handlePressMore} style={styles.menuButton}>
            <Image
              source={require("../../../assets/images/menu_icon.png")}
              style={styles.menuIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>History</Text>

          <TouchableOpacity onPress={handlePressMore} style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        <SectionList
          sections={MOCK_HISTORY}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...typography.body.large,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  moreIcon: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: 12,
  },
  sectionTitle: {
    ...typography.body.medium,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  historyCard: {
    backgroundColor: colors.background.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  timeIcon: {
    width: 14,
    height: 14,
    tintColor: colors.text.secondary,
  },
  timeText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
  },
  friendRow: {
    flexDirection: "row",
  },
  avatarContainer: {
    width: 70,
    height: 70,
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.background.white,
    backgroundColor: "#10B981",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  name: {
    ...typography.body.medium,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  verifiedIcon: {
    width: 16,
    height: 16,
  },
  tags: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  location: {
    ...typography.body.small,
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  languagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  languageIconImage: {
    width: 12,
    height: 12,
  },
  languages: {
    ...typography.body.small,
    fontSize: 11,
    color: colors.text.secondary,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  starIcon: {
    fontSize: 12,
  },
  rating: {
    ...typography.body.small,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  statusPillOnline: {
    backgroundColor: "#ECFDF5",
  },
  statusPillBusy: {
    backgroundColor: "#FEF2F2",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9CA3AF",
  },
  statusDotOnline: {
    backgroundColor: "#10B981",
  },
  statusDotBusy: {
    backgroundColor: "#EF4444",
  },
  statusText: {
    ...typography.body.small,
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  statusTextOnline: {
    color: "#10B981",
  },
  statusTextBusy: {
    color: "#EF4444",
  },
});
