import {View, Text, Pressable} from "react-native";
import {useEffect, useCallback} from "react";
import {Image} from "react-native";
import React from "react";
import Colors from "./../../constants/Colors";
import * as WebBrowser from "expo-web-browser";
import {useSSO} from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import {useNavigation} from "@react-navigation/native"; // Import navigation hook

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const {startSSOFlow} = useSSO();
  const navigation = useNavigation(); // Initialize navigation hook

  const onPress = useCallback(async () => {
    try {
      const {createdSessionId} = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/home", {scheme: "myapp"}),
      });

      if (createdSessionId) {
        // Redirect to the Home screen after successful login
        navigation.replace("home"); // Use replace to remove the current screen from the stack
      } else {
        // Handle signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error("SSOF error", err);
    }
  }, [navigation]);

  return (
    <View
      style={{
        backgroundColor: Colors.WHITE,
        height: "100%",
      }}
    >
      <Image
        source={require("./../../assets/images/login.png")}
        style={{
          width: "100%",
          height: 500,
        }}
      />

      <View
        style={{
          padding: 20,
          display: "flex",
          alignItems: "center",
        }}
      >
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
