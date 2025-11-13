import {View, Text, FlatList, StyleSheet} from "react-native";
import React, {useState, useEffect} from "react";
import {query, collection, where, getDocs} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";
import {useUser} from "@clerk/clerk-expo";
import UserItem from "../../components/Inbox/UserItem";

export default function Inbox() {
  const {user} = useUser();
  const [userList, setUserList] = useState([]);
  const [loader, setLoader] = useState(false);
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (user) {
      GetUserList();
    }
  }, [user]);

  const GetUserList = async () => {
    setLoader(true);
    setUserList([]);

    try {
      const querySnapshot = await getDocs(collection(db, "Chat"));
      const chats = [];

      querySnapshot.forEach((doc) => {
        const chatData = doc.data();

        // Check if current user is part of the chat
        const isUserInChat = chatData.users?.some(
          (userObj) => userObj.email?.toLowerCase() === currentUserEmail?.toLowerCase()
        );

        if (isUserInChat) {
          chats.push({
            id: doc.id,
            ...chatData,
          });
        }
      });

      setUserList(chats);
    } catch (error) {
      console.error("Error fetching user list:", error);
    } finally {
      setLoader(false);
    }
  };

  const getOtherUserList = () => {
    const list = [];
    userList.forEach((chat) => {
      const otherUser = chat.users?.find(
        (userObj) => userObj.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
      );

      if (otherUser) {
        const result = {
          docId: chat.id,
          ...otherUser,
          chatUsers: chat.users, // Include all users in the chat
        };
        list.push(result);
      }
    });
    return list;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbox</Text>

      <FlatList
        data={getOtherUserList()}
        refreshing={loader}
        onRefresh={GetUserList}
        style={styles.list}
        renderItem={({item}) => <UserItem userInfo={item} />}
        keyExtractor={(item) => item.docId}
        ListEmptyComponent={
          !loader && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubText}>Start a chat from a pet profile</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontFamily: "outfit-medium",
    fontSize: 30,
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
