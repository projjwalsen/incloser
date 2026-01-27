import React from "react";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  // Later: switch based on auth state (token)
  return <AuthStack />;
}
