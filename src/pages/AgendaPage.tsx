import { useOutletContext } from "react-router-dom";
import Agenda from "@/pages/Agenda";

interface AgendaContext {
  currentDate: Date;
  onNewSchedule: () => void;
}

export default function AgendaPage() {
  const context = useOutletContext<AgendaContext>();
  return <Agenda currentDate={context.currentDate} onNewSchedule={context.onNewSchedule} />;
}
