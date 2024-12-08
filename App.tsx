import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "./src/screens/SplashScreen";
import FollowScreen from "./src/screens/FollowScreen";
import SearchScreen from "./src/screens/SearchScreen";
import SignupScreen from "./src/screens/SignupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/Onboarding";
import FeedScreen from "./src/screens/FeedScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MakePostScreen from "./src/screens/MakePostScreen";
import SinglePostScreen from "./src/screens/SinglePostScreen";
import UserScreen from "./src/screens/UserScreen";
import EditProfileScreen from "./src/screens/EditProfile";
import OtherUserProfileScreen from "./src/screens/OtherUserProfileScreen";
import { RootStackParamList } from "./src/navigation/RootStackParamList";

const Stack = createStackNavigator<RootStackParamList>();

const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("TUNELINK FRONTEND START UP");
        console.log(
          `RUN HEALTH CHECK, CONNECTION TO BACKEND AT: ${SERVERIP}:${SERVERPORT}...`
        );
        const response = await fetch(
          `http://${SERVERIP}:${SERVERPORT}/health`
        ).catch((e) => {
          console.log("Error during fetch:", e);
          return null; // Return null to handle undefined response
        });

        if (response && response.ok) {
          setIsConnected(true);
          console.log("SERVER RUNNING: true");
        } else {
          console.log("SERVER RUNNING: false");
          console.log(
            "CHECK IF .env IS UPDATED, ENSURE YOU HAVE CORRECT CONNECTION DETAILS"
          );
        }
      } catch (error) {
        console.error("Error connecting to server:", error);
      }
    };

    checkConnection();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Feed"
          component={FeedScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MakePost"
          component={MakePostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SinglePostScreen"
          component={SinglePostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Follow"
          component={FollowScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="User"
          component={UserScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OtherUserProfile"
          component={OtherUserProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
