// app/index.jsx

import {useUser} from "@clerk/clerk-expo"; // Importing Clerk authentication hook
import {Link, Redirect, useRootNavigationState, useRouter} from "expo-router";
import {useEffect} from "react";
import {Pressable, Text, View} from "react-native"; // Importing UI components from React Native

export default function Index() {
  const {user} = useUser(); // Getting user authentication details
  const rootNavigationState = useRootNavigationState(); // Getting the state of the root navigation

  useEffect(() => {
    CheckNavLoaded(); // Checking if navigation state is loaded on component mount
  }, []);

  // Function to check if navigation state is loaded
  const CheckNavLoaded = () => {
    if (!rootNavigationState.key) return null;
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {user ? <Redirect href={"/(tabs)/home"} /> : <Redirect href={"/login"} />}
    </View>
  );
}
