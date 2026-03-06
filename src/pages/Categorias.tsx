import { incomeCategories, expenseCategories } from "@/lib/data";

const Categorias = () => {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Categorias</h1>

      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-income" />
          Receitas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {incomeCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-expense" />
          Despesas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2.5 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categorias;
