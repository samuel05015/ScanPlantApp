import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { database } from './supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BaseStyles, Icons } from './styles/DesignSystem';

const { width, height } = Dimensions.get('window');

const PlantDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { plant } = route.params;
  const [imageLoaded, setImageLoaded] = useState(false);

  const deletePlant = async () => {
    Alert.alert(
      'Excluir Planta',
      'Tem certeza que deseja excluir esta planta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await database.delete('plants', { id: plant.id });
              if (error) {
                Alert.alert('Erro', 'Falha ao excluir planta: ' + error.message);
              } else {
                Alert.alert('Sucesso', 'Planta excluída com sucesso!');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro inesperado ao excluir planta');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header com botão voltar */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={deletePlant}
          >
            <Text style={styles.deleteButtonText}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>

        {/* Imagem da planta */}
        <View style={styles.imageContainer}>
          {plant.image_data ? (
            <>
              {!imageLoaded && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando imagem...</Text>
                </View>
              )}
              <Image
                source={{ uri: plant.image_data }}
                style={[styles.plantImage, !imageLoaded && styles.hiddenImage]}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.warn('Erro ao carregar imagem da planta');
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>🌱</Text>
              <Text style={styles.noImageSubtext}>Imagem não disponível</Text>
            </View>
          )}
        </View>

        {/* Informações da planta */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>Informações da Planta</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome Comum:</Text>
            <Text style={styles.infoValue}>
              {plant.common_name || 'Nome não disponível'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome Científico:</Text>
            <Text style={styles.infoValueItalic}>
              {plant.scientific_name || 'Nome científico não disponível'}
            </Text>
          </View>

          {plant.family && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Família:</Text>
              <Text style={styles.infoValue}>{plant.family}</Text>
            </View>
          )}

          {plant.genus && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Gênero:</Text>
              <Text style={styles.infoValue}>{plant.genus}</Text>
            </View>
          )}

          {plant.wiki_description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Descrição:</Text>
              <Text style={styles.infoValue}>{plant.wiki_description}</Text>
            </View>
          )}

          {plant.care_instructions && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Cuidados:</Text>
              <Text style={styles.infoValue}>{plant.care_instructions}</Text>
            </View>
          )}

          {plant.enhanced_description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Informações Adicionais:</Text>
              <Text style={styles.infoValue}>{plant.enhanced_description}</Text>
            </View>
          )}

          {/* Localização */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>📍 Localização</Text>
            
            {plant.city && (
              <Text style={styles.locationText}>Cidade: {plant.city}</Text>
            )}
            
            {plant.location_name && (
              <Text style={styles.locationText}>Local: {plant.location_name}</Text>
            )}
            
            {plant.latitude && plant.longitude && (
              <Text style={styles.locationText}>
                Coordenadas: {plant.latitude.toFixed(6)}, {plant.longitude.toFixed(6)}
              </Text>
            )}
          </View>

          {/* Data de criação */}
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              📅 Salva em: {formatDate(plant.created_at)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  backButtonText: {
    ...Typography.styles.h4,
    color: Colors.text.inverse,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  deleteButtonText: {
    fontSize: 18,
    color: Colors.text.inverse,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  hiddenImage: {
    opacity: 0,
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  noImageText: {
    fontSize: 60,
    marginBottom: 10,
  },
  noImageSubtext: {
    color: '#666',
    fontSize: 16,
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  infoValueItalic: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  locationContainer: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.sm,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  dateContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PlantDetailScreen;