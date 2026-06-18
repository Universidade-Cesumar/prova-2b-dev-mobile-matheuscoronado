import React, { useState, useEffect, useRef } from 'react';
import { validarRetirada } from './src/utils/validacoes';
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

const API_URL = 'https://6a2b389db687a7d5cbc4f7a9.mockapi.io/api/v1/materiais';

export default function App() {
  // --- MEUS ESTADOS (STATES) ---
  const [materiais, setMateriais] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [carregando, setCarregando] = useState(false); // Rodinha de loading da lista
  const [enviando, setEnviando] = useState(false);     // Rodinha de loading do botão salvar

  // Controle de retirada de estoque por item da lista
  const [retiradas, setRetiradas] = useState({}); // { [id]: "quantidade digitada" }
  const [errosRetirada, setErrosRetirada] = useState({}); // { [id]: "mensagem de erro" }
  const [baixando, setBaixando] = useState({}); // { [id]: true/false }F

  // Estados para mostrar as mensagens de erro embaixo dos inputs
  const [erroNome, setErroNome] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');

  // Guarda o objeto do material que estou editando. Se for null, o app sabe que é um cadastro novo!
  const [itemEditando, setItemEditando] = useState(null);

  // Criando uma referência para o ScrollView para conseguir jogar a tela para cima nas funções
  const scrollViewRef = useRef(null);

  // Dispara a busca assim que o app abre na tela
  useEffect(() => {
    buscarMateriais();
  }, []);

  // ─── FUNÇÃO GET (Puxar dados da API) ───────────────────────────────────────
  const buscarMateriais = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error(); // Se der ruim no status do HTTP, joga pro catch
      const dados = await resposta.json();
      setMateriais(dados); // Joga os dados da API dentro do array
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o inventário. Verifique a URL da API.');
    } finally {
      setCarregando(false); // Desliga o loading de qualquer jeito
    }
  };

  // ─── VALIDAÇÃO DO FORMULÁRIO ───────────────────────────────────────────────
  const validarFormulario = () => {
    let valido = true;

    // Validando o campo Nome
    if (!nome.trim()) {
      setErroNome('O nome do material é obrigatório.');
      valido = false;
    } else {
      setErroNome(''); // Limpa o erro se tiver texto
    }

    // Validando o campo Quantidade
    if (!quantidade.trim()) {
      setErroQuantidade('A quantidade é obrigatória.');
      valido = false;
    } else if (isNaN(Number(quantidade)) || Number(quantidade) < 0) {
      setErroQuantidade('Informe um número válido.');
      valido = false;
    } else {
      setErroQuantidade('');
    }

    return valido; // Retorna true se passou em tudo, ou false se algo deu erro
  };

  // ─── FUNÇÃO SALVAR (Serve para POST e para PUT) ────────────────────────────
  const salvarMaterial = async () => {
    if (!validarFormulario()) return; // Se a validação falhar, para o código aqui

    setEnviando(true);

    // Descobre se estamos editando ou criando um novo com base no state 'itemEditando'
    const isEdicao = !!itemEditando;
    const url = isEdicao ? `${API_URL}/${itemEditando.id}` : API_URL;
    const metodo = isEdicao ? 'PUT' : 'POST';

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          quantidade: Number(quantidade) // API pede número, então dou um parse aqui
        }),
      });

      if (!resposta.ok) throw new Error();
      const dadosRetornados = await resposta.json();

      if (isEdicao) {
        // Se for edição, faz um .map na lista antiga e substitui só o item que mudou
        setMateriais(lista =>
          lista.map(m => String(m.id) === String(dadosRetornados.id) ? dadosRetornados : m)
        );
        setItemEditando(null); // Sai do modo de edição
        Alert.alert('Sucesso', 'Material atualizado com sucesso!');
      } else {
        // Se for cadastro novo, joga o item retornado no topo do array antigo (...lista)
        setMateriais(lista => [dadosRetornados, ...lista]);
        Alert.alert('Sucesso', 'Material cadastrado com sucesso!');
      }

      // Reseta os inputs do formulário
      setNome('');
      setQuantidade('');
    } catch (error) {
      Alert.alert('Erro', `Não foi possível ${isEdicao ? 'atualizar' : 'cadastrar'} o material.`);
    } finally {
      setEnviando(false);
    }
  };

  // ─── FUNÇÃO DELETE (Apagar da API e da tela) ────────────────────────────────
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

              // [CORREÇÃO] Forçando String() porque a API às vezes manda ID como texto e quebrava o !== estrito
              setMateriais(lista => lista.filter(m => String(m.id) !== String(item.id)));

              // Se eu deletar um item que estava aberto para edição no momento, limpa o formulário
              if (itemEditando && String(itemEditando.id) === String(item.id)) {
                cancelarEdicao();
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o material.');
            }
          },
        },
      ]
    );
  };

  // ─── Controle do input de retirada por item ──────────────────────────────────
  const atualizarRetirada = (id, valor) => {
    const soNumeros = valor.replace(/[^0-9]/g, '');
    setRetiradas(prev => ({ ...prev, [id]: soNumeros }));
    if (errosRetirada[id]) {
      setErrosRetirada(prev => ({ ...prev, [id]: '' }));
    }
  };

  // ─── PUT — Baixa de estoque ───────────────────────────────────────────────────
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

  // ─── ATIVAR EDIÇÃO (Joga os dados pro formulário lá em cima) ──────────────────
  const habilitarEdicao = (item) => {
    setItemEditando(item); // Guarda o item pra saber que mudamos pra modo PUT
    setNome(item.nome);    // Preenche o input do nome com o valor atual
    setQuantidade(String(item.quantidade)); // Preenche a quantidade convertendo pra string

    // Limpa erros antigos pra não confundir
    setErroNome('');
    setErroQuantidade('');

    // Gambiarra do bem: joga a tela do usuário lá no topo pra ele ver o formulário preenchido
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Sai do modo de edição e limpa tudo
  const cancelarEdicao = () => {
    setItemEditando(null);
    setNome('');
    setQuantidade('');
    setErroNome('');
    setErroQuantidade('');
  };

  // Layout de cada item da lista (Card)
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardNome}>{item.nome}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardQuantidade}>{item.quantidade} un.</Text>
        </View>
      </View>
      <View style={styles.cardAcoes}>
        <TouchableOpacity style={styles.btnEditar} onPress={() => habilitarEdicao(item)}>
          <Text style={styles.btnEditarTexto}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="btn-excluir"
          style={styles.btnExcluir}
          onPress={() => excluirMaterial(item)}
        >
          <Text style={styles.btnExcluirTexto}>🗑️ Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── RENDERIZAÇÃO DA TELA (JSX) ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef} // Conecta a referência aqui para o scroll funcionar
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho */}
        <Text style={styles.title}>Almoxarifado — Enfermagem</Text>
        <Text style={styles.description}>
          Controle de insumos em tempo real. Cadastre ou edite materiais e
          acompanhe o inventário conectado à API.
        </Text>

        {/* Formulário que muda de cor se estiver em modo edição (Dica estética do YouTube) */}
        <View style={[styles.form, itemEditando && styles.formEmEdicao]}>
          <Text style={styles.label}>
            {itemEditando ? 'Editando Material' : 'Nome do Material'}
          </Text>
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
              // Regex maroto pra aceitar apenas números inteiros positivos
              const soNumeros = v.replace(/[^0-9]/g, '');
              setQuantidade(soNumeros);
              if (soNumeros) setErroQuantidade('');
            }}
          />
          {erroQuantidade ? <Text style={styles.textoErro}>{erroQuantidade}</Text> : null}

          {/* Se estiver editando, cria duas colunas para os botões "Cancelar" e "Salvar" */}
          <View style={itemEditando ? styles.containerBotoesEdicao : null}>
            {itemEditando && (
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={cancelarEdicao}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              testID="btn-cadastrar"
              style={[
                styles.botao,
                enviando && styles.botaoDesabilitado,
                itemEditando && styles.botaoSalvarEdicao // Muda o botão pra verde se for edição
              ]}
              onPress={salvarMaterial}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoTexto}>
                  {itemEditando ? '💾 Salvar Alterações' : '+ Cadastrar Material'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Listagem */}
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>Inventário Atual</Text>
          <TouchableOpacity onPress={buscarMateriais}>
            <Text style={styles.atualizar}>↻ Atualizar</Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color="#2a7ae4" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            testID="lista-materials"
            data={materiais}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            scrollEnabled={false} // Desativado porque o ScrollView de fora já cuida da rolagem toda
            ListEmptyComponent={
              <Text style={styles.listaVazia}>Nenhum material cadastrado.</Text>
            }
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- ESTILIZAÇÃO DO APP ---
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formEmEdicao: {
    borderColor: '#2a7ae4', // Borda azul para indicar que está editando
    backgroundColor: '#f9fbfd',
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
  containerBotoesEdicao: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  botao: {
    backgroundColor: '#2a7ae4',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    flex: 1,
  },
  botaoSalvarEdicao: {
    marginTop: 0, // Alinha certinho com o botão cancelar lado a lado
    backgroundColor: '#27ae60', // Verde de sucesso pra salvar
  },
  botaoDesabilitado: {
    backgroundColor: '#9ab8e6',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  botaoCancelar: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCancelarTexto: {
    color: '#444',
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
  listaVazia: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    marginTop: 40,
  },
});