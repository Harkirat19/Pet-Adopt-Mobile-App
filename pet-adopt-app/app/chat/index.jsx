import {useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import {useLocalSearchParams, useNavigation} from "expo-router";
import {useUser} from "@clerk/clerk-expo";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  getDoc,
  orderBy,
  query,
  deleteDoc,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import {db} from "../../config/FirebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const {user} = useUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [otherUserName, setOtherUserName] = useState("Chat");
  const [uploading, setUploading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const currentUserId = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: false,
      headerTitle: otherUserName,
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
  }, [navigation, otherUserName]);

  useEffect(() => {
    if (!params?.id || !user) return;

    const GetUserDetails = async () => {
      try {
        const docRef = doc(db, "Chat", params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return;

        const result = docSnap.data();
        const otherUser = result?.users?.find(
          (item) => item.email?.toLowerCase() !== currentUserId?.toLowerCase()
        );

        setOtherUserName(otherUser?.name || "Chat");
        navigation.setOptions({
          headerTitle: otherUser?.name || "Chat",
        });
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    GetUserDetails();

    const messagesQuery = query(
      collection(db, "Chat", params.id, "Messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }));
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [params.id, user, navigation, currentUserId]);

  const pickImage = async () => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to share photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        sendImageMessage(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to take photos!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        sendImageMessage(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const sendImageMessage = async (imageBase64) => {
    if (!user || !params.id || uploading) return;

    setUploading(true);
    try {
      // Check approximate size
      if (imageBase64.length > 500000) {
        alert("Image is too large. Please choose a smaller image or lower quality.");
        setUploading(false);
        return;
      }

      const newMessage = {
        type: "image",
        imageData: `data:image/jpeg;base64,${imageBase64}`,
        text: inputText.trim() || "Shared a photo",
        createdAt: new Date(),
        user: {
          _id: currentUserId,
          name: user.fullName,
        },
        status: "sent",
      };

      await addDoc(collection(db, "Chat", params.id, "Messages"), newMessage);
      setInputText("");
    } catch (error) {
      console.error("Error sending image message:", error);
      alert("Failed to send image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !params.id) return;

    try {
      const newMessage = {
        type: "text",
        text: inputText,
        createdAt: new Date(),
        user: {
          _id: currentUserId,
          name: user.fullName,
        },
        status: "sent",
      };

      await addDoc(collection(db, "Chat", params.id, "Messages"), newMessage);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const openFullScreenImage = (imageData) => {
    setFullScreenImage(imageData);
    setImageModalVisible(true);
  };

  const handleImagePress = (imageData, messageId, isCurrentUser) => {
    if (!isCurrentUser) {
      // For other user's images, always open full screen
      openFullScreenImage(imageData);
      return;
    }
  };

  const handleMessageLongPress = (messageId, isCurrentUser) => {
    if (!isCurrentUser) return; // Can only unsend your own messages

    clearTimeout(longPressTimer);
    setSelectedMessageId(messageId);
    setMessageMenuVisible(true);
  };

  const handleImagePressIn = (messageId, isCurrentUser) => {
    if (!isCurrentUser) return;

    // Start timer for long press
    const timer = setTimeout(() => {
      setSelectedMessageId(messageId);
      setMessageMenuVisible(true);
    }, 800); // 800ms for long press on images

    setLongPressTimer(timer);
  };

  const handleImagePressOut = () => {
    clearTimeout(longPressTimer);
  };

  const unsendMessage = async () => {
    if (!selectedMessageId || !params.id) return;

    Alert.alert("Unsend Message", "Are you sure you want to unsend this message?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Unsend",
        style: "destructive",
        onPress: async () => {
          try {
            // Delete the message completely
            await deleteDoc(doc(db, "Chat", params.id, "Messages", selectedMessageId));

            setMessageMenuVisible(false);
            setSelectedMessageId(null);
          } catch (error) {
            console.error("Error unsending message:", error);
            alert("Failed to unsend message. Please try again.");
          }
        },
      },
    ]);
  };

  const renderMessage = ({item}) => {
    const isCurrentUser = item.user?._id === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {!isCurrentUser && <Text style={styles.userName}>{item.user?.name}</Text>}

        {item.type === "image" ? (
          // Image message with separate tap and long press
          <TouchableOpacity
            style={[
              styles.imageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
            onPress={() => openFullScreenImage(item.imageData)}
            onLongPress={() => handleMessageLongPress(item.id, isCurrentUser)}
            delayLongPress={800}
            activeOpacity={0.7}
          >
            {uploading && isCurrentUser ? (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator
                  size="large"
                  color="#fff"
                />
                <Text style={styles.imageLoadingText}>Sending...</Text>
              </View>
            ) : (
              <>
                <Image
                  source={{uri: item.imageData}}
                  style={styles.messageImage}
                  resizeMode="cover"
                  onError={(error) => console.log("Error loading image:", error.nativeEvent.error)}
                />
                {item.text !== "Shared a photo" && (
                  <Text style={[styles.imageCaption, isCurrentUser && styles.currentUserCaption]}>
                    {item.text}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Text message
          <TouchableOpacity
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
            onLongPress={() => handleMessageLongPress(item.id, isCurrentUser)}
            delayLongPress={500}
            activeOpacity={1}
          >
            <Text style={[styles.messageText, isCurrentUser && styles.currentUserMessageText]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isCurrentUser && " • You"}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        inverted={false}
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons
              name="close"
              size={30}
              color="#fff"
            />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{uri: fullScreenImage}}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={messageMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setMessageMenuVisible(false);
          setSelectedMessageId(null);
        }}
      >
        <TouchableOpacity
          style={styles.messageMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setMessageMenuVisible(false);
            setSelectedMessageId(null);
          }}
        >
          <View style={styles.messageMenuContainer}>
            <TouchableOpacity
              style={[styles.messageMenuItem, styles.deleteMenuItem]}
              onPress={unsendMessage}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="#ff3b30"
              />
              <Text style={[styles.messageMenuText, styles.deleteMenuText]}>Unsend</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.messageMenuItem}
              onPress={() => {
                setMessageMenuVisible(false);
                setSelectedMessageId(null);
              }}
            >
              <Text style={styles.messageMenuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.inputContainer}>
        {/* Image Attachment Button */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons
            name="image-outline"
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>

        {/* Camera Button */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={takePhoto}
          disabled={uploading}
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          editable={!uploading}
        />

        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || uploading}
        >
          {uploading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
  },
  currentUserMessage: {
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
  },
  userName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    marginLeft: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  imageBubble: {
    borderRadius: 15,
    overflow: "hidden",
    maxWidth: "70%",
    marginVertical: 5,
  },
  currentUserBubble: {
    backgroundColor: "#007AFF",
  },
  otherUserBubble: {
    backgroundColor: "#E5E5EA",
  },
  messageText: {
    fontSize: 16,
  },
  currentUserMessageText: {
    color: "#fff",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 15,
  },
  imageLoadingContainer: {
    width: 200,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
  },
  imageLoadingText: {
    color: "#fff",
    marginTop: 10,
  },
  imageCaption: {
    padding: 8,
    fontSize: 14,
    color: "#000",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  currentUserCaption: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    marginHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  attachButton: {
    padding: 10,
    marginRight: 5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Full Screen Image Modal
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },

  messageMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageMenuContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "70%",
    maxWidth: 250,
    overflow: "hidden",
  },
  messageMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    justifyContent: "center",
  },
  deleteMenuItem: {
    borderTopWidth: 0,
  },
  messageMenuText: {
    fontSize: 18,
    color: "#333",
  },
  deleteMenuText: {
    color: "#ff3b30",
    fontWeight: "600",
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
});
