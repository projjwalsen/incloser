import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import type { FriendItem } from "../../constants/mockFriends";

interface FriendCardProps {
  friend: FriendItem;
  mode: "call" | "chat";
  onPressCTA: (friend: FriendItem) => void;
}

export default function FriendCard({ friend, mode, onPressCTA }: FriendCardProps) {
  const isOnline = friend.status === "online";
  const isBusy = friend.status === "busy";

  return (
    <View style={styles.container}>
      {/* Left: Avatar with online indicator and status */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={friend.avatar}
            style={styles.avatar}
            resizeMode="cover"
          />
          {isOnline && <View style={styles.onlineRing} />}
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        
        {/* Status pill under avatar */}
        <View style={[
          styles.statusPillUnderAvatar,
          isOnline && styles.statusPillOnline,
          isBusy && styles.statusPillBusy,
        ]}>
          <View style={[
            styles.statusDot,
            isOnline && styles.statusDotOnline,
            isBusy && styles.statusDotBusy,
          ]} />
          <Text style={[
            styles.statusText,
            isOnline && styles.statusTextOnline,
            isBusy && styles.statusTextBusy,
          ]}>
            {friend.status === "online" ? "Online" : friend.status === "busy" ? "Busy" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Middle: Info */}
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

        {/* Rating */}
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.rating}>{friend.rating}</Text>
          </View>
        </View>
      </View>

      {/* Right: CTA Button */}
      <View style={styles.ctaContainer}>
        <Pressable
          onPress={() => onPressCTA(friend)}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          {mode === "call" ? (
            <Image
              source={require("../../../assets/images/call_icon.png")}
              style={styles.ctaIcon}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require("../../../assets/images/chat_icon.png")}
              style={styles.ctaIcon}
              resizeMode="contain"
            />
          )}
          <Text style={styles.ctaText}>
            {mode === "call" ? "Call now" : "Chat now"}
          </Text>
        </Pressable>
        <Text style={styles.price}>₹{friend.pricePerMin} / Min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
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
  avatarSection: {
    marginRight: 12,
    alignItems: "center",
  },
  avatarContainer: {
    width: 70,
    height: 70,
    position: "relative",
    marginBottom: 4,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  onlineRing: {
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
  onlineDot: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
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
  statusPillUnderAvatar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
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
    fontSize: 9,
    fontWeight: "500",
    color: "#6B7280",
  },
  statusTextOnline: {
    color: "#10B981",
  },
  statusTextBusy: {
    color: "#EF4444",
  },
  ctaContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
    marginLeft: 8,
    gap: 4,
  },
  ctaButton: {
    backgroundColor: colors.button.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaIcon: {
    width: 14,
    height: 14,
    tintColor: colors.text.white,
  },
  ctaText: {
    ...typography.button.small,
    fontSize: 12,
    color: colors.text.white,
  },
  price: {
    ...typography.body.small,
    fontSize: 11,
    color: colors.text.secondary,
  },
});
