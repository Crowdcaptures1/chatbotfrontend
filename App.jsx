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
      await axios.post('https://uniform-forwarder.up.railway.app/start', {
        user_id: 'demo-user',
        message: input,
      });

      pollResponses();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error sending message. Please try again.' },
      ]);
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
            { sender: 'bot', text: res.data.summary || 'Here’s your mockup:' },
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-xl bg-gray-800 rounded-lg shadow p-4 flex flex-col flex-grow overflow-y-auto">
        <h1 className="text-xl font-semibold mb-2">🎨 Uniform Design Assistant</h1>
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={\`p-2 rounded-lg max-w-[80%] \${msg.sender === 'user'
                ? 'bg-blue-600 self-end text-right'
                : 'bg-gray-700 self-start text-left'}\`}
            >
              {msg.text && <div>{msg.text}</div>}
              {msg.image && <img src={msg.image} alt="mockup" className="mt-2 rounded-md" />}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="w-full max-w-xl mt-2 flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your design request..."
          className="flex-1 rounded-l-md p-2 bg-gray-700 text-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={isWaiting}
          className="bg-blue-500 px-4 py-2 rounded-r-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
