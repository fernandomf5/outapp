import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface AgentSchedulePanelProps {
  agentId: string;
}

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ScheduleBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AgentSchedulePanel({ agentId }: AgentSchedulePanelProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true
  });

  const [newBlock, setNewBlock] = useState({
    start_date: "",
    end_date: "",
    reason: ""
  });

  useEffect(() => {
    fetchSchedules();
    fetchBlocks();
  }, [agentId]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_schedule')
        .select('*')
        .eq('agent_id', agentId)
        .order('day_of_week');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_schedule_blocks')
        .select('*')
        .eq('agent_id', agentId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const { error } = await supabase
        .from('agent_schedule')
        .insert([{ ...newSchedule, agent_id: agentId }]);

      if (error) throw error;

      toast.success('Horário criado com sucesso!');
      setDialogOpen(false);
      fetchSchedules();
      setNewSchedule({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "18:00",
        is_active: true
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Erro ao criar horário');
    }
  };

  const handleCreateBlock = async () => {
    try {
      const { error } = await supabase
        .from('agent_schedule_blocks')
        .insert([{ ...newBlock, agent_id: agentId }]);

      if (error) throw error;

      toast.success('Bloqueio criado com sucesso!');
      setBlockDialogOpen(false);
      fetchBlocks();
      setNewBlock({
        start_date: "",
        end_date: "",
        reason: ""
      });
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Erro ao criar bloqueio');
    }
  };

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_schedule')
        .update({ is_active: !isActive })
        .eq('id', scheduleId);

      if (error) throw error;
      fetchSchedules();
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('agent_schedule_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      fetchBlocks();
      toast.success('Bloqueio removido!');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Erro ao remover bloqueio');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Horários de Funcionamento</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Horário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Horário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Dia da Semana</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded"
                    value={newSchedule.day_of_week}
                    onChange={(e) => setNewSchedule({...newSchedule, day_of_week: Number(e.target.value)})}
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Horário de Término</Label>
                  <Input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                  />
                </div>
                <Button onClick={handleCreateSchedule} className="w-full">
                  Criar Horário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum horário configurado
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{daysOfWeek[schedule.day_of_week]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={schedule.is_active ? "bg-green-500" : "bg-gray-500"}>
                          {schedule.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => toggleSchedule(schedule.id, schedule.is_active)}
                      />
                    </TableCell>
                  </TableRow>
                      ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bloqueios de Agenda</CardTitle>
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Bloqueio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Bloqueio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="datetime-local"
                    value={newBlock.start_date}
                    onChange={(e) => setNewBlock({...newBlock, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data de Término</Label>
                  <Input
                    type="datetime-local"
                    value={newBlock.end_date}
                    onChange={(e) => setNewBlock({...newBlock, end_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                    placeholder="Ex: Férias, feriado..."
                  />
                </div>
                <Button onClick={handleCreateBlock} className="w-full">
                  Criar Bloqueio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum bloqueio configurado
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {new Date(block.start_date).toLocaleString('pt-BR')} até{' '}
                        {new Date(block.end_date).toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>{block.reason || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBlock(block.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
