// Mock data for the financial app

export type Transaction = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  paymentMethod: string;
  amount: number;
  isRecurring?: boolean;
  isFixed?: boolean;
  userId?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
};

export type BudgetLimit = {
  categoryId: string;
  category: string;
  budget: number;
  spent: number;
};

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  deadline?: string;
  responsible?: string; // user_id, "both", or undefined
};

export const incomeCategories: Category[] = [
  { id: "1", name: "Salário", icon: "💰", type: "income" },
  { id: "2", name: "Freelance", icon: "💻", type: "income" },
  { id: "3", name: "Investimentos", icon: "📈", type: "income" },
  { id: "4", name: "Outros", icon: "📦", type: "income" },
];

export const expenseCategories: Category[] = [
  { id: "5", name: "Alimentação", icon: "🍔", type: "expense" },
  { id: "6", name: "Transporte", icon: "🚗", type: "expense" },
  { id: "7", name: "Moradia", icon: "🏠", type: "expense" },
  { id: "8", name: "Saúde", icon: "💊", type: "expense" },
  { id: "9", name: "Educação", icon: "📚", type: "expense" },
  { id: "10", name: "Lazer", icon: "🎮", type: "expense" },
  { id: "11", name: "Roupas", icon: "👕", type: "expense" },
  { id: "12", name: "Assinaturas", icon: "📱", type: "expense" },
];

export const mockTransactions: Transaction[] = [
  { id: "1", date: "2026-03-05", type: "income", category: "Salário", description: "Salário março", paymentMethod: "Transferência", amount: 5500 },
  { id: "2", date: "2026-03-04", type: "expense", category: "Alimentação", description: "Supermercado", paymentMethod: "Cartão débito", amount: 320 },
  { id: "3", date: "2026-03-03", type: "expense", category: "Transporte", description: "Combustível", paymentMethod: "Cartão crédito", amount: 180 },
  { id: "4", date: "2026-03-02", type: "expense", category: "Assinaturas", description: "Netflix + Spotify", paymentMethod: "Cartão crédito", amount: 65 },
  { id: "5", date: "2026-03-01", type: "expense", category: "Moradia", description: "Aluguel", paymentMethod: "Transferência", amount: 1800 },
  { id: "6", date: "2026-02-28", type: "income", category: "Freelance", description: "Projeto web", paymentMethod: "Pix", amount: 1200 },
  { id: "7", date: "2026-02-27", type: "expense", category: "Lazer", description: "Jantar fora", paymentMethod: "Pix", amount: 150 },
  { id: "8", date: "2026-02-26", type: "expense", category: "Saúde", description: "Farmácia", paymentMethod: "Cartão débito", amount: 95 },
];

export const budgetLimits: BudgetLimit[] = [
  { categoryId: "5", category: "Alimentação", budget: 800, spent: 520 },
  { categoryId: "6", category: "Transporte", budget: 400, spent: 180 },
  { categoryId: "7", category: "Moradia", budget: 2000, spent: 1800 },
  { categoryId: "8", category: "Saúde", budget: 300, spent: 95 },
  { categoryId: "10", category: "Lazer", budget: 500, spent: 150 },
  { categoryId: "12", category: "Assinaturas", budget: 150, spent: 65 },
];

export const savingsGoals: SavingsGoal[] = [
  { id: "1", name: "Viagem", target: 5000, current: 2300, icon: "✈️" },
  { id: "2", name: "Reserva de emergência", target: 15000, current: 8700, icon: "🛡️" },
  { id: "3", name: "Carro novo", target: 40000, current: 12000, icon: "🚗" },
  { id: "4", name: "Curso", target: 2000, current: 1500, icon: "📚" },
];

export const challenge52Weeks = Array.from({ length: 52 }, (_, i) => ({
  week: i + 1,
  amount: (i + 1) * 5,
  completed: i < 9,
}));

export const paymentMethods = ["Pix", "Cartão crédito", "Cartão débito", "Dinheiro", "Transferência"];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
