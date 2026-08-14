import { Tabs } from 'expo-router';
import React from 'react';

// The app renders its own bottom navigation inside `index.tsx`, so the native
// expo-router tab bar is hidden to avoid a duplicate bar.
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
