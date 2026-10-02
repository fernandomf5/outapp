# Melhorar a Gestão Financeira e corrigir Receitas Recebidas

## Objetivo
Aplicar a direção visual “Professional SaaS clean” escolhida e garantir que uma receita marcada como paga apareça imediatamente no resumo do mês correto.

## Implementação
- Reorganizar o resumo mensal com hierarquia mais clara, acabamento limpo e responsivo, preservando tema escuro, identidade Out App e todos os controles atuais.
- Destacar saldo, resultado, receitas recebidas, despesas pagas e as duas pendências sem excesso de cores.
- Refinar comparativo, vencimentos e distribuição por categoria para leitura rápida, com estados vazios claros.
- Corrigir contas fixas/recorrentes: ao mudar apenas o status, preservar tipo, valor, vencimento, categoria e demais alterações daquele mês.
- Padronizar a leitura de status nos indicadores, gráficos e vencimentos para evitar divergência visual.
- Garantir que a recarga após salvar status seja aguardada antes de fechar a ação.

## Validação
- Reproduzir no navegador a mudança de uma receita pendente para paga e conferir “Receitas Recebidas”.
- Conferir conta recorrente com dados personalizados no mês, garantindo que esses dados não sejam apagados ao marcar como paga.
- Verificar o painel em desktop e mobile, além do estado de compilação do projeto.

## Detalhes técnicos
- Centralizar a atualização de `monthly_status` no helper que faz merge por período, evitando sobrescrever `overrides`.
- Normalizar status (`trim` e minúsculas) em todos os cálculos do resumo.
- Usar somente tokens semânticos e componentes já existentes no projeto.
