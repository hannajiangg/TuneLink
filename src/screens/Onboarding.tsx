// src/screens/Onboarding.tsx

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Button } from "react-native-paper";
import { ScrollView } from "react-native-gesture-handler";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootStackParamList";

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;
type OnboardingScreenRouteProp = RouteProp<RootStackParamList, "Onboarding">;

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

// Interface for props
interface Props {
  navigation: OnboardingScreenNavigationProp;
  route: OnboardingScreenRouteProp;
}

// Onboard screen
const OnboardingScreen: React.FC<Props> = ({ navigation, route }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const userId = route.params.userId;

  const genres = [
    "Pop",
    "Rock",
    "R&B",
    "Hip-hop",
    "EDM",
    "Classical",
    "Jazz",
    "Country",
    "Blues",
    "Reggae",
    "Metal",
    "Folk",
    "Soul",
    "Techno",
    "Disco",
  ];

  // Function to pick and unpick genres and change ui
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((item) => item !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Function to handle next
  const handleContinue = async () => {
    try {
      const updateUserData = {
        genres: JSON.stringify(selectedGenres),
      };

      const response = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateUserData),
        }
      );

      console.log(JSON.stringify(updateUserData));
      console.log(response);
      if (response.ok) {
        navigation.navigate("Feed", { userId });
      } else {
        console.error("Server error:", response.statusText);
      }
    } catch (error) {
      console.error("Network request failed:", error);
    }
  };

  // Function to handle selecting genre
  const isSelected = (genre: string) => selectedGenres.includes(genre);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Green Light Glow Effect */}
      <View style={styles.greenGlow} />

      <Text style={styles.title}>Select Your Favorite Music Genres</Text>
      <Text style={styles.subtitle}>Select all that apply</Text>

      <View style={styles.genreContainer}>
        {genres.map((genre, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.genreButton,
              isSelected(genre) && styles.genreButtonSelected,
            ]}
            onPress={() => toggleGenre(genre)}
          >
            <Text
              style={[
                styles.genreButtonText,
                isSelected(genre) && styles.genreButtonTextSelected,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleContinue}
        style={styles.continueButton}
      >
        Continue
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#000000",
  },
  greenGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    backgroundColor: "rgba(168, 235, 18, 0.2)",
    borderRadius: 150,
    top: -100,
    left: -100,
    opacity: 0.7,
    shadowColor: "#A8EB12",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    color: "white",
    marginBottom: 20,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#A8EB12",
    marginBottom: 20,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  genreButton: {
    backgroundColor: "#4D4D4D",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    marginRight: 10,
    flexGrow: 1,
    alignItems: "center",
  },
  genreButtonSelected: {
    backgroundColor: "#A8EB12",
  },
  genreButtonText: {
    color: "#FFFFFF",
  },
  genreButtonTextSelected: {
    color: "#000000",
  },
  continueButton: {
    backgroundColor: "#4D4D4D",
    marginTop: 20,
  },
});

export default OnboardingScreen;
