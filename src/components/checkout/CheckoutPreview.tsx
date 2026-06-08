import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package } from "lucide-react";

export const CheckoutPreview = ({ checkout }: { checkout: any }) => {
  return (
    <Card className="w-full border-2 border-primary/20 shadow-none">
      <CardContent className="p-4 space-y-4">
        {checkout.banner_url && (
          <div className="w-full h-24 overflow-hidden rounded-md">
            <img src={checkout.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-3">
          {checkout.item_image_url && (
            <img src={checkout.item_image_url} alt={checkout.item_name} className="w-16 h-16 rounded-md object-cover" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm truncate">{checkout.item_name || 'Nome do Item'}</h4>
            <p className="text-xs text-muted-foreground truncate">{checkout.item_description || 'Descrição...'}</p>
            <p className="font-bold text-primary mt-1">R$ {Number(checkout.price || 0).toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
