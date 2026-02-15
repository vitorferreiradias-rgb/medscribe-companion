import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Type, Palette, EyeOff, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const FONTS = [
  { label: "Moderna", value: "'Inter', system-ui, sans-serif" },
  { label: "Itálica", value: "'Georgia', 'Times New Roman', serif", italic: true },
];

const COLORS = [
  { label: "Preto", value: "hsl(225, 50%, 9%)" },
  { label: "Azul", value: "hsl(215, 84%, 53%)" },
  { label: "Verde", value: "hsl(160, 64%, 40%)" },
  { label: "Vermelho", value: "hsl(0, 84%, 60%)" },
  { label: "Cinza", value: "hsl(215, 14%, 46%)" },
];

const SPECIAL_CHARS = ["º", "ª", "°", "±", "µ", "²", "³", "½", "¼", "¾", "→", "←", "•", "—", "…"];
const MEDICAL_UNITS = ["mg", "ml", "µg", "µL", "UI", "g/L", "mg/dL", "mEq/L", "mcg", "cp", "comp", "gts", "caps"];

interface PrescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PrescriptionEditor({ value, onChange, placeholder = "Digite a prescrição aqui..." }: PrescriptionEditorProps) {
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [fontLabel, setFontLabel] = useState(FONTS[0].label);
  const [isItalicFont, setIsItalicFont] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState(COLORS[0].value);
  const [colorLabel, setColorLabel] = useState(COLORS[0].label);
  const [customColor, setCustomColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [isHidden, setIsHidden] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosave draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("medscribe_receita_draft", JSON.stringify({ value, fontFamily, fontSize, fontColor, isBold, isItalic, isUnderline, textAlign }));
    }, 500);
    return () => clearTimeout(timer);
  }, [value, fontFamily, fontSize, fontColor, isBold, isItalic, isUnderline, textAlign]);

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("medscribe_receita_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.value && !value) onChange(parsed.value);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.fontColor) setFontColor(parsed.fontColor);
      }
    } catch {}
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = value.substring(0, start) + text + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    }, 0);
  }, [value, onChange]);

  const selectFont = (font: typeof FONTS[0]) => {
    setFontFamily(font.value);
    setFontLabel(font.label);
    setIsItalicFont(!!font.italic);
  };

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${fontSize}px`,
    color: fontColor,
    fontWeight: isBold ? 700 : 400,
    fontStyle: isItalic || isItalicFont ? "italic" : "normal",
    textDecoration: [isUnderline && "underline", isStrikethrough && "line-through"].filter(Boolean).join(" ") || "none",
    textAlign,
    lineHeight: 1.7,
  };

  const ToolBtn = ({ active, onClick, children, label }: { active?: boolean; onClick: () => void; children: React.ReactNode; label: string }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={`h-7 w-7 flex items-center justify-center rounded-md text-xs transition-all duration-150 ${
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[11px]">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border/40 bg-muted/20">
        {/* Font selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors">
              <Type className="h-3.5 w-3.5" />
              <span>{fontLabel}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1.5" align="start">
            {FONTS.map((f) => (
              <button
                key={f.label}
                onClick={() => selectFont(f)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  fontFamily === f.value ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
                style={{ fontFamily: f.value, fontStyle: f.italic ? "italic" : "normal" }}
              >
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 px-2 flex items-center gap-1.5 rounded-md text-xs hover:bg-muted transition-colors">
              <div className="h-3.5 w-3.5 rounded-full border border-border/60" style={{ backgroundColor: fontColor }} />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2.5" align="start">
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Cor da letra</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => { setFontColor(c.value); setColorLabel(c.label); }}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    fontColor === c.value ? "border-primary ring-2 ring-primary/20" : "border-border/40"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/30">
              <input
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setFontColor(e.target.value); setColorLabel("Custom"); }}
                className="h-6 w-6 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-[11px] text-muted-foreground">Personalizada</span>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Font size slider */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 px-2 flex items-center gap-1.5 rounded-md text-xs font-medium hover:bg-muted transition-colors">
              <span className="text-muted-foreground">{fontSize}px</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3" align="start">
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tamanho</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">10</span>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={10}
                max={28}
                step={1}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground">28</span>
            </div>
            <p className="text-center text-sm font-medium mt-1">{fontSize}px</p>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Formatting */}
        <ToolBtn active={isBold} onClick={() => setIsBold(!isBold)} label="Negrito"><Bold className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={isItalic} onClick={() => setIsItalic(!isItalic)} label="Itálico"><Italic className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={isUnderline} onClick={() => setIsUnderline(!isUnderline)} label="Sublinhado"><Underline className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={isStrikethrough} onClick={() => setIsStrikethrough(!isStrikethrough)} label="Tachado"><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Alignment */}
        <ToolBtn active={textAlign === "left"} onClick={() => setTextAlign("left")} label="Alinhar à esquerda"><AlignLeft className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={textAlign === "center"} onClick={() => setTextAlign("center")} label="Centralizar"><AlignCenter className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={textAlign === "right"} onClick={() => setTextAlign("right")} label="Alinhar à direita"><AlignRight className="h-3.5 w-3.5" /></ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Lists */}
        <ToolBtn active={false} onClick={() => insertAtCursor("\n• ")} label="Lista"><List className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn active={false} onClick={() => insertAtCursor("\n1. ")} label="Lista numerada"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Special chars */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 px-2 flex items-center gap-1 rounded-md text-xs hover:bg-muted transition-colors text-muted-foreground">
              <span className="font-mono">µ</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Caracteres especiais</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {SPECIAL_CHARS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => insertAtCursor(ch)}
                  className="h-8 w-8 flex items-center justify-center rounded-md border border-border/40 text-sm hover:bg-primary/10 hover:text-primary transition-colors font-mono"
                >
                  {ch}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Unidades médicas</p>
            <div className="flex flex-wrap gap-1">
              {MEDICAL_UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => insertAtCursor(u)}
                  className="h-7 px-2 flex items-center justify-center rounded-md border border-border/40 text-[11px] hover:bg-primary/10 hover:text-primary transition-colors font-mono"
                >
                  {u}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <ToolBtn active={isHidden} onClick={() => setIsHidden(!isHidden)} label="Ocultar texto"><EyeOff className="h-3.5 w-3.5" /></ToolBtn>
      </div>

      {/* Editor area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
          className="w-full resize-y border-0 bg-white px-5 py-4 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
          style={{
            ...textStyle,
            visibility: isHidden ? "hidden" : "visible",
            minHeight: "200px",
          }}
        />
        {isHidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 pointer-events-none">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <EyeOff className="h-4 w-4" /> Conteúdo oculto
            </p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/30 bg-muted/10">
        <span className="text-[10px] text-muted-foreground">
          {value.length} caracteres · {value.split(/\s+/).filter(Boolean).length} palavras
        </span>
        <span className="text-[10px] text-success flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
          Rascunho salvo
        </span>
      </div>
    </motion.div>
  );
}
