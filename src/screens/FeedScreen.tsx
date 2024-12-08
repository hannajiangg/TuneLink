import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  Text,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { Audio, AVPlaybackStatus } from 'expo-av';
import Slider from "@react-native-community/slider";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

const DEFAULT_AVATAR = require("../../assets/app-logo.png");

// Function to retrieve album
const getAlbumCoverUrl = (fileId: string) => {
  if (!fileId) return "";
  return `http://${SERVERIP}:${SERVERPORT}/api/files/albumCover/${fileId}`;
};

// Function to retrieve audio
const getAudioUrl = (fileId: string) => {
  if (!fileId) return "";
  return `http://${SERVERIP}:${SERVERPORT}/api/files/audio/${fileId}`;
};

// Function to retrieve avatar
const getUserAvatarUrl = (fileId: string) => {
  if (!fileId) return "";
  return `http://${SERVERIP}:${SERVERPORT}/api/files/userAvatar/${fileId}`;
};

// Function to retrieve timestamp
const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInDays = Math.floor(
    (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 7) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }
  const weeks = Math.floor(diffInDays / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
};

type OutLink = {
  source: string;
  url: string;
};

// Interface for user
type User = {
  _id: string;
  userAvatarUrl: string;
  userName: string;
  profileName: string;
  followerCount: number;
  following: string[];
  totalLikeCount: number;
  profileDescription: string;
  genres: string[];
  ownedPosts: string[];
};

// Interface for post
type Post = {
  _id: string;
  ownerUser: string;
  likesCount: number;
  timestamp: string;
  albumCoverUrl?: string;
  audioUrl?: string;
  caption?: string;
  outLinks?: string;
  user?: User;
};

type FeedScreenNavigationProp = StackNavigationProp<RootStackParamList, "Feed">;
type FeedScreenRouteProp = RouteProp<RootStackParamList, "Feed">;

// Interface for props
interface Props {
  navigation: FeedScreenNavigationProp;
  route: FeedScreenRouteProp;
}

