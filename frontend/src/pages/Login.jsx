import { useState } from "react";
import { saveAuth } from "../utils/auth";

const API = "http://localhost:5000/api/auth/login";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("Login सुरू...");

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error);
      return;
    }

    saveAuth(data);  // ⭐ TOKEN HERE
    setMsg("Login यशस्वी!");

    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        /><br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />

        <button type="submit">Login</button>
      </form>

      <p>{msg}</p>
    </div>
  );
}
