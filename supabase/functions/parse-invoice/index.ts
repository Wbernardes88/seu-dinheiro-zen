import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_MAP: Record<string, string> = {
  "alimentação": "Alimentação",
  "alimentacao": "Alimentação",
  "supermercado": "Alimentação",
  "restaurante": "Alimentação",
  "padaria": "Alimentação",
  "lanchonete": "Alimentação",
  "veículos": "Transporte",
  "veiculos": "Transporte",
  "transporte": "Transporte",
  "uber": "Transporte",
  "99": "Transporte",
  "combustível": "Transporte",
  "estacionamento": "Transporte",
  "pedagio": "Transporte",
  "vestuário": "Compras",
  "vestuario": "Compras",
  "roupas": "Compras",
  "compras": "Compras",
  "saúde": "Saúde",
  "saude": "Saúde",
  "farmácia": "Saúde",
  "farmacia": "Saúde",
  "drogaria": "Saúde",
  "educação": "Educação",
  "educacao": "Educação",
  "lazer": "Lazer",
  "entretenimento": "Lazer",
  "turismo e entretenim": "Lazer",
  "assinatura": "Assinaturas",
  "streaming": "Assinaturas",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, categories } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: "PDF base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build category list for the prompt
    const userCategories = categories && categories.length > 0
      ? categories.map((c: { name: string; type: string }) => `${c.name} (${c.type})`).join(", ")
      : "Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Assinaturas";

    const systemPrompt = `Você é um assistente especializado em extrair dados de faturas de cartão de crédito brasileiras.
Analise o PDF da fatura e extraia ABSOLUTAMENTE TODOS os lançamentos, sem exceção.

REGRAS IMPORTANTES:
- Extraia TODOS os lançamentos: compras, saques, serviços (PIX, etc), débitos diversos, e OBRIGATORIAMENTE IOF.
- IOF (Imposto sobre Operações Financeiras): SEMPRE extraia TODAS as linhas de IOF, incluindo "IOF DIAR", "IOF ADIC", "IOF ROT", etc. Mesmo que o valor seja centavos (ex: R$ 0,08), DEVE ser extraído. Use a data de referência do IOF ou a data mais próxima disponível. Categoria: "Taxas" ou a mais próxima do usuário.
- NÃO inclua: pagamentos efetuados à operadora (linhas como "PAGAMENTO EFETUADO", "PGTO DÉBITO AUTOMÁTICO", créditos/valores negativos), encargos rotativos, juros de mora, multas, tarifas de anuidade.
- INCLUA SIM: Parcelamento de fatura anterior (ex: "PAGTO. PARCEL", "PARCELAMENTO FATURA", "PARC FATURA"). Esses são DÉBITOS reais que o cliente deve pagar, NÃO são pagamentos efetuados. Extraia como lançamento normal com a categoria mais adequada (ex: "Outros" ou "Taxas") e identifique as parcelas (installment_number/total_installments).
- Seções como "Débitos diversos", "Compras Diversas", "Companhias Aéreas" são AGRUPAMENTOS — extraia cada lançamento individual dentro dessas seções.
- Para cada lançamento extraia: data (DD/MM), descrição do estabelecimento, valor em R$, e categoria sugerida.
- Se o lançamento tiver indicação de parcela (ex: "PARC 01/03" ou "01/03"), extraia installment_number e total_installments.
- Mapeie categorias usando o contexto do estabelecimento. Categorias disponíveis do usuário: ${userCategories}
- Se o banco incluir categoria (ALIMENTAÇÃO, VEÍCULOS, etc), use como referência para mapear.
- A data do lançamento deve estar no formato YYYY-MM-DD. Use o ano da fatura como referência. Se a data tiver apenas DD/MM, infira o ano pelo contexto da fatura.
- Valores devem ser números positivos (sem sinal de menos).
- Ignore lançamentos com valor zero ou negativo (são pagamentos).
- CONFIRA: a soma dos valores extraídos deve bater com o subtotal/total da fatura (excluindo pagamentos). Se faltar valor, procure lançamentos que você pode ter pulado.

Retorne os dados usando a função extract_transactions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia todos os lançamentos desta fatura de cartão de crédito. Retorne usando a função extract_transactions.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_transactions",
              description: "Extrai as transações da fatura do cartão de crédito",
              parameters: {
                type: "object",
                properties: {
                  invoice_year: {
                    type: "number",
                    description: "Ano da fatura (ex: 2026)",
                  },
                  invoice_month: {
                    type: "number",
                    description: "Mês de referência da fatura (1-12)",
                  },
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: {
                          type: "string",
                          description: "Data no formato YYYY-MM-DD",
                        },
                        description: {
                          type: "string",
                          description: "Nome do estabelecimento/descrição",
                        },
                        amount: {
                          type: "number",
                          description: "Valor em reais (positivo)",
                        },
                        category: {
                          type: "string",
                          description: "Categoria sugerida do usuário",
                        },
                        installment_number: {
                          type: "number",
                          description: "Número da parcela atual (se parcelado)",
                        },
                        total_installments: {
                          type: "number",
                          description: "Total de parcelas (se parcelado)",
                        },
                      },
                      required: ["date", "description", "amount", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["invoice_year", "invoice_month", "transactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_transactions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar fatura com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "extract_transactions") {
      console.error("Unexpected AI response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "IA não retornou dados estruturados. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
