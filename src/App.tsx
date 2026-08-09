import { useState, useRef, useEffect } from 'react';

// Tipagem para as mensagens (já que escolhemos TypeScript)
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Aguardando atalho para capturar a tela...'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // Adiciona a mensagem do usuário
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');

    // Simulação da resposta da IA (vamos substituir isso pela API real depois)
    setTimeout(() => {
      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Esta é uma resposta simulada. Em breve, a IA analisará a sua tela aqui!'
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
    }, 1000);
  };

  return (
    <div className="h-screen w-full bg-zinc-900/60 text-zinc-100 p-4 flex flex-col font-sans select-none">
      {/* Cabeçalho */}
      <header className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
        <h1 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
          <span>🎮</span> AI Companion
        </h1>
        <div className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
          Online
        </div>
      </header>

      {/* Área de Mensagens */}
      <main className="flex-1 bg-zinc-950/50 rounded-lg p-4 mb-4 border border-zinc-800/50 shadow-inner overflow-y-auto flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 max-w-[85%] text-sm ${msg.role === 'user'
                ? 'bg-emerald-900/40 border border-emerald-800/50 text-emerald-100 self-end rounded-l-lg rounded-tr-lg'
                : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 self-start rounded-r-lg rounded-bl-lg'
              }`}
          >
            {msg.content}
          </div>
        ))}
        {/* Âncora invisível para o auto-scroll */}
        <div ref={messagesEndRef} />
      </main>

      {/* Barra de Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre a tela atual..."
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-zinc-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default App;