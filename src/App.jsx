import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
  if (!input.trim()) return;
  const userMessage = { sender: 'user', text: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setIsWaiting(true);

  try {
    const res = await axios.post('/api/chat', {
      assistant_id: 'asst_Iipk5uRob6IXSgf3t3OcoLVP',
      messages: [
        {
          role: 'user',
          content: input
        }
      ]
    });

    const reply = const reply = res.data?.reply;

    if (reply) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply }
      ]);
    } else {
      throw new Error('No reply returned from assistant');
    }
  } catch (err) {
    console.error('Chat API error:', err);
    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: 'Error sending message. Please try again.' },
    ]);
  } finally {
    setIsWaiting(false);
  }
};

  const pollResponses = async () => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.post('https://uniform-forwarder.up.railway.app/poll', {
          user_id: 'demo-user',
        });

        if (res.data && res.data.status === 'done') {
          setMessages((prev) => [
            ...prev,
            { sender: 'bot', text: res.data.summary || "Here's your mockup:" },
            { sender: 'bot', image: res.data.image_url },
          ]);
          clearInterval(interval);
          setIsWaiting(false);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMessageClasses = (sender) => {
    const baseClasses = 'p-2 rounded-lg max-w-[80%]';
    const userClasses = 'bg-blue-600 self-end text-right ml-auto';
    const botClasses = 'bg-gray-700 self-start text-left mr-auto';
    
    return sender === 'user' 
      ? `${baseClasses} ${userClasses}` 
      : `${baseClasses} ${botClasses}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-xl bg-gray-800 rounded-lg shadow p-4 flex flex-col h-[80vh]">
        <h1 className="text-xl font-semibold mb-4 text-center">🎨 Uniform Design Assistant</h1>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={getMessageClasses(msg.sender)}
            >
              {msg.text && <div>{msg.text}</div>}
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="mockup" 
                  className="mt-2 rounded-md max-w-full h-auto" 
                />
              )}
            </div>
          ))}
          {isWaiting && (
            <div className="bg-gray-700 self-start text-left mr-auto p-2 rounded-lg max-w-[80%]">
              <div className="flex items-center space-x-1">
                <div className="animate-pulse">Generating design...</div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your design request..."
            className="flex-1 rounded-l-md p-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isWaiting}
          />
          <button
            onClick={sendMessage}
            disabled={isWaiting || !input.trim()}
            className="bg-blue-500 px-4 py-2 rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isWaiting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
