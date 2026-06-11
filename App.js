import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';

const API_URL = 'https://6a2b389db687a7d5cbc4f7a9.mockapi.io/api/v1/materiais';

export default function App() {
  const [materiais, setMateriais] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    buscarMateriais();
  }, []);

  const buscarMateriais = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error('Erro ao buscar materiais');
      const dados = await resposta.json();
      setMateriais(dados);
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar o inventário.');
    } finally {
      setCarregando(false);
    }
  };

  const cadastrarMaterial = async () => {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome.trim(),
        quantidade: Number(quantidade),
      }),
    });
    const novoMaterial = await resposta.json();
    setMateriais(lista => [novoMaterial, ...lista]);
    setNome('');
    setQuantidade('');
  };

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