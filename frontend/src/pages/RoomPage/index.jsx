import { useRef, useState, useEffect } from "react";
import WhiteBoard from "../../components/WhiteBoard";
import "./index.css";

const RoomPage = ({ user, socket, users }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);

  // Undo / Redo
  const undo = () => {
    if (!elements.length) return;
    const last = elements[elements.length - 1];
    setHistory((h) => [...h, last]);
    setElements((e) => e.slice(0, -1));
    socket.emit("whiteBoardData", { roomId: user.roomId, elements: elements.slice(0, -1) });
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

  // Handle page refresh: reload same room
  useEffect(() => {
    if (user && user.roomId) {
      socket.emit("userJoined", user);
    }
  }, [user, socket]);

  return (
    <div className="room-wrapper">
      <div className="room-header">
        <h1 className="logo">SketchMate</h1>
        <span className="users-online">
          Users Online: {users?.length || 0}
        </span>
      </div>

      {user && (
        <div className="toolbar">
          <div className="tool-section">
            {["pencil", "line", "rect"].map((t) => (
              <label key={t} className="tool-option">
                <input
                  type="radio"
                  name="tool"
                  value={t}
                  checked={tool === t}
                  onChange={(e) => setTool(e.target.value)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>

          <div className="color-picker">
            <label>Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button onClick={undo} className="sk-btn action-btn">Undo</button>
            <button onClick={redo} className="sk-btn action-btn">Redo</button>
            <button onClick={clearCanvas} className="sk-btn clear-btn">Clear</button>
          </div>
        </div>
      )}

      <div className="canvas-container">
        <WhiteBoard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          elements={elements}
          setElements={setElements}
          tool={tool}
          color={color}
          socket={socket}
          user={user}
          roomId={user?.roomId}
        />
      </div>
    </div>
  );
};

export default RoomPage;
