-- Permitir que donos de chatbots deletem conversas e mensagens

-- Policy para deletar conversas
CREATE POLICY "Chatbot owners can delete their conversations"
ON chatbot_conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chatbots
    WHERE chatbots.id = chatbot_conversations.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
);

-- Policy para deletar mensagens
CREATE POLICY "Chatbot owners can delete messages from their conversations"
ON chatbot_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chatbot_conversations cc
    JOIN chatbots cb ON cb.id = cc.chatbot_id
    WHERE cc.id = chatbot_messages.conversation_id
    AND cb.user_id = auth.uid()
  )
);