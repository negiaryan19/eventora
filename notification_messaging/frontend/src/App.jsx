import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [privateMsg, setPrivateMsg] = useState("");
  const [roomMsg, setRoomMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [room, setRoom] = useState("");
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [typingUser, setTypingUser] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;

    socket.on("users", (usersList) => {
      setUsers(usersList);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(""), 1000);
    });

    return () => socket.off();
  }, [isLoggedIn]);

  //  LOGIN
  const handleLogin = () => {
    if (!username) return alert("Enter username");
    socket.emit("register", username);
    setIsLoggedIn(true);
  };

  // Broadcast
  const sendBroadcast = () => {
    socket.emit("broadcast", broadcastMsg);
    setBroadcastMsg("");
  };

  // Private
  const sendPrivate = () => {
    if (!selectedUser) return alert("Select user");
    socket.emit("private_message", {
      to: selectedUser,
      message: privateMsg
    });
    setPrivateMsg("");
  };

  // Join room
  const joinRoom = () => {
    socket.emit("join_room", room);
    if (!joinedRooms.includes(room)) {
      setJoinedRooms([...joinedRooms, room]);
    }
    setSelectedRoom(room);
    setRoom("");
  };

  // Leave room
  const leaveRoom = () => {
    socket.emit("leave_room", selectedRoom);
    setJoinedRooms(joinedRooms.filter((r) => r !== selectedRoom));
    setSelectedRoom("");
  };

  // Room message
  const sendRoomMessage = () => {
    socket.emit("room_message", {
      room: selectedRoom,
      message: roomMsg
    });
    setRoomMsg("");
  };

  // Typing
  const handleTyping = () => {
    if (selectedRoom) socket.emit("typing", selectedRoom);
  };

  //  LOGIN UI
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h2>🔐 Login</h2>
          <input
            style={styles.input}
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Chat with friends</h2>
        <h1>{username}</h1>
      </div>

      {/* Users */}
      <div style={styles.card}>
        <h3>🟢 Online Users</h3>
        {users.map((u) => (
          <div key={u.id}>{u.username}</div>
        ))}
      </div>

      {/* Broadcast */}
      <div style={styles.card}>
        <h3>Broadcast</h3>
        <input
          style={styles.input}
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
        />
        <button style={styles.button} onClick={sendBroadcast}>
          Send
        </button>
      </div>

      {/* Private */}
      <div style={styles.card}>
        <h3>Private</h3>
        <select
          style={styles.input}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option>Select User</option>
          {users
            .filter((u) => u.username !== username)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
        </select>

        <input
          style={styles.input}
          value={privateMsg}
          onChange={(e) => setPrivateMsg(e.target.value)}
        />

        <button style={styles.button} onClick={sendPrivate}>
          Send
        </button>
      </div>

      {/* Room */}
      <div style={styles.card}>
        <h3>Room</h3>

        <input
          style={styles.input}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room name"
        />
        <button style={styles.button} onClick={joinRoom}>
          Join
        </button>

        <select
          style={styles.input}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option>Select Room</option>
          {joinedRooms.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <button style={styles.button} onClick={leaveRoom}>
          Leave
        </button>

        <input
          style={styles.input}
          value={roomMsg}
          onChange={(e) => {
            setRoomMsg(e.target.value);
            handleTyping();
          }}
        />

        <button style={styles.button} onClick={sendRoomMessage}>
          Send
        </button>
      </div>

      {/* Messages */}
      <div style={styles.card}>
        <h3>💬 Messages</h3>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.from}</b>: {m.text} ({m.type})
          </div>
        ))}
        {typingUser && <p>✍️ {typingUser} typing...</p>}
      </div>
    </div>
  );
}

// 🎨 Styles
const styles = {
  container: {
    padding: 20,
    background: "#f4f6f8",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between"
  },
  card: {
    background: "white",
    padding: 15,
    marginTop: 15,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: 8,
    marginTop: 10
  },
  button: {
    marginTop: 10,
    padding: "8px 12px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: 5
  },
  loginContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #667eea, #764ba2)"
  },
  loginBox: {
    background: "white",
    padding: 30,
    borderRadius: 10,
    textAlign: "center",
    width: 300
  }
};