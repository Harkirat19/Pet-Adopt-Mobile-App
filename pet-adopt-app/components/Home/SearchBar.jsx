import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Colors from "./../../constants/Colors";

export default function SearchBar({ value, onChange }) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="search" size={22} style={styles.icon} />
      <TextInput
        key="pet-search-input"
        placeholder="Search by name or breed"
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholderTextColor="#666"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={false}
        blurOnSubmit={false}
      />
      {/*  Clear button - only shows when there's text */}
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")} style={styles.clearButton}>
          <MaterialIcons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.BG_CARD || "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  icon: {
    color: Colors.PRIMARY,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "#222",
    outlineStyle: "none",
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});