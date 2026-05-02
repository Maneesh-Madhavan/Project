import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoomForm = ({ uuid, setUser }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: true,
      presenter: true,
    };

    setUser(roomData);

    setTimeout(() => {
      navigate(`/${roomId}`);
    }, 300);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form className="sk-form" onSubmit={handleCreateRoom}>
      <input
        type="text"
        className="sk-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        disabled={loading}
      />

      <div className="sk-row">
        <input
          type="text"
          disabled
          value={roomId}
          className="sk-input"
        />

        <button
          type="button"
          className="sk-btn sk-btn-green"
          onClick={() => setRoomId(uuid())}
          disabled={loading}
        >
          New
        </button>

        <button
          type="button"
          className="sk-btn sk-btn-red"
          onClick={handleCopy}
          disabled={loading}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <button
        type="submit"
        className="sk-btn sk-btn-red sk-full-btn"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Room"}
      </button>
    </form>
  );
};

export default CreateRoomForm;
