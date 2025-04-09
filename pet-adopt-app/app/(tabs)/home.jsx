// app/(tabs)/home.jsx
import React, {useState, useCallback} from "react";
import {ScrollView, RefreshControl, View} from "react-native";
import Header from "../../components/Home/Header.jsx";
import Slider from "../../components/Home/Slider.jsx"
import * as Updates from "expo-updates";
import PetListByCategory from "../../components/Home/PetListByCategory.jsx";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
      <Slider />
      <PetListByCategory/>

      <TouchableOpacity style={styles.addNewPetContainer}>
      <MaterialIcons name="pets" size={24} color="Colors.PRIMARY" />
      <Text Style={{ 
        fontFamily:'outfit-medium',
        color: Colors.PRIMARY,
        fontSize:18
      }}>Add New Pet</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  addNewPetContainer:{
  display:'flex',
  flexDirection: 'row',
  gap:10,
  alignItems: 'center',
  padding:20,
  marginTop:20,
  backgroundColor: Colors.LIGHT_PRIMARY,
  borderWidth:1,
  borderColor: Colors. PRIMARY,
  borderRadius: 15,
  borderStyle: 'dashed',
  justifyContent: 'center'
  }
})