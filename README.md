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
- ✅ Validação de campos antes do envio (mensagens de erro inline)
- ✅ Campo de quantidade aceita apenas números
- ✅ Feedback visual de carregamento (`ActivityIndicator`)
- ✅ Botão de atualização manual do inventário

## 📋 Funcionalidades — Sprint 2

- ✅ **Baixa rápida de estoque** — cada item da lista possui um campo de
  quantidade e um botão de baixa (`PUT`) que subtrai do estoque atual.
- ✅ **Exclusão de material** — botão de exclusão (`DELETE`) remove o
  item permanentemente da MockAPI e atualiza a interface local.
- ✅ **Edição de material** — botão de editar carrega os dados do item
  no formulário principal, permitindo atualizar nome e quantidade (`PUT`).
- ✅ **Validação de regra de negócio** — função pura `validarRetirada`
  em `src/utils/validacoes.js`, testada via Jest, impede:
  - retiradas maiores que o estoque disponível;
  - retiradas zeradas ou negativas.

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo Go instalado no celular **ou** emulador Android/iOS

### 1. Configure a MockAPI

1. Acesse [mockapi.io](https://mockapi.io) e crie uma conta
2. Crie um novo projeto (ex: `sysalmoxarifado`)
3. Adicione o recurso **`materiais`** com os campos:
   - `nome` → String
   - `quantidade` → Number

### 2. Configure a URL no App

Abra o arquivo `App.js` e substitua a constante:

```js
const API_URL = 'https://SEU_ID.mockapi.io/api/v1/materiais';
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o app

```bash
npx expo start
```

Escaneie o QR Code com o **Expo Go** (Android/iOS) ou pressione `a` para abrir no emulador Android.

### 5. Execute os testes

```bash
npm test
```

---

## 🗂️ Estrutura de Arquivos

```
/
├── App.js                       # Componente principal
├── index.js                     # Entry point Expo
├── package.json
├── jest.config.js
├── README.md
├── src/
│   └── utils/
│       └── validacoes.js        # Função pura validarRetirada (Sprint 2)
└── __tests__/
    ├── sprint1.test.js          # Testes automatizados Sprint 1
    ├── sprint2.test.js          # Testes automatizados Sprint 2
    └── sprint3.test.js          # Testes automatizados Sprint 3
```

---

## 🧪 Contrato de Testes (testID)

### Sprint 1

| Componente | testID |
|---|---|
| TextInput — Nome do Material | `input-nome` |
| TextInput — Quantidade | `input-quantidade` |
| TouchableOpacity — Cadastrar | `btn-cadastrar` |
| FlatList — Inventário | `lista-materials` |

### Sprint 2

| Componente | testID |
|---|---|
| TextInput — Quantidade a retirar | `input-retirada` |
| TouchableOpacity — Confirmar baixa (PUT) | `btn-baixar` |
| TouchableOpacity — Excluir item (DELETE) | `btn-excluir` |
| Função pura | `validarRetirada(estoqueAtual, quantidadeRetirada)` em `src/utils/validacoes.js` |

---

## 👨‍💻 Autor

**Matheus Coronado**
Disciplina: Desenvolvimento Mobile
Sprint 2 — Regras de Negócio e Saídas no Mobile