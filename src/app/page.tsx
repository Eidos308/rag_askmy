'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';
import Image from 'next/image';

// Define the structure for chat messages
interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Define the structure for WebSocket messages
interface WebSocketMessage {
  action: string;
  query: string;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string;

export default function Chat() {
  // Initialize chat with welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "¡Hola! Soy tu asistente médico virtual. Puedo ayudarte con información médica general y preguntas. Ten en cuenta que no soy un sustituto del consejo médico profesional. ¿Cómo puedo ayudarte hoy?",
      isBot: true,
      timestamp: new Date()
    }
  ]);

  // State management for chat functionality
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    websocketRef.current = new WebSocket(WEBSOCKET_URL);

    // Handle connection events
    websocketRef.current.onopen = () => {
      setIsConnected(true);
    };

    websocketRef.current.onclose = () => {
      setIsConnected(false);
    };

    websocketRef.current.onerror = () => {
      setIsConnected(false);
    };

    // Handle incoming messages
    websocketRef.current.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        const newMessage: Message = {
          id: Date.now().toString(),
          text: response.answer || response.error || "Lo siento, no pude procesar esa solicitud.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      } catch {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: "Lo siento, recibí una respuesta inválida.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };
  };

  // Connect WebSocket on component mount
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Handle message submission
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

  // Render chat interface
  return (
    <div className={styles['chat-container']}>
      <header className={styles['chat-header']}>
        <div className={styles['header-avatar']}>
          <Image
            src="/askmy-logo-nobg.png"
            alt="AskMy Logo"
            width={40}
            height={40}
            className={styles['avatar-image']}
          />
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
                <Image
                  src="/askmy-logo-nobg.png"
                  alt="AskMy Logo"
                  width={30}
                  height={30}
                  className={styles['avatar-image']}
                />
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
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      <form onSubmit={handleSubmit} className={styles['chat-input-container']}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isConnected ? "Escribe tu pregunta médica..." : "Conectando..."}
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
