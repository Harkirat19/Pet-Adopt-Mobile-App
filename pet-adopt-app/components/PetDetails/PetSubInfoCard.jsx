import {View, Text, Image} from "react-native";
import React from "react";
import Colors from "../../constants/Colors";

export default function PetSubInfoCard({icon, title, value}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        padding: 10,
        margin: 5,
        borderRadius: 8,
      }}
    >
      <Image
        source={icon}
        style={{
          width: 40,
          height: 40,
          resizeMode: "contain",
          marginRight: 10,
        }}
      />
      <View style={{flex: 1}}>
        <Text
          style={{
            fontFamily: "outfit",
            fontSize: 16,
            color: Colors.GRAY,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "outfit-medium",
            fontSize: 16,
            color: Colors.BLACK,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
