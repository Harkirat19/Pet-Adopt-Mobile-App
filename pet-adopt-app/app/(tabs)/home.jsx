import React, {useState, useCallback} from "react";
import {Text, TouchableOpacity, StyleSheet, FlatList, View} from "react-native";
import Colors from "../../constants/Colors.ts";
import Header from "../../components/Home/Header.jsx";
import Slider from "../../components/Home/Slider.jsx";
import * as Updates from "expo-updates";
import PetListByCategory from "../../components/Home/PetListByCategory.jsx";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Updates.reloadAsync();
    setRefreshing(false);
  }, []);

  // Combine your static components into one header that will be rendered at the top of the FlatList.
  const renderHeader = () => (
    <View>
      <Header />
      <Slider />
      <PetListByCategory />
      <TouchableOpacity style={styles.addNewPetContainer}>
        <MaterialIcons
          name="pets"
          size={24}
          color={Colors.PRIMARY}
        />
        <Text style={styles.addNewPetText}>Add New Pet</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={[]} // No list items needed
      renderItem={() => null} // Render nothing for list items
      ListHeaderComponent={renderHeader}
      // Using FlatList's built-in refreshing support.
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    marginTop: 20,
  },
  addNewPetContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginTop: 20,
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 15,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  addNewPetText: {
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY,
    fontSize: 18,
  },
});
