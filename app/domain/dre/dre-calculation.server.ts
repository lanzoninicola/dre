// app/utils/dre-calculations.ts

import { DRELineItem, DREStructure } from "./dre.types";

export function calculateDREStructure(lineItems: DRELineItem[]): DREStructure {
  // Calcular valores por tipo de grupo DRE
  const receitaBruta = calculateByGroupType(lineItems, "receita", [1]); // Ordem 1 = Receita Bruta
  const deducoesDaReceita = calculateByGroupType(lineItems, "despesa", [2]); // Ordem 2 = Deduções
  const custoDosProdutosVendidos = calculateByGroupType(lineItems, "despesa", [
    3,
  ]); // Ordem 3 = CPV
  const despesasAdministrativas = calculateByGroupType(lineItems, "despesa", [
    4,
  ]); // Ordem 4 = Desp. Adm
  const despesasComerciais = calculateByGroupType(lineItems, "despesa", [5]); // Ordem 5 = Desp. Com
  const despesasFinanceiras = calculateByGroupType(lineItems, "despesa", [6]); // Ordem 6 = Desp. Fin
  const receitasFinanceiras = calculateByGroupType(lineItems, "receita", [7]); // Ordem 7 = Rec. Fin
  const outrasReceitasOperacionais = calculateByGroupType(
    lineItems,
    "receita",
    [8]
  ); // Ordem 8 = Outras Rec
  const outrasDespesasOperacionais = calculateByGroupType(
    lineItems,
    "despesa",
    [9]
  ); // Ordem 9 = Outras Desp

  // Cálculos derivados
  const receitaLiquida = receitaBruta - deducoesDaReceita;
  const lucroBruto = receitaLiquida - custoDosProdutosVendidos;
  const lucroOperacional =
    lucroBruto -
    despesasAdministrativas -
    despesasComerciais -
    despesasFinanceiras +
    receitasFinanceiras +
    outrasReceitasOperacionais -
    outrasDespesasOperacionais;
  const lucroLiquido = lucroOperacional; // Por simplicidade, sem IR/CSLL

  return {
    receitaBruta,
    deducoesDaReceita,
    receitaLiquida,
    custoDosProdutosVendidos,
    lucroBruto,
    despesasAdministrativas,
    despesasComerciais,
    despesasFinanceiras,
    receitasFinanceiras,
    outrasReceitasOperacionais,
    outrasDespesasOperacionais,
    lucroOperacional,
    lucroLiquido,
    lineItems: lineItems.sort((a, b) => a.groupOrder - b.groupOrder),
  };
}

function calculateByGroupType(
  lineItems: DRELineItem[],
  type: "receita" | "despesa",
  orders: number[]
): number {
  return lineItems
    .filter(
      (item) => item.groupType === type && orders.includes(item.groupOrder)
    )
    .reduce((sum, item) => sum + Math.abs(item.totalAmount), 0);
}

export function formatDREPeriod(periodStart: Date, periodEnd: Date): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });

  if (isSameMonth(periodStart, periodEnd)) {
    return formatter.format(periodStart);
  }

  return `${periodStart.toLocaleDateString(
    "pt-BR"
  )} a ${periodEnd.toLocaleDateString("pt-BR")}`;
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
