import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { RouteProp } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";

import { Alert } from "react-native";

//Set default avatar for user 
const DEFAULT_AVATAR_URL = "https://via.placeholder.com/150";


const handleError = (error: any, context: string) => {
  console.error(`${context}:`, error);
  Alert.alert("Error", `Something went wrong: ${error.message}`);
};

//Defining navigatoin prop
type UserScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "User"
>;
type UserScreenRouteProp = RouteProp<RootStackParamList, "User">;

//environment variables
const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

//Prop interface
interface Props {
  navigation: UserScreenNavigationProp;
  route: UserScreenRouteProp;
}

// State for user data and loading states
const UserScreen: React.FC<Props> = ({ navigation, route }) => {
  const [user, setUser] = useState({
    _id: "",
    userName: "",
    profileName: "",
    followerCount: 0,
    following: [],
    totalLikeCount: 0,
    profileDescription: "",
    genres: [] as string[],
    ownedPosts: [] as any[],
    userAvatarUrl: "",
  });

  //Refresh and loading states
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setRefreshing(true);
    await getUser(userId);
    setRefreshing(false);
  };

  const userId = route.params.userId;

  // Fetch and set the user's avatar
  const getUserAvatar = async (avatarId: string) => {
    try {
      if (!avatarId) {
        setUser((prevUser) => ({
          ...prevUser,
          userAvatarUrl: DEFAULT_AVATAR_URL,
        }));
        return;
      }

      const response = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/files/userAvatar/${avatarId}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching avatar: ${response.statusText}`);
      }

      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;

        setUser((prevUser) => ({
          ...prevUser,
          userAvatarUrl: `data:image/jpeg;base64,${base64data.split(",")[1]}`,
        }));
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      handleError(error, "Fetching avatar");
      console.error("Failed to fetch user avatar:", error);
    }
  };

  // Fetch and set user's posts
  const getPosts = async (ownedPosts: string[]) => {
    try {
      const fetchedPosts = await Promise.all(
        ownedPosts.map(async (postId) => {
          const response = await fetch(
            `http://${SERVERIP}:${SERVERPORT}/api/post/${postId}`
          );

          if (!response.ok) {
            throw new Error(`Error fetching post: ${response.statusText}`);
          }

          const post = await response.json();

          if (post.albumCoverUrl) {
             // Fetch album cover image for the post
            const albumCoverResponse = await fetch(
              `http://${SERVERIP}:${SERVERPORT}/api/files/albumCover/${post.albumCoverUrl}`
            );

            if (!albumCoverResponse.ok) {
              throw new Error(
                `Error fetching album cover: ${albumCoverResponse.statusText}`
              );
            }

            const blob = await albumCoverResponse.blob();

            const reader = new FileReader();
            const base64Url = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            post.albumCoverUrl = `data:image/jpeg;base64,${
              base64Url.split(",")[1]
            }`;
          }

          return post;
        })
      );

      setUser((prevUser) => ({
        ...prevUser,
        ownedPosts: fetchedPosts,
      }));
    } catch (error) {
      handleError(error, "Fetching Posts");
      console.error("Failed to fetch posts:", error);
    }
  };

  // Fetch user data from the server
  const getUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`
      );
      const responseData = await response.json();

      if (response.ok) {
        console.log("Successfully retrieved user");
        setUser(responseData);
        getUserAvatar(responseData.userAvatarUrl);
        getPosts(responseData.ownedPosts);
      } else {
        console.error("Server error:", response);
      }
      setLoading(false);
    } catch (error) {
      handleError(error, "Fetching user");
      console.error("Network request failed:", error);
      setLoading(false);
    }
  };

  // Fetch user data when the component mounts or userId changes
  useEffect(() => {
    getUser(userId);
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A8EB12" />
      </View>
    );
  }

  //UI and styling
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri: user.userAvatarUrl,
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>
          {user.userName} | {user.profileName}
        </Text>

      </View>
      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.bio}>{user.profileDescription}</Text>
      </View>
      {/* Followers/Following Section */}
      <View style={styles.followSection}>
        <TouchableOpacity
            style={styles.followCard}
            onPress={() => navigation.navigate("Feed", { userId })}
          >
            <Text style={styles.followCount}>
              {user.followerCount.toLocaleString()}
            </Text>
            <Text style={styles.followLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.followCard}
            onPress={() => navigation.navigate("Follow", { userId })}
          >
            <Text style={styles.followCount}>
              {user.following.length.toLocaleString()}
            </Text>
            <Text style={styles.followLabel}>Following</Text>
        </TouchableOpacity>
        
      </View>
      {/* User Posts List */}
      <FlatList
        data={user.ownedPosts}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postContainer}
            onPress={() =>
              navigation.navigate("SinglePostScreen", { postId: item._id })
            }
          >
            <Image
              source={{ uri: item.albumCoverUrl }}
              style={styles.albumCover}
            />
            <View style={styles.textContainer}>
              <Text style={styles.postTitle}>{item.caption}</Text>
              <Text style={styles.postDate}>{item.timestamp}</Text>
            </View>
          </TouchableOpacity>
        )}
        style={styles.postList}
        contentContainerStyle={styles.postListContent}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Feed", { userId })}
        >
          <Ionicons name="musical-notes" size={50} color="#A8EB12" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Search", { userId })}
        >
          <Ionicons name="search-outline" size={30} color="#A8EB12" />
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("MakePost", { userId })}
        >
          <Ionicons name="add-circle-outline" size={50} color="#A8EB12" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Profile", { userId })}
        >
          <Ionicons name="person-circle-outline" size={50} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    marginTop: 50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  username: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  bioSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  bio: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  followSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 20,
  },
  followCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  followCount: {
    color: "#A8EB12",
    fontSize: 24,
    fontWeight: "bold",
  },
  followLabel: {
    color: "#fff",
    fontSize: 14,
  },
  postList: {
    flex: 1,
  },
  postListContent: {
    paddingBottom: 100, // Add some padding at the bottom for the footer
  },
  postContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomColor: "#4D4D4D",
    borderBottomWidth: 1,
    borderRadius: 10, // Rounded corners
    backgroundColor: "#1a1a1a", // Background for posts
    marginHorizontal: 10,
    marginVertical: 5,
  },
  albumCover: {
    width: 70,
    height: 70,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  postTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  postDate: {
    color: "#ccc",
    fontSize: 12,
  },
  footer: {
    height: 80,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: "#4D4D4D",
    borderTopWidth: 1,
    paddingHorizontal: 40,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },
});

export default UserScreen;
