import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap, Cpu } from "lucide-react";

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective for most tasks",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-green-600",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Most capable OpenAI model",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-green-600",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Best for long documents and detailed analysis",
    icon: <Brain className="h-4 w-4" />,
    color: "text-orange-600",
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Fast and efficient for quick analysis",
    icon: <Brain className="h-4 w-4" />,
    color: "text-orange-600",
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xAI",
    description: "Real-time knowledge and creative responses",
    icon: <Zap className="h-4 w-4" />,
    color: "text-blue-600",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Multimodal with fast responses",
    icon: <Cpu className="h-4 w-4" />,
    color: "text-purple-600",
  },
  {
    id: "gemini-exp-1206",
    name: "Gemini Experimental",
    provider: "Google",
    description: "Latest experimental features",
    icon: <Cpu className="h-4 w-4" />,
    color: "text-purple-600",
  },
];

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  const selectedModel = AI_MODELS.find(m => m.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Model</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedModel && (
              <div className="flex items-center gap-2">
                <span className={selectedModel.color}>{selectedModel.icon}</span>
                <span>{selectedModel.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedModel.provider}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-start gap-3 py-1">
                <span className={`mt-0.5 ${model.color}`}>{model.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {model.description}
                  </p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
