import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Bloco para testar a função lógica obrigatória isoladamente
describe('🚀 Testes Automatizados - Sprint 2 (Validação Lógica)', () => {

  let validarRetirada;

  try {
    // Tenta importar a função do aluno de forma dinâmica para não travar o ambiente caso o arquivo não exista
    const validacoes = require('../src/utils/validacoes');
    validarRetirada = validacoes.validarRetirada;
  } catch (error) {
    // Tratamento silencioso, o teste abaixo falhará apontando que a função é indefinida
  }

  test('👉 [0,5 pt] A função validarRetirada deve permitir saídas válidas', () => {
    expect(validarRetirada).toBeDefined();
    expect(validarRetirada(10, 5)).toBe(true); // Retirar menos que o estoque
    expect(validarRetirada(10, 10)).toBe(true); // Limitar exatamente ao estoque
  });

  test('👉 [0,5 pt] A função validarRetirada deve bloquear saídas maiores que o estoque ou negativas', () => {
    expect(validarRetirada).toBeDefined();
    expect(validarRetirada(10, 15)).toBe(false); // Retirar mais do que tem
    expect(validarRetirada(10, -5)).toBe(false); // Quantidade negativa
    expect(validarRetirada(10, 0)).toBe(false); // Quantidade zero
  });
});