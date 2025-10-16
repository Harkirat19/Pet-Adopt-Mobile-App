import {View, Text, Image, TouchableOpacity, StyleSheet} from "react-native";
import React from "react";
import Colors from "@/constants/Colors";
import {Link} from "expo-router";

export default function UserItem({userInfo}) {
  console.log("UserItem - docId:", userInfo?.docId); // Debug log

  if (!userInfo || !userInfo.docId) {
    return null;
  }

  return (
    <Link
      href={`/chat?id=${userInfo.docId}`}
      asChild
    >
      <TouchableOpacity style={styles.container}>
        <View style={styles.content}>
          <Image
            source={{
              uri: userInfo?.imageUrl || userInfo?.profileImage || "https://via.placeholder.com/50",
            }}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text style={styles.name}>{userInfo?.name || "Unknown User"}</Text>
            <Text style={styles.email}>{userInfo?.email || "No email"}</Text>
          </View>
        </View>
        <View style={styles.separator} />
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: "outfit-medium",
    fontSize: 18,
    color: "#000",
  },
  email: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 2,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.GRAY,
    marginTop: 12,
  },
});
