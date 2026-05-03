import Forms from "./components/Forms";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import RoomPage from "./pages/RoomPage";
import io from "socket.io-client";
import { useEffect, useState } from "react";

// Auto-detect: in dev Vite sets import.meta.env.DEV = true
// In production the frontend is served by the same Express server, so we
// connect to the same origin (no hardcoded URL needed).
const server =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : window.location.origin;

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("skUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("userIsJoined", (data) => {
      if (data.success) console.log("UserJoined");
      else console.log("UserJoined Error");
    });

    socket.on("roomUsers", (usersList) => {
      setUsers(usersList);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("userIsJoined");
      socket.off("roomUsers");
    };
  }, []);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem("skUser", JSON.stringify(user));
    else localStorage.removeItem("skUser");
  }, [user]);

  const uuid = () => {
    var S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
  };

  return (
    <>
      {!isConnected && (
        <div className="loading-overlay">
          <div className="loader-orb"></div>
          <div className="loading-text">Waking up SketchMate…</div>
          <div className="loading-sub">Connecting to server, please wait</div>
        </div>
      )}
      <div>
        <Routes>
          <Route
            path="/"
            element={<Forms uuid={uuid} socket={socket} setUser={setUser} />}
          />
          <Route
            path="/:roomId"
            element={<RoomPage user={user} socket={socket} users={users} />}
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
