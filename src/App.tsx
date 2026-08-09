import { useState, useRef, useEffect } from 'react';
import { captureAndAnalyze, sendTextOnly, sendWithContext } from './lib/ai-pipeline';
import { ChatMessage, setApiKey } from './lib/gemini';
import Markdown from 'react-markdown';
import { ThemeProvider, useTheme } from './themes/ThemeContext';
import { ThemeToggle } from './themes/ThemeToggle';

function SafeLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children } = props;
  if (!href) return <span>{children}</span>;
  const isSafe = /^(https?:\/\/|mailto:)/i.test(href);
  if (isSafe) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <span>{children}</span>;
}

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  withScreenshot?: boolean;
};

function AppContent() {
  const [input, setInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [withScreenshot, setWithScreenshot] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Aguardando atalho para capturar a tela...'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput);
    }
  }, [apiKeyInput]);

  const buildHistory = (msgs: Message[]): ChatMessage[] => {
    return msgs
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content,
      }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !apiKeyInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      withScreenshot,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let result;

      if (withScreenshot) {
        result = await captureAndAnalyze(input);
      } else {
        const history = buildHistory(messages);
        if (history.length > 0) {
          result = await sendWithContext(input, history);
        } else {
          result = await sendTextOnly(input);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.analysis,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Erro: ${error instanceof Error ? error.message : 'Falha ao processar'}`
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full p-2 flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex flex-col h-full win95-border-outset" style={{ backgroundColor: 'var(--bg)' }}>
        
        {/* Barra de título */}
        <div className="win95-titlebar">
          <span style={{ fontSize: '12px' }}>🎮</span>
          <span className="flex-1">codenome BIA</span>
          <ThemeToggle />
        </div>

        {/* Conteúdo da janela */}
        <div className="flex flex-col flex-1 p-1" style={{ backgroundColor: 'var(--bg)' }}>
          
          {/* Configuração da API Key */}
          <div className="mb-2 p-2" style={{ backgroundColor: 'var(--bg)' }}>
            <label className="block mb-1" style={{ color: 'var(--text)', fontSize: 'var(--font-size)' }}>API Key do Google Gemini:</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Cole sua API Key aqui..."
              className="win95-input w-full"
            />
          </div>

          {/* Área de Mensagens */}
          <main className="flex-1 win95-border-inset p-2 mb-2 win95-scrollbar overflow-y-auto" style={{ backgroundColor: 'var(--input-bg)' }}>
            <div className="flex flex-col gap-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    maxWidth: '85%',
                    fontSize: 'var(--font-size)',
                    padding: '8px',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: msg.role === 'user'
                      ? 'var(--user-msg-bg)'
                      : msg.role === 'system'
                        ? 'var(--system-msg-bg)'
                        : 'var(--assistant-msg-bg)',
                    color: msg.role === 'user'
                      ? 'var(--user-msg-text)'
                      : msg.role === 'system'
                        ? 'var(--system-msg-text)'
                        : 'var(--assistant-msg-text)',
                    alignSelf: msg.role === 'user'
                      ? 'flex-end'
                      : msg.role === 'system'
                        ? 'center'
                        : 'flex-start',
                    textAlign: msg.role === 'system' ? 'center' : 'left',
                    fontStyle: msg.role === 'system' ? 'italic' : 'normal',
                  }}
                >
                  {msg.role === 'user' && msg.withScreenshot === false && (
                    <span style={{ opacity: 0.7, fontSize: '10px' }}>💬 </span>
                  )}
                  {msg.role === 'user' && msg.withScreenshot === true && (
                    <span style={{ opacity: 0.7, fontSize: '10px' }}>📷 </span>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none" style={{ fontSize: 'var(--font-size)' }}>
                      <Markdown components={{ a: SafeLink }}>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="mt-1 text-[10px] underline"
                      style={{ color: 'var(--link-color)' }}
                    >
                      Copiar
                    </button>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="animate-pulse" style={{
                  padding: '8px',
                  backgroundColor: 'var(--system-msg-bg)',
                  color: 'var(--system-msg-text)',
                  borderRadius: 'var(--border-radius)',
                  alignSelf: 'flex-start',
                  fontSize: 'var(--font-size)',
                }}>
                  {withScreenshot ? 'Capturando tela e analisando...' : 'Respondendo...'}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Barra de Input */}
          <form onSubmit={handleSend} className="flex gap-2 p-1 items-center" style={{ backgroundColor: 'var(--bg)' }}>
            <button
              type="button"
              onClick={() => setWithScreenshot((v) => !v)}
              className="win95-button"
              style={{ minWidth: 'auto', padding: '2px 6px', fontSize: 'var(--font-size)' }}
              title={withScreenshot ? 'Modo: Com screenshot (clique para alternar)' : 'Modo: Só texto (clique para alternar)'}
            >
              {withScreenshot ? '📷' : '💬'}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={apiKeyInput ? (withScreenshot ? "Pergunte sobre a tela atual..." : "Digite sua mensagem...") : "Insira a API Key primeiro..."}
              disabled={!apiKeyInput.trim()}
              className="flex-1 win95-input disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!apiKeyInput.trim() || isLoading}
              className="win95-button font-bold disabled:opacity-50"
            >
              {isLoading ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
