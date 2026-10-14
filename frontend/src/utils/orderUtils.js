export const shortOrderId = (id) => String(id).slice(-6).toUpperCase();
export const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;