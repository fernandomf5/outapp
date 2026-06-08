import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OrganizationTablesPanel } from "@/components/registration/OrganizationTablesPanel";
import { supabase } from "@/integrations/supabase/client";

const FullOrganizationTable = () => {
  const { tableId } = useParams();
  const [tableName, setTableName] = useState("Tabela");

  useEffect(() => {
    const fetchTableName = async () => {
      if (tableId) {
        const { data } = await supabase
          .from("organization_tables")
          .select("name")
          .eq("id", tableId)
          .single();
        if (data) setTableName(data.name);
      }
    };
    fetchTableName();
  }, [tableId]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tableName}</h1>
        </div>
        <OrganizationTablesPanel preselectedTableId={tableId} isFullPage={true} />
      </div>
    </div>
  );
};

export default FullOrganizationTable;
