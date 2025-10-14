import { useState, useEffect } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { GiftedChat } from "react-native-gifted-chat";
import { collection, addDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import moment from "moment";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const GetUserDetails = async () => {
      const docRef = doc(db, "Chat", params?.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const result = docSnap.data();
      const otherUser = result?.users?.find(
        (item) =>
          item.email?.toLowerCase() !==
          user?.primaryEmailAddress?.emailAddress?.toLowerCase()
      );
      
      navigation.setOptions({
        headerTitle: otherUser?.name || "Chat", // safe optional chaining
      });
      
      
    };

    GetUserDetails();

    const unsubscribe = onSnapshot(
      collection(db, "Chat", params?.id, "Messages"),
      (snapshot) => {
        const messageData = snapshot.docs
          .map((doc) => ({
            _id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => b.createdAt - a.createdAt); // newest first
        setMessages(messageData);
      }
    );

    return () => unsubscribe();
  }, []);

  const onSend = async (newMessages = []) => {
    const message = {
      ...newMessages[0],
      createdAt: moment().valueOf(),
    };

    setMessages((previousMessages) => GiftedChat.append(previousMessages, message));

    await addDoc(collection(db, "Chat", params.id, "Messages"), message);
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={(msgs) => onSend(msgs)}
      showUserAvatar
      user={{
        _id: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        avatar: user?.imageUrl,
      }}
    />
  );
}
