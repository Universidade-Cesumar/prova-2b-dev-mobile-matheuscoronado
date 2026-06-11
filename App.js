import React, { useState, useEffect } from 'react';
import {StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView,} from 'react-native';

const API_URL = 'https://6a2b389db687a7d5cbc4f7a9.mockapi.io/api/v1/materiais';

export default function App() {
  const [materiais, setMateriais]       = useState([]);
  const [nome, setNome]                 = useState('');
  const [quantidade, setQuantidade]     = useState('');
  const [carregando, setCarregando]     = useState(false);
  const [enviando, setEnviando]         = useState(false);

  // Erros de validação inline
  const [erroNome, setErroNome]             = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');

  // Modal de edição
  const [modalVisivel, setModalVisivel]       = useState(false);
  const [itemEditando, setItemEditando]       = useState(null);
  const [nomeEdit, setNomeEdit]               = useState('');
  const [quantidadeEdit, setQuantidadeEdit]   = useState('');
  const [erroNomeEdit, setErroNomeEdit]       = useState('');
  const [erroQtdEdit, setErroQtdEdit]         = useState('');

  useEffect(() => {
    buscarMateriais();
  }, []);

  // ─── GET ────────────────────────────────────────────────────────────────────
  const buscarMateriais = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error();
      const dados = await resposta.json();
      setMateriais(dados);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o inventário. Verifique a URL da API.');
    } finally {
      setCarregando(false);
    }
  };

  // ─── Validação ──────────────────────────────────────────────────────────────
  const validarFormulario = () => {
    let valido = true;

    if (!nome.trim()) {
      setErroNome('O nome do material é obrigatório.');
      valido = false;
    } else {
      setErroNome('');
    }

    if (!quantidade.trim()) {
      setErroQuantidade('A quantidade é obrigatória.');
      valido = false;
    } else if (isNaN(Number(quantidade)) || Number(quantidade) < 0) {
      setErroQuantidade('Informe um número válido.');
      valido = false;
    } else {
      setErroQuantidade('');
    }

    return valido;
  };

  // ─── POST ───────────────────────────────────────────────────────────────────
  const cadastrarMaterial = async () => {
    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), quantidade: Number(quantidade) }),
      });
      if (!resposta.ok) throw new Error();
      const novoMaterial = await resposta.json();
      setMateriais(lista => [novoMaterial, ...lista]);
      setNome('');
      setQuantidade('');
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o material.');
    } finally {
      setEnviando(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  const excluirMaterial = (item) => {
    Alert.alert(
      'Excluir Material',
      `Deseja excluir "${item.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const resposta = await fetch(`${API_URL}/${item.id}`, { method: 'DELETE' });
              if (!resposta.ok) throw new Error();
              setMateriais(lista => lista.filter(m => m.id !== item.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o material.');
            }
          },
        },
      ]
    );
  };

  // ─── PUT (abre modal) ────────────────────────────────────────────────────────
  const abrirEdicao = (item) => {
    setItemEditando(item);
    setNomeEdit(item.nome);
    setQuantidadeEdit(String(item.quantidade));
    setErroNomeEdit('');
    setErroQtdEdit('');
    setModalVisivel(true);
  };

  const salvarEdicao = async () => {
    let valido = true;

    if (!nomeEdit.trim()) {
      setErroNomeEdit('O nome é obrigatório.');
      valido = false;
    } else {
      setErroNomeEdit('');
    }

    if (!quantidadeEdit.trim()) {
      setErroQtdEdit('A quantidade é obrigatória.');
      valido = false;
    } else if (isNaN(Number(quantidadeEdit)) || Number(quantidadeEdit) < 0) {
      setErroQtdEdit('Informe um número válido.');
      valido = false;
    } else {
      setErroQtdEdit('');
    }

    if (!valido) return;

    try {
      const resposta = await fetch(`${API_URL}/${itemEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEdit.trim(), quantidade: Number(quantidadeEdit) }),
      });
      if (!resposta.ok) throw new Error();
      const atualizado = await resposta.json();
      setMateriais(lista => lista.map(m => m.id === atualizado.id ? atualizado : m));
      setModalVisivel(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  // ─── Render item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardNome}>{item.nome}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardQuantidade}>{item.quantidade} un.</Text>
        </View>
      </View>
      <View style={styles.cardAcoes}>
        <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
          <Text style={styles.btnEditarTexto}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnExcluir} onPress={() => excluirMaterial(item)}>
          <Text style={styles.btnExcluirTexto}>🗑️ Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <Text style={styles.title}>Almoxarifado — Enfermagem</Text>
        <Text style={styles.description}>
          Controle de insumos em tempo real. Cadastre novos materiais e
          acompanhe o inventário conectado à API.
        </Text>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label}>Nome do Material</Text>
          <TextInput
            testID="input-nome"
            style={[styles.input, erroNome ? styles.inputErro : null]}
            placeholder="Ex: Seringa 10ml"
            placeholderTextColor="#aaa"
            value={nome}
            onChangeText={v => { setNome(v); if (v.trim()) setErroNome(''); }}
          />
          {erroNome ? <Text style={styles.textoErro}>{erroNome}</Text> : null}

          <Text style={[styles.label, { marginTop: 14 }]}>Quantidade</Text>
          <TextInput
            testID="input-quantidade"
            style={[styles.input, erroQuantidade ? styles.inputErro : null]}
            placeholder="Ex: 50"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={quantidade}
            onChangeText={v => {
              // Aceita só dígitos
              const soNumeros = v.replace(/[^0-9]/g, '');
              setQuantidade(soNumeros);
              if (soNumeros) setErroQuantidade('');
            }}
          />
          {erroQuantidade ? <Text style={styles.textoErro}>{erroQuantidade}</Text> : null}

          <TouchableOpacity
            testID="btn-cadastrar"
            style={[styles.botao, enviando && styles.botaoDesabilitado]}
            onPress={cadastrarMaterial}
            disabled={enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.botaoTexto}>+ Cadastrar Material</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Cabeçalho da lista */}
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>Inventário Atual</Text>
          <TouchableOpacity onPress={buscarMateriais}>
            <Text style={styles.atualizar}>↻ Atualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {carregando ? (
          <ActivityIndicator size="large" color="#2a7ae4" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            testID="lista-materials"
            data={materiais}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.listaVazia}>Nenhum material cadastrado.</Text>
            }
          />
        )}
      </ScrollView>

      {/* Modal de edição */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Editar Material</Text>

            <Text style={styles.label}>Nome do Material</Text>
            <TextInput
              style={[styles.input, erroNomeEdit ? styles.inputErro : null]}
              placeholder="Nome do material"
              placeholderTextColor="#aaa"
              value={nomeEdit}
              onChangeText={v => { setNomeEdit(v); if (v.trim()) setErroNomeEdit(''); }}
            />
            {erroNomeEdit ? <Text style={styles.textoErro}>{erroNomeEdit}</Text> : null}

            <Text style={[styles.label, { marginTop: 14 }]}>Quantidade</Text>
            <TextInput
              style={[styles.input, erroQtdEdit ? styles.inputErro : null]}
              placeholder="Quantidade"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={quantidadeEdit}
              onChangeText={v => {
                const soNumeros = v.replace(/[^0-9]/g, '');
                setQuantidadeEdit(soNumeros);
                if (soNumeros) setErroQtdEdit('');
              }}
            />
            {erroQtdEdit ? <Text style={styles.textoErro}>{erroQtdEdit}</Text> : null}

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarEdicao}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  scrollContent: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },

  // Cabeçalho
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

  // Formulário
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
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
  inputErro: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff8f8',
  },
  textoErro: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  botao: {
    backgroundColor: '#2a7ae4',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoDesabilitado: {
    backgroundColor: '#9ab8e6',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Seção da lista
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a5c',
  },
  atualizar: {
    fontSize: 13,
    color: '#2a7ae4',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  cardAcoes: {
    flexDirection: 'row',
    gap: 8,
  },
  btnEditar: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c5d5f5',
  },
  btnEditarTexto: {
    color: '#2a7ae4',
    fontSize: 13,
    fontWeight: '600',
  },
  btnExcluir: {
    flex: 1,
    backgroundColor: '#fff0f0',
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5c5c5',
  },
  btnExcluirTexto: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '600',
  },

  // Lista vazia
  listaVazia: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    marginTop: 40,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnCancelarTexto: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  btnSalvar: {
    flex: 1,
    backgroundColor: '#2a7ae4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSalvarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});