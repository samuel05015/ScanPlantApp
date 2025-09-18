import React from 'react';
import {
  ScrollView,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ScreenPasso = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ImageBackground
        source={require('../assets/passoapasso.png')}
        style={styles.img}
        resizeMode="cover"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handlePress} style={styles.button}>
          <Text style={styles.buttonText}>OK, ENTENDI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#BED9A7',
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  img: {
    width: width,
    height: height , // Ajuste para garantir espaço para o botão
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    width: 150,
    borderRadius: 20,
    backgroundColor: '#809E40',
    paddingVertical: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default ScreenPasso;
