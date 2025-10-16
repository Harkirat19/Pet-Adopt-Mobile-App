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
} from "react-native";
import {useLocalSearchParams, useNavigation} from "expo-router";
import {useUser} from "@clerk/clerk-expo";
import {collection, addDoc, doc, onSnapshot, getDoc, orderBy, query} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const {user} = useUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [otherUserName, setOtherUserName] = useState("Chat");

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
          (item) =>
            item.email?.toLowerCase() !== user?.primaryEmailAddress?.emailAddress?.toLowerCase()
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
  }, [params.id, user, navigation]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !params.id) return;

    try {
      const newMessage = {
        text: inputText,
        createdAt: new Date(),
        user: {
          _id: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
        },
      };

      await addDoc(collection(db, "Chat", params.id, "Messages"), newMessage);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({item}) => {
    const isCurrentUser = item.user?._id === user?.primaryEmailAddress?.emailAddress;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {!isCurrentUser && <Text style={styles.userName}>{item.user?.name}</Text>}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text style={[styles.messageText, isCurrentUser && styles.currentUserMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
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

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
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
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
