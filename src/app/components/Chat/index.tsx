'use client';

import { useState, useRef } from 'react';
import styles from './chat.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

// Define la estructura para los mensajes del chat
interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Chat() {
  // Inicializa el chat con mensaje de bienvenida
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "¡Hola! Soy tu asistente médico virtual. Puedo ayudarte con información médica general y preguntas. Ten en cuenta que no soy un sustituto del consejo médico profesional. ¿Cómo puedo ayudarte hoy?",
      isBot: true,
      timestamp: new Date()
    }
  ]);

  // Gestión de estado para la funcionalidad del chat
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Función para procesar la pregunta usando LangChain
  const processQuestion = async (question: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error processing question:', error);
      return "Lo siento, hubo un error al procesar tu pregunta.";
    }
  };

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Maneja el envío de mensajes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    setIsTyping(true);
    scrollToBottom();
    
    const answer = await processQuestion(inputMessage);
    
    setIsTyping(false);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: answer,
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsProcessing(false);
    scrollToBottom();
  };

  // Renderiza la interfaz del chat
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
              {message.isBot ? (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}
              <div className={styles['message-timestamp']}>
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className={`${styles.message} ${styles['bot-message']} ${styles['typing-indicator']}`}>
            <div className={styles['bot-avatar']}>
              <Image
                src="/askmy-logo-nobg.png"
                alt="AskMy Logo"
                width={30}
                height={30}
                className={styles['avatar-image']}
              />
            </div>
            <div className={styles['typing-dots']}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      <form onSubmit={handleSubmit} className={styles['chat-input-container']}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe tu pregunta médica..."
          className={styles['chat-input']}
          disabled={isProcessing}
        />
        <button
          type="submit"
          className={styles['send-button']}
          aria-label="Send message"
          disabled={!inputMessage.trim() || isProcessing}
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