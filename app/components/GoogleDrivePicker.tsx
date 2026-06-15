import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_IOS = Constants.expoConfig?.extra?.googleClientIdIos ?? "";
const GOOGLE_CLIENT_ID_ANDROID = Constants.expoConfig?.extra?.googleClientIdAndroid ?? "";
const CLIENT_ID = Platform.OS === "ios" ? GOOGLE_CLIENT_ID_IOS : GOOGLE_CLIENT_ID_ANDROID;

// Google native OAuth clients use a reversed-client-ID scheme for redirect URIs
const IOS_REDIRECT_SCHEME = `com.googleusercontent.apps.${GOOGLE_CLIENT_ID_IOS.replace(".apps.googleusercontent.com", "")}`;
const ANDROID_REDIRECT_SCHEME = `com.googleusercontent.apps.${GOOGLE_CLIENT_ID_ANDROID.replace(".apps.googleusercontent.com", "")}`;

const DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onFilePicked: (fileId: string, name: string, accessToken: string) => void;
}

export default function GoogleDrivePicker({ visible, onClose, onFilePicked }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    native: Platform.OS === "ios"
      ? `${IOS_REDIRECT_SCHEME}:/oauth2redirect`
      : `${ANDROID_REDIRECT_SCHEME}:/oauth2redirect`,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    DISCOVERY
  );

  React.useEffect(() => {
    if (response?.type === "success" && response.params?.code) {
      AuthSession.exchangeCodeAsync(
        {
          clientId: CLIENT_ID,
          redirectUri,
          code: response.params.code,
          extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : {},
        },
        DISCOVERY
      ).then((tokenResponse) => {
        const token = tokenResponse.accessToken;
        if (token) {
          setAccessToken(token);
          fetchFiles(token);
        }
      }).catch(() => {
        Alert.alert("Auth error", "Could not complete Google sign-in.");
      });
    }
  }, [response]);

  async function fetchFiles(token: string) {
    setLoading(true);
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application/pdf'&fields=files(id,name,mimeType)&pageSize=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch {
      Alert.alert("Error", "Could not load files from Google Drive.");
    } finally {
      setLoading(false);
    }
  }

  function pickFile(file: DriveFile) {
    if (!accessToken) return;
    onFilePicked(file.id, file.name, accessToken);
    onClose();
  }

  function handleConnect() {
    if (accessToken) {
      fetchFiles(accessToken);
    } else {
      promptAsync();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Google Drive</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {!accessToken ? (
          <View style={styles.center}>
            <Text style={styles.hint}>Sign in to browse your Google Drive PDFs</Text>
            <Pressable
              style={[styles.connectBtn, !request && styles.connectBtnDisabled]}
              onPress={handleConnect}
              disabled={!request}
            >
              <Text style={styles.connectBtnText}>Sign in with Google</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.hint}>Loading your PDFs...</Text>
          </View>
        ) : files.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.hint}>No PDF files found in your Drive.</Text>
            <Pressable style={styles.connectBtn} onPress={() => fetchFiles(accessToken)}>
              <Text style={styles.connectBtnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.fileRow} onPress={() => pickFile(item)}>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileName} numberOfLines={2}>{item.name}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  close: { fontSize: 20, color: "#666", padding: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  hint: { fontSize: 14, color: "#666", textAlign: "center" },
  connectBtn: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectBtnDisabled: { backgroundColor: "#A0BFEF" },
  connectBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  fileIcon: { fontSize: 20, marginRight: 12 },
  fileName: { flex: 1, fontSize: 14, color: "#333" },
});
