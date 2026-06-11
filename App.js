import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';

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
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do material.');
      return;
    }
    if (!quantidade.trim() || isNaN(Number(quantidade))) {
      Alert.alert('Atenção', 'Informe uma quantidade válida.');
      return;
    }
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), quantidade: Number(quantidade) }),
    });
    const novoMaterial = await resposta.json();
    setMateriais(lista => [novoMaterial, ...lista]);
    setNome('');
    setQuantidade('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardNome}>{item.nome}</Text>
      <View style={styles.cardBadge}>
        <Text style={styles.cardQuantidade}>{item.quantidade} un.</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Almoxarifado — Enfermagem</Text>
      <Text style={styles.description}>
        Controle de insumos em tempo real. Cadastre novos materiais e
        acompanhe o inventário conectado à API.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nome do Material</Text>
        <TextInput
          testID="input-nome"
          style={styles.input}
          placeholder="Ex: Seringa 10ml"
          placeholderTextColor="#aaa"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          testID="input-quantidade"
          style={styles.input}
          placeholder="Ex: 50"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={quantidade}
          onChangeText={setQuantidade}
        />

        <TouchableOpacity
          testID="btn-cadastrar"
          style={styles.botao}
          onPress={cadastrarMaterial}
        >
          <Text style={styles.botaoTexto}>+ Cadastrar Material</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.secaoTitulo}>Inventário Atual</Text>

      <FlatList
        testID="lista-materials"
        data={materiais}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
      />
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
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dde3ef',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fafbfd',
  },
  botao: {
    backgroundColor: '#2a7ae4',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  cardNome: {
    fontSize: 15,
    color: '#222',
    flex: 1,
  },
  cardBadge: {
    backgroundColor: '#e8f0fe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardQuantidade: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2a7ae4',
  },
});