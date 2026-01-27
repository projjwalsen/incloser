import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

// Onboarding (common)
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import PhoneScreen from "../screens/auth/PhoneScreen";
import OtpScreen from "../screens/auth/OtpScreen";
import GenderScreen from "../screens/profile/GenderScreen";

// Male flow
import CreateProfileScreen from "../screens/profile/CreateProfileScreen";
import SelectAvatarScreen from "../screens/profile/SelectAvatarScreen";
import SelectLanguageScreen from "../screens/profile/SelectLanguageScreen";

// Female flow
import FemaleCreateProfileScreen from "../screens/female/FemaleCreateProfileScreen";
import FemaleSelectAvatarScreen from "../screens/female/FemaleSelectAvatarScreen";
import SelectSecondaryLanguageScreen from "../screens/female/SelectSecondaryLanguageScreen";
import AudioVerificationRecordScreen from "../screens/female/AudioVerificationRecordScreen";
import AudioVerificationSubmitScreen from "../screens/female/AudioVerificationSubmitScreen";

// App / Placeholder
import NextStepPlaceholderScreen from "../screens/profile/NextStepPlaceholderScreen";

// Male Home (Tabs)
import MaleHomeTabs from "./MaleHomeTabs";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* =========================
          COMMON ONBOARDING
         ========================= */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />

      {/* =========================
          MALE ONBOARDING FLOW
         ========================= */}
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="SelectAvatar" component={SelectAvatarScreen} />
      <Stack.Screen name="SelectLanguage" component={SelectLanguageScreen} />

      {/* =========================
          FEMALE ONBOARDING FLOW
         ========================= */}
      <Stack.Screen name="FemaleCreateProfile" component={FemaleCreateProfileScreen} />
      <Stack.Screen name="FemaleSelectAvatar" component={FemaleSelectAvatarScreen} />
      {/* Primary language screen is shared (SelectLanguage) */}
      <Stack.Screen
        name="SelectSecondaryLanguage"
        component={SelectSecondaryLanguageScreen}
      />
      <Stack.Screen
        name="AudioVerificationRecord"
        component={AudioVerificationRecordScreen}
      />
      <Stack.Screen
        name="AudioVerificationSubmit"
        component={AudioVerificationSubmitScreen}
      />

      {/* =========================
          MALE HOME (CHAT/CALL/HISTORY)
         ========================= */}
      <Stack.Screen name="MaleHome" component={MaleHomeTabs} />

      {/* =========================
          TEMP / NEXT STEPS
         ========================= */}
      <Stack.Screen name="NextStepPlaceholder" component={NextStepPlaceholderScreen} />
    </Stack.Navigator>
  );
}
