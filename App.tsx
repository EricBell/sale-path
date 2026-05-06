import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InputScreen from './src/screens/InputScreen';
import MapScreen from './src/screens/MapScreen';
import RouteScreen from './src/screens/RouteScreen';
import { YardSale, Cluster, HomeLocation } from './src/types';

export type RootStackParamList = {
  Input: undefined;
  Map: { sales: YardSale[]; clusters: Cluster[]; home: HomeLocation };
  Route: { sales: YardSale[]; home: HomeLocation };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Input">
          <Stack.Screen name="Input" component={InputScreen} options={{ title: 'Sale Path' }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Route Map' }} />
          <Stack.Screen name="Route" component={RouteScreen} options={{ title: 'Route List' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
