import { View, Text, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import OwnerInfo from '../../components/PetDetails/OwnerInfo';

export default function PetDetails() {
    const pet=useLocalSearchParams();
    const navigation=useNavigation();

    useEffect(()=>{
        navigation.setOptions({
            headerTransparent:true,
            headerTitle:''
        })
    },[])

    return (
        <View>
            <ScrollView>
            <PetInfo pet={pet} />
            <PetSubInfo pet={pet} />
            <AboutPet pet ={pet}/>
            <OwnerInfo pet={pet} />
            <View style={{height:70}}>
            
            </View>
            </ScrollView>
            <View style={styles?.bottomContainer}>
            <TouchableOpacity>
                <Text style={{
                    textAlign:'center',
                    fontFamily:'outfit-medium',
                    fontSize:20
                }}>Adopt Me</Text>
            </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StylesSheet.create({
    adoptBtn:{
        padding:15,
        backgroundColor:Colors.PRIMARY
    },
    bottomContainer:{
        position:'absolute',
        width:'100%',
        bottom:0
    }
})