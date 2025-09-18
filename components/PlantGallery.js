import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { database } from './supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BaseStyles, Icons } from './styles/DesignSystem';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 2;

const PlantGallery = ({ navigation }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlants = async () => {
    try {
      console.log('Carregando plantas do banco...');
      const { data, error } = await database.select('plants', '*');
      
      if (error) {
        console.error('Erro ao carregar plantas:', error);
        Alert.alert('Erro', 'Falha ao carregar plantas: ' + error.message);
        return;
      }
      
      console.log('Plantas carregadas:', data?.length || 0);
      setPlants(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      Alert.alert('Erro', 'Erro inesperado ao carregar plantas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const PlantItem = React.memo(({ item }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity 
        style={styles.plantItem}
        onPress={() => {
           console.log('Navegando para detalhes da planta:', item.id);
           navigation.navigate('PlantDetail', { plant: item });
         }}
      >
        {item.image_data && !imageError ? (
          <>
            {!imageLoaded && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            )}
            <Image 
              source={{ uri: item.image_data }} 
              style={[styles.plantImage, !imageLoaded && styles.hiddenImage]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.warn('Erro ao carregar imagem:', item.id);
                setImageError(true);
              }}
            />
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>🌱</Text>
          </View>
        )}
        
        <View style={styles.plantInfo}>
          <Text style={styles.commonName} numberOfLines={1}>
            {item.common_name || 'Nome não disponível'}
          </Text>
          <Text style={styles.scientificName} numberOfLines={1}>
            {item.scientific_name || 'Nome científico não disponível'}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            📍 {item.city || 'Local não disponível'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  const renderPlantItem = ({ item }) => <PlantItem item={item} />;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary[500]} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{Icons.back}</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Minhas Plantas</Text>
          </View>
          <View style={styles.headerAction} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingIcon}>{Icons.loading}</Text>
          <Text style={styles.loadingText}>Carregando plantas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (plants.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary[500]} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{Icons.back}</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Minhas Plantas</Text>
          </View>
          <View style={styles.headerAction} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>{Icons.plant}</Text>
          <Text style={styles.emptyText}>Nenhuma planta salva ainda</Text>
          <Text style={styles.emptySubtext}>Tire uma foto de uma planta para começar!</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('PhotoScreen')}
          >
            <Text style={styles.emptyButtonText}>Identificar Planta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary[500]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{Icons.back}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Minhas Plantas</Text>
          <Text style={styles.headerSubtitle}>{plants.length} plantas encontradas</Text>
        </View>
        
        <View style={styles.headerAction} />
      </View>

      <FlatList
        data={plants}
        renderItem={renderPlantItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        style={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={10}
        initialNumToRender={6}
        getItemLayout={(data, index) => ({
          length: 200,
          offset: 200 * Math.floor(index / 2),
          index,
        })}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...BaseStyles.container,
  },
  
  header: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  backButtonText: {
    fontSize: 20,
    color: Colors.text.inverse,
  },
  
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    ...Typography.styles.h3,
    color: Colors.text.inverse,
  },
  
  headerSubtitle: {
    ...Typography.styles.small,
    color: Colors.primary[100],
  },
  
  headerAction: {
    width: 40,
  },
  
  list: {
    backgroundColor: Colors.background.secondary,
  },
  
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  
  plantItem: {
    width: itemWidth,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    margin: Spacing.sm,
    ...Shadows.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  
  plantImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  
  noImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  
  noImageText: {
    fontSize: 32,
    color: Colors.neutral[400],
  },
  
  loadingContainer: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  
  loadingText: {
    ...Typography.styles.caption,
    marginTop: Spacing.xs,
  },
  
  hiddenImage: {
    opacity: 0,
  },
  
  plantInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  
  commonName: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary[600],
    marginBottom: Spacing.xs,
  },
  
  scientificName: {
    ...Typography.styles.caption,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  
  location: {
    ...Typography.styles.small,
    color: Colors.text.tertiary,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.xl,
  },
  
  loadingIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
    color: Colors.primary[500],
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
    color: Colors.neutral[300],
  },
  
  emptyText: {
    ...Typography.styles.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.text.secondary,
  },
  
  emptySubtext: {
    ...Typography.styles.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.text.tertiary,
  },
  
  emptyButton: {
    ...BaseStyles.buttonPrimary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    ...Shadows.lg,
  },
  
  emptyButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.inverse,
  },
});

export default PlantGallery;