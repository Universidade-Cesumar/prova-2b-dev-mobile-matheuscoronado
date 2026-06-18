# 📦 SysAlmoxarifado — Controle de Estoque (Enfermagem)

Sistema mobile de controle de insumos médicos desenvolvido para modernizar o almoxarifado de um laboratório de enfermagem, substituindo o fluxo manual de papel + Excel por uma interface conectada em tempo real à API.

---

## 🎯 Contexto do Projeto

O levantamento de requisitos identificou os principais problemas do processo atual:

- Controle feito em Excel com rascunho prévio em papel
- Sem contabilização automática de entrada/saída
- Sem alertas de validade ou estoque zerado
- Acesso limitado ao computador (sem mobilidade no estoque)

---

## 🚀 Tecnologias Utilizadas

| Tecnologia | Versão | Função |
|---|---|---|
| React Native | 0.74.5 | Framework mobile |
| Expo | ~51.0.0 | Toolchain e build |
| MockAPI | — | Backend RESTful simulado |
| Jest + jest-expo | ^29 / ^51 | Testes automatizados |
| @testing-library/react-native | ^13 | Utilitários de teste |

---

## 📋 Funcionalidades — Sprint 1

- ✅ **GET /materiais** — Carrega o inventário ao abrir o app via `useEffect`
- ✅ **POST /materiais** — Cadastra novo insumo com nome e quantidade
- ✅ Lista de rolagem com `FlatList` atualizada dinamicamente
- ✅ Validação de campos antes do envio
- ✅ Feedback visual de carregamento (`ActivityIndicator`)
- ✅ Botão de atualização manual do inventário

---

## 📋 Funcionalidades — Sprint 2

- ✅ **Baixa rápida de estoque** — cada item da lista possui um campo de
  quantidade e um botão de baixa (`PUT`) que subtrai do estoque atual.
- ✅ **Exclusão de material** — botão de exclusão (`DELETE`) remove o
  item permanentemente da MockAPI e atualiza a interface local.
- ✅ **Validação de regra de negócio** — função pura `validarRetirada`
  em `src/utils/validacoes.js`, testada via Jest, impede:
  - retiradas maiores que o estoque disponível;
  - retiradas zeradas ou negativas.

---

## 🧪 Contrato de Testes (testID)

| Componente | testID |
|---|---|
| TextInput — Nome do Material | `input-nome` |
| TextInput — Quantidade | `input-quantidade` |
| TouchableOpacity — Cadastrar | `btn-cadastrar` |
| FlatList — Inventário | `lista-materials` |

---

## 👨‍💻 Autor

**Matheus Coronado**  
Disciplina: Desenvolvimento Mobile  
Sprint 1 — Fundação, API e Inventário Mobile