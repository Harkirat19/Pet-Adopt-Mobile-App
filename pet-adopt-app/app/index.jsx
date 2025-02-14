import {useUser} from "@clerk/clerk-expo";
import {Link, Redirect, useRootNavigationState, useRouter} from "expo-router";
import {useEffect} from "react";
import {Pressable, Text, View} from "react-native";

export default function Index() {
  const {user} = useUser();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    CheckNavLoaded();
  }, []);

  const CheckNavLoaded = () => {
    if (!rootNavigationState.key) return null;
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Link href={"/login"}>
        <Text> Go To Login Screen</Text>
      </Link>
    </View>
  );
}
