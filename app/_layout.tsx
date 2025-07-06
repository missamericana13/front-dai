import { useNetInfo } from '@react-native-community/netinfo';
import { Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../context/authContext';
import { RecipeProvider } from '../context/recipeContext';
import Offline from '../screens/Offline';

export default function RootLayout() {
  const netInfo = useNetInfo();
  const [isReady, setIsReady] = useState(false);
  const [hasInternet, setHasInternet] = useState(true);

  useEffect(() => {
    if (netInfo.isInternetReachable !== null) {
      setHasInternet(netInfo.isInternetReachable);
      setIsReady(true);
    }
  }, [netInfo.isInternetReachable]);

  const handleRetry = () => {

    setIsReady(false);
    setTimeout(() => {
      setHasInternet(netInfo.isInternetReachable ?? false);
      setIsReady(true);
    }, 100); 
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2B5399" />
      </View>
    );
  }

  if (!hasInternet) {
    return <Offline onRetry={handleRetry} />;
  }

  return (
    <RecipeProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </RecipeProvider>
  );
}