import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Image} from "react-native";
import React, {useEffect} from "react";
import Colors from "../../constants/Colors.ts";
import {useLocalSearchParams} from "expo-router";

import {useNavigation} from "expo-router";
import PetInfo from "../../components/PetDetails/PetInfo";
import PetSubInfo from "../../components/PetDetails/PetSubInfo";
import AboutPet from "../../components/PetDetails/AboutPet";
import OwnerInfo from "../../components/PetDetails/OwnerInfo";

export default function PetDetails() {
  const pet = useLocalSearchParams();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "",
      // hide that “tabs” title:
      headerBackTitleVisible: false,
      // render our arrow as the back button:
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{marginLeft: 16}}
        >
          <Image
            source={require("../../assets/images/backArrow.png")}
            style={{width: 24, height: 24}}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <View>
      <ScrollView>
        <PetInfo pet={pet} />
        <PetSubInfo pet={pet} />
        <AboutPet pet={pet} />
        <OwnerInfo pet={pet} />
        <View style={{height: 70}}></View>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.adoptBtn}
          onPress={() => {
            /* adopt logic */
          }}
        >
          <Text style={styles.adoptBtnText}>Adopt Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    // alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  adoptBtn: {
    width: "100%",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 11,
    // paddingHorizontal: 40,
    alignItems: "center",
    borderRadius: 8,
  },
  adoptBtnText: {
    fontFamily: "outfit-medium",
    fontSize: 21,
    // textAlign: "center",
  },
});
