import React, {useState, useEffect} from "react";
import {View, Text, StyleSheet, Image, TouchableOpacity} from "react-native";
import Colors from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import {collection, query, where, getDocs} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";
import RatingComponent from "./RatingComponent";

export default function OwnerInfo({pet, onSendPress}) {
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [isLoadingRating, setIsLoadingRating] = useState(false);

  const ownerEmail = pet?.email;

  useEffect(() => {
    if (ownerEmail) {
      fetchOwnerRatings();
    }
  }, [ownerEmail]);

  const fetchOwnerRatings = async () => {
    if (!ownerEmail) return;

    setIsLoadingRating(true);
    try {
      const q = query(collection(db, "OwnerRatings"), where("ownerEmail", "==", ownerEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let totalRating = 0;
        let count = 0;

        querySnapshot.forEach((doc) => {
          const ratingData = doc.data();
          if (ratingData.rating && ratingData.rating >= 1 && ratingData.rating <= 5) {
            totalRating += ratingData.rating;
            count++;
          }
        });

        if (count > 0) {
          const avg = totalRating / count;
          setAverageRating(parseFloat(avg.toFixed(1)));
          setRatingCount(count);
        } else {
          setAverageRating(0);
          setRatingCount(0);
        }
      } else {
        setAverageRating(0);
        setRatingCount(0);
      }
    } catch (error) {
      console.error("Error fetching owner ratings:", error);
      setAverageRating(0);
      setRatingCount(0);
    } finally {
      setIsLoadingRating(false);
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh ratings after new rating is submitted
    fetchOwnerRatings();
  };

  return (
    <View style={styles.container}>
      <View style={styles.ownerSection}>
        <View style={styles.row}>
          <Image
            source={{uri: pet?.userImage}}
            style={{
              width: 50,
              height: 50,
              borderRadius: 99,
            }}
          />
          <View style={styles.ownerInfo}>
            <Text style={styles.userName}>{pet?.userName}</Text>
            <Text style={styles.userRole}>Pet Owner</Text>
            
            {/* Average Rating Display */}
            {averageRating > 0 && (
              <View style={styles.ratingDisplay}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                      size={14}
                      color={star <= Math.round(averageRating) ? Colors.PRIMARY : Colors.GRAY}
                      style={styles.ratingStar}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
                </Text>
              </View>
            )}
            {averageRating === 0 && !isLoadingRating && (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={onSendPress}
          style={styles.sendButton}
        >
          <Ionicons
            name="send-sharp"
            size={24}
            color={Colors.PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {/* Rating Component */}
      {ownerEmail && (
        <RatingComponent
          ownerEmail={ownerEmail}
          petId={pet?.id}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.WHITE,
  },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    flex: 1,
  },
  ownerInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: "outfit-medium",
    fontSize: 17,
  },
  userRole: {
    fontFamily: "outfit",
    color: Colors.GRAY,
    fontSize: 14,
    marginTop: 2,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingStar: {
    marginRight: 1,
  },
  ratingText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
  },
  noRatingText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    fontStyle: "italic",
    marginTop: 4,
  },
  sendButton: {
    padding: 8,
    borderRadius: 8,
  },
});
