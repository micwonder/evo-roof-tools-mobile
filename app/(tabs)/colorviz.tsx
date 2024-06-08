import React, { useState } from "react";
import {
  View,
  Button,
  Image,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import axios from "axios";
import * as FileSystem from "expo-file-system";

axios.interceptors.request.use((request) => {
  console.log("Starting Request", JSON.stringify(request, null, 2));
  return request;
});

axios.interceptors.response.use(
  (response) => {
    console.log("Response:", JSON.stringify(response, null, 2));
    return response;
  },
  (error) => {
    console.log("Response Error:", error);
    return Promise.reject(error);
  }
);

export default function TileColorVisualizerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customR, setCustomR] = useState("0");
  const [customG, setCustomG] = useState("0");
  const [customB, setCustomB] = useState("0");

  const getPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await getPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setOriginalImage(result.assets[0].uri);
    }
  };

  const selectPhoto = async () => {
    const hasPermission = await getPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setOriginalImage(result.assets[0].uri);
    }
  };

  const sendImageForColorChange = async (r: number, g: number, b: number) => {
    if (!selectedImage) {
      Alert.alert("Please select an image first.");
      return;
    }

    setIsLoading(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: "base64",
      });
      const formData = new FormData();
      formData.append("file", "data:image/jpeg;base64," + base64);
      formData.append("r", r.toString());
      formData.append("g", g.toString());
      formData.append("b", b.toString());

      const response = await fetch("https://yourserver.com/predict", {
        method: "POST",
        body: formData,
      });

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure the result is treated as a string
        const base64data = reader.result;
        if (typeof base64data === "string") {
          setSelectedImage(base64data);
        } else {
          console.error(
            "Expected a string from FileReader but received a different type."
          );
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Take a Photo" onPress={takePhoto} />
      <Button title="Select a Photo" onPress={selectPhoto} />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        )
      )}
      <View style={styles.buttonContainer}>
        <Button
          title="Original Look"
          onPress={() => setSelectedImage(originalImage)}
        />
        <Button
          title="Red Tiles"
          onPress={() => sendImageForColorChange(255, 0, 0)}
        />
        <Button
          title="Green Tiles"
          onPress={() => sendImageForColorChange(0, 255, 0)}
        />
        <Button
          title="Blue Tiles"
          onPress={() => sendImageForColorChange(0, 0, 255)}
        />
        <Button
          title="Custom Color"
          onPress={() =>
            sendImageForColorChange(
              Number(customR),
              Number(customG),
              Number(customB)
            )
          }
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={customR}
          onChangeText={setCustomR}
          placeholder="R"
        />
        <TextInput
          style={styles.input}
          value={customG}
          onChangeText={setCustomG}
          placeholder="G"
        />
        <TextInput
          style={styles.input}
          value={customB}
          onChangeText={setCustomB}
          placeholder="B"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    marginTop: 20,
    width: 300,
    height: 300,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    width: 50,
    marginRight: 10,
  },
});
