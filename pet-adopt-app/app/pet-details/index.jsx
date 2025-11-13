import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
  FlatList,
  Share,
  Platform,
  Modal,
} from "react-native";
import React, {useEffect, useState} from "react";
import Colors from "../../constants/Colors";
import {useUser} from "@clerk/clerk-expo";
import {useRouter, useLocalSearchParams, useNavigation} from "expo-router";
import * as Linking from "expo-linking";
import Ionicons from "@expo/vector-icons/Ionicons";

import {db} from "../../config/FirebaseConfig";
import {collection, query, where, getDocs, setDoc, doc, getDoc} from "firebase/firestore";

import PetInfo from "../../components/PetDetails/PetInfo";
import PetSubInfo from "../../components/PetDetails/PetSubInfo";
import AboutPet from "../../components/PetDetails/AboutPet";
import OwnerInfo from "../../components/PetDetails/OwnerInfo";

export default function PetDetails() {
  const pet = useLocalSearchParams();
  const navigation = useNavigation();
  const {user} = useUser();
  const router = useRouter();

  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [loadedPet, setLoadedPet] = useState(null);

  const effectivePet = pet?.name ? pet : loadedPet;
  const petId = pet?.id || loadedPet?.id;

  // Build image array
  const getPetImages = () => {
    if (!effectivePet) return [];

    if (effectivePet.petImages && Array.isArray(effectivePet.petImages)) {
      return effectivePet.petImages.map((uri, index) => ({
        id: `img_${index}`,
        uri,
        isCover: index === (effectivePet.coverImageIndex || 0),
      }));
    }

    if (effectivePet.imageUrl) {
      return [{id: "1", uri: effectivePet.imageUrl, isCover: true}];
    }

    return [];
  };

  const petImages = getPetImages();

  // If opened with only ?id= fetch full document
  useEffect(() => {
    const loadById = async () => {
      try {
        if (!pet?.name && pet?.id && !loadedPet) {
          const snap = await getDoc(doc(db, "Pets", pet.id));
          if (snap.exists()) setLoadedPet(snap.data());
        }
      } catch (e) {
        console.log("Error loading pet:", e);
      }
    };
    loadById();
  }, [pet?.id]);

  // Header config
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
    });
  }, [petId]);

  const InitiateChat = async () => {
    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const petEmail = effectivePet?.email;

      if (!userEmail || !petEmail) return;

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
        <PetInfo
          pet={effectivePet}
          petImages={petImages}
          onImagePress={(index) => {
            setViewerIndex(index);
            setShowViewer(true);
          }}
        />

        <PetSubInfo pet={effectivePet || pet} />
        <AboutPet pet={effectivePet || pet} />

        <OwnerInfo
          pet={effectivePet || pet}
          onSendPress={InitiateChat}
        />

        <View style={{height: 70}} />
      </ScrollView>

      {/* FULLSCREEN IMAGE VIEWER (Modal so touches always work) */}
      <Modal
        visible={showViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewer(false)}
      >
        <View style={styles.modalBackdrop}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowViewer(false)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close"
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Main image */}
          <Image
            source={{uri: petImages[viewerIndex]?.uri}}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />

          {/* Thumbnails */}
          {petImages.length > 1 && (
            <View style={styles.modalThumbRow}>
              <FlatList
                horizontal
                data={petImages}
                keyExtractor={(img) => img.id}
                renderItem={({item, index}) => (
                  <TouchableOpacity onPress={() => setViewerIndex(index)}>
                    <Image
                      source={{uri: item.uri}}
                      style={[styles.modalThumb, index === viewerIndex && styles.modalThumbActive]}
                    />
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* ADOPT BUTTON */}
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
    backgroundColor: "transparent",
  },
  adoptBtn: {
    width: "100%",
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 12,
  },
  adoptBtnText: {
    fontFamily: "outfit-medium",
    fontSize: 18,
    color: "#fff",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 2,
  },

  fullscreenImage: {
    width: "100%",
    height: "75%",
  },

  modalThumbRow: {
    position: "absolute",
    bottom: 30,
    paddingHorizontal: 10,
  },

  modalThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    opacity: 0.6,
  },

  modalThumbActive: {
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    opacity: 1,
  },
});
