import {View, Text, Image} from "react-native";
import React from "react";
import {useUser} from "@clerk/clerk-expo";

export default function Header() {
  const {isLoaded, user} = useUser();

  if (!isLoaded) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View>
        <Text>Loading... Try Refreshing if it takes too long :)</Text>
      </View>
    );
  }

  return (
    // Using user.id as key forces the component to remount when user data updates.
    <View
      style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}
      key={user.id}
    >
      <View>
        <Text style={{fontFamily: "outfit", fontSize: 18}}>Welcome,</Text>
        <Text style={{fontFamily: "outfit-medium", fontSize: 25}}>{user.fullName || "User"}</Text>
      </View>
      {user.imageUrl && (
        <Image
          source={{uri: user.imageUrl}}
          style={{width: 40, height: 40, borderRadius: 99}}
        />
      )}
    </View>
  );
}
