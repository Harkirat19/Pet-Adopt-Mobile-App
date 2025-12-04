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
        >
          <Picker.Item label="Default" value="none" />
          <Picker.Item label="Name (A->Z)" value="name-asc" />
          <Picker.Item label="Name (Z->A)" value="name-desc" />
          <Picker.Item label="Age (low->high)" value="age-asc" />
          <Picker.Item label="Age (high->low)" value="age-desc" />
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
    fontSize: 15,
    color: Colors.PRIMARY,
    marginRight: 10,
    width: 50,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 12,
    backgroundColor: Colors.BG_CARD || "#fff",
    height: 56,         
    justifyContent: "center",
    paddingLeft: 16,
    paddingRight: 40,
    paddingVertical: 4,   
  },
  picker: {
    fontSize: 16,
    lineHeight: 22,       
    height: 56,
  },
});
