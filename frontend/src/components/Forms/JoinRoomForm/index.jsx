import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomForm = ({ uuid, setUser }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;

    setLoading(true); 

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: false,
      presenter: false,
    };

    setUser(roomData);

    // small delay to let UI update (optional but smooth)
    setTimeout(() => {
      navigate(`/${roomId}`);
    }, 300);
  };

  return (
    <form className="sk-form" onSubmit={handleRoomJoin}>
      <input
        type="text"
        className="sk-input"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />

      <input
        type="text"
        className="sk-input"
        placeholder="Enter room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        disabled={loading}
      />

      <button
        type="submit"
        className="sk-btn sk-btn-red sk-full-btn"
        disabled={loading}
      >
        {loading ? "Joining..." : "Join Room"}
      </button>
    </form>
  );
};

export default JoinRoomForm;
