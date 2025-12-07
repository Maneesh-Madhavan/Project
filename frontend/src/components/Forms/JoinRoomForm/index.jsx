import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomForm = ({ uuid, socket, setUser }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRoomJoin = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: false,
      presenter: false,
    };
    setUser(roomData);
    navigate(`/${roomId}`);
    socket.emit("userJoined", roomData);
  };

  return (
    <form className="sk-form">
      <input
        type="text"
        className="sk-input"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        className="sk-input"
        placeholder="Enter room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button
        type="submit"
        onClick={handleRoomJoin}
        className="sk-btn sk-btn-red sk-full-btn"
      >
        Join Room
      </button>
    </form>
  );
};

export default JoinRoomForm;
