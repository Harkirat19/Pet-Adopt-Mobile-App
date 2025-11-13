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
import {Ionicons} from "@expo/vector-icons";

export default function UserPost() {
  const navigation = useNavigation();
  const {user} = useUser();
  const [loader, setLoader] = useState(false);
  const [userPostList, setUserPostList] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Constants for image limits
  const MAX_IMAGES = 3;
  const IMAGE_QUALITY = 0.1;

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
    petImages: [],
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

    // Reconstruct petImages array from stored data
    const petImages = pet.petImages
      ? pet.petImages.map((uri, index) => ({
          id: `img_${index}`,
          uri: uri,
          isCover: index === (pet.coverImageIndex || 0),
        }))
      : [
          {
            id: "1",
            uri: pet.imageUrl,
            isCover: true,
          },
        ];

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
      petImages: petImages,
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
      petImages: [],
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

  // Multiple Image Picker for Edit
  const pickMultipleImages = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Check if adding more images would exceed the limit
    if (formData.petImages.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images Reached",
        `You can only upload up to ${MAX_IMAGES} photos. Please remove some images before adding new ones.`
      );
      return;
    }

    const remainingSlots = MAX_IMAGES - formData.petImages.length;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_QUALITY,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        id: Date.now() + Math.random(),
        uri: "data:image/jpeg;base64," + asset.base64,
        isCover: false,
      }));

      // Final check to ensure we don't exceed limit
      if (formData.petImages.length + newImages.length > MAX_IMAGES) {
        Alert.alert(
          "Too Many Images",
          `You can only upload ${MAX_IMAGES} photos total. You currently have ${formData.petImages.length} and tried to add ${newImages.length} more.`
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        petImages: [...prev.petImages, ...newImages],
      }));
    }
  };

  // Take Photo for Edit
  const takePhotoEdit = async () => {
    // Check image limit before taking photo
    if (formData.petImages.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images Reached",
        `You can only upload up to ${MAX_IMAGES} photos. Please remove some images before adding new ones.`
      );
      return;
    }

    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_QUALITY,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const newImage = {
        id: Date.now().toString(),
        uri: "data:image/jpeg;base64," + result.assets[0].base64,
        isCover: false,
      };

      setFormData((prev) => ({
        ...prev,
        petImages: [...prev.petImages, newImage],
      }));
    }
  };

  // Remove Image for Edit
  const removeImage = (imageId) => {
    const updatedImages = formData.petImages.filter((img) => img.id !== imageId);

    // If we're removing the cover image, set a new cover
    const removedImage = formData.petImages.find((img) => img.id === imageId);
    if (removedImage?.isCover && updatedImages.length > 0) {
      updatedImages[0].isCover = true;
      setFormData((prev) => ({
        ...prev,
        imageUrl: updatedImages[0].uri,
        petImages: updatedImages,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        petImages: updatedImages,
      }));
    }

    // If no images left, clear the imageUrl
    if (updatedImages.length === 0) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    }
  };

  // Set Cover Image for Edit
  const setCoverImage = (imageId) => {
    const updatedImages = formData.petImages.map((img) => ({
      ...img,
      isCover: img.id === imageId,
    }));

    const coverImage = updatedImages.find((img) => img.isCover);

    setFormData((prev) => ({
      ...prev,
      petImages: updatedImages,
      imageUrl: coverImage?.uri || prev.imageUrl,
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
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData?.[field] || formData[field].trim?.() === ""
    );

    if (missingFields.length > 0) {
      Alert.alert("Error", `Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!formData.petImages || formData.petImages.length === 0) {
      Alert.alert("Error", "Please add at least one photo of your pet");
      return;
    }

    // Final validation before submitting
    if (formData.petImages.length > MAX_IMAGES) {
      Alert.alert(
        "Too Many Images",
        `Please remove ${
          formData.petImages.length - MAX_IMAGES
        } image(s). Maximum ${MAX_IMAGES} photos allowed.`
      );
      return;
    }

    try {
      setLoader(true);

      // Convert to basic array of strings (URIs) and track cover index
      const imageUris = formData.petImages.map((img) => img.uri);
      const coverIndex = formData.petImages.findIndex((img) => img.isCover);

      const petRef = doc(db, "Pets", editingPet.id);
      await updateDoc(petRef, {
        ...formData,
        petImages: imageUris,
        coverImageIndex: coverIndex,
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

  const renderImageItem = ({item}) => (
    <View style={styles.imageItem}>
      <Image
        source={{uri: item.uri}}
        style={styles.thumbnail}
      />
      {item.isCover && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverText}>Cover</Text>
        </View>
      )}
      <View style={styles.imageActions}>
        <TouchableOpacity
          style={[styles.imageActionButton, styles.setCoverButton]}
          onPress={() => setCoverImage(item.id)}
          disabled={item.isCover}
        >
          <Ionicons
            name="star"
            size={16}
            color={item.isCover ? "#FFD700" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageActionButton, styles.removeButton]}
          onPress={() => removeImage(item.id)}
        >
          <Ionicons
            name="close"
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

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
              contentContainerStyle={styles.scrollViewContent}
            >
              <Text style={styles.sectionHeader}>Edit Pet Information</Text>

              {/* Multiple Photos Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pet Photos *</Text>
                <Text style={styles.photoNote}>
                  Maximum {MAX_IMAGES} photos • Tap star to set cover photo •
                  {formData.petImages.length > 0 &&
                    ` ${MAX_IMAGES - formData.petImages.length} slots remaining`}
                </Text>

                {/* Image Thumbnails Grid */}
                {formData.petImages.length > 0 && (
                  <FlatList
                    data={formData.petImages}
                    renderItem={renderImageItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesList}
                    contentContainerStyle={styles.imagesListContent}
                  />
                )}

                {/* Add Photo Buttons */}
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={pickMultipleImages}
                    disabled={formData.petImages.length >= MAX_IMAGES}
                  >
                    <Ionicons
                      name="images-outline"
                      size={24}
                      color={formData.petImages.length >= MAX_IMAGES ? "#ccc" : Colors.PRIMARY}
                    />
                    <Text
                      style={[
                        styles.imageButtonText,
                        formData.petImages.length >= MAX_IMAGES && styles.disabledButtonText,
                      ]}
                    >
                      Choose Photos
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={takePhotoEdit}
                    disabled={formData.petImages.length >= MAX_IMAGES}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={24}
                      color={formData.petImages.length >= MAX_IMAGES ? "#ccc" : Colors.PRIMARY}
                    />
                    <Text
                      style={[
                        styles.imageButtonText,
                        formData.petImages.length >= MAX_IMAGES && styles.disabledButtonText,
                      ]}
                    >
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rest of the form fields */}
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
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  listMode="MODAL"
                  zIndex={3000}
                  zIndexInverse={1000}
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
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  listMode="MODAL"
                  zIndex={2000}
                  zIndexInverse={2000}
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
  scrollViewContent: {
    paddingBottom: 100,
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
    zIndex: 1,
  },
  input: {
    padding: 12,
    backgroundColor: Colors.WHITE,
    borderRadius: 7,
    fontFamily: "outfit",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 7,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 7,
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

  // Multiple Image Styles
  photoNote: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  imagesList: {
    marginBottom: 16,
  },
  imagesListContent: {
    gap: 12,
  },
  imageItem: {
    position: "relative",
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.GRAY,
  },
  coverBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    color: "white",
    fontSize: 10,
    fontFamily: "outfit-medium",
  },
  imageActions: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    gap: 4,
  },
  imageActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  setCoverButton: {
    backgroundColor: "white",
  },
  removeButton: {
    backgroundColor: "#ff4d4d",
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderStyle: "dashed",
  },
  imageButtonText: {
    fontFamily: "outfit-medium",
    color: Colors.PRIMARY,
    fontSize: 14,
  },
  disabledButtonText: {
    color: "#ccc",
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
