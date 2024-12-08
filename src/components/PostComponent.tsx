import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';


// Define comment interface
interface Comment {
  username: string;
  text: string;
}

// Define post interface
interface PostProps {
  post: {
    id: string;
    userAvatar: string;
    username: string;
    timestamp: string;
    location: string;
    videoUri: string;
    description: string;
    spotifyUri?: string;
    comments: Comment[];
  };
  isCurrent: boolean;
}

// Retrieve dimensions
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Post component
const PostComponent: React.FC<PostProps> = ({ post, isCurrent }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(123);

  // Mute/Unmute functionality
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Like functionality
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prevLikes) => (isLiked ? prevLikes - 1 : prevLikes + 1));
  };

  return (
    <View style={styles.container}>
      {/* Video background */}
      <Video
        source={{ uri: post.videoUri }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={isCurrent}
        isLooping
        isMuted={isMuted}
        onLoad={() => {
          console.log('Video loaded:', post.id);
        }}
        onError={(error) => {
          console.log('Video error:', error);
        }}
      />

      {/* Overlay elements */}
      <View style={styles.overlay}>
        {/* Left side: User info and caption */}
        <View style={styles.leftContainer}>
          <TouchableOpacity style={styles.userInfo}>
            <Image source={{ uri: post.userAvatar }} style={styles.profilePic} />
            <Text style={styles.username}>{post.username}</Text>
          </TouchableOpacity>
          <Text style={styles.description}>{post.description}</Text>
          <View style={styles.musicInfo}>
            <Ionicons name="musical-notes" size={16} color="#fff" />
            <Text style={styles.musicText}>Original Sound - {post.username}</Text>
          </View>
        </View>

        {/* Right side: Action buttons */}
        <View style={styles.rightContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={40}
              color={isLiked ? 'red' : '#fff'}
            />
            <Text style={styles.actionLabel}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={40} color="#fff" />
            <Text style={styles.actionLabel}>{post.comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={40} color="#fff" />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={30}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  rightContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  actionButton: {
    marginBottom: 25,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PostComponent;
