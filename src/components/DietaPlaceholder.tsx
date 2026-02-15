import { useState } from "react";
import { motion } from "framer-motion";
import { Apple, UtensilsCrossed, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLongBR } from "@/lib/format";

export function DietaPlaceholder() {
  const [draft, setDraft] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Info card */}
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <UtensilsCrossed className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Orientação Nutricional</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                Registre orientações alimentares e restrições do paciente. 
                Este módulo será expandido com templates e cálculo calórico em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draft area */}
      <Card className="glass-card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Apple className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Rascunho</span>
          </div>
          <Textarea
            placeholder="Orientações dietéticas, restrições alimentares, suplementação..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="text-sm resize-y"
          />
          {draft.trim().length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] text-foreground font-medium">{formatDateLongBR()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
