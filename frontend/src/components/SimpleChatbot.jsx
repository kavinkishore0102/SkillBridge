import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../utils/simpleChatbot';

// Add CSS keyframes for bounce animation
const bounceAnimation = `
  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

const SimpleChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Add bounce animation styles to document
    const styleElement = document.createElement("style");
    styleElement.innerHTML = bounceAnimation;
    document.head.appendChild(styleElement);
    
    console.log('SimpleChatbot component mounted');
    
    return () => {
      // Cleanup
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        text: "👋 Hello! I'm your SkillBridge AI assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = getChatbotResponse(inputMessage.trim());
      const botMessage = {
        text: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  console.log('SimpleChatbot render - isOpen:', isOpen);

  return (
    <>
      {/* Chat Toggle Button with SkillBridge Logo */}
      {!isOpen && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(to right, #14b8a6, #3b82f6)',
              color: 'white',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            title="Open SkillBridge AI Assistant"
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            }}
          >
            {/* SkillBridge Logo Icon */}
            <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '320px',
          height: '400px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with SkillBridge Branding */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'linear-gradient(to right, #14b8a6, #3b82f6)',
            color: 'white',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>SkillBridge AI</h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  {isTyping ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '4px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              title="Close chat"
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '16px',
            height: '250px',
            overflowY: 'auto',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((message, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: message.isBot ? 'flex-start' : 'flex-end' 
                }}>
                  <div style={{
                    maxWidth: '240px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: message.isBot ? 'white' : '#14b8a6',
                    color: message.isBot ? '#374151' : 'white',
                    border: message.isBot ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '4px', 
                      opacity: 0.7 
                    }}>
                      {message.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    maxWidth: '240px',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#9ca3af',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#9ca3af',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.16s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#9ca3af',
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out',
                        animationDelay: '0.32s'
                      }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: 'white',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about SkillBridge..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#14b8a6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(20, 184, 166, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: !inputMessage.trim() || isTyping ? 'not-allowed' : 'pointer',
                  backgroundColor: !inputMessage.trim() || isTyping ? '#e5e7eb' : '#14b8a6',
                  color: !inputMessage.trim() || isTyping ? '#9ca3af' : 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!(!inputMessage.trim() || isTyping)) {
                    e.target.style.backgroundColor = '#0f766e';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!inputMessage.trim() || isTyping)) {
                    e.target.style.backgroundColor = '#14b8a6';
                  }
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleChatbot;
