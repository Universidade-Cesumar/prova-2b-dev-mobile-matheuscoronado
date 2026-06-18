/**
 * Valida se uma retirada de estoque é permitida.
 *
 * @param {number} estoqueAtual - Quantidade atualmente disponível em estoque.
 * @param {number} quantidadeRetirada - Quantidade que se deseja retirar.
 * @returns {boolean} true se a operação for permitida, false caso contrário.
 */
function validarRetirada(estoqueAtual, quantidadeRetirada) {
  if (typeof estoqueAtual !== 'number' || typeof quantidadeRetirada !== 'number') {
    return false;
  }
  if (isNaN(estoqueAtual) || isNaN(quantidadeRetirada)) {
    return false;
  }
  if (quantidadeRetirada <= 0) {
    return false;
  }
  if (quantidadeRetirada > estoqueAtual) {
    return false;
  }
  return true;
}

module.exports = { validarRetirada };