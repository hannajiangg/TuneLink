import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Environment variable declaration
const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

// Defining navigation prop types 
type SearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Search"
>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, "Search">;

//Global event handling
const handleError = (error: any, context: string) => {
  console.error(`${context}:`, error);
  Alert.alert("Error", `Something went wrong: ${error.message}`);
};

//User Object
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

// Props for the SearchScreen navigation and route parameters
interface Props {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

// Main SearchScreen functional component
const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
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

  // Extract userId from route parameters
  const userId = route.params.userId;

   // Function to handle search based on either user name or genre
  const [query, setQuery] = useState("");
  const [searchByGenre, setSearchByGenre] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) {
      Alert.alert("Invalid Input", "Please enter a search term.");
      return;
    }

    setLoading(true); //loading state
       
    // Search by genre
    try {
      if (searchByGenre) {
        const endpoint = `http://${SERVERIP}:${SERVERPORT}/api/user/search-by-genre/${query}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(
            `Error fetching genre specified users: ${response.statusText}`
          );
        }

        const data = await response.json();
        setResults(data);
      } else {
        // Search by user name
        const response = await fetch(
          `http://${SERVERIP}:${SERVERPORT}/api/user/username/${query}`
        );
        if (response.status == 404) {
          Alert.alert("Error", `User could not be found :(`);
        } else if (!response.ok) {
          throw new Error(
            `Error fetching user ${query}: ${response.statusText}`
          );
        }

        const data = await response.json();
        setResults([data]); // Update state with search results
      }
    } catch (error) {
      handleError(error, "Search");
    } finally {
      setLoading(false);
    }
  };

  //UI and styling 
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder={searchByGenre ? "Enter genre..." : "Enter username..."}
          placeholderTextColor="#ccc"
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Search Mode */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setSearchByGenre(false)}
          style={[
            styles.toggleButton,
            !searchByGenre && styles.activeToggleButton,
          ]}
        >
          <Text style={styles.toggleText}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSearchByGenre(true)}
          style={[
            styles.toggleButton,
            searchByGenre && styles.activeToggleButton,
          ]}
        >
          <Text style={styles.toggleText}>Genre</Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      {loading ? (
        <ActivityIndicator size="large" color="#A8EB12" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate("OtherUserProfile", {
                  userId: userId,
                  otherUserId: item._id,
                })
              }
            >
              {/* in progress
              <Image
                source={{
                  uri: item.userAvatarUrl,
                }}
                style={styles.avatar}
              />
              */}
              <Text style={styles.resultText}>{item.userName}</Text>
              <Text style={styles.resultSubText}>{item.profileName}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading && <Text style={styles.noResults}>No results found.</Text>
          }
        />
      )}

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
          style={styles.addButton}
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
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    marginTop: 80,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#1a1a1a",
    borderRadius: 5,
    paddingHorizontal: 10,
    color: "#fff",
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: "#A8EB12",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  searchButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "#1a1a1a",
  },
  activeToggleButton: {
    backgroundColor: "#A8EB12",
  },
  toggleText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loader: {
    marginTop: 20,
  },
  resultItem: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultSubText: {
    color: "#ccc",
    fontSize: 12,
  },
  noResults: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 20,
  },
});

export default SearchScreen;
