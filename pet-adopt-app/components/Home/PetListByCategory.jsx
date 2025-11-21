import { View, FlatList, Text } from "react-native";
import React, { useState, useEffect } from "react";
import Category from "./Category";
import PetListItem from "./PetListItem";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import PetSort from "./PetSort";

export default function PetListByCategory({ searchTerm = "" }) {
  const [allPets, setAllPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Dogs");

  // new sort state
  const [selectedSort, setSelectedSort] = useState("name-asc");

  // Fetch all pets once
  const FetchAllPets = async () => {
    try {
      setLoader(true);
      const petsCollection = collection(db, "Pets");
      const snapshot = await getDocs(petsCollection);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllPets(data);
      setLoader(false);
    } catch (error) {
      console.log("Error fetching pets:", error);
      setLoader(false);
    }
  };

  // Sorting logic
  const SortPets = (petsArray, sortType) => {
    const sorted = [...petsArray];

    switch (sortType) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;

      case "age-asc":
        sorted.sort((a, b) => (a.age || 0) - (b.age || 0));
        break;

      case "age-desc":
        sorted.sort((a, b) => (b.age || 0) - (a.age || 0));
        break;
    }

    return sorted;
  };

  // Filtering logic
  const FilterPets = (pets, category, term, sortType) => {
    let result = pets;

    // category filter
    if (category && category !== "All") {
      result = result.filter(
        (pet) => pet.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // search filter
    if (term.trim() !== "") {
      const lower = term.toLowerCase();
      result = result.filter(
        (pet) =>
          pet.name?.toLowerCase().includes(lower) ||
          pet.breed?.toLowerCase().includes(lower)
      );
    }

    // apply sorting
    result = SortPets(result, sortType);

    setFilteredPets(result);
  };

  useEffect(() => {
    FetchAllPets();
  }, []);

  useEffect(() => {
    if (allPets.length > 0) {
      FilterPets(allPets, selectedCategory, searchTerm, selectedSort);
    }
  }, [allPets, selectedCategory, searchTerm, selectedSort]);

  return (
    <View>
      <Category category={(value) => setSelectedCategory(value)} />

      {/* sort dropdown menu */}
      <PetSort
        selectedSort={selectedSort}
        onChangeSort={(value) => setSelectedSort(value)}
      />

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
