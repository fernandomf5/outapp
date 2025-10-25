import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export const ChatbotReportsPanel = ({ chatbotId }: { chatbotId: string }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Relatórios e Exportação
      </h3>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Mensais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Conversas
          </Button>
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Clientes
          </Button>
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Pedidos
          </Button>
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};