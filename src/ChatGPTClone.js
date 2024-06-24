import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ChatGPTClone = () => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatHistory]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { type: 'user', content: input };
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');

    const formData = new FormData();
    formData.append('prompt', input);
    formData.append('model', model);
    if (file) {
      formData.append('file', file);
    }

    try {
      let response;
      if (model === 'gpt-4o' && input.toLowerCase().includes("generate an image")) {
        response = await fetch('http://localhost:3001/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: input }),
        });
      } else {
        response = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      if (model === 'gpt-4o' && input.toLowerCase().includes("generate an image")) {
        const aiMessage = { type: 'ai', content: `Here is the image: ${data.imageUrl}`, imageUrl: data.imageUrl };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        const aiMessage = { type: 'ai', content: data.response };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage = { type: 'error', content: `Sorry, there was an error processing your request: ${error.message}` };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setFile(null); // Clear the file input
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-800 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-4">ChatGPT Clone</h2>
      </div>
      <div className="flex-1 flex flex-col">
        <div 
          id="chat-container"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500">
              Start a conversation by typing a message below.
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                  msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  {msg.content}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Generated Image" className="mt-2 rounded-lg" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
          <div className="relative mb-2">
            <label htmlFor="model" className="block text-gray-700 font-bold mb-1">Select Model</label>
            <select 
              id="model" 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="gpt-3.5-turbo">GPT-3.5</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>
          {model === 'gpt-4o' && (
            <div className="relative mb-2">
              <label htmlFor="file" className="block text-gray-700 font-bold mb-1">Attach File</label>
              <input 
                type="file" 
                id="file" 
                onChange={handleFileChange} 
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button 
              type="submit"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                isLoading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
              } text-white p-1 rounded-full transition-colors duration-200`}
              disabled={isLoading}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatGPTClone;
