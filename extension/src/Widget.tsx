import { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

interface WidgetProps {
  currentDomain: string;
}

export default function Widget({ currentDomain }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [config, setConfig] = useState<any>(null);

  // When the widget loads, verify the domain with your backend
  useEffect(() => {
    const verifyDomain = async () => {
      try {
        // You will build this endpoint next
        const res = await fetch(`http://localhost:5001/api/public/widget/init/6a5cbdff96034cb0387bbd3b?domain=${currentDomain}`);

        if (res.ok) {
          const data = await res.json();
          setConfig(data.settings); // { botName, primaryColor, welcomeMessage }
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        setIsAuthorized(false);
      }
    };

    verifyDomain();
  }, [currentDomain]);

  // If the backend says this domain isn't registered, don't show the widget at all
  if (isAuthorized === false) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">

      {/* The Chat Window */}
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 text-white"
            style={{ backgroundColor: config?.primaryColor || '#6366f1' }}
          >
            <div>
              <h2 className="font-semibold">{config?.botName || 'AI Copilot'}</h2>
              <p className="text-xs opacity-80">Powered by Omnix</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="rounded-xl bg-white p-3 text-sm shadow-sm border border-gray-100 max-w-[85%]">
              {config?.welcomeMessage || 'Hi! How can I help you today?'}
            </div>
            {/* Map messages here */}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 bg-white p-4">
            <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none transition-all focus:bg-gray-200"
              />
              <button
                type="submit"
                style={{ backgroundColor: config?.primaryColor || '#6366f1' }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: config?.primaryColor || '#6366f1' }}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

    </div>
  );
}