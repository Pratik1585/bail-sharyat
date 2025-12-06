import { useState } from "react";
import { saveAuth } from "../utils/auth";

const API = "http://localhost:5000/api/auth/signup";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("खाते तयार होत आहे...");

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, password }),
    });

    const data = await res.json();
    if (!data.ok) {
      setMsg(data.error);
      return;
    }

    saveAuth(data);  // ⭐ TOKEN SAVE
    setMsg("खाते यशस्वी तयार झाले!");

    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="नाव"
          value={name}
          onChange={(e) => setName(e.target.value)}
        /><br /><br />

        <input
          type="text"
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        /><br /><br />

        <input
          type="password"
          placeholder="पासवर्ड"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />

        <button type="submit">Signup</button>
      </form>

      <p>{msg}</p>
    </div>
  );
}
