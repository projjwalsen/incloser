import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useOnboardingStore } from "../../store/onboardingStore";
import { AVATARS } from "../../constants/avatars";

interface TopHeaderProps {
  balance: number;
  onPressMenu: () => void;
  onPressAddMoney: () => void;
  onPressProfile: () => void;
}

export default function TopHeader({
  balance,
  onPressMenu,
  onPressAddMoney,
  onPressProfile,
}: TopHeaderProps) {
  const insets = useSafeAreaInsets();
  const { avatarId } = useOnboardingStore();

  // Get user's selected avatar
  const selectedAvatar = AVATARS.find((a) => a.id === avatarId);
  const avatarSource = selectedAvatar
    ? selectedAvatar.source
    : require("../../../assets/images/male_profile.png");

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Left: Menu */}
      <TouchableOpacity onPress={onPressMenu} style={styles.menuButton}>
        <Image
          source={require("../../../assets/images/menu_icon.png")}
          style={styles.menuIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Right: Wallet + Profile */}
      <View style={styles.rightSection}>
        {/* Wallet Chip */}
        <View style={styles.walletChip}>
          <Text style={styles.walletText}>₹ {balance.toFixed(2)}</Text>
          <TouchableOpacity onPress={onPressAddMoney} style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar */}
        <TouchableOpacity onPress={onPressProfile} style={styles.profileButton}>
          <Image
            source={avatarSource}
            style={styles.profileAvatar}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
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
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
  },
  walletText: {
    ...typography.body.medium,
    fontSize: 14,
    color: colors.text.white,
    fontWeight: "600",
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.white,
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: {
    fontSize: 18,
    color: "#3B82F6",
    fontWeight: "600",
    lineHeight: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
});
