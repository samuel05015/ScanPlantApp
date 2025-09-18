import React, { Component } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { auth } from './supabase';

export default class CriarConta extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      senha: '',
      errorMessage: '', // Estado para mensagens de erro
      successMessage: '', // Estado para mensagens de sucesso
    };

    this.cadastrar = this.cadastrar.bind(this);
    this.voltar = this.voltar.bind(this); // Adiciona o bind para a função voltar

    // Listener de autenticação do Supabase (opcional)
    // auth.onAuthStateChange((event, session) => {
    //   if (event === 'SIGNED_IN' && session) {
    //     console.log('Usuário logado:', session.user);
    //   }
    // });
  }

  async cadastrar() {
    // Validações básicas
    if (!this.state.email || !this.state.senha) {
      this.setState({
        errorMessage: 'Por favor, preencha todos os campos!',
        successMessage: '',
      });
      return;
    }

    if (this.state.senha.length < 6) {
      this.setState({
        errorMessage: 'Sua senha deve ter pelo menos 6 caracteres!',
        successMessage: '',
      });
      return;
    }

    try {
      const { data, error } = await auth.signUp(this.state.email, this.state.senha);
      
      if (error) {
        // Mapear erros do Supabase para mensagens em português
        switch (error.message) {
          case 'User already registered':
            this.setState({
              errorMessage: 'Já existe uma conta vinculada a esse email',
              successMessage: '',
            });
            break;
          case 'Password should be at least 6 characters':
            this.setState({
              errorMessage: 'Sua senha deve ter pelo menos 6 caracteres!',
              successMessage: '',
            });
            break;
          case 'Invalid email':
            this.setState({
              errorMessage: 'Email inválido! Verifique o formato.',
              successMessage: '',
            });
            break;
          default:
            this.setState({
              errorMessage: 'Ocorreu um erro! Tente novamente mais tarde!',
              successMessage: '',
            });
            break;
        }
      } else {
        // Cadastro bem-sucedido
        this.setState({
          successMessage: 'Usuário Cadastrado com Sucesso! Verifique seu email para confirmar a conta.',
          errorMessage: '',
        });
        
        // Limpar os campos após sucesso
        setTimeout(() => {
          this.setState({ email: '', senha: '' });
        }, 2000);
      }
    } catch (error) {
      this.setState({
        errorMessage: 'Erro de conexão! Verifique sua internet.',
        successMessage: '',
      });
    }
  }

  voltar() {
    this.props.navigation.goBack(); // Navegar de volta para a tela anterior
  }

  render() {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/imagemlogotcc.png')} // Ajuste o caminho da imagem conforme necessário
          style={styles.logo}
        />

        <Text style={styles.title}>CRIAR CONTA</Text>
        <View style={styles.separator} />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(email) => this.setState({ email })}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            secureTextEntry={true}
            style={styles.input}
            onChangeText={(senha) => this.setState({ senha })}
            placeholder="Senha"
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
          onPress={this.cadastrar}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton} // Adiciona estilos para o botão voltar
          onPress={this.voltar}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

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
  button: {
    backgroundColor: '#809E40',
    paddingVertical: 10,
    paddingHorizontal: 80,
    borderRadius: 20,
    marginTop: 20,
  },

  title: {
    fontSize: 50,
    color: 'black',
    textShadowColor: 'white',
    fontFamily: 'Outfit-Regular',
    textShadowRadius: 20,
    marginBottom: 70,
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
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#707070', // Cor diferenciada para o botão voltar
    paddingVertical: 10,
    paddingHorizontal: 100,
    borderRadius: 20,
    marginTop: 20,
    // Margem superior para o botão voltar
  },
});
