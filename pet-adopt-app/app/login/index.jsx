// app/login/index.jsx

import {View, Text, Pressable, Image, Platform} from "react-native";
import React, {useEffect, useCallback} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {useRouter} from "expo-router";
import {useSSO} from "@clerk/clerk-expo";
import Colors from "./../../constants/Colors";

// Custom hook to warm up the web browser for SSO authentication
export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preload the browser to reduce authentication load time (only on native platforms)
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
    }
    return () => {
      // Cleanup when component unmounts (only on native platforms)
      if (Platform.OS !== 'web') {
        void WebBrowser.coolDownAsync();
      }
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  // Retrieve the Clerk SSO function
  const {startSSOFlow} = useSSO();

  // Use Expo Router instead of React Navigation
  const router = useRouter();

  const onPress = useCallback(async () => {
    try {
      // Initiate the SSO flow (Google OAuth)
      const {createdSessionId} = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/(tabs)/home", {scheme: "myapp"}),
      });

      // If a session was created, go to the home screen
      if (createdSessionId) {
        router.replace("(tabs)/home");
      } else {
        // Handle additional steps (e.g., MFA) here
      }
    } catch (err) {
      console.error("SSO flow error:", err);
    }
  }, [router, startSSOFlow]);

  return (
    <View style={{backgroundColor: Colors.WHITE, height: "100%"}}>
      <Image
        source={require("./../../assets/images/login.png")}
        style={{width: "100%", height: 500}}
      />
      <View style={{padding: 20, alignItems: "center"}}>
        <Text
          style={{
            fontFamily: "outfit-bold",
            fontSize: 30,
            textAlign: "center",
          }}
        >
          Ready to make a new friend?
        </Text>
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 18,
            textAlign: "center",
            color: Colors.GRAY,
          }}
        >
          Let's adopt a pet which you like, to make their life happy again :)
        </Text>

        <Pressable
          onPress={onPress}
          style={{
            padding: 14,
            marginTop: 100,
            backgroundColor: Colors.PRIMARY,
            width: "100%",
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "outfit-medium",
              fontSize: 20,
              textAlign: "center",
            }}
          >
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
