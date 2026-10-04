export interface VoiceAction {
  type:
    | 'PLAY'
    | 'PAUSE'
    | 'NEXT_CHANNEL'
    | 'PREV_CHANNEL'
    | 'MUTE'
    | 'UNMUTE'
    | 'VOLUME_UP'
    | 'VOLUME_DOWN'
    | 'OPEN_GPS'
    | 'CLOSE_GPS'
    | 'TOGGLE_FAVORITE'
    | 'SWITCH_CHANNEL'
    | 'CAR_MODE'
    | 'NIGHT_MODE'
    | 'NAVIGATE_TO';
  payload?: string;
}

export type VoiceCallback = (action: VoiceAction, transcript: string) => void;

class VoiceAssistantService {
  private recognition: any = null;
  private isListening: boolean = false;
  private callback: VoiceCallback | null = null;
  private feedbackEnabled: boolean = true;
  private isSupported: boolean = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'pt-BR';

      this.recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        console.log('[VoiceAssistant] Reconhecido:', transcript);
        this.parseCommand(transcript);
      };

      this.recognition.onerror = (err: any) => {
        console.warn('[VoiceAssistant] Erro no reconhecimento:', err.error);
        if (err.error === 'not-allowed') {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if driving handsfree is active
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (_) {}
        }
      };
    }
  }

  public getSupported(): boolean {
    return this.isSupported;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setFeedbackEnabled(enabled: boolean) {
    this.feedbackEnabled = enabled;
  }

  public speak(text: string) {
    if (!this.feedbackEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[VoiceAssistant] Erro ao sintetizar áudio:', e);
    }
  }

  public startListening(callback: VoiceCallback) {
    this.callback = callback;
    if (!this.recognition) {
      this.speak('Comandos de voz não suportados neste navegador');
      return false;
    }

    try {
      this.isListening = true;
      this.recognition.start();
      this.speak('Comandos de voz ativados. Fale o comando.');
      return true;
    } catch (e) {
      console.warn('[VoiceAssistant] Já iniciado:', e);
      return true;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
  }

  private parseCommand(text: string) {
    if (!this.callback) return;

    if (text.includes('pausar') || text.includes('parar') || text.includes('pause')) {
      this.callback({ type: 'PAUSE' }, text);
      this.speak('Vídeo pausado.');
      return;
    }

    if (text.includes('reproduzir') || text.includes('play') || text.includes('tocar') || text.includes('continuar')) {
      this.callback({ type: 'PLAY' }, text);
      this.speak('Reproduzindo.');
      return;
    }

    if (text.includes('próximo canal') || text.includes('proximo canal') || text.includes('canal seguinte') || text.includes('avançar')) {
      this.callback({ type: 'NEXT_CHANNEL' }, text);
      this.speak('Próximo canal sintonizado.');
      return;
    }

    if (text.includes('canal anterior') || text.includes('voltar canal') || text.includes('retroceder')) {
      this.callback({ type: 'PREV_CHANNEL' }, text);
      this.speak('Canal anterior.');
      return;
    }

    if (text.includes('mutar') || text.includes('mudo') || text.includes('silenciar')) {
      this.callback({ type: 'MUTE' }, text);
      this.speak('Áudio silenciado.');
      return;
    }

    if (text.includes('desmutar') || text.includes('som ligado') || text.includes('ativar som')) {
      this.callback({ type: 'UNMUTE' }, text);
      this.speak('Áudio restaurado.');
      return;
    }

    if (text.includes('aumentar volume') || text.includes('mais alto')) {
      this.callback({ type: 'VOLUME_UP' }, text);
      this.speak('Aumentando volume.');
      return;
    }

    if (text.includes('abaixar volume') || text.includes('mais baixo') || text.includes('diminuir volume')) {
      this.callback({ type: 'VOLUME_DOWN' }, text);
      this.speak('Abaixando volume.');
      return;
    }

    if (text.includes('abrir gps') || text.includes('mostrar mapa') || text.includes('navegação') || text.includes('trajeto')) {
      this.callback({ type: 'OPEN_GPS' }, text);
      this.speak('Abrindo mapa e navegação GPS.');
      return;
    }

    if (text.includes('fechar gps') || text.includes('ocultar mapa') || text.includes('tela de vídeo')) {
      this.callback({ type: 'CLOSE_GPS' }, text);
      this.speak('Retornando à transmissão.');
      return;
    }

    if (text.includes('favoritar') || text.includes('salvar canal') || text.includes('favorito')) {
      this.callback({ type: 'TOGGLE_FAVORITE' }, text);
      this.speak('Canal adicionado aos favoritos.');
      return;
    }

    if (text.includes('modo carro') || text.includes('modo condução') || text.includes('painel veicular')) {
      this.callback({ type: 'CAR_MODE' }, text);
      this.speak('Modo condução veicular acionado.');
      return;
    }

    if (text.includes('modo noturno') || text.includes('escurecer tela')) {
      this.callback({ type: 'NIGHT_MODE' }, text);
      this.speak('Modo noturno ativado.');
      return;
    }

    // Direct channel search: "assistir [canal]", "colocar [canal]", "sintonizar [canal]"
    const matchChannel = text.match(/(?:assistir|sintonizar|colocar|abrir canal|mudar para)\s+(.+)/i);
    if (matchChannel && matchChannel[1]) {
      const channelQuery = matchChannel[1].trim();
      this.callback({ type: 'SWITCH_CHANNEL', payload: channelQuery }, text);
      this.speak(`Buscando canal ${channelQuery}`);
      return;
    }

    // Direct navigation search: "navegar para [local]", "rota para [local]", "ir para [local]"
    const matchNav = text.match(/(?:navegar para|rota para|ir para|destino)\s+(.+)/i);
    if (matchNav && matchNav[1]) {
      const dest = matchNav[1].trim();
      this.callback({ type: 'NAVIGATE_TO', payload: dest }, text);
      this.speak(`Calculando rota até ${dest}`);
      return;
    }

    // Fallback: pass as channel search
    this.callback({ type: 'SWITCH_CHANNEL', payload: text }, text);
  }
}

export const voiceAssistant = new VoiceAssistantService();
