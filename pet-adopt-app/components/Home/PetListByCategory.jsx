import {View, FlatList, Text, Image} from "react-native";
import React, {useState, useEffect} from "react";
import Category from "./Category";
import PetListItem from "./PetListItem";
import {collection, getDocs, query, where} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";

export default function PetListByCategory() {
  const [petList, setPetList] = useState([]);
  const [loader, setLoader] = useState(false);

  const GetPetList = async (category) => {
    setLoader(true);
    setPetList([]);
    const q = query(collection(db, "Pets"), where("category", "==", category));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      setPetList((prev) => [...prev, doc.data()]);
    });
    setLoader(false);
  };

  useEffect(() => {
    GetPetList("Dogs");
  }, []);

  return (
    <View>
      <Category category={(value) => GetPetList(value)} />

      <FlatList
        data={petList}
        style={{marginTop: 10}}
        horizontal={true}
        refreshing={loader}
        onRefresh={() => GetPetList("Dogs")}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => <PetListItem pet={item} />}
      />
    </View>
  );
}
