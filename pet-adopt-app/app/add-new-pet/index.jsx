import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
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
  const [categoryItems, setCategoryItems] = useState([]); // populated from DB
  const [image, setImage] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Add New Pet",
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
    GetCategories();
  }, []);

  // Used to Get Category List from DB
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
      "imageUrl",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData?.[field] || formData[field].trim?.() === ""
    );

    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    SaveFormData(formData.imageUrl) //pass base64 image
      .then(() => {
        alert("Pet saved successfully!");
        navigation.goBack();
      })
      .catch((err) => {
        console.error("Error saving form data:", err);
        alert("Something went wrong.");
      });
  };

  const SaveFormData = async (imageUrl) => {
    const docId = Date.now().toString();

    await setDoc(doc(db, "Pets", docId), {
      ...formData,
      imageUrl: imageUrl,
      userName: user?.fullName,
      email: user?.primaryEmailAddress?.emailAddress,
      userImage: user?.imageUrl,
      id: docId,
      createdAt: new Date(),
    });
  };

  // Used to pick image from device
  const imagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      const base64Img = "data:image/jpeg;base64," + result.assets[0].base64;
      setImage(base64Img);
      handleInputChange("imageUrl", base64Img);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // adjusts differently on iOS vs Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // optional offset for header
    >
      <ScrollView
        style={{
          padding: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "outfit-medium",
            fontSize: 20,
          }}
        >
          Add New Pet for adoption
        </Text>

        <Pressable onPress={imagePicker}>
          {!image ? (
            <Image
              source={require("../../assets/images/placeholder.png")}
              style={{
                width: 100,
                height: 100,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: Colors.GRAY,
              }}
            />
          ) : (
            <Image
              source={{uri: image}}
              style={{
                width: 100,
                height: 100,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: Colors.GRAY,
              }}
            />
          )}
        </Pressable>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pet Name *</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => handleInputChange("name", value)}
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
            onChangeText={(value) => handleInputChange("breed", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age (in Years)*</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(value) => handleInputChange("age", value)}
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
            onChangeText={(value) => handleInputChange("weight", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => handleInputChange("address", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>About *</Text>
          <TextInput
            style={styles.input}
            numberOfLines={5}
            multiline={true}
            onChangeText={(value) => handleInputChange("about", value)}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onSubmit}
        >
          <Text style={{fontFamily: "outfit-medium", textAlign: "center"}}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 5,
  },
  input: {
    padding: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 7,
    fontFamily: "outfit",
  },
  label: {
    marginVertical: 5,
    fontFamily: "outfit",
  },
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 7,
    marginVertical: 10,
    marginBottom: 55,
  },
});
