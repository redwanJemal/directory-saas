import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

// Planner tab removed — redirect to home
export default function PlannerScreen() {
  return <Redirect href="/(main)" />;
}
