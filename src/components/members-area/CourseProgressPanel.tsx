import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, CheckCircle, Clock, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseProgressPanelProps {
  areaId: string;
}

export function CourseProgressPanel({ areaId }: CourseProgressPanelProps) {
  const [progress, setProgress] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [areaId]);

  const loadData = async () => {
    try {
      // Carregar módulos
      const { data: modulesData } = await supabase
        .from('members_area_modules')
        .select('*')
        .eq('members_area_id', areaId)
        .order('order_index');

      if (modulesData) setModules(modulesData);

      // Carregar progresso dos alunos
      const { data: progressData } = await supabase
        .from('members_course_progress')
        .select('*')
        .eq('members_area_id', areaId)
        .order('last_watched_at', { ascending: false });

      if (progressData) setProgress(progressData);

      // Carregar certificados emitidos
      const { data: certsData } = await supabase
        .from('members_certificates')
        .select('*')
        .eq('members_area_id', areaId)
        .order('issued_at', { ascending: false });

      if (certsData) setCertificates(certsData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (userEmail: string, userName: string) => {
    const certificateCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const { error } = await supabase
      .from('members_certificates')
      .insert([{
        members_area_id: areaId,
        user_email: userEmail,
        user_name: userName,
        certificate_code: certificateCode
      }]);

    if (error) {
      toast.error('Erro ao gerar certificado');
    } else {
      toast.success('Certificado gerado com sucesso!');
      loadData();
    }
  };

  // Agrupar progresso por aluno
  const studentProgress = progress.reduce((acc, p) => {
    if (!acc[p.user_email]) {
      acc[p.user_email] = {
        email: p.user_email,
        modules: [],
        totalCompleted: 0,
        totalProgress: 0
      };
    }
    acc[p.user_email].modules.push(p);
    if (p.completed) acc[p.user_email].totalCompleted++;
    acc[p.user_email].totalProgress += p.progress_percentage || 0;
    return acc;
  }, {} as any);

  const students = Object.values(studentProgress) as any[];

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground">Alunos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-sm text-muted-foreground">Módulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-sm text-muted-foreground">Certificados Emitidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {students.length > 0 
                ? Math.round(students.reduce((sum: number, s: any) => {
                    const avg = s.modules.length > 0 ? s.totalProgress / s.modules.length : 0;
                    return sum + avg;
                  }, 0) / students.length)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Progresso Médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos e Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso dos Alunos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.map((student: any) => {
            const avgProgress = student.modules.length > 0 
              ? Math.round(student.totalProgress / student.modules.length) 
              : 0;
            const hasCertificate = certificates.some(c => c.user_email === student.email);

            return (
              <div key={student.email} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{student.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.totalCompleted} de {modules.length} módulos completos
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCertificate ? (
                      <Badge variant="default" className="gap-1">
                        <Award className="w-3 h-3" />
                        Certificado
                      </Badge>
                    ) : avgProgress === 100 ? (
                      <Button
                        size="sm"
                        onClick={() => generateCertificate(student.email, student.email)}
                        className="gap-1"
                      >
                        <Award className="w-4 h-4" />
                        Gerar Certificado
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progresso Geral</span>
                    <span className="font-medium">{avgProgress}%</span>
                  </div>
                  <Progress value={avgProgress} className="h-2" />
                </div>
              </div>
            );
          })}

          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno com progresso registrado ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificados Emitidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certificados Emitidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">{cert.user_name}</div>
                  <div className="text-sm text-muted-foreground">{cert.user_email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Código: {cert.certificate_code}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}

            {certificates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum certificado emitido ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}