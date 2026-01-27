import React from "react";
import { Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import ChatHomeScreen from "../screens/maleHome/ChatHomeScreen";
import CallHomeScreen from "../screens/maleHome/CallHomeScreen";
import HistoryScreen from "../screens/maleHome/HistoryScreen";

type MaleTabsParamList = {
  ChatTab: undefined;
  CallTab: undefined;
  HistoryTab: undefined;
};

const Tab = createBottomTabNavigator<MaleTabsParamList>();

export default function MaleHomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FF6B9D",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tab.Screen
        name="ChatTab"
        component={ChatHomeScreen}
        options={{
          title: "Chat",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require("../../assets/images/chat_icon.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="CallTab"
        component={CallHomeScreen}
        options={{
          title: "Call",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require("../../assets/images/call_icon.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarIcon: ({ focused, color }) => (
            <Image
              source={require("../../assets/images/history_icon.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
