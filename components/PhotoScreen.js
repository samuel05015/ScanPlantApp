import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import { auth, database, storage } from './supabase'; // Importing Supabase
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BaseStyles, Icons } from './styles/DesignSystem';

const PLANT_ID_API_KEY = 'lz8GUbeXEkLexa0nWTZ0n1dU8DOOiLMdeOPA3BY5nWrC2p2D6O';
const PLANT_ID_API_URL = 'https://api.plant.id/v2/identify';

// API Groq para informações adicionais da planta
const GROQ_API_KEY = 'gsk_your_api_key_here'; // Substitua pela sua chave da API Groq
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const PROHIBITED_WORDS = [
  'vai tomar no cu',
  'merda',
  'caralho',
  'puta',
  'foda-se',
  'arrombado',
  'desgraçado',
  'filho da puta',
  'cacete',
  'porra',
  'bosta',
  'vagabundo',
  'buceta',
  'piranha',
  'mermão',
  'cu',
  'cuzão',
  'safado',
  'vagabunda',
  'pau no cu',
  'idiota',
  'imbecil',
  'estúpido',
  'burro',
  'otário',
  'cabeça de bagre',
  'pinto',
  'fuleiragem',
  'cagaço',
  'xoxota',
  'filha da puta',
  'boceta',
  'poceta',
  'fdp',
  'pp',
  'pv',
  'bdo',
  'vag',
  'cuz',
  'pvc',
  'nss',
  'saf',
  'merd',
  'xxta',
  'bct',
  'cusao',
  'piri',
  'foda',
  'bocet',
  'bag',
  'arrom',
  'cace',
  'cfc',
  'pqp',
];

