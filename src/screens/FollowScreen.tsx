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

const handleError = (error: any, context: string) => {
  console.error(`${context}:`, error);
  Alert.alert("Error", `Something went wrong: ${error.message}`);
};

type FollowScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Follow"
>;
type FollowScreenRouteProp = RouteProp<RootStackParamList, "Follow">;

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

// Interface for props
interface Props {
  navigation: FollowScreenNavigationProp;
  route: FollowScreenRouteProp;
}

// Interface for following user
interface FollowingUser {
  id: string;
  userName: string;
  avatarUrl: string;
}

// Function of information about users user follows
const FollowScreen: React.FC<Props> = ({ navigation, route }) => {
  const [user, setUser] = useState({
    _id: "",
    userName: "",
    profileName: "",
    followerCount: 0,
    following: [] as FollowingUser[],
    totalLikeCount: 0,
    profileDescription: "",
    genres: [] as string[],
    ownedPosts: [] as any[],
    userAvatarUrl: "",
  });

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refreshes data periodically
  const refreshData = async () => {
    setRefreshing(true);
    await getUser(userId);
    setRefreshing(false);
  };

  const userId = route.params.userId;
  const currentUserId = route.params.currentUserId;

  // Retrieves avatar of user based on id
  const getUserAvatar = async (avatarId: string) => {
    try {
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

  // Function to retrieve followers based on id
  const getFollowing = async (following: string[]) => {
    try {
      const fetchedUsers = await Promise.all(
        following.map(async (userId) => {
          const response = await fetch(
            `http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`
          );

          if (!response.ok) {
            throw new Error(`Error fetching user: ${response.statusText}`);
          }

          const user = await response.json();

          return {
            id: user._id,
            userName: user.userName,
            avatarUrl: user.userAvatarUrl,
          };
        })
      );

      setUser((prevUser) => ({
        ...prevUser,
        following: fetchedUsers,
      }));
    } catch (error) {
      handleError(error, "Fetching Following");
      console.error("Failed to fetch following:", error);
    }
  };

  // Function to get user based on id
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
        if (responseData.userAvatarUrl) {
          getUserAvatar(responseData.userAvatarUrl);
        }
        getFollowing(responseData.following);
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

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#A8EB12" />
        </TouchableOpacity>

        <Image
          source={{
            uri: user.userAvatarUrl,
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{user.userName}</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.username}>{"Following:"}</Text>
      </View>

      {/* Following List */}
      <FlatList
        data={user.following}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.followingContainer}
            key={item.id}
            onPress={() =>
              navigation.navigate("OtherUserProfile", {
                otherUserId: item.id,
                userId: currentUserId,
              })
            }
          >
            <Text style={styles.followingUsername}>{item.userName}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row", // Align items horizontally
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: 20, // Space between elements
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  username: {
    color: "#A8EB12",
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
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderTopColor: "#4D4D4D",
    borderTopWidth: 1,
  },
  iconButton: {
    padding: 10,
    marginRight: 15,
    color: "#A8EB12",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    transform: [{ translateX: 160 }, { translateY: 20 }],
  },
  FollowPic: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },
  followingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomColor: "#4D4D4D",
    borderBottomWidth: 1,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  followingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  followingUsername: {
    color: "#fff",
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
});

export default FollowScreen;
