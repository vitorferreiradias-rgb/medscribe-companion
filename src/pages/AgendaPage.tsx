import { useOutletContext } from "react-router-dom";
import Agenda from "@/pages/Agenda";

interface AgendaContext {
  currentDate: Date;
  onNewSchedule: () => void;
  onReschedule: (eventId: string) => void;
  onNewTimeBlock: () => void;
  onSmartAssistant?: () => void;
}

export default function AgendaPage() {
  const context = useOutletContext<AgendaContext>();
  return (
    <Agenda
      currentDate={context.currentDate}
      onNewSchedule={context.onNewSchedule}
      onReschedule={context.onReschedule}
      onNewTimeBlock={context.onNewTimeBlock}
      onSmartAssistant={context.onSmartAssistant}
    />
  );
}
