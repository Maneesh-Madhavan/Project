import { useState, useEffect, useRef } from "react";
// import "./RoomChat.css";

const RoomChat = ({ socket, user, roomId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Receive chat messages
  useEffect(() => {
    socket.on("roomChatResponse", (msgs) => setMessages(msgs));
    return () => socket.off("roomChatResponse");
  }, [socket]);

  // Send a chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { user: user.name, text: input };
    socket.emit("roomChatMessage", { roomId, msg });
    setInput("");
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={() => setOpen(true)}>
        Chat
      </button>

      <div className={`chat-panel ${open ? "open" : ""}`}>
        <div className="chat-header">
          <h3>Room Chat</h3>
          <button className="close-btn" onClick={() => setOpen(false)}><span></span></button>
        </div>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.user === user.name ? "self" : ""}`}>
              <strong>{m.user}:</strong> {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </>
  );
};

export default RoomChat;
