import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { database } from './supabase'; // Import Supabase configuration

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('common_name'); // 'common_name', 'city_name', or 'location_name'
  const [plantData, setPlantData] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de localização negada',
          'Permita o acesso à localização para visualizar o mapa.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      // Fetch plants nearby
      fetchNearbyPlants(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const fetchNearbyPlants = async (latitude, longitude) => {
    setLoading(true);
    try {
      const { data, error } = await database.select('plants');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        const nearbyPlants = data.filter((plant) => {
          // Implementar lógica para filtrar plantas próximas baseado em latitude/longitude
          // Por simplicidade, assumindo que todas as plantas são próximas
          return true;
        });
        setPlantData(nearbyPlants);
        setFilteredPlants([]);
      } else {
        setPlantData([]);
        setFilteredPlants([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao buscar plantas próximas.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlant = async () => {
    setLoading(true);
    try {
      const { data, error } = await database.select('plants');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        const filtered = data.filter((plant) => {
          switch (searchType) {
            case 'common_name':
              return (plant.common_name || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            case 'city_name':
              return (plant.city_name || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            case 'location_name':
              return (plant.location_name || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            default:
              return false;
          }
        });
        setFilteredPlants(filtered);
        if (filtered.length > 0) {
          const plant = filtered[0];
          setInitialRegion({
            latitude: plant.latitude,
            longitude: plant.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        Alert.alert(
          'Nenhuma planta encontrada',
          'Não foi possível encontrar uma planta com o termo fornecido.'
        );
        setFilteredPlants([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao buscar a planta.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlants = async () => {
    setLoading(true);
    try {
      const { data, error } = await database.select('plants');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        setFilteredPlants(data);
        const plant = data[0];
        setInitialRegion({
          latitude: plant.latitude,
          longitude: plant.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        Alert.alert(
          'Nenhuma planta encontrada',
          'Não foi possível encontrar plantas.'
        );
        setFilteredPlants([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao buscar as plantas.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BUSCAR PLANTA</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={searchType}
          style={styles.picker}
          onValueChange={(itemValue) => setSearchType(itemValue)}>
          <Picker.Item label="Nome Comum" value="common_name" />
          <Picker.Item label="Cidade" value="city_name" />
          <Picker.Item label="Localização" value="location_name" />
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Termo de busca"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <TouchableOpacity style={styles.searchButton} onPress={searchPlant}>
        <Text style={styles.searchButtonText}>Buscar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewAllButton} onPress={fetchAllPlants}>
        <Text style={styles.viewAllButtonText}>Ver Todas as Plantas</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {initialRegion && (
        <MapView style={styles.map} initialRegion={initialRegion}>
          {filteredPlants.map((plant, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: plant.latitude,
                longitude: plant.longitude,
              }}
              title={plant.common_name}
              description={plant.scientific_name}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#D4E6C3',
  },
  header: {
    fontSize: 40,
    color: 'black',
    textShadowColor: 'white',
    fontFamily: 'Outfit-Regular',
    textShadowRadius: 20,
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 30,
  },
  pickerContainer: {
    height: 40,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
  },
  picker: {
    height: '100%',
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
  },
  viewAllButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: 16,
  },
  map: {
    flex: 1,
    marginTop: 20,
  },
});
