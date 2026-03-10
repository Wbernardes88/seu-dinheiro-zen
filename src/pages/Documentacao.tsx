const Documentacao = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 print:space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">📊 Guia do Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Como cada item funciona</p>
      </div>

      <Section title="💰 Saldo do Mês" text="Diferença entre todas as entradas e saídas do mês selecionado. Mostra quanto sobrou (ou faltou) no período." />

      <Section title="📈 Entradas" text="Soma de todos os lançamentos do tipo 'Entrada' no mês (salários, freelances, investimentos, etc)." />

      <Section title="📉 Saídas" text="Soma de todos os lançamentos do tipo 'Saída' no mês (alimentação, transporte, contas, etc)." />

      <Section title="📊 Variação Mensal (%)" text="Compara o saldo do mês atual com o mês anterior. Ex: se mês passado sobrou R$1.000 e este mês R$1.500, a variação é +50%." />

      <Section title="🏥 Saúde Financeira (Score 0-100)">
        <p className="text-sm text-muted-foreground mb-2">Nota calculada com 4 fatores:</p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Razão de Saldo (0-30 pts)</strong> — Quanto maior a proporção de receita que sobra após despesas, mais pontos.</li>
          <li><strong>Aderência aos Limites (0-30 pts)</strong> — Começa em 30. Perde 10 pts por categoria que estourou o limite e 3 pts por categoria perto do limite (80%+).</li>
          <li><strong>Progresso de Metas (0-20 pts)</strong> — Média do progresso das suas metas de reserva (Caixinha). Meta 100% completa = 20 pts.</li>
          <li><strong>Presença de Receita (0-20 pts)</strong> — Tem receita no mês? Ganha 20 pts. Sem receita = 0.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Classificação:</strong> 80+ Excelente · 60-79 Boa · 40-59 Atenção · 0-39 Crítica
        </p>
      </Section>

      <Section title="📅 Disponível para Hoje" text="Divide o saldo restante do mês pelos dias que faltam. Mostra quanto você pode gastar por dia sem ficar no vermelho." />

      <Section title="🔮 Previsão de Saldo">
        <p className="text-sm text-muted-foreground mb-2">Projeta o saldo ao final do mês atual separando gastos fixos e variáveis:</p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Gastos fixos (🔄 recorrentes)</strong> — já são contabilizados integralmente, sem projeção extra.</li>
          <li><strong>Gastos variáveis</strong> — a média diária até hoje é projetada para os dias restantes do mês.</li>
          <li><strong>Previsão</strong> = Entradas − (Fixos + Variáveis projetados).</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">Se a previsão for negativa, o card sugere quanto reduzir por dia para fechar o mês positivo.</p>
      </Section>

      <Section title="⚠️ Alertas de Limite" text="Avisa quando seus gastos em uma categoria atingem 80% do limite definido, e alerta quando ultrapassa 100%." />

      <Section title="📈 Evolução do Saldo" text="Gráfico de linha mostrando o saldo (entradas - saídas) dos últimos 6 meses, para visualizar a tendência financeira." />

      <Section title="🎯 Metas de Reserva (Caixinha)" text="Mostra o progresso das suas metas de economia. Cada meta tem um valor alvo e o quanto já foi guardado." />

      <Section title="🏆 Desafio 52 Semanas" text="Desafio de guardar um valor crescente por semana durante 1 ano. Defina a meta semanal e marque as semanas completadas." />

      <div className="text-center pt-4 text-xs text-muted-foreground print:mt-8">
        <p>Para salvar como PDF: pressione <strong>Ctrl+P</strong> (ou ⌘+P no Mac) → Salvar como PDF</p>
      </div>
    </div>
  );
};

const Section = ({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) => (
  <div className="bg-card rounded-xl border p-4 print:break-inside-avoid">
    <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
    {text && <p className="text-sm text-muted-foreground">{text}</p>}
    {children}
  </div>
);

export default Documentacao;
