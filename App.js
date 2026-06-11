import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const API_URL = 'https://6a2b389db687a7d5cbc4f7a9.mockapi.io/api/v1/materiais';

export default function App() {
  const [materiais, setMateriais] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almoxarifado — Enfermagem</Text>
      <Text style={styles.description}>
        Controle de insumos em tempo real. Cadastre novos materiais e
        acompanhe o inventário conectado à API.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a3a5c',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
});