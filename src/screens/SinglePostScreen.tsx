import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Text,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { RouteProp } from "@react-navigation/native";
import { Audio } from "expo-av";
import { ActivityIndicator } from "react-native";

type SinglePostScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SinglePostScreen"
>;
type SinglePostRouteProp = RouteProp<RootStackParamList, "SinglePostScreen">;

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

interface Props {
  navigation: SinglePostScreenNavigationProp;
  route: SinglePostRouteProp;
}

const SinglePostScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [post, setPost] = useState({
    _id: "",
    ownerUser: "",
    likesCount: 0,
    timestamp: null,
    albumCoverUrl: "",
    audioUrl: "",
    caption: "",
    outLinks: [],
  });

  const [albumCover, setAlbumCover] = useState<any>(null);
  const [audio, setAudio] = useState<string | any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  const getAudioUrl = async (audioId: string) => {
    return `http://${SERVERIP}:${SERVERPORT}/api/files/audio/${audioId}`;
  };

  const getAlbumCoverUrl = async (albumCoverId: string) => {
    return `http://${SERVERIP}:${SERVERPORT}/api/files/albumCover/${albumCoverId}`;
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };

    setupAudio();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current = null;
      }
    });

    return unsubscribe;
  }, [navigation]);

  const addLike = async () => {
    setIsLiked(!isLiked);
    let updateVal = 0;
    if (!isLiked) {
      updateVal = post.likesCount + 1;
    } else {
      updateVal = post.likesCount - 1;
    }

    setPost({
      ...post,
      likesCount: updateVal,
    });

    await fetch(
      `http://${SERVERIP}:${SERVERPORT}/api/post/${route.params?.postId}`,
      {
        method: "PUT",
        body: JSON.stringify({ likesCount: updateVal }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).catch((e) => console.error("Could not update on server: ", e));

    const response = await fetch(
      `http://${SERVERIP}:${SERVERPORT}/api/user/${post.ownerUser}`
    );

    if (response.ok) {
      const user = await response.json();
      let val = user.totalLikeCount;
      if (!isLiked) {
        val += 1;
      } else {
        val -= 1;
      }

      await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/user/${post.ownerUser}`,
        {
          method: "PUT",
          body: JSON.stringify({ totalLikeCount: val }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).catch((e) => console.error("Could not update on server: ", e));
    }
  };

  const getPost = async (postId: string) => {
    setIsLoading(true);
    try {
      const postResponse = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/post/${postId}`
      );

      if (!postResponse.ok) {
        throw new Error(`Error fetching post: ${postResponse.status}`);
      }

      const postData = await postResponse.json();
      // console.log(JSON.stringify(postData));

      const sanitizedPostData = {
        ...postData,
        outLinks: JSON.parse(postData.outLinks),
      };

      setPost(sanitizedPostData);

      if (postData.audioUrl !== "") {
        // const audioResponse = await fetch(
        //   `http://${SERVERIP}:${SERVERPORT}/api/files/audio/${postData.audioUrl}`
        // );
        // if (!audioResponse.ok) {
        //   throw new Error(`Error fetching audio: ${audioResponse.status}`);
        // }

        // const audioBlob = await audioResponse.blob();
        // const reader = new FileReader();
        // reader.onloadend = () => {
        //   const base64data = reader.result as string;
        //   setAudio(base64data);
        // };
        // reader.readAsDataURL(audioBlob);

        const audioUrl = await getAudioUrl(postData.audioUrl);
        setAudio(audioUrl);
      }

      if (postData.albumCoverUrl !== "") {
        // const albumCoverResponse = await fetch(
        //   `http://${SERVERIP}:${SERVERPORT}/api/files/albumCover/${postData.albumCoverUrl}`
        // );
        // if (!albumCoverResponse.ok) {
        //   throw new Error(
        //     `Error fetching album cover: ${albumCoverResponse.status}`
        //   );
        // }

        // const albumCoverBlob = await albumCoverResponse.blob();
        // const reader = new FileReader();
        // reader.onloadend = () => {
        //   const base64data = reader.result as string;
        //   setAlbumCover(base64data);
        // };
        // reader.readAsDataURL(albumCoverBlob);

        const albumCoverUrl = await getAlbumCoverUrl(postData.albumCoverUrl);
        setAlbumCover(albumCoverUrl);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching post data:", error);
    }
  };

  useEffect(() => {
    getPost(route.params.postId);
  }, [route.params?.postId]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      style={styles.container}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8EB12" />
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#A8EB12" />
          </TouchableOpacity>


          {/* Album Cover */}
          {albumCover ? (
            <Image source={{ uri: albumCover }} style={styles.albumCover} />
          ) : (
            <View style={styles.placeholder}>
              <Text>No Album Cover Available</Text>
            </View>
          )}

          {/* Like Button */}
          <TouchableOpacity style={styles.likeButton} onPress={addLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "red" : "grey"}
            />
          </TouchableOpacity>

          {/* Post Details */}
          <View style={styles.postDetails}>
            <Text style={styles.caption}>{post.caption}</Text>
            <Text style={styles.details}>
              {`Likes: ${post.likesCount} | Posted at: ${post.timestamp}`}
            </Text>
            <Text style={styles.caption}>OutLinks</Text>

            {Array.isArray(post.outLinks) ? (
              post.outLinks.map((outlink, index) => (
                <View key={index} style={styles.outlinkContainer}>
                  <Text style={styles.details}>
                    {`Media: ${outlink?.source}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(outlink?.url)}
                  >
                    <Text style={[styles.details, styles.link]}>
                      {outlink?.url}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.details}>No outlinks available</Text>
            )}
          </View>

          {/* Audio Player */}
          {audio ? (
            <TouchableOpacity
              style={styles.audioButton}
              onPress={async () => {
                console.log(audio);
                try {
                  if (soundRef.current) {
                    if (!isPlaying) {
                      await soundRef.current.playAsync();
                      setIsPlaying(true);
                    }
                  } else {
                    // if (soundRef.current) {
                    //   await soundRef.current.unloadAsync();
                    //   soundRef.current = null;
                    // }

                    const { sound } = await Audio.Sound.createAsync(
                      { uri: audio },
                      {
                        shouldPlay: true,
                        progressUpdateIntervalMillis: 1000,
                        positionMillis: 0,
                        volume: 1.0,
                        rate: 1.0,
                        isMuted: false,
                      }
                    );
                    soundRef.current = sound;
                    console.log(soundRef.current);
                    setIsPlaying(true);
                    sound.setOnPlaybackStatusUpdate((status) => {
                      if ("didJustFinish" in status && status.didJustFinish) {
                        sound.unloadAsync();
                        soundRef.current = null;
                        setIsPlaying(false);
                      }
                    });
                  }
                } catch (error) {
                  console.error("Error playing audio:", error);
                  Alert.alert(
                    "Audio Error",
                    "There was an error playing the audio. Please try again."
                  );
                }
              }}
            >
              {/* <Ionicons name="play-circle" size={50} color="#A8EB12" /> */}
              <Text style={styles.audioText}>Play Audio</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder}>
              <Text>No Audio Available</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 50,
  },
  scrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: Dimensions.get("window").height,
  },
  outlinkContainer: {
    alignItems: "center",
    marginVertical: 5,
  },
  link: {
    color: "#A8EB12",
    textDecorationLine: "underline",
  },
  likeButton: {
    padding: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  likeButtonText: {
    color: "white",
    fontSize: 16,
  },
  iconButton: {
    padding: 10,
    marginTop: 50,
    color: "#A8EB12"
  },

  albumCover: {
    width: Dimensions.get("window").width * 0.9,
    height: 300,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 20,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
    width: Dimensions.get("window").width * 0.9,
    borderWidth: 1,
    borderColor: "#4D4D4D",
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
  },
  postDetails: {
    alignItems: "center",
    marginBottom: 20,
  },
  caption: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#fff",
  },
  details: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 15,
  },
  audioText: {
    fontSize: 18,
    marginLeft: 10,
    color: "#A8EB12",
  },
});

export default SinglePostScreen;
