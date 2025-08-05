import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import { countries } from '../utils/countries';

const TRNC_CODE = 'TRNC';
const TRNC_CITIES = [
  { label: 'Lefkoşa', value: 'Lefkosa' },
  { label: 'Gazimağusa', value: 'Gazimagusa' },
  { label: 'Girne', value: 'Girne' },
  { label: 'Güzelyurt', value: 'Guzelyurt' },
  { label: 'İskele', value: 'Iskele' },
  { label: 'Lefke', value: 'Lefke' },
];

export default function CountryCityScreen({ navigation }) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryValue, setCountryValue] = useState(null);
  const [countryItems, setCountryItems] = useState([
    { label: 'Northern Cyprus (TRNC)', value: TRNC_CODE },
    ...countries,
  ]);

  const [cityOpen, setCityOpen] = useState(false);
  const [cityValue, setCityValue] = useState(null);
  const [cityItems, setCityItems] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (countryValue) {
      if (countryValue === TRNC_CODE) {
        setCityItems(TRNC_CITIES);
      } else {
        fetchCitiesByCountry(countryValue);
      }
    }
  }, [countryValue]);

  const fetchCitiesByCountry = async (countryCode) => {
    setLoadingCities(true);
    try {
      const res = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        params: { countryIds: countryCode, limit: 10, sort: '-population' },
        headers: {
          'X-RapidAPI-Key': '2ee8934d37msh864594354f00f8cp1c11bcjsn9334e18f2b8c',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
      });

      const formattedCities = res.data.data.map((city) => ({
        label: city.name,
        value: `${city.name}-${city.id}`, // unique key
      }));
      setCityItems(formattedCities);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const handleContinue = () => {
    if (!countryValue || !cityValue) {
      Alert.alert('Missing info', 'Please select both country and city.');
      return;
    }

    navigation.replace('LocationPermission', {
      selectedCountry: countryValue,
      selectedCity: cityValue,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Select Your Region</Text>

      <DropDownPicker
        open={countryOpen}
        value={countryValue}
        items={countryItems}
        setOpen={setCountryOpen}
        setValue={setCountryValue}
        setItems={setCountryItems}
        placeholder="Select a country"
        style={styles.dropdown}
        zIndex={3000}
        zIndexInverse={1000}
      />

      <DropDownPicker
        open={cityOpen}
        value={cityValue}
        items={cityItems}
        setOpen={setCityOpen}
        setValue={setCityValue}
        setItems={setCityItems}
        placeholder="Select a city"
        disabled={!countryValue}
        style={styles.dropdown}
        zIndex={2000}
        zIndexInverse={2000}
      />

      {loadingCities && <ActivityIndicator style={{ marginVertical: 10 }} />}

      <Button title="Continue ➡️" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  dropdown: {
    marginBottom: 20,
  },
  notice: {
    marginTop: 10,
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
