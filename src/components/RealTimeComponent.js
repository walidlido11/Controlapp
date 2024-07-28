// src/components/RealTimeComponent.js
import React, { useEffect, useState } from 'react';

function RealTimeComponent() {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');
    setSocket(ws);

    ws.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (message) => {
    if (socket) {
      socket.send(message);
    }
  };

  return (
    <div>
      <h3>Real-Time Messages</h3>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      <button onClick={() => sendMessage('Hello from client')}>Send Message</button>
    </div>
  );
}

export default RealTimeComponent;
