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
        <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.85}>
          <Text style={styles.buttonText}>OK, ENTENDI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F7F2',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
  },
  img: {
    width: width,
    height: height,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  button: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: '#6F9D3C',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ScreenPasso;
