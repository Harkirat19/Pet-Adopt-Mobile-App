import React from "react";
import {View, Text, StyleSheet, Image} from "react-native";
import Colors from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function OwnerInfo({pet}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Image
          source={{uri: pet?.userImage}}
          style={{
            width: 50,
            height: 50,
            borderRadius: 99,
          }}
        />
        <View>
          <Text style={styles.userName}>{pet?.userName}</Text>
          <Text style={styles.userRole}>Pet Owner</Text>
        </View>
      </View>
      <Ionicons
        name="send-sharp"
        size={24}
        color={Colors.PRIMARY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.WHITE,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  userName: {
    fontFamily: "outfit-medium",
    fontSize: 17,
  },
  userRole: {
    fontFamily: "outfit",
    color: Colors.GRAY,
  },
});
