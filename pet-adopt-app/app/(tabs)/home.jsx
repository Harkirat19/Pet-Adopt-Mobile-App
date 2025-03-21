// app/(tabs)/home.jsx
import React, {useState, useCallback} from "react";
import {ScrollView, RefreshControl, View} from "react-native";
import Header from "../../components/Home/Header.jsx";
import * as Updates from "expo-updates";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Updates.reloadAsync();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{padding: 20, marginTop: 20}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Header />
      {/* Other components */}
    </ScrollView>
  );
}
