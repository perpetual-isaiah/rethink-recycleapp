import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl 
} from 'react-native';

export default function AdminHomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);

  // For now, just simulates refresh. Add fetch logic as needed.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800); // Replace with API call if needed
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#4CAF50"
        />
      }
    >
      <Text style={styles.title}>Welcome, Admin!</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ManageChallenges')}
      >
        <Text style={styles.buttonText}>Manage Challenges</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Guides')}
      >
        <Text style={styles.buttonText}>Edit Guides</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('ManageAdmins')}
>
  <Text style={styles.buttonText}>Manage Admins</Text>
</TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#388E3C',
  },
  button: {
    width: '80%',
    backgroundColor: '#9DD549',
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
