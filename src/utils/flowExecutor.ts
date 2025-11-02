import { Node, Edge } from 'reactflow';

export interface FlowExecutionResult {
  message?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  documentName?: string;
  buttons?: Array<{ text: string; url?: string; targetNodeId?: string }>;
  nextNodeId?: string;
  transferToHuman?: boolean;
  delaySeconds?: number;
}

export class FlowExecutor {
  private nodes: Node[];
  private edges: Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // Encontrar node inicial
  findInitialNode(): Node | null {
    return this.nodes.find(node => node.id === 'initial-message') || this.nodes[0] || null;
  }

  // Encontrar node por palavra-chave
  findNodeByKeyword(keyword: string): Node | null {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return this.nodes.find(node => {
      const nodeKeyword = node.data.keyword?.toLowerCase().trim();
      return nodeKeyword && normalizedKeyword.includes(nodeKeyword);
    }) || null;
  }

  // Encontrar próximo node através de uma edge
  findNextNode(currentNodeId: string, buttonIndex?: number): Node | null {
    // Procurar edges que saem do node atual
    const outgoingEdges = this.edges.filter(edge => edge.source === currentNodeId);
    
    if (outgoingEdges.length === 0) return null;

    // Se tiver índice de botão, usar a edge correspondente
    const targetEdge = buttonIndex !== undefined && outgoingEdges[buttonIndex]
      ? outgoingEdges[buttonIndex]
      : outgoingEdges[0];

    return this.nodes.find(node => node.id === targetEdge.target) || null;
  }

  // Executar um node e retornar o resultado
  executeNode(node: Node, userName?: string): FlowExecutionResult {
    const { data } = node;
    const result: FlowExecutionResult = {
      delaySeconds: data.delaySeconds || 0,
    };

    // Processar variáveis no texto
    let message = data.label || '';
    if (userName) {
      message = message.replace(/{name}/g, userName);
      message = message.replace(/{first_name}/g, userName.split(' ')[0]);
    }

    // Definir conteúdo baseado no tipo de node
    switch (node.type) {
      case 'text':
        result.message = message;
        break;

      case 'image':
        result.message = message;
        result.imageUrl = data.imageUrl;
        break;

      case 'video':
        result.message = message;
        result.videoUrl = data.videoUrl;
        break;

      case 'audio':
        result.message = message;
        result.audioUrl = data.audioUrl;
        break;

      case 'document':
        result.message = message;
        result.documentUrl = data.documentUrl;
        result.documentName = data.documentName;
        break;

      case 'humanAgent':
        result.message = message || 'Você está sendo transferido para um atendente humano...';
        result.transferToHuman = true;
        break;

      case 'button':
        result.message = message;
        break;
    }

    // Processar botões se existirem
    if (data.buttons && Array.isArray(data.buttons) && data.buttons.length > 0) {
      result.buttons = data.buttons.map((btn: any, index: number) => {
        const nextNode = this.findNextNode(node.id, index);
        return {
          text: btn.text,
          url: btn.url,
          targetNodeId: nextNode?.id,
        };
      });
    }

    // Determinar próximo node automaticamente se não tiver botões
    if (!result.buttons || result.buttons.length === 0) {
      const nextNode = this.findNextNode(node.id);
      if (nextNode) {
        result.nextNodeId = nextNode.id;
      }
    }

    return result;
  }

  // Executar fluxo completo a partir de um node
  async executeFlow(startNodeId: string, userName?: string): Promise<FlowExecutionResult[]> {
    const results: FlowExecutionResult[] = [];
    let currentNodeId: string | null = startNodeId;
    let depth = 0;
    const maxDepth = 20; // Prevenir loops infinitos

    while (currentNodeId && depth < maxDepth) {
      const currentNode = this.nodes.find(n => n.id === currentNodeId);
      if (!currentNode) break;

      const result = this.executeNode(currentNode, userName);
      results.push(result);

      // Se tiver botões ou transferência humana, parar aqui
      if (result.buttons || result.transferToHuman) {
        break;
      }

      // Continuar para próximo node
      currentNodeId = result.nextNodeId || null;
      depth++;
    }

    return results;
  }
}
