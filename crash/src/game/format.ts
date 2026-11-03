const integer = new Intl.NumberFormat('fr-FR');
const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (value: number) => integer.format(value);
export const formatDecimal = (value: number) => decimal.format(value);
export const formatMoney = (value: number) => `${integer.format(value)} FCFA`;
