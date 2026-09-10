"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  Brain,
  Clock,
  AlertTriangle,
  Settings,
  BarChart3,
  Trash2,
  XOctagon,
  Activity,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Direction = "CALL" | "PUT" | null;
type Risk = "Baixo" | "Moderado" | "Alto";
type TendencyLevel = "Fraca" | "Moderada" | "Forte";
type FeedbackType = "win" | "loss" | null;

interface AnalysisResult {
  direction: Direction;
  signalType: string;
  confidence: number;
  tendency: TendencyLevel;
  risk: Risk;
  tendencyDescription: string;
  indicators: { name: string; description: string }[];
  patterns: string[];
  levels: { support: string; resistance: string; volatility: string };
  recommendation: string;
  timeframe: string;
  entryTime: string;
  warning: string;
}

interface HistoryItem {
  id: string;
  fileName: string;
  timeframe: string;
  result: AnalysisResult;
  feedback: FeedbackType;
  comment: string;
  date: Date;
}

interface PerformanceMetrics {
  hitRate: number;
  efficiency: number;
  consistency: number;
  neuralCalibration: number;
  totalAnalyses: number;
  wins: number;
  losses: number;
}

const calculateMetrics = (history: HistoryItem[]): PerformanceMetrics => {
  if (history.length === 0) {
    return { hitRate: 0, efficiency: 0, consistency: 0, neuralCalibration: 0, totalAnalyses: 0, wins: 0, losses: 0 };
  }
  const wins = history.filter((h) => h.feedback === "win").length;
  const losses = history.filter((h) => h.feedback === "loss").length;
  const total = history.length;
  const hitRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const correctWithConfidence = history.filter((h) => h.feedback === "win").reduce((acc, h) => acc + h.result.confidence, 0);
  const efficiency = wins > 0 ? Math.round(correctWithConfidence / wins) : 0;
  let maxStreak = 0;
  let currentStreak = 0;
  for (const h of history) {
    if (h.feedback === "win") { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else { currentStreak = 0; }
  }
  const consistency = total > 0 ? Math.min(100, Math.round((maxStreak / total) * 150)) : 0;
  const highConfidenceAnalyses = history.filter((h) => h.result.confidence >= 70);
  const correctHighConfidence = highConfidenceAnalyses.filter((h) => h.feedback === "win").length;
  const neuralCalibration = highConfidenceAnalyses.length > 0
    ? Math.round((correctHighConfidence / highConfidenceAnalyses.length) * 100)
    : Math.round(efficiency * 0.9);
  return { hitRate, efficiency, consistency, neuralCalibration, totalAnalyses: total, wins, losses };
};

const timeframes = [
  { value: "1", label: "1 minuto" },
  { value: "2", label: "2 minutos" },
  { value: "3", label: "3 minutos" },
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
  { value: "15", label: "15 minutos" },
];

function CircularProgress({ value, color, icon }: { value: number; color: string; icon: React.ReactNode }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" className="stroke-border" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-0.5">{icon}</div>
          <span className="text-xl font-bold text-foreground">{value}%</span>
        </div>
      </div>
    </div>
  );
}

function TriangleRadar({ metrics }: { metrics: PerformanceMetrics }) {
  const size = 160;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 60;
  const hitRatePoint = { x: centerX, y: centerY - (metrics.hitRate / 100) * radius };
  const efficiencyPoint = { x: centerX + (metrics.efficiency / 100) * radius * 0.866, y: centerY + (metrics.efficiency / 100) * radius * 0.5 };
  const consistencyPoint = { x: centerX - (metrics.consistency / 100) * radius * 0.866, y: centerY + (metrics.consistency / 100) * radius * 0.5 };
  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon points={`${centerX},${centerY - radius} ${centerX + radius * 0.866},${centerY + radius * 0.5} ${centerX - radius * 0.866},${centerY + radius * 0.5}`} fill="none" className="stroke-border" strokeWidth="1" />
        <polygon points={`${centerX},${centerY - radius * 0.66} ${centerX + radius * 0.577},${centerY + radius * 0.33} ${centerX - radius * 0.577},${centerY + radius * 0.33}`} fill="none" className="stroke-border" strokeWidth="1" />
        <polygon points={`${centerX},${centerY - radius * 0.33} ${centerX + radius * 0.289},${centerY + radius * 0.165} ${centerX - radius * 0.289},${centerY + radius * 0.165}`} fill="none" className="stroke-border" strokeWidth="1" />
        <polygon points={`${hitRatePoint.x},${hitRatePoint.y} ${efficiencyPoint.x},${efficiencyPoint.y} ${consistencyPoint.x},${consistencyPoint.y}`} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
        <circle cx={hitRatePoint.x} cy={hitRatePoint.y} r="4" fill="#22c55e" />
        <circle cx={efficiencyPoint.x} cy={efficiencyPoint.y} r="4" fill="#22c55e" />
        <circle cx={consistencyPoint.x} cy={consistencyPoint.y} r="4" fill="#22c55e" />
        <text x={centerX} y={centerY - radius - 10} textAnchor="middle" className="fill-muted-foreground" fontSize="10">Taxa de Acerto</text>
        <text x={centerX + radius + 10} y={centerY + radius + 5} textAnchor="start" className="fill-muted-foreground" fontSize="10">Eficiência</text>
        <text x={centerX - radius - 10} y={centerY + radius + 5} textAnchor="end" className="fill-muted-foreground" fontSize="10">Consistência</text>
      </svg>
    </div>
  );
}

