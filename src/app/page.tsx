'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface WebSocketMessage {
  action: string;
  query: string;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string;

function MedicalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21 5h-2.64l1.14-3.14L17.5 1l-1.96 5H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-3.5 9h-1v1.5h-2v-1.5h-1v-2h1v-1.5h2v1.5h1v2z" />
    </svg>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your virtual medical assistant. I can help you with general medical information and questions. Please note that I'm not a substitute for professional medical advice. How can I assist you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    websocketRef.current = new WebSocket(WEBSOCKET_URL);

    websocketRef.current.onopen = () => {
      setIsConnected(true);
    };

    websocketRef.current.onclose = () => {
      setIsConnected(false);
    };

    websocketRef.current.onerror = () => {
      setIsConnected(false);
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: response.answer || response.error || "Sorry, I couldn't process that request.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      } catch (error) {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: "Sorry, I received an invalid response.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !websocketRef.current || !isConnected) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    const wsMessage: WebSocketMessage = {
      action: "sendmessage",
      query: inputMessage
    };

    setMessages(prev => [...prev, newMessage]);
    websocketRef.current.send(JSON.stringify(wsMessage));
    setInputMessage('');
    scrollToBottom();
  };

  const handleReconnect = () => {
    if (!isConnected) {
      connectWebSocket();
    }
  };

  return (
    <div className={styles['chat-container']}>
      <header className={styles['chat-header']}>
        <div className={styles['header-avatar']}>
          <MedicalIcon />
        </div>
        <div className={styles['header-info']}>
          <h1 className={styles['header-title']}>AskMy</h1>
          <p className={styles['header-subtitle']}>
            Virtual Medical Assistant
            <span className={`${styles['connection-status']} ${isConnected ? styles.connected : styles.disconnected}`}>
              •
            </span>
          </p>
        </div>
      </header>

      <div className={styles['chat-messages']}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.isBot ? styles['bot-message'] : styles['user-message']
              }`}
          >
            {message.isBot && (
              <div className={styles['bot-avatar']}>
                <MedicalIcon />
              </div>
            )}
            <div className={styles['message-content']}>
              <p>{message.text}</p>
              <div className={styles['message-timestamp']}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles['chat-input-container']}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isConnected ? "Type your medical question..." : "Connecting..."}
          className={styles['chat-input']}
          disabled={!isConnected}
        />
        <button
          type="submit"
          className={styles['send-button']}
          aria-label="Send message"
          disabled={!inputMessage.trim() || !isConnected}
          onClick={!isConnected ? handleReconnect : undefined}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
