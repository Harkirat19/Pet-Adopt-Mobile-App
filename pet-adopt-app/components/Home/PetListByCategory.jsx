import { View, FlatList, Text } from "react-native";
import React, { useState, useEffect } from "react";
import Category from "./Category";
import PetListItem from "./PetListItem";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

export default function PetListByCategory({ searchTerm = "" }) {
  const [allPets, setAllPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Dogs");

  // Fetch all pets once
  const FetchAllPets = async () => {
    try {
      setLoader(true);
      const petsCollection = collection(db, "Pets");
      const snapshot = await getDocs(petsCollection);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllPets(data);
      setLoader(false);
      return data;
    } catch (error) {
      console.log("Error fetching pets:", error);
      setLoader(false);
    }
  };

  // Filter pets dynamically as search term or category changes
  const FilterPets = (pets, category, term) => {
    let filtered = pets;

    if (category && category !== "All") {
      filtered = filtered.filter(
        (pet) => pet.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (term.trim() !== "") {
      filtered = filtered.filter(
        (pet) =>
          pet.name?.toLowerCase().includes(term.toLowerCase()) ||
          pet.breed?.toLowerCase().includes(term.toLowerCase())
      );
    }

    setFilteredPets(filtered);
  };

  // Fetch pets only once
  useEffect(() => {
    FetchAllPets();
  }, []);

  // Filter whenever data, searchTerm, or category changes
  useEffect(() => {
    if (allPets.length > 0) {
      FilterPets(allPets, selectedCategory, searchTerm);
    }
  }, [allPets, selectedCategory, searchTerm]);

  return (
    <View>
      <Category category={(value) => setSelectedCategory(value)} />

      {filteredPets.length === 0 && !loader ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
          No pets found
        </Text>
      ) : (
        <FlatList
          data={filteredPets}
          style={{ marginTop: 10 }}
          horizontal={true}
          refreshing={loader}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PetListItem pet={item} />}
        />
      )}
    </View>
  );
}
