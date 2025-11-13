import React, {useState} from "react";
import {View, Text, TouchableOpacity, FlatList, StyleSheet, Image} from "react-native";
import Colors from "../../constants/Colors";
import MarkFav from "../MarkFav";
import {Ionicons} from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {Share, Platform} from "react-native";

export default function PetInfo({pet, petImages = [], onImagePress}) {
  // Build images array
  const images =
    petImages && petImages.length > 0
      ? petImages
      : pet?.imageUrl
      ? [{id: "1", uri: pet.imageUrl, isCover: true}]
      : [];

  // Selected big image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const onShare = async () => {
    try {
      const url = Linking.createURL("/pet-details") + `?id=${pet?.id}`;

      await Share.share(
        Platform.select({
          ios: {message: url, url},
          android: {message: url},
        })
      );
    } catch (e) {
      console.log("Share error:", e);
    }
  };

  const renderImageThumbnail = ({item, index}) => (
    <TouchableOpacity
      onPress={() => setSelectedImageIndex(index)}
      style={[styles.thumbnailContainer, index === selectedImageIndex && styles.thumbnailSelected]}
    >
      <Image
        source={{uri: item.uri}}
        style={styles.thumbnail}
      />

      {item.isCover && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverText}>Cover</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      {/* BIG main image */}
      {images.length > 0 && (
        <View>
          <TouchableOpacity onPress={() => onImagePress(selectedImageIndex)}>
            <Image
              source={{uri: images[selectedImageIndex]?.uri}}
              style={styles.mainImage}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShare}
            style={styles.shareButton}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          {/* small indicator top-right */}
          {images.length > 1 && (
            <View style={styles.photosIndicator}>
              <Ionicons
                name="images"
                size={18}
                color="#fff"
              />
              <Text style={styles.photosIndicatorText}>
                {selectedImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* THUMBNAILS */}
      {images.length > 1 && (
        <View style={styles.thumbnailGallery}>
          <FlatList
            data={images}
            renderItem={renderImageThumbnail}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>
      )}

      {/* PET INFO HEADER */}
      <View style={styles.petHeader}>
        <View>
          <Text style={styles.petName}>{pet?.name}</Text>
          <Text style={styles.petAddress}>{pet?.address}</Text>
        </View>

        <MarkFav pet={pet} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    resizeMode: "cover",
  },
  photosIndicator: {
    marginTop: 25,
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  photosIndicatorText: {
    color: "#fff",
    fontFamily: "outfit-medium",
    fontSize: 13,
  },
  thumbnailGallery: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumbnailList: {
    alignItems: "center",
  },
  thumbnailContainer: {
    position: "relative",
    marginRight: 10,
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 10,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    resizeMode: "cover",
  },
  coverBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0, 122, 255, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    color: "white",
    fontSize: 10,
    fontFamily: "outfit-medium",
  },
  petHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  petName: {
    fontFamily: "outfit-bold",
    fontSize: 27,
    color: Colors.BLACK,
  },
  petAddress: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 4,
  },
  shareButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 10,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
});
