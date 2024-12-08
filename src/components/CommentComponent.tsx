import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import SingleComment from './SingleComment'; // Adjust the path to your component
import { Ionicons } from '@expo/vector-icons';

// Define the interface for a single comment
interface Comment {
  username: string;
  text: string;
}

// Define the props for the CommentComponent
interface CommentComponentProps {
  comments: Comment[];
  onClose: () => void;
}

const { height } = Dimensions.get('window');

// Define comment component
const CommentComponent: React.FC<CommentComponentProps> = ({ comments, onClose }) => {
  return (
    <TouchableOpacity style={styles.overlay} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.commentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.commentList}>
          {comments.map((comment, index) => (
            <SingleComment key={index} comment={comment} />
          ))}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  commentContainer: {
    backgroundColor: '#1a1a1a',
    height: height * 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  commentList: {
    flex: 1,
  },
});

export default CommentComponent;