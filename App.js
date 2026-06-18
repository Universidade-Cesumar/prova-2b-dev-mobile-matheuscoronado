import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { validarRetirada } from './src/utils/validacoes';

const API_URL = 'https://6a2b389db687a7d5cbc4f7a9.mockapi.io/api/v1/materiais';

export default function App() {
  const [materiais, setMateriais] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Controla se está no modo edição
  const [editandoItem, setEditandoItem] = useState(null);

  // Erros de validação inline do formulário de cadastro/edição
  const [erroNome, setErroNome] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');

  // Controle de retirada de estoque por item da lista (Sprint 2)
  const [retiradas, setRetiradas] = useState({}); // { [id]: "quantidade digitada" }
  const [errosRetirada, setErrosRetirada] = useState({}); // { [id]: "mensagem de erro" }
  const [baixando, setBaixando] = useState({}); // { [id]: true/false }

  // Referência para rolar até o topo ao clicar em Editar
  const scrollRef = useRef(null);

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

  // ─── Validação do formulário de cadastro/edição ──────────────────────────────
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

  // ─── POST ou PUT dependendo do modo ─────────────────────────────────────────
  const salvarMaterial = async () => {
    if (!validarFormulario()) return;

    setEnviando(true);
    try {
      if (editandoItem) {
        // Modo edição → PUT
        const resposta = await fetch(`${API_URL}/${editandoItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), quantidade: Number(quantidade) }),
        });
        if (!resposta.ok) throw new Error();
        const atualizado = await resposta.json();
        setMateriais(lista => lista.map(m => m.id === atualizado.id ? atualizado : m));
        setEditandoItem(null);
      } else {
        // Modo cadastro → POST
        const resposta = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), quantidade: Number(quantidade) }),
        });
        if (!resposta.ok) throw new Error();
        const novoMaterial = await resposta.json();
        setMateriais(lista => [novoMaterial, ...lista]);
      }

      setNome('');
      setQuantidade('');
    } catch {
      Alert.alert('Erro', editandoItem
        ? 'Não foi possível salvar as alterações.'
        : 'Não foi possível cadastrar o material.'
      );
    } finally {
      setEnviando(false);
    }
  };

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  const excluirMaterial = (item) => {
    const confirmarExclusao = () => {
      executarExclusao(item);
    };

    if (Platform.OS === 'web') {
      // No navegador, Alert.alert com múltiplos botões não funciona —
      // usamos o confirm nativo do navegador.
      const confirmado = window.confirm(`Deseja excluir "${item.nome}"?`);
      if (confirmado) confirmarExclusao();
    } else {
      Alert.alert(
        'Excluir Material',
        `Deseja excluir "${item.nome}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: confirmarExclusao },
        ]
      );
    }
  };

  const executarExclusao = async (item) => {
    try {
      const resposta = await fetch(`${API_URL}/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resposta.ok) throw new Error();
      setMateriais(lista => lista.filter(m => m.id !== item.id));

      setRetiradas(prev => {
        const copia = { ...prev };
        delete copia[item.id];
        return copia;
      });
      setErrosRetirada(prev => {
        const copia = { ...prev };
        delete copia[item.id];
        return copia;
      });

      if (editandoItem?.id === item.id) cancelarEdicao();
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Não foi possível excluir o material.');
      } else {
        Alert.alert('Erro', 'Não foi possível excluir o material.');
      }
    }
  };

  // ─── Prepara edição no formulário ────────────────────────────────────────────
  const iniciarEdicao = (item) => {
    setEditandoItem(item);
    setNome(item.nome);
    setQuantidade(String(item.quantidade));
    setErroNome('');
    setErroQuantidade('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const cancelarEdicao = () => {
    setEditandoItem(null);
    setNome('');
    setQuantidade('');
    setErroNome('');
    setErroQuantidade('');
  };

  // ─── Controle do input de retirada por item (Sprint 2) ───────────────────────
  const atualizarRetirada = (id, valor) => {
    const soNumeros = valor.replace(/[^0-9]/g, '');
    setRetiradas(prev => ({ ...prev, [id]: soNumeros }));
    if (errosRetirada[id]) {
      setErrosRetirada(prev => ({ ...prev, [id]: '' }));
    }
  };

  // ─── PUT — Baixa de estoque (Sprint 2) ────────────────────────────────────────
  const confirmarBaixa = async (item) => {
    const quantidadeRetirada = Number(retiradas[item.id]);

    if (!retiradas[item.id]) {
      setErrosRetirada(prev => ({ ...prev, [item.id]: 'Informe a quantidade a retirar.' }));
      return;
    }

    if (!validarRetirada(item.quantidade, quantidadeRetirada)) {
      setErrosRetirada(prev => ({
        ...prev,
        [item.id]: quantidadeRetirada > item.quantidade
          ? `Estoque insuficiente. Disponível: ${item.quantidade}.`
          : 'Informe uma quantidade válida (maior que zero).',
      }));
      return;
    }

    setBaixando(prev => ({ ...prev, [item.id]: true }));
    try {
      const novaQuantidade = item.quantidade - quantidadeRetirada;
      const resposta = await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: item.nome, quantidade: novaQuantidade }),
      });
      if (!resposta.ok) throw new Error();
      const atualizado = await resposta.json();
      setMateriais(lista => lista.map(m => m.id === atualizado.id ? atualizado : m));
      setRetiradas(prev => ({ ...prev, [item.id]: '' }));
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a baixa de estoque.');
    } finally {
      setBaixando(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // ─── Render item ─────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const esteEstaEditando = editandoItem?.id === item.id;
    return (
      <View style={[styles.card, esteEstaEditando && styles.cardEditando]}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <View style={styles.cardBadge}>
            <Text style={styles.cardQuantidade}>{item.quantidade} un.</Text>
          </View>
        </View>

        {/* Ações: editar / excluir */}
        <View style={styles.cardAcoes}>
          <TouchableOpacity
            style={[styles.btnEditar, esteEstaEditando && styles.btnEditarAtivo]}
            onPress={() => esteEstaEditando ? cancelarEdicao() : iniciarEdicao(item)}
          >
            <Text style={[styles.btnEditarTexto, esteEstaEditando && styles.btnEditarAtivoTexto]}>
              {esteEstaEditando ? '✕ Cancelar' : '✏️ Editar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-excluir"
            style={styles.btnExcluir}
            onPress={() => excluirMaterial(item)}
          >
            <Text style={styles.btnExcluirTexto}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>

        {/* Baixa rápida de estoque */}
        <View style={styles.retiradaBox}>
          <TextInput
            testID="input-retirada"
            style={[
              styles.inputRetirada,
              errosRetirada[item.id] ? styles.inputErro : null,
            ]}
            placeholder="Qtd. a retirar"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={retiradas[item.id] || ''}
            onChangeText={(v) => atualizarRetirada(item.id, v)}
          />
          <TouchableOpacity
            testID="btn-baixar"
            style={[styles.btnBaixar, baixando[item.id] && styles.botaoDesabilitado]}
            onPress={() => confirmarBaixa(item)}
            disabled={baixando[item.id]}
          >
            {baixando[item.id]
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnBaixarTexto}>↓ Baixar</Text>
            }
          </TouchableOpacity>
        </View>
        {errosRetirada[item.id] ? (
          <Text style={styles.textoErro}>{errosRetirada[item.id]}</Text>
        ) : null}
      </View>
    );
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
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

        {/* Formulário — muda título e botão dependendo do modo */}
        <View style={[styles.form, editandoItem && styles.formEditando]}>
          {editandoItem && (
            <View style={styles.badgeEdicao}>
              <Text style={styles.badgeEdicaoTexto}>✏️ Editando: {editandoItem.nome}</Text>
            </View>
          )}

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
              const soNumeros = v.replace(/[^0-9]/g, '');
              setQuantidade(soNumeros);
              if (soNumeros) setErroQuantidade('');
            }}
          />
          {erroQuantidade ? <Text style={styles.textoErro}>{erroQuantidade}</Text> : null}

          <View style={styles.botoes}>
            {editandoItem && (
              <TouchableOpacity style={styles.btnCancelar} onPress={cancelarEdicao}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="btn-cadastrar"
              style={[
                styles.botao,
                editandoItem && styles.botaoSalvar,
                enviando && styles.botaoDesabilitado,
              ]}
              onPress={salvarMaterial}
              disabled={enviando}
            >
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.botaoTexto}>
                  {editandoItem ? '💾 Salvar Alterações' : '+ Cadastrar Material'}
                </Text>
              }
            </TouchableOpacity>
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  formEditando: {
    borderWidth: 2,
    borderColor: '#2a7ae4',
  },
  badgeEdicao: {
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeEdicaoTexto: {
    color: '#2a7ae4',
    fontSize: 13,
    fontWeight: '600',
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
  botoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  botao: {
    flex: 1,
    backgroundColor: '#2a7ae4',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botaoSalvar: {
    backgroundColor: '#27ae60',
  },
  botaoDesabilitado: {
    backgroundColor: '#9ab8e6',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnCancelar: {
    flex: 0.45,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnCancelarTexto: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
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
  cardEditando: {
    borderWidth: 2,
    borderColor: '#2a7ae4',
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
  btnEditarAtivo: {
    backgroundColor: '#fff0f0',
    borderColor: '#f5c5c5',
  },
  btnEditarTexto: {
    color: '#2a7ae4',
    fontSize: 13,
    fontWeight: '600',
  },
  btnEditarAtivoTexto: {
    color: '#e74c3c',
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
  retiradaBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  inputRetirada: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dde3ef',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafbfd',
  },
  btnBaixar: {
    backgroundColor: '#e67e22',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBaixarTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  listaVazia: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    marginTop: 40,
  },
});