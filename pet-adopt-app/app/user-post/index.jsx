import {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  Platform,
  Image,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import {useLocalSearchParams, useNavigation} from "expo-router";
import {useUser} from "@clerk/clerk-expo";
import {collection, where, doc, getDocs, query, deleteDoc, updateDoc} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";
import PetListItem from "@/components/Home/PetListItem";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import Colors from "@/constants/Colors";

export default function UserPost() {
  const navigation = useNavigation();
  const {user} = useUser();
  const [loader, setLoader] = useState(false);
  const [userPostList, setUserPostList] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    breed: "",
    age: "",
    sex: "",
    weight: "",
    address: "",
    about: "",
    imageUrl: "",
  });

  // Dropdown states
  const [gender, setGender] = useState(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    {label: "Male", value: "Male"},
    {label: "Female", value: "Female"},
  ]);

  const [category, setCategory] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: false,
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
    GetCategories();
  }, [navigation]);

  useEffect(() => {
    if (user) {
      GetUserPost();
    }
  }, [user]);

  // Get Categories from DB
  const GetCategories = async () => {
    const snapshot = await getDocs(collection(db, "Category"));
    const list = [];
    snapshot.forEach((doc) => {
      list.push({label: doc.data().name, value: doc.data().name});
    });
    setCategoryItems(list);
  };

  // Get User Posts
  const GetUserPost = async () => {
    setLoader(true);
    setUserPostList([]);
    const q = query(
      collection(db, "Pets"),
      where("email", "==", user?.primaryEmailAddress?.emailAddress)
    );
    const querySnapshot = await getDocs(q);
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    setUserPostList(posts);
    setLoader(false);
  };

  const OnDeletePost = (docId) => {
    Alert.alert("Delete Post?", "Do you really want to delete this post?", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Click"),
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => deletePost(docId),
      },
    ]);
  };

  const deletePost = async (docId) => {
    try {
      await deleteDoc(doc(db, "Pets", docId));
      GetUserPost(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "Failed to delete post");
    }
  };

  const OnEditPost = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || "",
      category: pet.category || "",
      breed: pet.breed || "",
      age: pet.age || "",
      sex: pet.sex || "",
      weight: pet.weight || "",
      address: pet.address || "",
      about: pet.about || "",
      imageUrl: pet.imageUrl || "",
    });

    // Set dropdown values
    setGender(pet.sex || null);
    setCategory(pet.category || null);

    setEditModalVisible(true);
  };

  const OnCancelEdit = () => {
    setEditModalVisible(false);
    setEditingPet(null);
    setFormData({
      name: "",
      category: "",
      breed: "",
      age: "",
      sex: "",
      weight: "",
      address: "",
      about: "",
      imageUrl: "",
    });
    setGender(null);
    setCategory(null);
  };

  const handleInputChange = (fieldName, fieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  const OnSaveEdit = async () => {
    const requiredFields = [
      "name",
      "category",
      "breed",
      "age",
      "sex",
      "weight",
      "address",
      "about",
      "imageUrl",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData?.[field] || formData[field].trim?.() === ""
    );

    if (missingFields.length > 0) {
      Alert.alert("Error", `Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setLoader(true);
      const petRef = doc(db, "Pets", editingPet.id);
      await updateDoc(petRef, {
        ...formData,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Pet updated successfully!");
      setEditModalVisible(false);
      setEditingPet(null);
      GetUserPost(); // Refresh the list
    } catch (error) {
      console.error("Error updating pet:", error);
      Alert.alert("Error", "Failed to update pet");
    } finally {
      setLoader(false);
    }
  };

  // Image Picker Function
  const imagePicker = async () => {
    // Request permissions
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const base64Img = "data:image/jpeg;base64," + result.assets[0].base64;
      handleInputChange("imageUrl", base64Img);
    }
  };

  const takePhoto = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const base64Img = "data:image/jpeg;base64," + result.assets[0].base64;
      handleInputChange("imageUrl", base64Img);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Posts</Text>

      <FlatList
        data={userPostList}
        numColumns={2}
        refreshing={loader}
        onRefresh={GetUserPost}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({item, index}) => (
          <View style={styles.petItemContainer}>
            <View style={styles.petImageContainer}>
              <PetListItem
                pet={item}
                key={index}
              />
            </View>

            {/* Edit and Delete Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={() => OnEditPost(item)}
                style={styles.editButton}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => OnDeletePost(item?.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Edit Pet Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={OnCancelEdit}
      >
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={OnCancelEdit}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Pet</Text>
              <TouchableOpacity
                onPress={OnSaveEdit}
                style={[styles.saveButton, loader && styles.saveButtonDisabled]}
                disabled={loader}
              >
                <Text style={styles.saveButtonText}>{loader ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 100}}
            >
              <Text style={styles.sectionHeader}>Edit Pet Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pet Photo *</Text>
                <View style={styles.imageButtonsContainer}>
                  <Pressable
                    onPress={imagePicker}
                    style={styles.imageButton}
                  >
                    {!formData.imageUrl ? (
                      <Image
                        source={require("../../assets/images/placeholder.png")}
                        style={styles.imagePlaceholder}
                      />
                    ) : (
                      <Image
                        source={{uri: formData.imageUrl}}
                        style={styles.imagePreview}
                      />
                    )}
                  </Pressable>
                  <View style={styles.imageActionButtons}>
                    <TouchableOpacity
                      style={styles.smallImageButton}
                      onPress={imagePicker}
                    >
                      <Text style={styles.smallImageButtonText}>Choose Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallImageButton}
                      onPress={takePhoto}
                    >
                      <Text style={styles.smallImageButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pet Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  placeholder="Enter pet name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category *</Text>
                <DropDownPicker
                  open={categoryOpen}
                  value={category}
                  items={categoryItems}
                  setOpen={setCategoryOpen}
                  setValue={(callback) => {
                    const value = callback(category);
                    setCategory(value);
                    handleInputChange("category", value);
                  }}
                  setItems={setCategoryItems}
                  placeholder="Select Category"
                  style={styles.input}
                  dropDownContainerStyle={{borderColor: "#ccc"}}
                  listMode="MODAL"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Breed *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.breed}
                  onChangeText={(value) => handleInputChange("breed", value)}
                  placeholder="Enter breed"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Age (in Years)*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.age}
                  onChangeText={(value) => handleInputChange("age", value)}
                  placeholder="Enter age"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender *</Text>
                <DropDownPicker
                  open={genderOpen}
                  value={gender}
                  items={genderItems}
                  setOpen={setGenderOpen}
                  setValue={(callback) => {
                    const value = callback(gender);
                    setGender(value);
                    handleInputChange("sex", value);
                  }}
                  setItems={setGenderItems}
                  placeholder="Select Gender"
                  style={styles.input}
                  dropDownContainerStyle={{borderColor: "#ccc"}}
                  listMode="MODAL"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Weight (in Kgs) *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.weight}
                  onChangeText={(value) => handleInputChange("weight", value)}
                  placeholder="Enter weight"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(value) => handleInputChange("address", value)}
                  placeholder="Enter address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>About *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.about}
                  onChangeText={(value) => handleInputChange("about", value)}
                  placeholder="Tell us about your pet..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loader && styles.submitButtonDisabled]}
                onPress={OnSaveEdit}
                disabled={loader}
              >
                <Text style={styles.submitButtonText}>{loader ? "Updating..." : "Update Pet"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontFamily: "outfit-medium",
    fontSize: 30,
    padding: 20,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  petItemContainer: {
    width: "49%",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImageContainer: {
    width: "117%",
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    fontFamily: "outfit-medium",
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },

  // Modal Style
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#f8f8f8",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "#007AFF",
  },
  modalTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#333",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    fontFamily: "outfit-medium",
    color: "white",
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    fontFamily: "outfit-medium",
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },

  // Form Style
  inputContainer: {
    marginVertical: 8,
    zIndex: 1, // for dropdowns
  },
  input: {
    padding: 12,
    backgroundColor: Colors.WHITE,
    borderRadius: 7,
    fontFamily: "outfit",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    marginVertical: 6,
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Image Styles
  imageButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  imageActionButtons: {
    flex: 1,
    gap: 8,
  },
  smallImageButton: {
    padding: 12,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 7,
    alignItems: "center",
  },
  smallImageButtonText: {
    fontFamily: "outfit-medium",
    color: Colors.WHITE,
    fontSize: 14,
  },
  submitButton: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 7,
    marginVertical: 20,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontFamily: "outfit-medium",
    color: Colors.WHITE,
    fontSize: 16,
  },
});
