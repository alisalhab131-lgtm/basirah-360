export const safeNumber = (value) => {
  return Number(value ?? 0);
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export const isOverdue = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d) && d < new Date();
};