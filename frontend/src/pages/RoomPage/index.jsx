import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WhiteBoard from "../../components/WhiteBoard/index.jsx";
import "./index.css";

const RoomPage = ({ socket, user, users }) => {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState([]);

  /* SAFETY */
  useEffect(() => {
    if (!user?.roomId) {
      navigate("/");
    }
  }, [user, navigate]);

  /* SOCKET LISTENERS */
  useEffect(() => {
    socket.on("whiteBoardData", (data) => setElements(data));
    socket.on("roomChatResponse", (msgs) => setMessages(msgs));

    return () => {
      socket.off("whiteBoardData");
      socket.off("roomChatResponse");
    };
  }, [socket]);

  /* JOIN ROOM — ONLY HERE */
  useEffect(() => {
    if (!user?.roomId) return;
    socket.emit("userJoined", user);
  }, [user, socket]);

  /* WHITEBOARD ACTIONS */
  const undo = () => {
    if (!elements.length) return;
    const updated = elements.slice(0, -1);
    setElements(updated);
    socket.emit("whiteBoardData", { roomId: user.roomId, elements: updated });
  };

  const redo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    const updated = [...elements, last];
    setElements(updated);
    setHistory((h) => h.slice(0, -1));
    socket.emit("whiteBoardData", { roomId: user.roomId, elements: updated });
  };

  const clearCanvas = () => {
    setElements([]);
    setHistory([]);
    socket.emit("whiteBoardData", { roomId: user.roomId, elements: [] });
  };

  /* CHAT */
  const sendMessage = () => {
    if (!chatMsg.trim()) return;

    socket.emit("roomChatMessage", {
      roomId: user.roomId,
      msg: {
        user: user.name,
        text: chatMsg,
        time: Date.now(),
      },
    });

    setChatMsg("");
  };

  if (!user) return null;

  return (
    <div className="room-wrapper">
      <div className="room-header">
        <h1 className="logo">SketchMate</h1>
        <span className="users-online">
          Users Online: {users?.length || 0}
        </span>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="tool-section">
          {["pencil", "line", "rect"].map((t) => (
            <label key={t} className="tool-option">
              <input
                type="radio"
                checked={tool === t}
                onChange={() => setTool(t)}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="action-buttons">
          <button className="sk-btn action-btn" onClick={undo}>Undo</button>
          <button className="sk-btn action-btn" onClick={redo}>Redo</button>
          <button className="sk-btn clear-btn" onClick={clearCanvas}>Clear</button>
          <button
            className="sk-btn chat-btn"
            onClick={() => setChatOpen(!chatOpen)}
          >
            💬 Chat
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <WhiteBoard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          elements={elements}
          setElements={setElements}
          tool={tool}
          color={color}
          socket={socket}
          roomId={user.roomId}
          user={user}
        />
      </div>

      {/* CHAT PANEL */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Room Chat</span>
            <button className="buttonUI" onClick={() => setChatOpen(false)}>
              <span className="xcolor">X</span>
            </button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className="chat-msg">
                <div className="chat-username">{m.user}</div>
                <div className="chat-text">{m.text}</div>
                <div className="chat-time">
                  {new Date(m.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type message..."
            />
            <button onClick={sendMessage} className="sk-btn action-btn">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
