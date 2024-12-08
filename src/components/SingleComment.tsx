import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Define the Comment type
interface CommentProps {
  comment: {
    username: string;
    text: string;
  };
}

// Single comment component
const SingleComment: React.FC<CommentProps> = ({ comment }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.comment}>
        <Text style={styles.username}>{comment.username}: </Text>
        {comment.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
  },
  comment: {
    color: '#fff',
  },
  username: {
    fontWeight: 'bold',
    color: '#A8EB12',
  },
});

export default SingleComment;