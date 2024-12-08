import AsyncStorage from "@react-native-async-storage/async-storage";

export const setAuthToken = async (token) => {
  await AsyncStorage.setItem("token", token);
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem("token");
};
