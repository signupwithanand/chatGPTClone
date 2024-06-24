import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import axios from 'axios';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const ChatGPTClone = () => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    });
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (isLoading) return;

    setIsLoading(true);
    const userMessage = { type: 'user', content: input };
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');

    const formData = new FormData();
    formData.append('prompt', input);
    formData.append('model', model);
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      let response;
      if (model === 'gpt-4o' && input.toLowerCase().includes("generate an image")) {
        response = await axios.post('http://localhost:3001/api/image', { prompt: input });
        const aiMessage = { type: 'ai', content: `Here is the image:`, imageUrl: response.data.imageUrl };
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        response = await axios.post('http://localhost:3001/api/chat', formData);
        const aiMessage = { type: 'ai', content: response.data.response };
        setChatHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      const errorMessage = { type: 'error', content: `Sorry, there was an error processing your request: ${error.message}` };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a notification here if you want
      console.log('Code copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };


  const renderMessage = (msg) => {
    if (msg.type === 'user') {
      return <div className="whitespace-pre-wrap">{msg.content}</div>;
    } else if (msg.type === 'ai') {
      return (
        <div className="ai-message">
          <div dangerouslySetInnerHTML={{ __html: marked(msg.content) }} />
          {msg.imageUrl && (
            <div className="mt-2">
              <img src={msg.imageUrl} alt="Generated" className="rounded-lg max-w-full" />
              <a href={msg.imageUrl} download className="text-blue-500 mt-2 block">Download Image</a>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-800 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-4">ChatGPT Clone</h2>
        <div className="relative mb-2">
          <label htmlFor="model" className="block text-gray-300 font-bold mb-1">Select Model</label>
          <select 
            id="model" 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isLoading}
          >
            <option value="gpt-3.5-turbo">GPT-3.5</option>
            <option value="gpt-4o">GPT-4o</option>
          </select>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div 
          ref={chatContainerRef}
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
                  {renderMessage(msg)}
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
          <div className="relative">
            <label htmlFor="file-upload" className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${isLoading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white p-1 rounded-full transition-colors duration-200 cursor-pointer`}>
              <Paperclip size={20} />
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
                ref={fileInputRef}
              />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {files.length > 0 && (
            <div className="mt-2">
              <ul>
                {files.map((file, idx) => (
                  <li key={idx} className="text-gray-700">{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatGPTClone;