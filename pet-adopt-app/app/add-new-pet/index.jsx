import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import React, {useEffect, useState} from "react";
import {useNavigation} from "expo-router";
import Colors from "@/constants/Colors";
import DropDownPicker from "react-native-dropdown-picker";
import {StyleSheet, TextInput} from "react-native";
import {collection, addDoc, getDocs, doc, setDoc} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";
import * as ImagePicker from "expo-image-picker";
import {useUser} from "@clerk/clerk-expo";
import {Ionicons} from "@expo/vector-icons";

export default function AddNewPet() {
  const {user} = useUser();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({});
  const [gender, setGender] = useState(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    {label: "Male", value: "Male"},
    {label: "Female", value: "Female"},
  ]);
  const [category, setCategory] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [petImages, setPetImages] = useState([]);
  const [loader, setLoader] = useState(false);

  // Constants for image limits
  const MAX_IMAGES = 3;
  const IMAGE_QUALITY = 0.1;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Add New Pet",
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
  }, []);

  const GetCategories = async () => {
    const snapshot = await getDocs(collection(db, "Category"));
    const list = [];
    snapshot.forEach((doc) => {
      list.push({label: doc.data().name, value: doc.data().name});
    });
    setCategoryItems(list);
  };

  const handleInputChange = (fieldName, fieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
  };

  // Multiple Image Picker
  const pickMultipleImages = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Check if adding more images would exceed the limit
    if (petImages.length >= MAX_IMAGES) {
      Alert.alert(
        "Maximum Images Reached",
        `You can only upload up to ${MAX_IMAGES} photos. Please remove some images before adding new ones.`
      );
      return;
    }

    const remainingSlots = MAX_IMAGES - petImages.length;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: IMAGE_QUALITY,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots, // Only allow remaining slots
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        id: Date.now() + Math.random(),
        uri: "data:image/jpeg;base64," + asset.base64,
        isCover: petImages.length === 0, // First image becomes cover if no images exist
      }));

      // Final check to ensure we don't exceed limit
      if (petImages.length + newImages.length > MAX_IMAGES) {
        Alert.alert(
          "Too Many Images",
          `You can only upload ${MAX_IMAGES} photos total. You currently have ${petImages.length} and tried to add ${newImages.length} more.`
        );
        return;
      }

      setPetImages((prev) => [...prev, ...newImages]);

      // Set the first image as cover image URL for backward compatibility
      if (petImages.length === 0 && newImages.length > 0) {
        handleInputChange("imageUrl", newImages[0].uri);
      }
    }
  };

  // Take Photo with Camera
  const takePhoto = async () => {
    // Check image limit before taking photo
    if (petImages.length >= MAX_IMAGES) {
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
        isCover: petImages.length === 0,
      };

      setPetImages((prev) => [...prev, newImage]);

      if (petImages.length === 0) {
        handleInputChange("imageUrl", newImage.uri);
      }
    }
  };

  // Remove Image
  const removeImage = (imageId) => {
    const updatedImages = petImages.filter((img) => img.id !== imageId);

    // If removing the cover image, set a new cover
    const removedImage = petImages.find((img) => img.id === imageId);
    if (removedImage?.isCover && updatedImages.length > 0) {
      updatedImages[0].isCover = true;
      handleInputChange("imageUrl", updatedImages[0].uri);
    }

    setPetImages(updatedImages);

    // If no images left, clear the imageUrl
    if (updatedImages.length === 0) {
      handleInputChange("imageUrl", "");
    }
  };

  // Set Cover Image
  const setCoverImage = (imageId) => {
    const updatedImages = petImages.map((img) => ({
      ...img,
      isCover: img.id === imageId,
    }));

    setPetImages(updatedImages);

    // Update the main imageUrl with the cover image
    const coverImage = updatedImages.find((img) => img.isCover);
    if (coverImage) {
      handleInputChange("imageUrl", coverImage.uri);
    }
  };

  const onSubmit = async () => {
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

    if (petImages.length === 0) {
      Alert.alert("Error", "Please add at least one photo of your pet");
      return;
    }

    // Final validation before submitting
    if (petImages.length > MAX_IMAGES) {
      Alert.alert(
        "Too Many Images",
        `Please remove ${
          petImages.length - MAX_IMAGES
        } image(s). Maximum ${MAX_IMAGES} photos allowed.`
      );
      return;
    }

    setLoader(true);
    SaveFormData()
      .then(() => {
        Alert.alert("Success", "Pet saved successfully!");
        navigation.goBack();
      })
      .catch((err) => {
        console.error("Error saving form data:", err);
        Alert.alert("Error", "Failed to save pet. Please try again.");
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const SaveFormData = async () => {
    const docId = Date.now().toString();

    // Convert to basic array of strings (URIs) and track cover index
    const imageUris = petImages.map((img) => img.uri);
    const coverIndex = petImages.findIndex((img) => img.isCover);

    await setDoc(doc(db, "Pets", docId), {
      ...formData,
      imageUrl: formData.imageUrl,
      petImages: imageUris, // Just store array of URIs
      coverImageIndex: coverIndex, // Store which image is cover
      userName: user?.fullName,
      email: user?.primaryEmailAddress?.emailAddress,
      userImage: user?.imageUrl,
      id: docId,
      createdAt: new Date(),
    });
  };

  const renderImageItem = ({item, index}) => (
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
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.pageTitle}>Add New Pet for adoption</Text>

        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Pet Photos *</Text>
          <Text style={styles.photoNote}>
            Maximum {MAX_IMAGES} photos • First photo will be cover •
            {petImages.length > 0 && ` ${MAX_IMAGES - petImages.length} slots remaining`}
          </Text>

          {petImages.length > 0 && (
            <FlatList
              data={petImages}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesList}
              contentContainerStyle={styles.imagesListContent}
            />
          )}

          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickMultipleImages}
              disabled={petImages.length >= MAX_IMAGES}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={petImages.length >= MAX_IMAGES ? "#ccc" : Colors.PRIMARY}
              />
              <Text
                style={[
                  styles.imageButtonText,
                  petImages.length >= MAX_IMAGES && styles.disabledButtonText,
                ]}
              >
                Choose Photos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={petImages.length >= MAX_IMAGES}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={petImages.length >= MAX_IMAGES ? "#ccc" : Colors.PRIMARY}
              />
              <Text
                style={[
                  styles.imageButtonText,
                  petImages.length >= MAX_IMAGES && styles.disabledButtonText,
                ]}
              >
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rest of your form fields remain the same */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pet Name *</Text>
          <TextInput
            style={styles.input}
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
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Breed *</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => handleInputChange("breed", value)}
            placeholder="Enter breed"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age (in Years)*</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
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
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weight (in Kgs) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(value) => handleInputChange("weight", value)}
            placeholder="Enter weight"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => handleInputChange("address", value)}
            placeholder="Enter address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>About *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            numberOfLines={5}
            multiline={true}
            onChangeText={(value) => handleInputChange("about", value)}
            placeholder="Tell us about your pet..."
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loader && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loader}
        >
          <Text style={styles.buttonText}>{loader ? "Saving..." : "Submit"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontFamily: "outfit-medium",
    fontSize: 20,
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: "outfit-medium",
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    marginVertical: 6,
    fontFamily: "outfit-medium",
    fontSize: 16,
    color: "#333",
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 7,
    marginVertical: 20,
    marginBottom: 55,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    fontFamily: "outfit-medium",
    textAlign: "center",
    color: Colors.WHITE,
  },
});
