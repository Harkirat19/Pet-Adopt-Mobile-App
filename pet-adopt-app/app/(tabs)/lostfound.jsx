import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import Colors from '../../constants/Colors';

export default function LostFound() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('lost'); // 'lost' or 'found'
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'lostfound'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching lost and found posts:', error);
    }
  };

  const handleAddPost = async () => {
    if (!title || !description || !location) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }
    try {
      await addDoc(collection(db, 'lostfound'), {
        title,
        description,
        type,
        location,
        imageUrl,
        createdAt: new Date(),
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setImageUrl('');
      setType('lost');
      fetchPosts();
      Alert.alert('Success', 'Post added successfully.');
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to add post.');
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postType}>{item.type === 'lost' ? 'Lost' : 'Found'}</Text>
      <Text style={styles.postTitle}>{item.title}</Text>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      ) : null}
      <Text style={styles.postDescription}>{item.description}</Text>
      <Text style={styles.postLocation}>Location: {item.location}</Text>
      <Text style={styles.postDate}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Lost and Found Pets</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeSelector}>
          <Button
            title="Lost"
            color={type === 'lost' ? Colors.PRIMARY : Colors.GRAY}
            onPress={() => setType('lost')}
          />
          <Button
            title="Found"
            color={type === 'found' ? Colors.PRIMARY : Colors.GRAY}
            onPress={() => setType('found')}
          />
        </View>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter image URL (optional)"
          value={imageUrl}
          onChangeText={setImageUrl}
        />

        <Button title="Add Post" onPress={handleAddPost} color={Colors.PRIMARY} />
      </View>

      <Text style={styles.subHeading}>Posts</Text>
      {posts.length === 0 ? (
        <Text style={styles.noPosts}>No posts available.</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.WHITE,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 6,
    padding: 8,
    backgroundColor: Colors.WHITE,
  },
  postContainer: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  postType: {
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  postImage: {
    width: '100%',
    height: 200,
    marginBottom: 6,
    borderRadius: 6,
  },
  postDescription: {
    marginBottom: 6,
  },
  postLocation: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  subHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noPosts: {
    fontStyle: 'italic',
    color: Colors.GRAY,
  },
});
