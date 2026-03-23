const BRL_NUMBER_FORMAT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(value: number): string {
  return BRL_NUMBER_FORMAT.format(value);
}
