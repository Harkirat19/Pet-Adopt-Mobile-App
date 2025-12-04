import React, {useState} from "react";
import {View, Text, StyleSheet, Platform, TouchableOpacity, Modal, FlatList} from "react-native";
import {Picker} from "@react-native-picker/picker";
import Colors from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

const sortOptions = [
  {label: "Default", value: "none"},
  {label: "Name (A->Z)", value: "name-asc"},
  {label: "Name (Z->A)", value: "name-desc"},
  {label: "Age (low->high)", value: "age-asc"},
  {label: "Age (high->low)", value: "age-desc"},
];

export default function PetSort({selectedSort, onChangeSort}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState(selectedSort);

  const selectedLabel = sortOptions.find((opt) => opt.value === selectedSort)?.label || "Default";

  const handleSelect = (value) => {
    setTempSelected(value);
    onChangeSort(value);
    setModalVisible(false);
  };

  if (Platform.OS === "ios") {
    return (
      <>
        <View style={styles.container}>
          <Text style={styles.label}>Sort by:</Text>

          <TouchableOpacity
            style={styles.iosPickerWrapper}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.iosPickerText}>{selectedLabel}</Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={Colors.PRIMARY}
              style={styles.iosPickerIcon}
            />
          </TouchableOpacity>
        </View>

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort by</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.PRIMARY}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={sortOptions}
                keyExtractor={(item) => item.value}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      tempSelected === item.value && styles.optionItemSelected,
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        tempSelected === item.value && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {tempSelected === item.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.PRIMARY}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Android/Web: Use the original Picker
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort by:</Text>

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedSort}
          onValueChange={(itemValue) => onChangeSort(itemValue)}
          style={styles.picker}
          dropdownIconColor={Colors.PRIMARY}
        >
          {sortOptions.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
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
    color: Colors.PRIMARY,
  },
  // iOS Custom Picker Styles
  iosPickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 12,
    backgroundColor: Colors.BG_CARD || "#fff",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iosPickerText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: "black",
  },
  iosPickerIcon: {
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: Colors.PRIMARY,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionItemSelected: {
    backgroundColor: Colors.LIGHT_PRIMARY,
  },
  optionText: {
    fontFamily: "outfit",
    fontSize: 16,
    color: "#333",
  },
  optionTextSelected: {
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY,
  },
});
