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
} from "react-native";
import {useLocalSearchParams, useNavigation} from "expo-router";
import {Pressable} from "react-native";
import {useUser} from "@clerk/clerk-expo";
import {
  collection,
  where,
  addDoc,
  doc,
  onSnapshot,
  getDocs,
  orderBy,
  query,
  deleteDoc,
} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";
import PetListItem from "@/components/Home/PetListItem";

export default function UserPost() {
  const navigation = useNavigation();
  const {user} = useUser();
  const [loader, setLoader] = useState(false);
  const [userPostList, setUserPostList] = useState([]);

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: false,
      headerTitle: "User Posts",
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
  }, [navigation]);

  useEffect(() => {
    if (user) {
      GetUserPost();
    }
  }, [user]);

  // Get User Posts
  const GetUserPost = async () => {
    setLoader(true);
    setUserPostList([]);
    const q = query(
      collection(db, "Pets"),
      where("email", "==", user?.primaryEmailAddress?.emailAddress)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      setUserPostList((prev) => [...prev, doc.data()]);
    });
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

  return (
    <View>
      <Text
        style={{
          fontFamily: "outfit-medium",
          fontSize: 30,
          padding: 20,
        }}
      >
        UserPost
      </Text>

      <FlatList
        data={userPostList}
        numColumns={2}
        refreshing={loader}
        onRefresh={GetUserPost}
        renderItem={({item, index}) => (
          <View style={{marginLeft: 10}}>
            <PetListItem
              pet={item}
              key={index}
            />
            <Pressable
              onPress={() => OnDeletePost(item?.id)}
              style={styles.deleteButton}
            >
              <Text
                style={{
                  fontFamily: "outfit-medium",
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    backgroundColor: "#ff4d4d",
    padding: 5,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
    width: 170,
  },
});
