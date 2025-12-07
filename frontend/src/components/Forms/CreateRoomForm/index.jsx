import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoomForm = ({ uuid, socket, setUser }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: true,
      presenter: true,
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
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />

      <div className="sk-row">
        <input
          type="text"
          disabled
          value={roomId}
          className="sk-input flex-grow-1"
          placeholder="Generate room code"
        />

        <button
          type="button"
          className="sk-btn sk-btn-green"
          onClick={() => setRoomId(uuid())}
        >
          Generate
        </button>
        <button type="button" className="sk-btn sk-btn-red">
          Copy
        </button>
      </div>

      <button
        type="submit"
        onClick={handleCreateRoom}
        className="sk-btn sk-btn-red sk-full-btn"
      >
        Generate Room
      </button>
    </form>
  );
};

export default CreateRoomForm;
