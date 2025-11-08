import {View, ScrollView, TouchableOpacity, StyleSheet, Image, Text, Share, Platform} from "react-native";
import React, {useEffect, useState, useCallback} from "react";
import Colors from "../../constants/Colors.ts";
import {useUser} from "@clerk/clerk-expo";
import {useRouter, useLocalSearchParams, useNavigation} from "expo-router";
import * as Linking from "expo-linking";
import Ionicons from "@expo/vector-icons/Ionicons";

// Firestore imports
import {db} from "../../config/FirebaseConfig";
import {collection, query, where, getDocs, setDoc, doc, getDoc} from "firebase/firestore";

// Components
import PetInfo from "../../components/PetDetails/PetInfo";
import PetSubInfo from "../../components/PetDetails/PetSubInfo";
import AboutPet from "../../components/PetDetails/AboutPet";
import OwnerInfo from "../../components/PetDetails/OwnerInfo";

export default function PetDetails() {
  const pet = useLocalSearchParams();
  const navigation = useNavigation();
  const {user} = useUser();
  const router = useRouter();
  const [loadedPet, setLoadedPet] = useState(null);

  const effectivePet = pet?.name ? pet : loadedPet;
  const petId = pet?.id || loadedPet?.id;

  // If opened via deep link with only id param, fetch the pet from Firestore
  useEffect(() => {
    const loadByIdIfNeeded = async () => {
      try {
        if (!pet?.name && pet?.id && !loadedPet) {
          const snap = await getDoc(doc(db, "Pets", pet.id));
          if (snap.exists()) {
            setLoadedPet(snap.data());
          }
        }
      } catch (e) {
        console.log("Error loading pet by id:", e);
      }
    };
    loadByIdIfNeeded();
  }, [pet?.id]);

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "",
      headerBackTitleVisible: false,
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
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            try {
              if (!petId) return;
              const url = Linking.createURL("/pet-details", {scheme: "myapp"}) + `?id=${petId}`;
              await Share.share(
                Platform.select({
                  ios: {message: url, url},
                  android: {message: url},
                  default: {message: url},
                })
              );
            } catch (e) {
              console.log("Error sharing link:", e);
            }
          }}
          style={{
            marginRight: 16,
            backgroundColor: Colors.PRIMARY,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="share-outline" size={18} color={"#fff"} style={{marginRight: 6}} />
          <Text style={{fontFamily: "outfit-medium", color: "#fff"}}>Share</Text>
        </TouchableOpacity>
      ),
    });
  }, [petId]);

  const InitiateChat = async () => {
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const petEmail = (effectivePet?.email); // actual owner email

      if (!userEmail || !petEmail) return;

      // Sort to ensure unique chat ID
      const [email1, email2] = [userEmail, petEmail].sort();
      const docId = `${email1}_${email2}`;

      const q = query(collection(db, "Chat"), where("id", "==", docId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length > 0) {
        router.push({pathname: "/chat", params: {id: docId}});
      } else {
        await setDoc(doc(db, "Chat", docId), {
          id: docId,
          users: [
            {email: userEmail, imageUrl: user?.imageUrl || "", name: user?.fullName || "You"},
            {email: petEmail, imageUrl: pet?.userImage || "", name: pet?.userName || "Owner"},
          ],
        });

        router.push({pathname: "/chat", params: {id: docId}});
      }
    } catch (error) {
      console.log("Error initiating chat:", error);
    }
  };

  // Loading state when deep-linked and data is not yet fetched
  if (!pet?.name && !effectivePet) {
    return (
      <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
        <Text style={{fontFamily: "outfit"}}>Loading pet...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView>
        <PetInfo pet={effectivePet || pet} />
        <PetSubInfo pet={effectivePet || pet} />
        <AboutPet pet={effectivePet || pet} />
        <OwnerInfo
          pet={effectivePet || pet}
          onSendPress={InitiateChat}
        />
        <View style={{height: 70}} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={InitiateChat}
          style={styles.adoptBtn}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  adoptBtn: {
    width: "100%",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 8,
  },
  adoptBtnText: {
    fontFamily: "outfit-medium",
    fontSize: 21,
  },
});
