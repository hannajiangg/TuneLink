import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

type MakePostScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MakePost"
>;
type MakePostScreenRouteProp = RouteProp<RootStackParamList, "MakePost">;

// Interface for props
interface Props {
  navigation: MakePostScreenNavigationProp;
  route: MakePostScreenRouteProp;
}

// Screen to make post
const MakePostScreen: React.FC<Props> = ({ navigation, route }) => {
  const userId = route.params.userId;

  const [caption, setCaption] = useState<string>("");
  const [image, setImage] = useState<any>(null);
  const [audio, setAudio] = useState<any>(null);
  const [links, setLinks] = useState<any>([]);

  // Function to select an image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Function to select audio
  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });

    if (!result.canceled) {
      setAudio(result.assets[0]);
    }
  };

  // Function to add link
  const addLink = () => {
    setLinks([...links, { source: "", url: "" }]);
  };

  // Function to update link
  const updateLink = (index: number, key: "source" | "url", value: string) => {
    const updatedLinks = links.map((link, i) =>
      i === index ? { ...link, [key]: value } : link
    );
    setLinks(updatedLinks);
  };

  // Function to remove link
  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Function to add post to database
  const uploadPost = async () => {
    console.log("Uploading Post");
    console.log(SERVERIP);
    console.log(SERVERPORT);
    console.log(caption);
    console.log(image);
    console.log(audio);
    console.log(links);
    try {
      const formData = new FormData();
      formData.append("ownerUser", userId);
      formData.append("likesCount", "0");
      formData.append("caption", caption);
      formData.append("outLinks", JSON.stringify(links));

      if (audio) {
        const uri = audio.uri;
        let type = uri.substring(uri.lastIndexOf(".") + 1);
        formData.append("audio", {
          uri,
          name: "media",
          type: `image/${type}`,
        } as any);
      }

      if (image) {
        const uri = image.uri;
        let type = uri.substring(uri.lastIndexOf(".") + 1);
        formData.append("albumCover", {
          uri,
          name: "media",
          type: `image/${type}`,
        } as any);
      }

      // Function to post data to database
      const response = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/upload/uploadPost`,
        {
          method: "POST",
          body: formData,
        }
      );

      const responseData = await response.json();
      console.log(responseData);

      setImage(null);
      setAudio(null);
      setCaption("");
      setLinks([]);
      navigation.navigate("Feed", { userId });
    } catch (error) {
      console.error("Error uploading post:", error);
      navigation.navigate("Feed", { userId });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a New Post</Text>

      {/* Image Picker */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>Select Image</Text>
        )}
      </TouchableOpacity>

      {/* Audio Picker */}
      <TouchableOpacity style={styles.audioPicker} onPress={pickAudio}>
        <Text style={styles.audioText}>
          {audio ? audio.name : "Select Audio"}
        </Text>
        <View style={styles.audioWave}>
          <View style={styles.waveLine}></View>
          <View style={[styles.waveLine, styles.tall]}></View>
          <View style={styles.waveLine}></View>
          <View style={[styles.waveLine, styles.tall]}></View>
          <View style={styles.waveLine}></View>
        </View>
      </TouchableOpacity>

      {/* Caption Input */}
      <TextInput
        style={styles.input}
        textColor="#FFFFFF"
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        mode="outlined"
        theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
      />

      {/* Links Section */}
      <Text style={styles.sectionTitle}>Add Links</Text>
      {links.map((link, index) => (
        <View key={index} style={styles.linkContainer}>
          <TextInput
            style={styles.linkInput}
            textColor="#FFFFFF"
            placeholder="Source (e.g., YouTube)"
            value={link.source}
            onChangeText={(text) => updateLink(index, "source", text)}
            mode="outlined"
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <TextInput
            style={styles.linkInput}
            textColor="#FFFFFF"
            placeholder="URL (e.g., https://example.com)"
            value={link.url}
            onChangeText={(text) => updateLink(index, "url", text)}
            mode="outlined"
            theme={{ colors: { text: "#FFFFFF", placeholder: "#FFFFFF" } }}
          />
          <Button
            mode="outlined"
            onPress={() => removeLink(index)}
            style={styles.removeButton}
          >
            Remove
          </Button>
        </View>
      ))}
      <Button onPress={addLink} style={styles.addLinkButton}>
        Add Link
      </Button>

      <Button onPress={uploadPost} style={styles.postButton}>
        Upload Post
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: "#A8EB12",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  imagePicker: {
    height: 150,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A8EB12",
  },
  imagePickerText: {
    color: "#A8EB12",
    fontSize: 16,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  audioPicker: {
    backgroundColor: "#4D4D4D",
    borderRadius: 5,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  audioText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  audioWave: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  waveLine: {
    width: 5,
    height: 10,
    backgroundColor: "#A8EB12",
    marginHorizontal: 2,
    borderRadius: 2,
  },
  tall: {
    height: 20,
  },
  input: {
    backgroundColor: "#1a1a1a",
    marginBottom: 20,
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  linkInput: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#1a1a1a",
  },
  removeButton: {
    backgroundColor: "#d9534f",
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  addLinkButton: {
    backgroundColor: "#4D4D4D",
    borderRadius: 5,
    paddingVertical: 10,
    marginVertical: 10,
  },
  postButton: {
    backgroundColor: "#A8EB12",
    borderRadius: 5,
    paddingVertical: 10,
    marginVertical: 20,
  },
});

export default MakePostScreen;
