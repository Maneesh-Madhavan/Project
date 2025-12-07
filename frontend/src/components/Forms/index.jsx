import CreateRoomForm from "./CreateRoomForm"
import JoinRoomForm from "./JoinRoomForm"
import "./index.css"

const Forms = ({uuid, socket, setUser}) => {
  return (
    <div className="landing-wrapper">
      <h1 className="landing-title">SketchMate</h1>
      <p className="landing-subtitle">Create. Share. Collaborate in real-time.</p>

      <div className="forms-container">
        <div className="form-card">
          <h2>Create Room</h2>
          <CreateRoomForm uuid={uuid} socket={socket} setUser={setUser} />
        </div>

        <div className="form-card">
          <h2>Join Room</h2>
          <JoinRoomForm uuid={uuid} socket={socket} setUser={setUser} />
        </div>
      </div>
    </div>
  )
}

export default Forms
