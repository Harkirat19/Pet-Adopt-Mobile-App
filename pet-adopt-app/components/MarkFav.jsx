import {View, Text, Pressable} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, {useEffect} from "react";
import {useState} from "react";
import {useUser} from "@clerk/clerk-expo";
import Shared from "./../Shared/Shared";

export default function MarkFav(pet, color = "black") {
  const {user} = useUser();
  const [favList, setFavList] = useState([]);

  useEffect(() => {
    user && GetFav();
  }, [user]);
  const GetFav = async () => {
    const result = await Shared.GetFavList(user);
    console.log(result);
    setFavList(result?.favourites ? result?.favourites : []);
  };

  const AddToFav = async () => {
    const favResult = favList;
    favResult.push(pet.id);
    await Shared.UpdateFav(user, favourites);
    GetFav();
  };

  const removeFromFav = async () => {
    const favResult = favList.filter((item) => item != pet.id);
    await Shared.UpdateFav(user, favResult);
    GetFav();
  };

  return (
    <View>
      {favList?.includes(pet.id) ? (
        <Pressable onPress={removeFromFav}>
          <Ionicons
            name="heart"
            size={30}
            color="red"
          />
        </Pressable>
      ) : (
        <Pressable onPress={() => AddToFav()}>
          <Ionicons
            name="heart-outline"
            size={30}
            color={color}
          />
        </Pressable>
      )}
    </View>
  );
}
