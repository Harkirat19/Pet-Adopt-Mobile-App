import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import React, { useEffect } from "react";
import Colors from "../../constants/Colors.ts";
import { useUser } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";

// Firestore imports
import { db } from "../../config/FirebaseConfig";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";

// Components
import PetInfo from "../../components/PetDetails/PetInfo";
import PetSubInfo from "../../components/PetDetails/PetSubInfo";
import AboutPet from "../../components/PetDetails/AboutPet";
import OwnerInfo from "../../components/PetDetails/OwnerInfo";

export default function PetDetails() {
  const pet = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
          <Image
            source={require("../../assets/images/backArrow.png")}
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  const InitiateChat = async () => {
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const petEmail = pet?.email;  // actual owner email
  
      if (!userEmail || !petEmail) return;
  
      // Sort to ensure unique chat ID
      const [email1, email2] = [userEmail, petEmail].sort();
      const docId = `${email1}_${email2}`;
  
      const q = query(collection(db, 'Chat'), where('id', '==', docId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.docs.length > 0) {
        router.push({ pathname: '/chat', params: { id: docId } });
      } else {
        await setDoc(doc(db, 'Chat', docId), {
          id: docId,
          users: [
            { email: userEmail, imageUrl: user?.imageUrl || '', name: user?.fullName || 'You' },
            { email: petEmail, imageUrl: pet?.userImage || '', name: pet?.userName || 'Owner' }
          ]
        });
  
        router.push({ pathname: '/chat', params: { id: docId } });
      }
    } catch (error) {
      console.log("Error initiating chat:", error);
    }
  };
  

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <PetInfo pet={pet} />
        <PetSubInfo pet={pet} />
        <AboutPet pet={pet} />
        <OwnerInfo pet={pet} />
        <View style={{ height: 70 }} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={InitiateChat} style={styles.adoptBtn}>
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
