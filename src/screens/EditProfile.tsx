// src/screens/EditProfile.tsx
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import * as ImagePicker from "expo-image-picker";
import { RouteProp } from "@react-navigation/native";
import axios from "axios";

type EditProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EditProfile"
>;

type EditProfileScreenRouteProp = RouteProp<RootStackParamList, "EditProfile">;

// Props interface
interface Props {
  navigation: EditProfileScreenNavigationProp;
  route: EditProfileScreenRouteProp;
}

// Server definition
const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

// Function to define making edits to profile
const EditProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const userId = route.params.userId;
  const [profilename, setProfileName] = useState<string>("");
  const [profileDescription, setProfileDescription] = useState<string>("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [image, setImage] = useState<any>(null);

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

// Function to pick image to upload to profile
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

// Function to update profile visually
  useEffect(() => {
    const updateValues = async () => {
      const existingUser = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`
      );
      if (!existingUser.ok) {
        throw new Error(
          `Error fetching user ${userId}: ${existingUser.statusText}`
        );
      }
      const existingUserJson = await existingUser.json();
      setProfileName(existingUserJson.profileName);
      setProfileDescription(existingUserJson.profileDescription);
      setSelectedGenres(existingUserJson.genres);
    };
    updateValues();
  }, [userId]);

// Function to update profile based on changes in database
  const handleUpdateProfile = async () => {
    console.log("Updating profile");
  
    const formData = new FormData();
    formData.append("profileName", profilename);
    formData.append("profileDescription", profileDescription);
    formData.append("genres", JSON.stringify(selectedGenres)); 
  
    if (image) {
      const uri = image.uri;
      let type = uri.substring(uri.lastIndexOf(".") + 1);
      const fileName = uri.split("/").pop();
      formData.append("userAvatar", {
        uri,
        name: fileName || "userAvatar",
        type: `image/${type}`,
      } as any);
    }

    try {
      const updateUser = await axios.put(
        `http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`, 
        formData
      );

      const resposeData = updateUser.data
      console.log("Profile updated successfully");
      navigation.navigate("Profile", { userId });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Function to keep track of genres selected by user
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((item) => item !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Function to determine if genre is selected
  const isSelected = (genre: string) => selectedGenres.includes(genre);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color="#A8EB12" />
      </TouchableOpacity>


      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} />
            ) : (
              <Text style={styles.imagePlaceholder}>Select Profile Image</Text>
            )}
          </TouchableOpacity>

          <TextInput
            label="Profile Name"
            textColor="#FFFFFF"
            value={profilename}
            onChangeText={setProfileName}
            mode="outlined"
            placeholder="Enter your Profile Name"
            style={styles.input}
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <TextInput
            label="Profile Description"
            textColor="#FFFFFF"
            value={profileDescription}
            onChangeText={setProfileDescription}
            mode="outlined"
            placeholder="Enter your Profile Description"
            style={styles.input}
            multiline
            numberOfLines={4}
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
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
            onPress={handleUpdateProfile}
            style={styles.signupButton}
            labelStyle={styles.signupButtonText}
          >
            Update Profile
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  iconButton: {
    padding: 10,
    marginRight: 15, 
    marginTop: 50,
    color: "#A8EB12"
  },

  imageContainer: {
    alignSelf: "center",
    marginBottom: 40,
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#A8EB12",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
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
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
  },
  imagePlaceholder: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    padding: 10,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  input: {
    marginBottom: 24,
    backgroundColor: "#1a1a1a",
    color: "#FFFFFF",
  },
  signupButton: {
    backgroundColor: "#A8EB12",
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signupButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditProfileScreen;
