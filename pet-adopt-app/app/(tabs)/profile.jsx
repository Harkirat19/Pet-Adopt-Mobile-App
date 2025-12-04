import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, {useState} from "react";
import {useUser, useAuth} from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/constants/Colors";
import {useRouter} from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";

export default function Profile() {
  const {user, isLoaded} = useUser();
  const router = useRouter();
  const {signOut} = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [profileData, setProfileData] = useState(null);

  const Menu = [
    {
      id: 1,
      name: "Add New Pet",
      icon: "add-circle",
      path: "/add-new-pet",
    },
    {
      id: 5,
      name: "My Posts",
      icon: "bookmark",
      path: "/user-post",
    },
    {
      id: 2,
      name: "Favorites",
      icon: "heart",
      path: "/(tabs)/favorite",
    },
    {
      id: 3,
      name: "Inbox",
      icon: "chatbubble",
      path: "/(tabs)/inbox",
    },
    {
      id: 6,
      name: "Edit Profile",
      icon: "create-outline",
      path: "edit",
    },
    {
      id: 4,
      name: "Logout",
      icon: "exit",
      path: "logout",
    },
  ];

  // Load user profile data from Firestore
  const loadProfileData = async () => {
    if (!user || !isLoaded) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData(data);
        setNewDisplayName(data.userName || user.fullName || "");
      } else {
        const initialData = {
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          userName: user.fullName || "",
          userImage: user.imageUrl || "",
          googleProfilePicture: user.imageUrl || "",
          googleDisplayName: user.fullName || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, "users", user.id), initialData, {merge: true});
        setProfileData(initialData);
        setNewDisplayName(initialData.userName);
      }
    } catch (error) {
      console.log("Error loading profile data:", error);
    }
  };

  React.useEffect(() => {
    if (isLoaded && user) {
      loadProfileData();
    }
  }, [isLoaded, user]);

  // Helper function to update pets with new owner info
  const updatePetsWithNewOwnerInfo = async (newOwnerName, newOwnerImage, userId, userEmail) => {
    try {
      let petsUpdated = 0;
      let failedPets = [];

      // Try to find pets by multiple criteria
      const petsRef = collection(db, "Pets");

      // Get all possible queries
      const queries = [
        query(petsRef, where("userId", "==", userId)),
        query(petsRef, where("email", "==", userEmail)),
      ];

      const allPetDocs = new Map(); // Use Map to avoid duplicates

      // Execute all queries
      for (const q of queries) {
        try {
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            allPetDocs.set(doc.id, doc);
          });
        } catch (queryError) {
          console.log("Query error:", queryError);
        }
      }

      // Update each pet document individually with error handling
      for (const [petId, petDoc] of allPetDocs) {
        try {
          const petRef = doc(db, "Pets", petId);

          // Try to update just the specific fields
          await updateDoc(petRef, {
            userName: newOwnerName,
            userImage: newOwnerImage,
            updatedAt: new Date(),
          });

          petsUpdated++;
          console.log(`✓ Updated pet: ${petId}`);
        } catch (petError) {
          console.error(`✗ Error updating pet ${petId}:`, petError.message);
          failedPets.push({petId, error: petError.message});

          // If document is too large, we can't update it
          // The user will need to edit the pet manually to fix this
          if (
            petError.code === "failed-precondition" ||
            petError.message.includes("exceeds") ||
            petError.message.includes("size")
          ) {
            console.log(`  → Pet document ${petId} is too large to update automatically`);
          }
        }
      }

      // Summary
      if (petsUpdated > 0) {
        console.log(`✅ Successfully updated ${petsUpdated} pet(s)`);
      }

      if (failedPets.length > 0) {
        console.log(`⚠️  Failed to update ${failedPets.length} pet(s)`);
        // Store this info for potential user notification
        return {
          success: petsUpdated,
          failed: failedPets,
          total: allPetDocs.size,
        };
      }

      return {success: petsUpdated, failed: [], total: allPetDocs.size};
    } catch (error) {
      console.error("Error in updatePetsWithNewOwnerInfo:", error);
      return {success: 0, failed: [{petId: "unknown", error: error.message}], total: 0};
    }
  };

  // Helper function to update chats with new user info
  const updateChatsWithNewUserInfo = async (newUserName, newUserImage, userId, userEmail) => {
    try {
      const chatsRef = collection(db, "Chat");
      const querySnapshot = await getDocs(chatsRef);

      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        let updatedCount = 0;

        querySnapshot.forEach((chatDoc) => {
          const chatRef = doc(db, "Chat", chatDoc.id);
          const chatData = chatDoc.data();

          if (chatData.users && Array.isArray(chatData.users)) {
            let needsUpdate = false;
            const updatedUsers = chatData.users.map((userData) => {
              if (userData.email === userEmail) {
                needsUpdate = true;
                return {
                  ...userData,
                  name: newUserName,
                  imageUrl: newUserImage,
                };
              }
              return userData;
            });

            if (needsUpdate) {
              updatedCount++;
              batch.update(chatRef, {
                users: updatedUsers,
                updatedAt: new Date(),
              });
            }
          }
        });

        if (updatedCount > 0) {
          await batch.commit();
          console.log(`✅ Updated ${updatedCount} chat(s)`);
        } else {
          console.log("No chats found for this user");
        }
      }
    } catch (error) {
      console.error("Error updating chats:", error);
    }
  };

  // Update user profile in all relevant collections
  const updateUserProfileEverywhere = async (newUserName, newUserImage, userId, userEmail) => {
    try {
      console.log("🔄 Starting profile update across all collections...");

      // Update Pets collection
      const petResult = await updatePetsWithNewOwnerInfo(
        newUserName,
        newUserImage,
        userId,
        userEmail
      );

      // Update Chat collection
      await updateChatsWithNewUserInfo(newUserName, newUserImage, userId, userEmail);

      console.log("✅ Profile update completed");

      // Return summary for user feedback
      return {
        petsUpdated: petResult.success,
        petsFailed: petResult.failed.length,
        petsTotal: petResult.total,
      };
    } catch (error) {
      console.error("Error updating user profile everywhere:", error);
      return {
        petsUpdated: 0,
        petsFailed: 1,
        petsTotal: 0,
        error: error.message,
      };
    }
  };

  const onPressMenu = async (menu) => {
    if (menu.path == "logout") {
      signOut();
      return;
    }

    if (menu.path == "edit") {
      setEditModalVisible(true);
      return;
    }

    router.push(menu.path);
  };

  const pickProfilePicture = async () => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need camera roll permissions to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct syntax
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await updateProfilePicture(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error picking profile picture:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takeProfilePicture = async () => {
    try {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "We need camera permissions to take a profile picture.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct syntax
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await updateProfilePicture(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error taking profile picture:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const updateProfilePicture = async (imageBase64) => {
    if (!user || loading || !isLoaded) return;

    setLoading(true);
    try {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const userImage = `data:image/jpeg;base64,${imageBase64}`;
      const userName = profileData?.userName || user.fullName || "";

      // Update Firestore user document
      const userData = {
        userId: user.id,
        email: userEmail,
        userName: userName,
        userImage: userImage,
        googleProfilePicture: user.imageUrl || "",
        googleDisplayName: user.fullName || "",
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "users", user.id), userData, {merge: true});
      setProfileData(userData);

      // Update user profile in all related collections
      const updateResult = await updateUserProfileEverywhere(
        userName,
        userImage,
        user.id,
        userEmail
      );

      // Show appropriate message based on results
      if (updateResult.petsFailed > 0) {
        Alert.alert(
          "Partial Success",
          `Profile picture updated! However, ${updateResult.petsFailed} of your pet listings could not be updated because they're too large. You may need to edit those pets manually.`
        );
      } else if (updateResult.petsUpdated > 0) {
        Alert.alert(
          "Success",
          `Profile picture updated across all ${updateResult.petsUpdated} pet listings and chats!`
        );
      } else {
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveDisplayName = async () => {
    if (!user || !newDisplayName.trim() || !isLoaded) return;

    setLoading(true);
    try {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const userImage = profileData?.userImage || user.imageUrl || "";
      const userName = newDisplayName.trim();

      // Update Firestore user document
      const userData = {
        userId: user.id,
        email: userEmail,
        userName: userName,
        userImage: userImage,
        googleProfilePicture: user.imageUrl || "",
        googleDisplayName: user.fullName || "",
        updatedAt: new Date(),
      };

      await setDoc(doc(db, "users", user.id), userData, {merge: true});
      setProfileData(userData);

      // Update user profile in all related collections
      const updateResult = await updateUserProfileEverywhere(
        userName,
        userImage,
        user.id,
        userEmail
      );

      // Show appropriate message
      if (updateResult.petsFailed > 0) {
        Alert.alert(
          "Partial Success",
          `Display name updated! However, ${updateResult.petsFailed} of your pet listings could not be updated because they're too large. You may need to edit those pets manually.`
        );
      } else if (updateResult.petsUpdated > 0) {
        Alert.alert(
          "Success",
          `Display name updated across all ${updateResult.petsUpdated} pet listings and chats!`
        );
      } else {
        Alert.alert("Success", "Display name updated!");
      }

      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating display name:", error);
      Alert.alert("Error", "Failed to update display name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get profile picture - prioritize Firestore data, fallback to Clerk
  const getProfilePicture = () => {
    if (profileData?.userImage) return profileData.userImage;
    if (user?.imageUrl) return user.imageUrl;
    return "";
  };

  // Get display name - prioritize Firestore data, fallback to Clerk
  const getDisplayName = () => {
    if (profileData?.userName) return profileData.userName;
    if (user?.fullName) return user.fullName;
    return "";
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.PRIMARY}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={() => {
            Alert.alert("Change Profile Picture", "How would you like to change your picture?", [
              {text: "Cancel", style: "cancel"},
              {text: "Take Photo", onPress: takeProfilePicture},
              {text: "Choose from Gallery", onPress: pickProfilePicture},
            ]);
          }}
        >
          <Image
            source={{uri: getProfilePicture()}}
            style={styles.profileImage}
          />
          <View style={styles.editImageIcon}>
            <Ionicons
              name="camera"
              size={16}
              color="#fff"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{getDisplayName()}</Text>

        <TouchableOpacity
          style={styles.editNameButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={Colors.PRIMARY}
          />
          <Text style={styles.editNameText}>Edit name</Text>
        </TouchableOpacity>

        <Text style={styles.profileEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <FlatList
        data={Menu}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => onPressMenu(item)}
            style={styles.menuItem}
          >
            <Ionicons
              name={item.icon}
              size={30}
              color={Colors.PRIMARY}
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />

      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Display Name</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.nameInput}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              placeholder="Enter your display name"
              maxLength={50}
              editable={!loading}
            />

            <Text style={styles.modalNote}>
              This name will be shown throughout the app and in chats
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!newDisplayName.trim() || loading) && styles.saveButtonDisabled,
                ]}
                onPress={saveDisplayName}
                disabled={!newDisplayName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "outfit-medium",
    fontSize: 30,
  },
  profileHeader: {
    alignItems: "center",
    marginVertical: 25,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    marginTop: 6,
  },
  editNameButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderRadius: 20,
    gap: 6,
  },
  editNameText: {
    fontFamily: "outfit-medium",
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  profileEmail: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 8,
  },
  menuItem: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.WHITE,
    padding: 10,
    borderRadius: 10,
  },
  menuIcon: {
    padding: 10,
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderRadius: 10,
  },
  menuText: {
    fontFamily: "outfit",
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: "outfit",
    marginBottom: 10,
  },
  modalNote: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: Colors.GRAY,
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.LIGHT_PRIMARY,
  },
  saveButtonText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "#fff",
  },
});
