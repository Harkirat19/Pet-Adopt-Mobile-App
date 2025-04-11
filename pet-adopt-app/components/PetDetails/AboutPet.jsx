import {View, Text, Pressable} from "react-native";
import React from "react";
import {useState} from "react";
import Colors from "../../constants/Colors";

export default function AboutPet({pet}) {
  const [readMore, setReadMore] = useState(false);
  return (
    <View
      style={{
        padding: 20,
      }}
    >
      <Text
        style={{
          fontFamily: "outfit-medium",
          fontSize: 20,
        }}
      >
        About {pet?.name}
      </Text>
      <Text
        numberOfLines={readMore ? undefined : 3} // undefined means no limit
        style={{fontFamily: "outfit-medium", fontSize: 14}}
      >
        {pet.about}
      </Text>
      {!readMore && (
        <Pressable onPress={() => setReadMore(true)}>
          <Text
            style={{
              fontFamily: "outfit-medium",
              fontSize: 14,
              color: Colors.SECONDARY,
            }}
          >
            Read More
          </Text>
        </Pressable>
      )}
      {readMore && (
        <Pressable onPress={() => setReadMore(false)}>
          <Text
            style={{
              fontFamily: "outfit-medium",
              fontSize: 14,
              color: Colors.SECONDARY,
              marginTop: 5,
            }}
          >
            Read Less
          </Text>
        </Pressable>
      )}
    </View>
  );
}
