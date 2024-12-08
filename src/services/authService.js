import axios from "axios";
const SERVERIP = process.env.EXPO_PUBLIC_SERVER_IP;
const SERVERPORT = process.env.EXPO_PUBLIC_SERVER_PORT;

const API_URL = `http://${SERVERIP}:${SERVERPORT}`;

export const signup = async (userFormData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, userFormData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
