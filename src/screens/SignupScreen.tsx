// src/screens/SignupScreen.tsx
import React, { useState } from "react";
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

import { signup } from "../services/authService";

// Define navigation type
type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Signup"
>;

// Eenvironment variables
const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

interface Props {
  navigation: SignupScreenNavigationProp;
}

// Main SignupScreen functional component
const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profilename, setProfileName] = useState<string>("");
  const [profileDescription, setProfileDescription] = useState<string>("");
  const [image, setImage] = useState<any>(null);

  const [errorMessage, setErrorMessage] = useState<string>("");

  // Function to handle image selection from  ImagePicker library
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

  // Function to handle the signup process
  const handleSignup = async () => {
    try {
      if (password.length < 4) {
        setErrorMessage("Password must be at least 4 characters long.");
        return;
      }

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("userName", username);
      formData.append("profileName", profilename);
      formData.append("profileDescription", profileDescription);

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

      console.log(formData);

      const responseData = await signup(formData);
      if (responseData && responseData.userId) {
        console.log(responseData);
        // Navigate to the Onboarding screen if success
        navigation.navigate("Onboarding", { userId: responseData.userId });
      } else {
        setErrorMessage("Failed to sign up. Please try again later.");
      }
    } catch (error) {
      setErrorMessage(
        "Network request failed. Please enter all fields and try again."
      );
      console.error("Network request failed:", error);
    }
  };

  //UI and styling
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.container}>
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.image} />
          ) : (
            <Text style={styles.imagePlaceholder}>Select Profile Image</Text>
          )}
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            textColor="#FFFFFF"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            placeholder="Enter your email"
            style={styles.input}
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <TextInput
            label="Username"
            textColor="#FFFFFF"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            placeholder="Enter your username"
            style={styles.input}
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
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
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <TextInput
            label="Password"
            textColor="#FFFFFF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            placeholder="Enter your password"
            style={styles.input}
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <Button
            mode="contained"
            onPress={handleSignup}
            style={styles.signupButton}
            labelStyle={styles.signupButtonText}
          >
            Sign Up
          </Button>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000000",
    paddingBottom: 50,
    paddingTop: 50,
  },
  logoContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  imageContainer: {
    alignSelf: "center",
    marginVertical: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#A8EB12",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  imagePlaceholder: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  formContainer: {
    flex: 1.4,
    paddingHorizontal: 16,
    justifyContent: "flex-start",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
    color: "#FFFFFF",
  },
  signupButton: {
    backgroundColor: "#4D4D4D",
    marginTop: 10,
    paddingVertical: 10,
  },
  signupButtonText: {
    color: "#FFFFFF",
  },
  link: {
    color: "#A8EB12",
    textAlign: "center",
    marginTop: 20,
  },
});

export default SignupScreen;
