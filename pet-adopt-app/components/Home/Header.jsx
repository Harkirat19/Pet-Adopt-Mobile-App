import {View, Text, Image} from "react-native";
import React, {useState, useEffect} from "react";
import {useUser} from "@clerk/clerk-expo";
import {doc, getDoc} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";

export default function Header() {
  const {isLoaded, user} = useUser();
  const [firestoreUser, setFirestoreUser] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            setFirestoreUser(userDoc.data());
          }
        } catch (error) {
          console.log("Error loading user data:", error);
        }
      }
    };

    if (isLoaded && user) {
      loadUserData();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View>
        <Text>Loading... Try Refreshing if it takes too long :)</Text>
      </View>
    );
  }

  // Use Firestore data if available, fallback to Clerk data
  const displayName = firestoreUser?.userName || user.fullName || "User";
  const profileImage = firestoreUser?.userImage || user.imageUrl;

  return (
    <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
      <View>
        <Text style={{fontFamily: "outfit", fontSize: 18}}>Welcome,</Text>
        <Text style={{fontFamily: "outfit-medium", fontSize: 25}}>{displayName}</Text>
      </View>
      {profileImage && (
        <Image
          source={{uri: profileImage}}
          style={{width: 40, height: 40, borderRadius: 99}}
        />
      )}
    </View>
  );
}