export default function AnalyzerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("study-analyzer-timeframe") || "5";
    return "5";
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sent" | "waiting">("idle");
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState<string>("Todas");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => { localStorage.setItem("study-analyzer-timeframe", timeframe); }, [timeframe]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => calculateMetrics(history), [history]);

  const filteredHistory = useMemo(() => {
    if (filter === "Todas") return history;
    const nowDate = new Date();
    let startDate: Date;
    switch (filter) {
      case "Hoje": startDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()); break;
      case "Semana": startDate = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "Mês": startDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1); break;
      default: return history;
    }
    return history.filter((h) => h.date >= startDate);
  }, [history, filter]);

  const filteredMetrics = useMemo(() => calculateMetrics(filteredHistory), [filteredHistory]);

  useEffect(() => { loadAnalyses(); }, []);

  const loadAnalyses = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch("/api/analyses");
      const data = await response.json();
      if (data.success && data.analyses) {
        const mappedHistory: HistoryItem[] = data.analyses.map((a: any) => ({
          id: a.id,
          fileName: a.fileName,
          timeframe: a.timeframe,
          result: {
            direction: a.direction,
            signalType: a.direction === "PUT" ? "VENDA" : "COMPRA",
            confidence: a.confidence,
            tendency: a.tendency,
            risk: a.risk,
            tendencyDescription: a.tendencyDesc,
            indicators: JSON.parse(a.indicators || "[]"),
            patterns: JSON.parse(a.patterns || "[]"),
            levels: { support: a.supportLevel, resistance: a.resistanceLevel, volatility: a.volatility },
            recommendation: a.recommendation,
            timeframe: a.timeframe,
            entryTime: a.entryTime,
            warning: a.warning,
          },
          feedback: a.feedback?.result || null,
          comment: a.feedback?.comment || "",
          date: new Date(a.createdAt),
        }));
        setHistory(mappedHistory);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getCurrentTime = () => now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const getCurrentDate = () => now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) loadImage(blob, `clipboard-${Date.now()}.png`);
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const loadImage = (file: File, name: string) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setFileName(name);
      setResult(null);
      setFeedback(null);
      setFeedbackStatus("idle");
      setComment("");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadImage(file, file.name);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file, file.name);
  };

  const removeImage = () => {
    setImage(null);
    setFileName("");
    setResult(null);
    setFeedback(null);
    setFeedbackStatus("idle");
    setComment("");
  };

  const getEntryTime = (tf: string): string => {
    const minutes = parseInt(tf);
    return new Date(Date.now() + minutes * 60000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, timeframe }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro na análise");
      const analysis = data.analysis;
      const analysisResult: AnalysisResult = {
        direction: analysis.direction || "CALL",
        signalType: analysis.direction === "PUT" ? "VENDA" : "COMPRA",
        confidence: analysis.confidence || 75,
        tendency: analysis.tendency || "Moderada",
        risk: analysis.risk || "Moderado",
        tendencyDescription: analysis.tendencyDescription || analysis.justification || "Análise técnica realizada",
        indicators: analysis.indicators || [{ name: "RSI", description: "Análise de momentum" }, { name: "MACD", description: "Tendência e momentum" }],
        patterns: analysis.patterns || ["Padrão identificado"],
        levels: {
          support: analysis.levels?.support || "Suporte identificado",
          resistance: analysis.levels?.resistance || "Resistência identificada",
          volatility: analysis.levels?.volatility || "Média",
        },
        recommendation: analysis.recommendation || (analysis.direction === "PUT" ? "VENDA (PUT)" : "COMPRA (CALL)"),
        timeframe: timeframes.find((t) => t.value === timeframe)?.label?.toUpperCase() || "5 MINUTOS",
        entryTime: analysis.entryTime || getEntryTime(timeframe),
        warning: analysis.warning || "Aguarde confirmação do sinal",
      };
      try {
        const saveResponse = await fetch("/api/analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: fileName || "clipboard", timeframe, direction: analysisResult.direction,
            confidence: analysisResult.confidence, tendency: analysisResult.tendency,
            risk: analysisResult.risk, tendencyDescription: analysisResult.tendencyDescription,
            indicators: analysisResult.indicators, patterns: analysisResult.patterns,
            levels: analysisResult.levels, recommendation: analysisResult.recommendation,
            entryTime: analysisResult.entryTime, warning: analysisResult.warning,
            justification: analysis.justification || "",
          }),
        });
        const saveData = await saveResponse.json();
        if (saveData.success && saveData.analysis) setCurrentAnalysisId(saveData.analysis.id);
      } catch (saveError) { console.error("Error saving analysis:", saveError); }
      setResult(analysisResult);
    } catch (error: any) {
      console.error("Analysis error:", error);
      const isPut = Math.random() > 0.4;
      const confidence = 60 + Math.floor(Math.random() * 30);
      const risks: Risk[] = ["Baixo", "Moderado", "Alto"];
      const tendencies: TendencyLevel[] = ["Fraca", "Moderada", "Forte"];
      const mockResult: AnalysisResult = {
        direction: isPut ? "PUT" : "CALL", signalType: isPut ? "VENDA" : "COMPRA",
        confidence, tendency: tendencies[Math.floor(Math.random() * 3)],
        risk: risks[Math.floor(Math.random() * 3)],
        tendencyDescription: "Análise simulada - API indisponível",
        indicators: [{ name: "RSI", description: "Indicador de momentum" }, { name: "MACD", description: "Indicador de tendência" }],
        patterns: ["Padrão não identificado"],
        levels: { support: "Suporte não identificado", resistance: "Resistência não identificada", volatility: "Média" },
        recommendation: isPut ? "VENDA (PUT)" : "COMPRA (CALL)",
        timeframe: timeframes.find((t) => t.value === timeframe)?.label?.toUpperCase() || "5 MINUTOS",
        entryTime: getEntryTime(timeframe),
        warning: "API indisponível - usando dados simulados",
      };
      try {
        const saveResponse = await fetch("/api/analyses", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: fileName || "clipboard", timeframe, direction: mockResult.direction,
            confidence: mockResult.confidence, tendency: mockResult.tendency,
            risk: mockResult.risk, tendencyDescription: mockResult.tendencyDescription,
            indicators: mockResult.indicators, patterns: mockResult.patterns,
            levels: mockResult.levels, recommendation: mockResult.recommendation,
            entryTime: mockResult.entryTime, warning: mockResult.warning, justification: "",
          }),
        });
        const saveData = await saveResponse.json();
        if (saveData.success && saveData.analysis) setCurrentAnalysisId(saveData.analysis.id);
      } catch (saveError) { console.error("Error saving mock analysis:", saveError); }
      setResult(mockResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitFeedback = async (type: FeedbackType) => {
    setFeedback(type);
    setFeedbackStatus("sent");
    if (currentAnalysisId) {
      try {
        await fetch(`/api/analyses/${currentAnalysisId}/feedback`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: type, comment: comment || undefined }),
        });
        await loadAnalyses();
      } catch (error) { console.error("Error saving feedback:", error); }
    }
    setTimeout(() => {
      setResult(null);
      setCurrentAnalysisId(null);
      setFeedback(null);
      setFeedbackStatus("idle");
      setComment("");
      setImage(null);
      setFileName("");
    }, 1500);
  };

  const deleteAnalysis = async () => {
    if (currentAnalysisId) {
      try {
        await fetch(`/api/analyses?id=${currentAnalysisId}`, { method: "DELETE" });
        await loadAnalyses();
      } catch (error) { console.error("Error deleting analysis:", error); }
    }
    setResult(null);
    setCurrentAnalysisId(null);
    setFeedback(null);
    setFeedbackStatus("idle");
    setComment("");
    setImage(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "monospace" }}>
              <span className="text-green-500">Study</span> <span className="text-foreground">Analyzer</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Date/Time */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{getCurrentDate()}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-sm text-green-500 font-mono">{getCurrentTime()}</span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Selecione o timeframe do gráfico</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-green-500 transition-colors"
          >
            {timeframes.map((tf) => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
        </div>

        {/* Upload Area */}
        <Card
          className="bg-card border-2 border-dashed border-green-500/30 hover:border-green-500/50 transition-colors mb-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            {image ? (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden bg-background">
                  <img src={image} alt="Gráfico" className="w-full max-h-[500px] object-contain" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{fileName}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={removeImage} className="text-muted-foreground hover:text-red-400">
                      <X className="mr-1 h-4 w-4" /> Remover
                    </Button>
                    <Button size="sm" onClick={analyzeImage} disabled={isAnalyzing} className="bg-green-500 hover:bg-green-600 text-black">
                      {isAnalyzing ? (
                        <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analisando...</>
                      ) : (
                        <><Brain className="mr-1 h-4 w-4" /> Analisar</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 cursor-pointer" onClick={() => document.getElementById("file-input")?.click()}>
                <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Upload className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-green-500 mb-2" style={{ fontFamily: "monospace" }}>Envie o print do gráfico</h2>
                <p className="text-muted-foreground mb-4">Arraste e solte ou clique para selecionar</p>
                <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
                  <span className="text-lg">📋</span>
                  <span>Ou pressione Ctrl+V para colar uma imagem</span>
                </div>
                <p className="text-xs text-muted-foreground">Formatos aceitos: JPG, PNG, WEBP</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground mb-8">
          A única inteligência artificial do mundo especializada em análise gráfica, desenvolvida para transformar traders em operadores lucrativos.
        </p>

        {/* Analysis Result */}
        {result && (
          <div className="mb-6">
            <Card className="bg-card border border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Signal Header */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {result.direction === "PUT" ? (
                        <TrendingDown className="w-8 h-8 text-red-400" />
                      ) : (
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      )}
                      <h2 className={`text-3xl font-bold ${result.direction === "PUT" ? "text-red-400" : "text-green-400"}`} style={{ fontFamily: "monospace" }}>
                        Sinal de {result.signalType}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.tendencyDescription}</p>
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center px-6 py-3 rounded-full ${result.direction === "PUT" ? "bg-red-500" : "bg-green-500"}`}>
                      <span className="text-xl font-bold text-foreground">{result.confidence}% Confiante</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border">
                      <span className="text-xs text-muted-foreground">Tendência:</span>
                      <span className="text-xs text-foreground font-medium">{result.tendency}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border">
                      <span className="text-xs text-muted-foreground">Risco:</span>
                      <span className={`text-xs font-medium ${result.risk === "Alto" ? "text-red-400" : result.risk === "Moderado" ? "text-yellow-400" : "text-green-400"}`}>{result.risk}</span>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <h3 className="text-sm font-bold text-green-500 mb-3" style={{ fontFamily: "monospace" }}>ANÁLISE TÉCNICA DETALHADA</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{result.warning}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Settings className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">CONFIGURAÇÃO: Configure seu painel para timeframe de {result.timeframe}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">ENTRADA NA PRÓXIMA VELA: {result.entryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Analysis */}
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <h3 className="text-sm font-bold text-green-500 mb-3" style={{ fontFamily: "monospace" }}>ANÁLISE TÉCNICA PROFISSIONAL</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-foreground font-medium">TENDÊNCIA:</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">{result.tendencyDescription}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-foreground font-medium">INDICADORES TÉCNICOS:</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {result.indicators.map((ind, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• <span className="text-foreground font-medium">{ind.name}:</span> {ind.description}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-foreground font-medium">PADRÕES GRÁFICOS:</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {result.patterns.map((pattern, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {pattern}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-foreground font-medium">NÍVEIS CHAVE:</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          <li className="text-sm text-muted-foreground">• <span className="text-green-400">Suporte:</span> {result.levels.support}</li>
                          <li className="text-sm text-muted-foreground">• <span className="text-red-400">Resistência:</span> {result.levels.resistance}</li>
                          <li className="text-sm text-muted-foreground">• <span className="text-yellow-400">Volatilidade:</span> {result.levels.volatility}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-foreground font-bold" style={{ fontFamily: "monospace" }}>RECOMENDAÇÃO: {result.recommendation}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Probabilidade estimada:</span>
                        <p className="text-lg font-bold text-foreground">{result.confidence}%</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Timeframe:</span>
                        <p className="text-lg font-bold text-foreground">{result.timeframe}</p>
                      </div>
                    </div>
                  </div>

                  {/* Support & Resistance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background border border-border">
                      <h4 className="text-xs font-bold text-green-500 mb-2" style={{ fontFamily: "monospace" }}>SUPORTE</h4>
                      <p className="text-sm text-muted-foreground">{result.levels.support}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-border">
                      <h4 className="text-xs font-bold text-red-400 mb-2" style={{ fontFamily: "monospace" }}>RESISTÊNCIA</h4>
                      <p className="text-sm text-muted-foreground">{result.levels.resistance}</p>
                    </div>
                  </div>

                  {/* Patterns Badges */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">PADRÕES IDENTIFICADOS</p>
                    <div className="flex flex-wrap gap-2">
                      {result.patterns.map((p, i) => (
                        <Badge key={i} className="bg-green-500/20 text-green-400 border-0">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Area */}
        {result && (
          <div className="mb-6">
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                {feedbackStatus === "sent" ? (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-green-500 font-medium">Feedback enviado: Aguardando...</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => submitFeedback("win")} className={`border-border ${feedback === "win" ? "bg-green-500/20 border-green-500 text-green-400" : "text-muted-foreground hover:bg-green-500/10 hover:border-green-500/50"}`}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Acertou
                      </Button>
                      <Button variant="outline" onClick={() => submitFeedback("loss")} className={`border-border ${feedback === "loss" ? "bg-red-500 border-red-500 text-foreground" : "text-muted-foreground hover:bg-red-500/10 hover:border-red-500/50"}`}>
                        <XCircle className="mr-2 h-4 w-4" /> Errou
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={deleteAnalysis} className="border-border text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                      <Button variant="outline" onClick={() => { setResult(null); setFeedback(null); setFeedbackStatus("idle"); }} className="border-border text-muted-foreground hover:bg-gray-500/10">
                        <XOctagon className="mr-2 h-4 w-4" /> Fechar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">A análise estava correta?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => submitFeedback("win")} className="border-border text-muted-foreground hover:bg-green-500/10 hover:border-green-500/50">
                        <CheckCircle className="mr-2 h-4 w-4" /> Acertei
                      </Button>
                      <Button variant="outline" onClick={() => submitFeedback("loss")} className="border-border text-muted-foreground hover:bg-red-500/10 hover:border-red-500/50">
                        <XCircle className="mr-2 h-4 w-4" /> Errei
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={deleteAnalysis} className="border-border text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
                        <Trash2 className="mr-2 h-4 w-4" /> Rejeitar
                      </Button>
                      <Button variant="outline" onClick={() => { setResult(null); setCurrentAnalysisId(null); }} className="border-border text-muted-foreground hover:bg-gray-500/10">
                        <XOctagon className="mr-2 h-4 w-4" /> Fechar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Stats */}
        <div className="mb-6">
          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{filteredMetrics.totalAnalyses}</p>
                  <p className="text-xs text-muted-foreground">Análises</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{filteredMetrics.wins}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{filteredMetrics.losses}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Radar */}
        <div className="mb-6">
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-green-500" style={{ fontFamily: "monospace" }}>Radar de Performance</h2>
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-background border border-border rounded px-3 py-1 text-sm text-foreground focus:outline-none focus:border-green-500"
                >
                  <option value="Todas">Todas</option>
                  <option value="Hoje">Hoje</option>
                  <option value="Semana">Semana</option>
                  <option value="Mês">Mês</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-shrink-0">
                  <TriangleRadar metrics={filteredMetrics} />
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <CircularProgress value={filteredMetrics.hitRate} color="#22c55e" icon={<Target className="w-4 h-4 text-green-400" />} />
                    <span className="text-xs text-muted-foreground mt-2">Taxa de Acerto</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress value={filteredMetrics.efficiency} color="#f59e0b" icon={<TrendingUp className="w-4 h-4 text-yellow-400" />} />
                    <span className="text-xs text-muted-foreground mt-2">Eficiência</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress value={filteredMetrics.consistency} color="#3b82f6" icon={<BarChart3 className="w-4 h-4 text-blue-400" />} />
                    <span className="text-xs text-muted-foreground mt-2">Consistência</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <CircularProgress value={filteredMetrics.neuralCalibration} color="#a855f7" icon={<Brain className="w-4 h-4 text-purple-400" />} />
                    <span className="text-xs text-muted-foreground mt-2">Calibração<br />Neural</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{filteredMetrics.totalAnalyses}</span> análises rastreadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Status da IA: <span className="text-green-500 font-medium">Sincronizando...</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mb-6">
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <h3 className="text-sm text-muted-foreground mb-3">Histórico Recente</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-background text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.fileName}</span>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 text-xs">{item.timeframe}m</Badge>
                        <Badge className={item.result.direction === "CALL" ? "bg-green-500/20 text-green-400 border-0 text-xs" : "bg-red-500/20 text-red-400 border-0 text-xs"}>
                          {item.result.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.feedback === "win" && <CheckCircle className="h-4 w-4 text-green-400" />}
                        {item.feedback === "loss" && <XCircle className="h-4 w-4 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
