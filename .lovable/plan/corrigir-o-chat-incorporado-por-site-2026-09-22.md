# Corrigir o chat incorporado por site

## Correção
- Garantir que o código colado carregue sempre o Chat Online correspondente ao `data-agent-id` daquele código.
- Quando houver um código antigo e outro novo no mesmo site, substituir o widget anterior pelo chat do código mais recente, em vez de manter o primeiro.
- Atualizar a versão do arquivo copiado para impedir que o navegador use a versão antiga em cache.

## Validação
- Simular uma página com dois códigos de chats diferentes e confirmar que o segundo ID é o exibido.
- Confirmar que uma página com apenas um código continua abrindo o chat correto.
