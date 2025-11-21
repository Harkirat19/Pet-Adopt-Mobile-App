import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Colors from "../../constants/Colors";

export default function PetSort({ selectedSort, onChangeSort }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort by:</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedSort}
          onValueChange={(itemValue) => onChangeSort(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Default" value="none" />
          <Picker.Item label="Name (A → Z)" value="name-asc" />
          <Picker.Item label="Name (Z → A)" value="name-desc" />
          <Picker.Item label="Age (Low → High)" value="age-asc" />
          <Picker.Item label="Age (High → Low)" value="age-desc" />
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  label: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: Colors.PRIMARY,
    marginRight: 10,
  },
  pickerWrapper: {
    width: 200,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 10,
    backgroundColor: Colors.BG_CARD || "#fff",
    height: 45,
    justifyContent: "center",
    overflow: "hidden", 
  },
  picker: {
    fontFamily: "outfit-medium",
    fontSize: 14,
    height: 45,
    border: "none", 
    outline: "none", 
    boxShadow: "none", 
  },
  pickerItem: {
    fontFamily: "outfit-medium",
    fontSize: 14,
  },
});