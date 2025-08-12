import React, { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        const name = await AsyncStorage.getItem('userName');
        setUserRole(role);
        if (name) setUserName(name);
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };

    getUserInfo();
  }, []);

  // For now, just simulates refresh. Add fetch logic as needed.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800); // Replace with API call if needed
  }, []);

  // Define which roles can access which features
  const hasAccess = (feature) => {
    switch (feature) {
      case 'challenges':
        return userRole === 'admin' || userRole === 'admin_full' || userRole === 'challenge_admin';
      case 'guides':
        return userRole === 'admin' || userRole === 'admin_full' || userRole === 'guide_admin';
      case 'recycling':
        return userRole === 'admin' || userRole === 'admin_full' || userRole === 'recycling_admin';
      case 'manage_admins':
        return userRole === 'admin'; // Only super admin can manage other admins
      default:
        return false;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Super Admin';
      case 'admin_full':
        return 'Full Admin';
      case 'challenge_admin':
        return 'Challenge Admin';
      case 'guide_admin':
        return 'Guide Admin';
      case 'recycling_admin':
        return 'Recycling Admin';
      default:
        return 'Admin';
    }
  };

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
      <Text style={styles.title}>Welcome, {userName}!</Text>
      <Text style={styles.subtitle}>{getRoleDisplayName(userRole)}</Text>

      {hasAccess('challenges') && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ManageChallenges')}
        >
          <Text style={styles.buttonText}>Manage Challenges</Text>
        </TouchableOpacity>
      )}

      {hasAccess('guides') && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Guides')}
        >
          <Text style={styles.buttonText}>Edit Guides</Text>
        </TouchableOpacity>
      )}

      {hasAccess('recycling') && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RecyclingPoints')}
        >
          <Text style={styles.buttonText}>Manage Recycling Points</Text>
        </TouchableOpacity>
      )}

      {hasAccess('manage_admins') && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ManageAdmins')}
        >
          <Text style={styles.buttonText}>Manage Admins</Text>
        </TouchableOpacity>
      )}

      {!hasAccess('challenges') && !hasAccess('guides') && !hasAccess('recycling') && !hasAccess('manage_admins') && (
        <View style={styles.noAccessContainer}>
          <Text style={styles.noAccessText}>
            Contact your super admin for access permissions.
          </Text>
        </View>
      )}
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
    marginBottom: 8,
    color: '#388E3C',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    fontWeight: '500',
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
  noAccessContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noAccessText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});