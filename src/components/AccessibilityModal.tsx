import React from 'react';
import {
  Eye,
  Moon,
  Sun,
  Sparkles,
  Volume2,
  Type,
  Contrast,
  Tv,
  Check,
  Smartphone,
} from 'lucide-react';
import { voiceAssistant } from '../services/voiceAssistant';

export type NightModeOption = 'auto' | 'dark' | 'car-night-drive' | 'light';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  nightMode: NightModeOption;
  onChangeNightMode: (mode: NightModeOption) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  fontSize: 'normal' | 'large' | 'extra-large';
  onChangeFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  voiceFeedback: boolean;
  onToggleVoiceFeedback: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  nightMode,
  onChangeNightMode,
  highContrast,
  onToggleHighContrast,
  fontSize,
  onChangeFontSize,
  voiceFeedback,
  onToggleVoiceFeedback,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Acessibilidade & Modo Noturno</h2>
              <p className="text-xs text-neutral-400">Personalização de contraste, fontes e visão noturna</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Options Content */}
        <div className="space-y-5 py-4">
          {/* Night Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Modo Noturno e Iluminação</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'auto', label: 'Automático (Sensor/Horário)', desc: 'Alterna pelo ciclo solar' },
                { id: 'dark', label: 'Modo Escuro (Dark)', desc: 'Equilibrado para o dia a dia' },
                { id: 'car-night-drive', label: 'Condução Noturna OLED', desc: 'Preto puro p/ não ofuscar na estrada' },
                { id: 'light', label: 'Modo Claro (Light)', desc: 'Alto brilho para luz solar direta' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChangeNightMode(m.id as NightModeOption);
                    if (voiceFeedback) voiceAssistant.speak(`Modo de exibição alterado para ${m.label}`);
                  }}
                  className={`p-3 rounded-2xl border text-left transition ${
                    nightMode === m.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-500'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>{m.label}</span>
                    {nightMode === m.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 font-normal">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Contrast className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Alto Contraste Acentuado</p>
                <p className="text-[10px] text-neutral-400">Bordas reforçadas e cores vivas para visibilidade máxima</p>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleHighContrast();
                if (voiceFeedback) voiceAssistant.speak(highContrast ? 'Alto contraste desativado' : 'Alto contraste ativado');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                highContrast ? 'bg-indigo-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  highContrast ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size Scaling */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-400" />
              <span>Tamanho do Texto e Legibilidade</span>
            </label>
            <div className="flex gap-2">
              {[
                { id: 'normal', label: 'Padrão (100%)' },
                { id: 'large', label: 'Grande (125%)' },
                { id: 'extra-large', label: 'Extra Grande (150%)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChangeFontSize(f.id as any)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-semibold transition ${
                    fontSize === f.id
                      ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Synthesis Feedback */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Feedback por Voz Falada (TTS)</p>
                <p className="text-[10px] text-neutral-400">Anuncia canais e alertas sonoros durante a condução</p>
              </div>
            </div>
            <button
              onClick={onToggleVoiceFeedback}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                voiceFeedback ? 'bg-emerald-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  voiceFeedback ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