// Feed component
const FeedScreen: React.FC<Props> = ({ navigation, route }) => {
  const userId = route.params.userId;
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [blurredImage, setBlurredImage] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (posts.length > 0) {
      const initialExpandedState = posts.reduce((acc, post) => {
        acc[post._id] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      setExpandedCaptions(initialExpandedState);
    }
  }, [posts]);

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

  // Function to automatically play sound
  const playSound = async (audioUrl: string) => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: getAudioUrl(audioUrl) },
          { shouldPlay: true }
        );
        
        // Get initial status to set duration immediately
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          setAudioDuration(status.durationMillis / 1000);
        }

        // Set up status update callback after getting initial duration
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        
        soundRef.current = sound;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Function to update when played
  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    if (status.isPlaying) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    if (status.positionMillis !== undefined) {
      setAudioPosition(status.positionMillis / 1000);
    }

    if (status.durationMillis !== undefined) {
      setAudioDuration(status.durationMillis / 1000);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setAudioPosition(0);
      if (soundRef.current) {
        await soundRef.current.playFromPositionAsync(0);
      }
    }
  };

  const seekAudio = async (value: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.playFromPositionAsync(value * 1000);
        setAudioPosition(value);
      }
    } catch (error) {
      console.error("Error seeking audio:", error);
    }
  };

  // Function to fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `http://${SERVERIP}:${SERVERPORT}/api/feed/get_feed/${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Response was not JSON");
      }
      const data = await response.json();
      // console.log("Posts:", data);
      const feedPosts = data.feed || [];

      // Fetch user data for each post
      const postsWithUsers = await Promise.all(
        feedPosts.map(async (post: Post) => {
          try {
            const userResponse = await fetch(
              `http://${SERVERIP}:${SERVERPORT}/api/user/${post.ownerUser}`
            );
            if (userResponse.ok) {
              const userData = await userResponse.json();
              // console.log("User data:", userData);
              return { ...post, user: userData };
            }
            return post;
          } catch (error) {
            console.error("Error fetching user data:", error);
            return post;
          }
        })
      );

      setPosts(postsWithUsers);
      setCurrentIndex(0);
      setLikedPosts({});
      if (postsWithUsers.length > 0) {
        if (postsWithUsers[0].albumCoverUrl) {
          setBlurredImage(postsWithUsers[0].albumCoverUrl);
        }
        if (postsWithUsers[0].audioUrl) {
          playSound(postsWithUsers[0].audioUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  // Function to see next post
  const goToNextPost = async () => {
    if (currentIndex < posts.length - 1) {
      // Reset audio state
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setAudioPosition(0);
      setAudioDuration(0);
      
      // Move to next post
      setCurrentIndex(currentIndex + 1);
      const nextPost = posts[currentIndex + 1];
      
      if (nextPost.albumCoverUrl) {
        setBlurredImage(nextPost.albumCoverUrl);
      }
      
      // Play new audio after a short delay to ensure proper cleanup
      if (nextPost.audioUrl) {
        setTimeout(() => {
          playSound(nextPost.audioUrl!);
        }, 100);
      }
    } else {
      console.log("Fetching new posts");
      fetchPosts();
    }
  };

  const goToPreviousPost = async () => {
    if (currentIndex > 0) {
      // Reset audio state
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setAudioPosition(0);
      setAudioDuration(0);
      
      // Move to previous post
      setCurrentIndex(currentIndex - 1);
      const prevPost = posts[currentIndex - 1];
      
      if (prevPost.albumCoverUrl) {
        setBlurredImage(prevPost.albumCoverUrl);
      }
      
      // Play new audio after a short delay to ensure proper cleanup
      if (prevPost.audioUrl) {
        setTimeout(() => {
          playSound(prevPost.audioUrl!);
        }, 100);
      }
    }
  };

  const toggleCaption = (postId: string) => {
    setExpandedCaptions((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleLike = async (postId: string) => {
    if (!likedPosts[postId]) {
      posts[currentIndex].likesCount++;
      await fetch(`http://${SERVERIP}:${SERVERPORT}/api/post/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ likesCount: posts[currentIndex].likesCount }),
      });

      const updatedTotalLikeCount = posts[currentIndex].user?.totalLikeCount;
      if (updatedTotalLikeCount) {
        await fetch(`http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalLikeCount: updatedTotalLikeCount + 1,
          }),
        });
      }
    } else {
      posts[currentIndex].likesCount--;
      await fetch(`http://${SERVERIP}:${SERVERPORT}/api/post/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likesCount: posts[currentIndex].likesCount,
        }),
      });

      const updatedTotalLikeCount = posts[currentIndex].user?.totalLikeCount;
      if (updatedTotalLikeCount) {
        await fetch(`http://${SERVERIP}:${SERVERPORT}/api/user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalLikeCount: updatedTotalLikeCount - 1,
          }),
        });
      }
    }

    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    
    // Round to nearest second to avoid decimal places
    seconds = Math.round(seconds);
    
    // Extract minutes and seconds
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    // Format with leading zero only for seconds
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Function to render post
  const renderPost = (post: Post) => {
    let parsedOutLinks: OutLink[] = [];
    if (post.outLinks) {
      try {
        if (typeof post.outLinks === "string") {
          parsedOutLinks = JSON.parse(post.outLinks);
        } else {
          parsedOutLinks = post.outLinks;
        }
      } catch (error) {
        console.error("Error parsing outLinks:", error);
      }
    }

    const isLiked = likedPosts[post._id];

    const isCaptionLong = post.caption && post.caption.length > 100;
    const isExpanded = expandedCaptions[post._id] || false;

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.postContainer}>
            {/* User Info Row */}
            <View style={styles.userInfoRow}>
              <View style={styles.leftUserInfo}>
                {post.user && (
                  <>
                    <Image
                      source={
                        post.user.userAvatarUrl
                          ? { uri: getUserAvatarUrl(post.user.userAvatarUrl) }
                          : DEFAULT_AVATAR
                      }
                      style={styles.userAvatar}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("OtherUserProfile", {
                          userId: userId,
                          otherUserId: post.user?._id,
                        })
                      }
                    >
                      <Text style={styles.userName}>{post.user?.userName}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.rightUserInfo}>
                {/* <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity> */}
                <Text style={styles.timestamp}>
                  {getTimeAgo(post.timestamp)}
                </Text>
              </View>
            </View>

            {/* Album Art Section */}
            <View style={styles.albumSection}>
              {post.albumCoverUrl && (
                <Image
                  source={{
                    uri: getAlbumCoverUrl(post.albumCoverUrl),
                  }}
                  style={styles.albumArt}
                />
              )}
            </View>

            {/* Audio Controls */}
            {post.audioUrl && (
              <View style={styles.audioControls}>
                {/* Play/Pause button commented out
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={() => {
                    if (post.audioUrl) {
                      playSound(post.audioUrl);
                    }
                  }}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={28}
                    color="#A8EB12"
                  />
                </TouchableOpacity>
                */}
                <Text style={styles.audioTime}>
                  {formatTime(audioPosition)}
                </Text>
              </View>
            )}

            {/* Caption if exists */}
            {post.caption && (
              <View>
                <Text
                  style={styles.postDescription}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {post.caption}
                </Text>
                {isCaptionLong && (
                  <TouchableOpacity
                    onPress={() => toggleCaption(post._id)}
                    style={styles.seeMoreButtonContainer}
                  >
                    <Text style={styles.seeMoreButton}>
                      {isExpanded ? "See less" : "See more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Likes Row and Heart Button */}
            <View style={styles.likesContainer}>
              <View style={styles.likesWrapper}>
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => toggleLike(post._id)}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={28}
                    color={isLiked ? "#A8EB12" : "#fff"}
                  />
                </TouchableOpacity>
                <Text style={styles.likesCount}>
                  {post.likesCount ?? 0} likes
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={
          blurredImage ? { uri: getAlbumCoverUrl(blurredImage) } : undefined
        }
        style={styles.background}
        blurRadius={20}
      >
        {/* Top bar */}
        {/* <View style={styles.topBar}>
        <Image
          source={require("../../assets/app-logo.png")}
          style={styles.appLogo}
        />
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile", { userId })}
        >
          <Ionicons name="person-circle-outline" size={40} color="#fff" />
        </TouchableOpacity>
      </View> */}

        {/* Posts Display */}
        <View style={styles.carousel}>
          <TouchableOpacity
            style={[styles.navButton, { left: 20 }]}
            onPress={goToPreviousPost}
            disabled={currentIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={30}
              color={currentIndex === 0 ? "#666" : "#fff"}
            />
          </TouchableOpacity>

          {posts.length > 0 && renderPost(posts[currentIndex])}

          <TouchableOpacity
            style={[styles.navButton, { right: 20 }]}
            onPress={goToNextPost}
            // disabled={currentIndex === posts.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={30}
              color={currentIndex === posts.length - 1 ? "#666" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </ImageBackground>
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Feed", { userId })}
        >
          <Ionicons name="musical-notes" size={35} color="#A8EB12" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Search", { userId })}
        >
          <Ionicons name="search-outline" size={35} color="#A8EB12" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("MakePost", { userId })}
        >
          <Ionicons name="add-circle-outline" size={35} color="#A8EB12" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Profile", { userId })}
        >
          <Ionicons name="person-circle-outline" size={35} color="#fff" />
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
  appLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 40,
  },
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  seeMoreButtonContainer: {
    paddingVertical: 5,
  },
  outLinksContainer: {
    flexDirection: "column",
    gap: 8,
    marginTop: 10,
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
    alignItems: "center",
    justifyContent: "center",
  },
  outLinkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  outLinkText: {
    color: "#A8EB12",
    fontSize: 14,
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  profileButton: {
    marginLeft: 10,
  },
  carousel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  navButton: {
    position: "absolute",
    zIndex: 2,
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 25,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: "rgba(41, 43, 77, 0.3)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardContent: {
    flex: 1,
  },
  postContainer: {
    flex: 1,
    width: "100%",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  leftUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timestamp: {
    color: "#B0B0C3",
    fontSize: 14,
  },
  followButton: {
    backgroundColor: "#A8EB12",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  followButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  albumSection: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 15,
  },
  albumArt: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  heartButton: {
    marginBottom: 5,
  },
  postDescription: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 10,
    minHeight: 60,
  },
  seeMoreButton: {
    color: "#A8EB12",
    fontSize: 14,
    fontWeight: "600",
    marginTop: -5,
    marginBottom: 10,
  },
  outLinkButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  audioControls: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  playPauseButton: {
    marginRight: 10,
  },
  audioSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  audioTime: {
    color: "#fff",
    fontSize: 14,
    textAlign: 'left',
  },
  likesContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  likesWrapper: {
    alignItems: 'center',
  },
  likesCount: {
    color: "#A8EB12",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FeedScreen;