export default function PhotoScreen() {
  const navigation = useNavigation();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [plantData, setPlantData] = useState({
    common_name: '',
    scientific_name: '',
    family: '',
    genus: '',
    wiki_description: '',
    wiki_url: '',
    care_instructions: '',
    enhanced_description: '',
  });
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const viewShotRef = useRef(null);

  const REVERSE_GEOCODING_API_URL =
    'https://nominatim.openstreetmap.org/reverse';

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `${REVERSE_GEOCODING_API_URL}?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      if (data.address) {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          'Cidade Não Disponível';
        const road = data.address.road || '';
        const neighborhood = data.address.neighbourhood || '';
        const exactLocation = `${road}, ${neighborhood}, ${city}`;
        return { exactLocation, city };
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
    }
    return {
      exactLocation: 'Nome do Local Não Disponível',
      city: 'Cidade Não Disponível',
    };
  };

  useEffect(() => {
    (async () => {
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus === 'granted');

      if (locationStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  useEffect(() => {
    if (plantData.wiki_description === 'Descrição não encontrada.') {
      setPlantData((prevData) => ({
        ...prevData,
        common_name: 'Nome Comum Não Disponível',
      }));
    }
  }, [plantData.wiki_description]);

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    authenticateAnonymously();
  }, []);

  const authenticateAnonymously = async () => {
    try {
      // Supabase não requer autenticação anônima para operações públicas
      // Se necessário, pode implementar autenticação de usuário aqui
      console.log('Supabase ready for operations');
    } catch (error) {
      console.error('Error during Supabase setup:', error);
    }
  };

  if (!permission || !permission.granted) {
    return <View />;
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const pickImage = async () => {
    try {
      // Solicitar permissões da galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso à galeria para selecionar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        identifyPlant(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao tentar selecionar a imagem. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const takePicture = async () => {
    try {
      // Solicitar permissões da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso à câmera para tirar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        identifyPlant(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao tentar tirar a foto. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const identifyPlant = async (uri) => {
    setLoading(true);
    setPlantData({
      common_name: '',
      scientific_name: '',
      family: '',
      genus: '',
      wiki_description: '',
      wiki_url: '',
      care_instructions: '',
      enhanced_description: '',
    });

    try {
      let formData = new FormData();
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      });
      formData.append('organs', JSON.stringify(['leaf']));
      formData.append('include_related_images', JSON.stringify(false));

      const plantIdResponse = await fetch(PLANT_ID_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Api-Key': PLANT_ID_API_KEY,
        },
        body: formData,
      });

      if (!plantIdResponse.ok) {
        throw new Error('Error in Plant.id API request');
      }

      const plantIdData = await plantIdResponse.json();

      if (plantIdData.suggestions && plantIdData.suggestions.length > 0) {
        const plantDetails = plantIdData.suggestions[0].plant_details;
        const scientificName =
          plantDetails.scientific_name || 'Nome Científico Não Disponível';
        const commonName =
          plantDetails.common_names && plantDetails.common_names.length > 0
            ? plantDetails.common_names[0]
            : 'Nome Comum Não Disponível';
        const family = plantDetails.family || 'Família Não Disponível';
        const genus = plantDetails.genus || 'Gênero Não Disponível';

        // Fetch description from Wikipedia
        const description = await fetchWikipediaData(scientificName);
        
        // Fetch additional info using AI
        const aiInfo = await fetchPlantInfoWithAI(scientificName);

        setPlantData({
          common_name: aiInfo.common_name || commonName,
          scientific_name: scientificName,
          family: family,
          genus: genus,
          wiki_description: description || 'Descrição Não Disponível',
          wiki_url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(
            scientificName.replace(/\s+/g, '_')
          )}`,
          enhanced_description: aiInfo.enhanced_description,
          care_instructions: aiInfo.care_instructions,
        });
      } else {
        Alert.alert(
          'Erro',
          'Nenhuma sugestão de planta encontrada. Verifique a imagem e tente novamente.'
        );
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWikipediaData = async (scientificName) => {
    try {
      const response = await fetch(
        `https://pt.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(
          scientificName
        )}&prop=extracts&exchars=500&explaintext=true&utf8=1&redirects=1`
      );
      const data = await response.json();

      const page = Object.values(data.query.pages)[0];
      if (page && page.extract) {
        return page.extract;
      }
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
    }
    return 'Descrição não encontrada.';
  };

  // Base de dados local com informações completas de plantas
  const plantDatabase = {
    'Rosa': {
      common_name: 'Rosa',
      enhanced_description: 'A rosa é uma das plantas ornamentais mais cultivadas e admiradas no mundo, pertencente à família Rosaceae. Originária do hemisfério norte, especialmente da Ásia, Europa e América do Norte, esta planta perene possui mais de 100 espécies naturais e milhares de variedades híbridas. Suas flores, que variam do branco puro ao vermelho intenso, passando por tons de rosa, amarelo e laranja, são compostas por pétalas delicadas e perfumadas que exalam fragrâncias únicas. As folhas são compostas, serrilhadas nas bordas, e os caules possuem espinhos característicos que servem como proteção natural. A rosa simboliza amor, paixão, pureza e beleza em diversas culturas, sendo amplamente utilizada em perfumaria, culinária e medicina tradicional. Suas propriedades incluem ação anti-inflamatória, antioxidante e calmante.',
      care_instructions: '• Rega: 2-3 vezes por semana pela manhã, evitando molhar folhas para prevenir fungos\n• Luz: Sol pleno (mínimo 6 horas diárias) para floração abundante\n• Solo: Bem drenado, rico em matéria orgânica, pH entre 6,0-7,0\n• Temperatura: 15-25°C, resistente ao frio moderado\n• Poda: Remover flores murchas, galhos secos e fazer poda de formação no inverno\n• Fertilização: Adubo orgânico mensalmente na primavera e verão'
    },
    'Aloe vera': {
      common_name: 'Babosa',
      enhanced_description: 'A Aloe vera, conhecida popularmente como babosa, é uma suculenta medicinal extraordinária da família Asphodelaceae, originária da Península Arábica e norte da África. Esta planta perene forma rosetas de folhas carnosas, triangulares e pontiagudas, que podem atingir até 60cm de comprimento. Suas folhas verde-acinzentadas possuem bordas serrilhadas e armazenam um gel transparente rico em mais de 75 compostos ativos, incluindo vitaminas A, C, E, aminoácidos, enzimas, polissacarídeos e minerais. Utilizada há mais de 4.000 anos por civilizações antigas como egípcios, gregos e romanos, a babosa é reconhecida mundialmente por suas propriedades cicatrizantes, anti-inflamatórias, hidratantes e antimicrobianas. Produz flores tubulares amarelas ou alaranjadas em hastes altas durante o verão. É uma das plantas medicinais mais estudadas cientificamente.',
      care_instructions: '• Rega: 1 vez por semana no verão, quinzenal no inverno (solo deve secar completamente)\n• Luz: Luz indireta brilhante, evitar sol direto intenso que pode queimar as folhas\n• Solo: Bem drenado, específico para suculentas ou mistura com areia grossa\n• Temperatura: 18-27°C, não tolera geadas ou temperaturas abaixo de 10°C\n• Drenagem: Essencial para evitar apodrecimento das raízes\n• Fertilização: Adubo líquido diluído mensalmente na primavera'
    },
    'Ficus': {
      common_name: 'Ficus',
      enhanced_description: 'O Ficus é um gênero diversificado da família Moraceae, compreendendo mais de 800 espécies de árvores, arbustos e trepadeiras, distribuídas principalmente em regiões tropicais e subtropicais. Originário principalmente da Ásia e África, o ficus é reconhecido por suas folhas brilhantes, coriáceas e de formato variado, que podem ser ovais, elípticas ou lobadas. Muitas espécies possuem raízes aéreas impressionantes e produzem um látex branco quando cortadas. São plantas extremamente adaptáveis, capazes de crescer tanto em ambientes internos quanto externos, e algumas espécies como a Ficus benjamina são excelentes purificadoras de ar, removendo formaldeído, xileno e tolueno. Na natureza, podem atingir dimensões monumentais, com algumas espécies vivendo centenas de anos. Possuem grande importância ecológica, servindo de alimento para diversas espécies de animais e sendo consideradas sagradas em algumas culturas.',
      care_instructions: '• Rega: Manter solo levemente úmido, sem encharcar (teste com o dedo)\n• Luz: Sol pleno a meia sombra, adapta-se bem a ambientes internos\n• Solo: Fértil, bem drenado e rico em matéria orgânica\n• Temperatura: 20-30°C, clima tropical a subtropical\n• Poda: Pode ser podado para controlar tamanho e forma\n• Umidade: Borrifar folhas ocasionalmente em ambientes secos'
    },
    'Monstera': {
      common_name: 'Costela-de-Adão',
      enhanced_description: 'A Monstera deliciosa, popularmente conhecida como Costela-de-Adão, é uma planta tropical espetacular da família Araceae, nativa das florestas tropicais do México e América Central. Esta trepadeira epífita é famosa por suas folhas gigantescas, que podem atingir até 90cm de diâmetro, apresentando perfurações e fendas naturais características (fenestração) que se desenvolvem conforme a planta amadurece. Essas aberturas únicas não são apenas decorativas, mas servem como adaptação evolutiva para resistir a ventos fortes e permitir que a luz solar alcance as folhas inferiores. Na natureza, utiliza raízes aéreas para escalar árvores em busca de luz, podendo atingir até 20 metros de altura. Produz frutos comestíveis que levam mais de um ano para amadurecer e têm sabor que lembra abacaxi com banana. É uma das plantas de interior mais populares atualmente, simbolizando sofisticação e conexão com a natureza.',
      care_instructions: '• Rega: 1-2 vezes por semana, manter solo úmido mas nunca encharcado\n• Luz: Luz indireta brilhante, evitar sol direto que pode queimar as folhas\n• Solo: Rico em matéria orgânica, bem drenado e aerado\n• Temperatura: 18-27°C, alta umidade do ar (50-60%)\n• Suporte: Fornecer tutor ou vara de musgo para plantas maiores\n• Limpeza: Limpar folhas regularmente com pano úmido'
    },
    'Spathiphyllum': {
      common_name: 'Lírio-da-Paz',
      enhanced_description: 'O Spathiphyllum, conhecido como Lírio-da-Paz ou Bandeira-Branca, é uma planta herbácea perene da família Araceae, originária das florestas tropicais da América Central e do Sul, especialmente Colômbia e Venezuela. Esta elegante planta de interior é caracterizada por suas folhas verde-escuras brilhantes, lanceoladas e arqueadas, que emergem diretamente do solo formando touceiras densas. Suas flores são na verdade inflorescências compostas por uma espata branca (bráctea modificada) que envolve um espádice amarelo-esverdeado onde se encontram as pequenas flores verdadeiras. É uma das plantas mais eficazes na purificação do ar interior, removendo toxinas como amônia, benzeno, formaldeído e tricloroetileno, sendo reconhecida pela NASA em seus estudos sobre plantas purificadoras. Floresce durante todo o ano em condições adequadas e é considerada símbolo de paz, pureza e prosperidade.',
      care_instructions: '• Rega: 2 vezes por semana, manter solo consistentemente úmido mas não encharcado\n• Luz: Meia sombra a sombra, tolera muito bem ambientes com pouca luz\n• Solo: Rico em matéria orgânica, bem drenado e levemente ácido\n• Temperatura: 18-25°C, alta umidade ambiente\n• Fertilização: Adubo líquido diluído mensalmente na primavera e verão\n• Cuidados: Remover flores murchas e folhas amareladas'
    }
  };

  // Função para buscar informações adicionais usando base local e simulação de IA
  const fetchPlantInfoWithAI = async (scientificName) => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar na base local primeiro
      const localInfo = plantDatabase[scientificName];
      if (localInfo) {
        return localInfo;
      }
      
      // Buscar por palavras-chave no nome científico
      const keywords = scientificName.toLowerCase();
      for (const [key, value] of Object.entries(plantDatabase)) {
        if (keywords.includes(key.toLowerCase()) || key.toLowerCase().includes(keywords.split(' ')[0])) {
          return value;
        }
      }
      
      // Gerar informações genéricas baseadas no nome científico
      const genus = scientificName.split(' ')[0];
      return {
        common_name: `Planta do gênero ${genus}`,
        enhanced_description: `Esta é uma espécie do gênero ${genus}, uma planta com características únicas. Recomenda-se pesquisar mais sobre suas propriedades específicas.`,
        care_instructions: '• Rega: Manter solo levemente úmido\n• Luz: Luz indireta brilhante\n• Solo: Bem drenado\n• Temperatura: Entre 18-25°C'
      };
    } catch (error) {
      console.error('Erro ao buscar informações:', error);
      return {
        common_name: 'Nome comum não disponível',
        enhanced_description: 'Descrição não disponível no momento.',
        care_instructions: 'Instruções de cuidado não disponíveis no momento.'
      };
    }
  };

  const handleCancel = () => {
    setImage(null);
    setPlantData({
      common_name: '',
      scientific_name: '',
      family: '',
      genus: '',
      wiki_description: '',
      wiki_url: '',
      care_instructions: '',
      enhanced_description: '',
    });
  };

  const saveToDatabase = async (
    imageBase64,
    plantData,
    location,
    exactLocation,
    cityName
  ) => {
    try {
      const plantRecord = {
        image_data: imageBase64,
        scientific_name: plantData.scientific_name,
        common_name: plantData.common_name,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: cityName,
        location_name: exactLocation,
        wiki_description: plantData.wiki_description || '',
        family: plantData.family || '',
        genus: plantData.genus || '',
        care_instructions: plantData.care_instructions || '',
        enhanced_description: plantData.enhanced_description || ''
      };
      
      console.log('Salvando dados da planta:', plantRecord);
      const { data, error } = await database.insert('plants', plantRecord);
      
      if (error) {
        console.error('Erro detalhado do banco:', error);
        throw new Error(error.message);
      }
      
      console.log('Dados salvos com sucesso no Supabase:', data);
      return data;
    } catch (error) {
      console.error('Erro ao salvar no banco de dados:', error);
      throw new Error('Falha ao salvar no banco: ' + error.message);
    }
  };

  const containsProhibitedWords = (text) => {
    return PROHIBITED_WORDS.some((word) => text.toLowerCase().includes(word));
  };

  // Função para otimizar salvamento (sem compressão por enquanto)
  const optimizeForSaving = (base64Data) => {
    try {
      // Verificar se é muito grande e avisar
      const sizeKB = Math.round(base64Data.length / 1024);
      console.log('Tamanho final da imagem:', sizeKB + ' KB');
      
      if (sizeKB > 1000) {
        console.warn('Imagem grande detectada:', sizeKB + ' KB');
      }
      
      return base64Data;
    } catch (error) {
      console.error('Erro na otimização:', error);
      return base64Data;
    }
  };

  const saveData = async () => {
    if (!plantData.scientific_name || plantData.scientific_name === 'Nome Científico Não Disponível') {
      Alert.alert(
        'Erro',
        'Nome científico não disponível. Por favor, tire uma nova foto.'
      );
      return;
    }

    if (containsProhibitedWords(plantData.common_name)) {
      Alert.alert(
        'Erro',
        'O Nome Comum contém palavras impróprias. Por favor, insira um nome válido.'
      );
      return;
    }

    if (!image) {
      Alert.alert('Erro', 'Nenhuma imagem disponível para salvar.');
      return;
    }

    try {
      // Show loading screen
      navigation.navigate('LoadingSave');

      console.log('Iniciando processo de salvamento...');
      
      // Converter imagem para base64 com otimização
      console.log('Convertendo imagem para base64...');
      
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error('Falha ao acessar a imagem');
      }
      
      const blob = await response.blob();
      
      // Verificar tamanho do blob
      const blobSizeMB = blob.size / (1024 * 1024);
      console.log('Tamanho da imagem:', blobSizeMB.toFixed(2) + ' MB');
      
      if (blobSizeMB > 5) {
        Alert.alert('Aviso', 'Imagem muito grande. Isso pode causar lentidão.');
      }
      
      const reader = new FileReader();
      
      const imageBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result;
          const sizeKB = Math.round(result.length / 1024);
          console.log('Base64 gerado, tamanho:', sizeKB + ' KB');
          
          // Verificar se a imagem é muito grande
          if (sizeKB > 2000) { // Limite de 2MB em base64
            Alert.alert(
              'Imagem Muito Grande',
              'Esta imagem pode causar lentidão. Recomendamos tirar uma foto com menor resolução.',
              [
                { text: 'Cancelar', onPress: () => reject(new Error('Imagem cancelada pelo usuário')) },
                { text: 'Continuar Mesmo Assim', onPress: () => resolve(optimizeForSaving(result)) }
              ]
            );
          } else {
            resolve(optimizeForSaving(result));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('Imagem processada com sucesso');

      const { exactLocation, city } = await getLocationName(
        location.coords.latitude,
        location.coords.longitude
      );

      console.log('Localização obtida:', { exactLocation, city });

      // Salvar dados diretamente no banco
      await saveToDatabase(
        imageBase64,
        plantData,
        location,
        exactLocation,
        city
      );

      console.log('Planta salva com sucesso!');
      Alert.alert('Sucesso!', 'Planta salva com sucesso!');
      
      // Navigate back to the previous screen after saving
      navigation.goBack();

      // Show success message
      Alert.alert('Sucesso', 'Imagem e dados salvos com sucesso!');
    } catch (error) {
      console.error('Error during saveData:', error);
      Alert.alert('Erro', 'Erro ao salvar a imagem: ' + error.message);

      // Navigate back to the previous screen in case of error
      navigation.goBack();
    }
  };

  const openWikipedia = () => {
    if (plantData.wiki_url) {
      Linking.openURL(plantData.wiki_url);
    } else {
      Alert.alert('Erro', 'URL do Wikipedia não disponível.');
    }
  };



  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <ViewShot
        ref={viewShotRef}
        options={{ quality: 10 }}
        style={styles.ViewShot}>
        
        {/* Header Moderno */}
        <View style={styles.modernHeader}>
          <View style={styles.headerIconContainer}>
             <Text style={styles.headerIcon}>{Icons.identify}</Text>
           </View>
          <Text style={styles.modernTitle}>Identificação de Plantas</Text>
          <Text style={styles.modernSubtitle}>Capture ou selecione uma foto para identificar a espécie</Text>
        </View>

        {/* Câmera ou Imagem */}
        {image ? (
          <View style={styles.imageContainer}>
            <View style={styles.imageFrame}>
              <Image source={{ uri: image }} style={styles.image} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.retakeButton} onPress={() => setImage(null)}>
                  <Text style={styles.retakeText}>{Icons.camera} Nova Foto</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <View style={styles.cameraFrame}>
              <CameraView style={styles.camera} facing={facing}>
                <View style={styles.cameraOverlay}>
                  <View style={styles.focusFrame} />
                </View>
                <View style={styles.bottomBar}>
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={pickImage}>
                    <View style={styles.buttonBackground}>
                      <Image
                        source={require('../assets/fotogaleria.png')}
                        style={styles.icongalery}
                      />
                    </View>
                    <Text style={styles.buttonLabel}>Galeria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePicture}>
                    <View style={styles.captureButtonOuter}>
                      <View style={styles.captureButtonInner}>
                        <Image
                          source={require('../assets/logocamera.png')}
                          style={styles.icon}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.flipButton}
                    onPress={toggleCameraFacing}>
                    <View style={styles.buttonBackground}>
                      <Text style={styles.flipIcon}>{Icons.rotate}</Text>
                    </View>
                    <Text style={styles.buttonLabel}>Virar</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          </View>
        )}

        {/* Divisor Elegante */}
        <View style={styles.elegantDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{Icons.location}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Seção de Localização Moderna */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>Localização da Planta</Text>
            <Text style={styles.locationSubtitle}>Onde esta planta foi encontrada</Text>
          </View>
          
          {location ? (
            <View style={styles.locationContent}>
              <View style={styles.modernMapContainer}>
                <MapView
                  style={styles.modernMap}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}>
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Localização da Planta"
                    description="Planta identificada aqui"
                  />
                </MapView>
              </View>
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesLabel}>Coordenadas:</Text>
                <Text style={styles.coordinatesValue}>
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingLocationContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingLocationText}>Obtendo localização...</Text>
            </View>
          )}
        </View>

        {/* Seção de Características Moderna */}
        <View style={styles.modernCharacteristicsContainer}>
          <View style={styles.characteristicsHeader}>
            <Text style={styles.characteristicsTitle}>Análise da Planta</Text>
            <Text style={styles.characteristicsSubtitle}>Informações científicas identificadas</Text>
          </View>

          {loading && (
            <View style={styles.analysisLoadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.analysisLoadingText}>Analisando planta...</Text>
              <Text style={styles.analysisLoadingSubtext}>Identificando espécie e características</Text>
            </View>
          )}

          {plantData.scientific_name && (
            <View style={styles.scientificNameContainer}>
              <Text style={styles.scientificNameLabel}>Nome Científico:</Text>
              <View style={styles.scientificNameCard}>
                <Text style={styles.scientificNameValue}>{plantData.scientific_name}</Text>
              </View>
            </View>
          )}

          {/* Informações da Planta - Só aparecem após identificação */}
          {(plantData.scientific_name || plantData.common_name) && (
            <View style={styles.plantInfoContainer}>
              <View style={styles.plantHeader}>
                <Text style={styles.plantTitle}>🌿 Planta Identificada</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Nome Científico */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Nome Científico</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.scientificNameText}>{plantData.scientific_name}</Text>
                </View>
              </View>

              {/* Nome Comum */}
              {plantData.common_name && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Nome Popular</Text>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoText}>{plantData.common_name}</Text>
                  </View>
                </View>
              )}

              {/* Descrição Completa */}
              {(plantData.enhanced_description || plantData.wiki_description) && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Sobre Esta Planta</Text>
                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionText}>
                      {plantData.enhanced_description || plantData.wiki_description}
                    </Text>
                  </View>
                </View>
              )}

              {/* Cuidados e Cultivo */}
              {plantData.care_instructions && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Guia de Cuidados</Text>
                  <View style={styles.careCard}>
                    <Text style={styles.careText}>{plantData.care_instructions}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ViewShot>
      {plantData.wiki_url ? (
        <TouchableOpacity onPress={openWikipedia}>
          <Text style={styles.linkText}>Saiba mais na Wikipedia</Text>
        </TouchableOpacity>
      ) : null}

      {/* Botões de Ação Modernos */}
      <View style={styles.modernButtonsContainer}>
        <TouchableOpacity style={styles.modernSaveButton} onPress={saveData}>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>{Icons.save}</Text>
            <Text style={styles.modernSaveButtonText}>Salvar Planta</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modernCancelButton} onPress={handleCancel}>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>{Icons.cancel}</Text>
            <Text style={styles.modernCancelButtonText}>Cancelar</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  ViewShot: {
    backgroundColor: Colors.background.primary,
    marginBottom: 0,
    width: '100%',
  },
  
  // Header Moderno
  modernHeader: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.primary[200],
  },
  
  headerIcon: {
    fontSize: 36,
    color: Colors.primary[600],
  },
  
  modernTitle: {
    ...Typography.styles.h1,
    color: Colors.primary[700],
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  modernSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  
  // Camera Styles
  cameraContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraFrame: {
    width: 350,
    height: 350,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.xl,
    borderWidth: 3,
    borderColor: Colors.primary[200],
  },
  camera: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 200,
    height: 200,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  galleryButton: {
    alignItems: 'center',
  },
  flipButton: {
    alignItems: 'center',
  },
  buttonBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 12,
    marginBottom: 5,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  captureButton: {
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: {
    fontSize: 20,
  },
  
  // Image Styles
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageFrame: {
    width: 350,
    height: 350,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retakeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Divider Styles
  elegantDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
  },
  dividerText: {
    fontSize: 24,
    marginHorizontal: Spacing.md,
    color: Colors.primary[500],
  },
  
  // Location Styles
  locationSection: {
    width: '100%',
    marginBottom: 25,
  },
  locationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  locationTitle: {
    ...Typography.styles.h3,
    color: Colors.primary[600],
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  locationSubtitle: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  locationContent: {
    alignItems: 'center',
  },
  modernMapContainer: {
    width: Dimensions.get('window').width - 30,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  modernMap: {
    width: '100%',
    height: '100%',
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  coordinatesValue: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  loadingLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingLocationText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  
  // Characteristics Styles
  modernCharacteristicsContainer: {
    width: '100%',
    marginBottom: 25,
  },
  characteristicsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  characteristicsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  characteristicsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  analysisLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  analysisLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 15,
    marginBottom: 5,
  },
  analysisLoadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scientificNameContainer: {
    marginBottom: 20,
  },
  scientificNameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  scientificNameCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  scientificNameText: {
     ...Typography.styles.h3,
     color: Colors.primary[700],
     fontStyle: 'italic',
     textAlign: 'center',
   },
  
  sectionTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  plantInfoContainer: {
     width: '100%',
     marginTop: 20,
     backgroundColor: '#ffffff',
     borderRadius: 20,
     padding: 25,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 6,
     },
     shadowOpacity: 0.15,
     shadowRadius: 12,
     elevation: 10,
   },
   plantHeader: {
     alignItems: 'center',
     marginBottom: 25,
   },
   plantTitle: {
     ...Typography.styles.h2,
     color: Colors.primary[600],
     marginBottom: Spacing.md,
     textAlign: 'center',
   },
   infoSection: {
     marginBottom: 20,
   },
   infoCard: {
     backgroundColor: Colors.primary[50],
     borderRadius: BorderRadius.xl,
     padding: Spacing.lg,
     borderLeftWidth: 4,
     borderLeftColor: Colors.primary[500],
     ...Shadows.md,
     marginBottom: Spacing.md,
   },
   descriptionCard: {
     backgroundColor: Colors.background.primary,
     borderRadius: BorderRadius.xl,
     padding: Spacing.xl,
     borderLeftWidth: 4,
     borderLeftColor: Colors.primary[600],
     ...Shadows.lg,
     marginBottom: Spacing.md,
     borderWidth: 1,
     borderColor: Colors.primary[100],
   },
   careCard: {
     backgroundColor: Colors.warning + '10',
     borderRadius: BorderRadius.xl,
     padding: Spacing.xl,
     borderLeftWidth: 4,
     borderLeftColor: Colors.warning,
     ...Shadows.md,
     marginBottom: Spacing.md,
     borderWidth: 1,
     borderColor: Colors.warning + '30',
   },
   infoText: {
     ...Typography.styles.bodyMedium,
     color: Colors.primary[700],
   },
   descriptionText: {
     ...Typography.styles.body,
     color: Colors.text.primary,
     lineHeight: 24,
     textAlign: 'justify',
   },
   careText: {
     ...Typography.styles.body,
     color: Colors.text.secondary,
     lineHeight: 22,
   },
  
  // Link Styles
  linkText: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary[600],
    textDecorationLine: 'underline',
    marginBottom: Spacing.xl,
    marginLeft: Spacing.xs,
  },
  
  // Modern Button Styles
  modernButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 40,
    gap: 15,
  },
  modernSaveButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    ...Shadows.lg,
  },
  modernCancelButton: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    ...Shadows.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
    color: Colors.text.inverse,
  },
  modernSaveButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.inverse,
  },
  modernCancelButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.inverse,
  },
  
  // Icon Styles
  icon: {
    width: 30,
    height: 30,
  },
  icongalery: {
    width: 24,
    height: 24,
  },
});
