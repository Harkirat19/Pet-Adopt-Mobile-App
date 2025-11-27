import React, {useState, useEffect} from "react";
import {View, Text, TouchableOpacity, StyleSheet, Alert} from "react-native";
import Colors from "../../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useUser} from "@clerk/clerk-expo";
import {collection, query, where, getDocs, addDoc} from "firebase/firestore";
import {db} from "../../config/FirebaseConfig";

export default function RatingComponent({ownerEmail, petId, onRatingSubmitted}) {
  const {user} = useUser();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress;

  // Check if user has already rated this owner
  useEffect(() => {
    if (currentUserEmail && ownerEmail) {
      checkExistingRating();
    }
  }, [currentUserEmail, ownerEmail]);

  const checkExistingRating = async () => {
    try {
      const q = query(
        collection(db, "OwnerRatings"),
        where("ownerEmail", "==", ownerEmail),
        where("raterEmail", "==", currentUserEmail)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const ratingDoc = querySnapshot.docs[0].data();
        setHasRated(true);
        setExistingRating(ratingDoc.rating);
        setSelectedRating(ratingDoc.rating);
      }
    } catch (error) {
      console.error("Error checking existing rating:", error);
    }
  };

  const handleStarPress = (rating) => {
    if (hasRated) {
      Alert.alert("Already Rated", "You have already rated this pet owner.");
      return;
    }
    setSelectedRating(rating);
  };

  const handleStarHover = (rating) => {
    if (!hasRated) {
      setHoveredRating(rating);
    }
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitRating = async () => {
    if (hasRated) {
      Alert.alert("Already Rated", "You have already rated this pet owner.");
      return;
    }

    if (selectedRating === 0) {
      Alert.alert("Select Rating", "Please select at least one star to submit your rating.");
      return;
    }

    if (!currentUserEmail || !ownerEmail) {
      Alert.alert("Error", "Unable to submit rating. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Double-check if user has already rated
      const checkQuery = query(
        collection(db, "OwnerRatings"),
        where("ownerEmail", "==", ownerEmail),
        where("raterEmail", "==", currentUserEmail)
      );
      const checkSnapshot = await getDocs(checkQuery);

      if (!checkSnapshot.empty) {
        Alert.alert("Already Rated", "You have already rated this pet owner.");
        setIsSubmitting(false);
        return;
      }

      // Submit new rating
      await addDoc(collection(db, "OwnerRatings"), {
        ownerEmail: ownerEmail,
        raterEmail: currentUserEmail,
        rating: selectedRating,
        petId: petId || "",
        createdAt: new Date(),
      });

      setHasRated(true);
      setExistingRating(selectedRating);

      // Notify parent component to refresh average rating
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      Alert.alert("Success", "Thank you for your rating!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show rating component if user is the owner
  if (currentUserEmail === ownerEmail) {
    return null;
  }

  // If user has already rated, show their rating but don't allow changes
  if (hasRated) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Your Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= existingRating ? "star" : "star-outline"}
              size={24}
              color={star <= existingRating ? Colors.PRIMARY : Colors.GRAY}
              style={styles.star}
            />
          ))}
        </View>
        <Text style={styles.ratedText}>You have already rated this owner</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rate this Pet Owner:</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = star <= selectedRating;
          const isHovered = star <= hoveredRating && hoveredRating > selectedRating;
          const shouldHighlight = isSelected || isHovered;

          return (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              onPressIn={() => handleStarHover(star)}
              onPressOut={handleStarLeave}
              activeOpacity={0.7}
              style={styles.starButton}
            >
              <Ionicons
                name={shouldHighlight ? "star" : "star-outline"}
                size={28}
                color={shouldHighlight ? Colors.PRIMARY : Colors.GRAY}
                style={styles.star}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedRating > 0 && (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitRating}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  label: {
    fontFamily: "outfit-medium",
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  starButton: {
    marginRight: 5,
  },
  star: {
    marginRight: 2,
  },
  submitButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.GRAY,
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: "outfit-medium",
    color: Colors.WHITE,
    fontSize: 14,
  },
  ratedText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: Colors.GRAY,
    fontStyle: "italic",
    marginTop: 5,
  },
});
