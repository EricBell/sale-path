import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InputScreen from './src/screens/InputScreen';
import MapScreen from './src/screens/MapScreen';
import RouteScreen from './src/screens/RouteScreen';
import ValidationScreen from './src/screens/ValidationScreen';
import HelpScreen from './src/screens/HelpScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { YardSale, Cluster, HomeLocation } from './src/types';
import { ValidatedEntry } from './src/services/validation';

export type RootStackParamList = {
  Input: undefined;
  Validation: { entries: ValidatedEntry[]; sales: YardSale[]; homeAddress: string; clusterRadiusMiles: number };
  Map: { sales: YardSale[]; clusters: Cluster[]; home: HomeLocation };
  Route: { sales: YardSale[]; home: HomeLocation };
  Help: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Input">
          <Stack.Screen name="Input" component={InputScreen} options={{ title: 'Sale Path' }} />
          <Stack.Screen name="Validation" component={ValidationScreen} options={{ title: 'Review Addresses' }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Route Map' }} />
          <Stack.Screen name="Route" component={RouteScreen} options={{ title: 'Route List' }} />
          <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
