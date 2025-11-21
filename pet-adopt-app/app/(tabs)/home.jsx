import React, { useState, useCallback } from "react";
import { Text, TouchableOpacity, StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import Colors from "../../constants/Colors.ts";
import Header from "../../components/Home/Header.jsx";
import { Link } from "expo-router";
import Slider from "../../components/Home/Slider.jsx";
import SearchBar from "../../components/Home/SearchBar.jsx";
import * as Updates from "expo-updates";
import PetListByCategory from "../../components/Home/PetListByCategory.jsx";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";


export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
   const [sortValue, setSortValue] = useState("none");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Updates.reloadAsync();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header />
      <Slider />

      {/*  SearchBar with stable state */}
      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      

      {/*  Pass searchTerm prop to filter pets */}
      <PetListByCategory searchTerm={searchTerm} />

      <Link href={"/add-new-pet"} style={styles.addNewPetContainer}>
        <MaterialIcons name="pets" size={24} color={Colors.PRIMARY} />
        <Text style={styles.addNewPetText}>Add New Pet</Text>
      </Link>
    </ScrollView>
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
    textAlign: "center",
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