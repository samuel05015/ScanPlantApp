import React, { Component } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from './supabase';

class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      senha: '',
      errorMessage: '',
      successMessage: '', // Adiciona um estado para mensagens de sucesso
    };

    this.login = this.login.bind(this);
    this.resetPassword = this.resetPassword.bind(this); // Bind para o resetPassword
  }

  async login() {
    try {
      const { data, error } = await auth.signIn(this.state.email, this.state.senha);
      
      if (error) {
        // Mapear erros do Supabase para mensagens em português
        switch (error.message) {
          case 'Invalid login credentials':
            this.setState({ errorMessage: 'Email ou senha incorretos!' });
            break;
          case 'Email not confirmed':
            this.setState({ errorMessage: 'Email não confirmado! Verifique sua caixa de entrada.' });
            break;
          case 'Too many requests':
            this.setState({ errorMessage: 'Muitas tentativas. Tente novamente mais tarde.' });
            break;
          default:
            this.setState({
              errorMessage: 'Ocorreu um erro! Tente novamente mais tarde!',
            });
            break;
        }
      } else {
        // Login bem-sucedido
        this.setState({ errorMessage: '', successMessage: '' });
        this.props.navigation.navigate('HomeScreen');
      }
    } catch (error) {
      this.setState({
        errorMessage: 'Erro de conexão! Verifique sua internet.',
      });
    }
  }

  async resetPassword() {
    if (!this.state.email) {
      this.setState({
        errorMessage: 'Digite seu email antes de solicitar a redefinição de senha.',
        successMessage: '',
      });
      return;
    }

    try {
      const { data, error } = await auth.resetPassword(this.state.email);
      
      if (error) {
        this.setState({
          errorMessage: 'Erro ao enviar email de redefinição. Verifique o email.',
          successMessage: '',
        });
      } else {
        this.setState({
          successMessage: 'Email de redefinição de senha enviado!',
          errorMessage: '',
        });
      }
    } catch (error) {
      this.setState({
        errorMessage: 'Erro de conexão! Verifique sua internet.',
        successMessage: '',
      });
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/imagemlogotcc.png')}
          style={styles.logo}
        />

        <Text style={styles.title}>FAZER LOGIN</Text>
        <View style={styles.separator} />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(email) => this.setState({ email })}
            placeholder="Email"
            placeholderTextColor="#A9A9A9"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            secureTextEntry={true}
            style={styles.input}
            onChangeText={(senha) => this.setState({ senha })}
            placeholder="Senha"
            placeholderTextColor="#A9A9A9"
          />
        </View>

        {this.state.errorMessage ? (
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
        ) : null}

        {this.state.successMessage ? (
          <Text style={styles.successText}>{this.state.successMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={this.login}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={this.resetPassword} 
        >
          <Text style={styles.linkText}>Esqueci a senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => this.props.navigation.navigate('CriarConta')}
        >
          <Text style={styles.linkText}>Não tem uma conta? Crie uma aqui.</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const LoginScreenWithNavigation = (props) => {
  const navigation = useNavigation();
  return <LoginScreen {...props} navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#BED9A7',
  },
  logo: {
    width: 130,
    height: 200,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    height: 40,
    width: '100%',
    margin: 6,
    borderWidth: 1,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 50,
    color: 'black',
    textShadowColor: 'white',
    fontFamily: 'Outfit-Regular',
    textShadowRadius: 20,
    marginBottom: 70,
  },
  button: {
    backgroundColor: '#809E40',
    paddingVertical: 10,
    paddingHorizontal: 80,
    borderRadius: 20,
    marginTop: 20,
    marginBottom:30
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  successText: {
    color: 'green',
    marginBottom: 10,
  },
  linkContainer: {
     marginTop: 30,
  },
  linkText: {
    color: 'black',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
});

export default LoginScreenWithNavigation;
