import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";

// ---------- MAIN APP ----------
function App() {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem("bail_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token) setAuth(parsed);
      } catch {}
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage auth={auth} setAuth={setAuth} />} />
      <Route path="/login" element={<AuthPage auth={auth} setAuth={setAuth} />} />
      <Route path="/bull/:id" element={<BullDetailPage auth={auth} />} />
    </Routes>
  );
}

// ---------- HOME PAGE ----------
function HomePage({ auth, setAuth }) {
  const [bulls, setBulls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [btnFlash, setBtnFlash] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [form, setForm] = useState({
    name: "",
    age_years: "",
    weight_kg: "",
    color: "",
    price: "",
    district: "",
    taluka: "",
    village: "",
    has_race_exp: false,
    races_count: "",
    best_position: "",
    description: "",
    contact_phone: "",
    video_url: "",
  });

  const [photoFiles, setPhotoFiles] = useState([]); // multiple photos

  const resetForm = () => {
    setForm({
      name: "",
      age_years: "",
      weight_kg: "",
      color: "",
      price: "",
      district: "",
      taluka: "",
      village: "",
      has_race_exp: false,
      races_count: "",
      best_position: "",
      description: "",
      contact_phone: "",
      video_url: "",
    });
    setPhotoFiles([]);
    setEditingId(null);
  };

  const fetchBulls = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/bulls`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Something went wrong");
      setBulls(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Bulls load होताना problem आला.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulls();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(files);
  };

  const handleLogout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("bail_auth");
  };

  const handleEditClick = (bull) => {
    setEditingId(bull.id);
    setForm({
      name: bull.name || "",
      age_years: bull.age_years || "",
      weight_kg: bull.weight_kg || "",
      color: bull.color || "",
      price: bull.price || "",
      district: bull.district || "",
      taluka: bull.taluka || "",
      village: bull.village || "",
      has_race_exp: !!bull.has_race_exp,
      races_count: bull.races_count || "",
      best_position: bull.best_position || "",
      description: bull.description || "",
      contact_phone: bull.contact_phone || "",
      video_url: bull.video_url || "",
    });
    setPhotoFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (bull) => {
    if (!auth.token) return;
    const ok = window.confirm(
      `खरंच "${bull.name}" हा bail delete करायचा आहे का?`
    );
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/bulls/${bull.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Delete करताना problem आला.");
      }
      fetchBulls();
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete करताना problem आला.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnFlash(true);
    setTimeout(() => setBtnFlash(false), 140);
    setError("");
    setSuccess("");

    if (!auth.token) {
      setError("बैल add करण्यासाठी आधी login करा.");
      return;
    }

    if (!form.name || !form.price || !form.district || !form.contact_phone) {
      setError("Name, Price, District आणि Contact हे भरायला हवेत.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // EDIT (photos बदलत नाहीत)
        const payload = {
          ...form,
          has_race_exp: form.has_race_exp ? "true" : "false",
        };

        const res = await fetch(`${API_BASE}/api/bulls/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Update करताना problem आला.");
        }

        setSuccess("Bail यशस्वीरित्या अपडेट झाला ✅");
        resetForm();
        fetchBulls();
        return;
      }

      // NEW bail → FormData + multiple photos
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "has_race_exp") {
          fd.append(key, value ? "true" : "false");
        } else {
          fd.append(key, value ?? "");
        }
      });
      photoFiles.forEach((f) => fd.append("photos", f));

      const res = await fetch(`${API_BASE}/api/bulls`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Save करताना problem आला.");
      }

      setSuccess("बैल यशस्वीरित्या सेव्ह झाला ✅");
      resetForm();
      setFilterDistrict("");
      fetchBulls();
    } catch (err) {
      console.error(err);
      setError(err.message || "Save करताना problem आला.");
    } finally {
      setSaving(false);
    }
  };

  const visibleBulls = useMemo(
    () =>
      bulls.filter((b) => {
        if (
          filterDistrict &&
          !(b.district || "")
            .toLowerCase()
            .includes(filterDistrict.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [bulls, filterDistrict]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2fe 0, #f8fafc 40%, #f1f5f9 100%)",
        padding: isMobile ? "10px" : "16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        {/* Top nav bar */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            padding: "10px 14px",
            borderRadius: isMobile ? "14px" : "999px",
            background: "rgba(15,23,42,0.9)",
            color: "white",
            marginBottom: "16px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.35)",
            backdropFilter: "blur(10px)",
            gap: isMobile ? 8 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "999px",
                background: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🐂
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                bailgadasharyat.in
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                Maharashtra Bail Sharyat Market
              </div>
            </div>
          </div>

          <div
            style={{
              marginLeft: isMobile ? 0 : "auto",
              fontSize: 13,
              marginTop: isMobile ? 6 : 0,
            }}
          >
            {auth.user ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    lineHeight: 1.2,
                  }}
                >
                  <div>नमस्कार, {auth.user.name}</div>
                  <div style={{ opacity: 0.8 }}>{auth.user.mobile}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(248,250,252,0.3)",
                    background: "rgba(248,250,252,0.1)",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <span style={{ opacity: 0.8, fontSize: 12 }}>
                  Seller नाही? account तयार करा →
                </span>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(135deg,#22c55e,#16a34a,#15803d)",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(22,163,74,0.5)",
                  }}
                >
                  Login / Signup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title bar */}
        <header
          style={{
            marginBottom: "18px",
            padding: isMobile ? "12px 14px" : "14px 18px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 8,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                color: "#0f172a",
              }}
            >
              Maharashtra Bail Sharyat Market
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#64748b",
              }}
            >
              शर्यतीसाठी तयार खास बैल – खरेदी-विक्री एका जागी.
            </p>
          </div>

          <div
            style={{
              fontSize: 11,
              textAlign: isMobile ? "left" : "right",
              color: "#64748b",
            }}
          >
            <div>Local demo</div>
            <div>Data: MySQL • Node + Express</div>
          </div>
        </header>

        {/* Layout: Form + List */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 1fr",
            gap: isMobile ? "14px" : "18px",
          }}
        >
          {/* Form */}
          <section
            style={{
              background: "white",
              padding: "16px 18px 18px",
              borderRadius: "16px",
              boxShadow: "0 16px 45px rgba(15,23,42,0.06)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {editingId ? "बैल माहिती Edit करा:" : "नवीन बैल जोडाः"}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  Seller panel
                </span>
              </h2>

              {auth.token && (
                <div
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  ✅ Logged in
                </div>
              )}
            </div>

            {editingId && (
              <div
                style={{
                  fontSize: 12,
                  color: "#92400e",
                  background: "#fffbeb",
                  border: "1px solid #fed7aa",
                  borderRadius: 10,
                  padding: "6px 8px",
                  marginBottom: 8,
                }}
              >
                सध्या तुम्ही आधीचा bail edit करत आहात. नवीन bail add करायचा असेल
                तर{" "}
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1d4ed8",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  इथे click करा (reset).
                </button>
              </div>
            )}

            {!auth.token && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#b91c1c",
                  marginBottom: "10px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                🔒 बैल add करण्यासाठी आधी{" "}
                <Link to="/login" style={{ color: "#2563eb" }}>
                  Login / Signup
                </Link>{" "}
                करा.
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#b91c1c",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  marginBottom: "8px",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: "#ecfdf3",
                  color: "#15803d",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  marginBottom: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                opacity: auth.token ? 1 : 0.55,
                pointerEvents: auth.token ? "auto" : "none",
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "10px 14px",
                fontSize: "14px",
                marginTop: 4,
              }}
            >
              <div>
                <label>नाव (Name)*</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="उदा. शक्तीवान, लक्ष्या"
                />
              </div>
              <div>
                <label>किंमत (Price)*</label>
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  type="number"
                  style={inputStyle}
                  placeholder="₹"
                />
              </div>
              <div>
                <label>जिल्हा (District)*</label>
                <input
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="उदा. कोल्हापूर"
                />
              </div>
              <div>
                <label>तालुका (Taluka)</label>
                <input
                  name="taluka"
                  value={form.taluka}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="ऐच्छिक"
                />
              </div>
              <div>
                <label>गाव (Village)</label>
                <input
                  name="village"
                  value={form.village}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="ऐच्छिक"
                />
              </div>
              <div>
                <label>रंग (Color)</label>
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="उदा. काळा, पांढरा, चित्ता"
                />
              </div>
              <div>
                <label>वय (Age, वर्षे)</label>
                <input
                  name="age_years"
                  value={form.age_years}
                  onChange={handleChange}
                  type="number"
                  style={inputStyle}
                />
              </div>
              <div>
                <label>वजन (Weight kg)</label>
                <input
                  name="weight_kg"
                  value={form.weight_kg}
                  onChange={handleChange}
                  type="number"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Contact Mobile *</label>
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="WhatsApp / Call number"
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label>व्हिडीओ link (YouTube / इ.)</label>
                <input
                  name="video_url"
                  value={form.video_url}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="उदा. https://youtu.be/..."
                />
              </div>

              {!editingId && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>फोटो (multiple photos निवडा)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{
                      marginTop: "3px",
                      fontSize: "13px",
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    ⓘ एकाच वेळी ३–५ फोटो निवडा (Ctrl/Shift वापरून).
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <input
                  type="checkbox"
                  name="has_race_exp"
                  id="has_race_exp"
                  checked={form.has_race_exp}
                  onChange={handleChange}
                />
                <label htmlFor="has_race_exp">
                  शर्यतीचा आधीचा experience आहे का?
                </label>
              </div>
              <div>
                <label>शर्यतीची संख्या</label>
                <input
                  name="races_count"
                  value={form.races_count}
                  onChange={handleChange}
                  type="number"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Best position</label>
                <input
                  name="best_position"
                  value={form.best_position}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="उदा. 1st, 2nd, 3rd..."
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>अधिक माहिती</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="बैलबद्दल थोडी माहिती, विशेष गुण, स्वभाव इ."
                />
              </div>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: saving
                      ? "#64748b"
                      : btnFlash
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#16a34a,#22c55e)",
                    color: "white",
                    border: "none",
                    padding: "9px 22px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    boxShadow: btnFlash
                      ? "0 0 0 4px rgba(34,197,94,0.35)"
                      : "0 12px 25px rgba(22,163,74,0.45)",
                    transition: "all 0.12s",
                    transform: btnFlash ? "translateY(-1px)" : "translateY(0)",
                    fontSize: 14,
                    fontWeight: 500,
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Bail"
                    : "Save Bail"}
                </button>
              </div>
            </form>
          </section>

          {/* List */}
          <section
            style={{
              background: "white",
              padding: "14px 16px 16px",
              borderRadius: "16px",
              boxShadow: "0 16px 45px rgba(15,23,42,0.06)",
              border: "1px solid #e2e8f0",
              maxHeight: isMobile ? "none" : "80vh",
              overflowY: isMobile ? "visible" : "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: "#0f172a",
                  }}
                >
                  Available Bulls
                </h2>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginTop: 2,
                  }}
                >
                  Total: {bulls.length} • Filtered: {visibleBulls.length}
                </div>
              </div>
              <button
                onClick={fetchBulls}
                style={{
                  fontSize: "12px",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  border: "1px solid #cbd5f5",
                  background: "#eff6ff",
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>

            <div
              style={{
                marginBottom: "10px",
                fontSize: "12px",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                placeholder="जिल्हा filter (उदा. कोल्हापूर)"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                style={{
                  ...inputStyle,
                  maxWidth: isMobile ? "100%" : "220px",
                  marginTop: 0,
                }}
              />
              {filterDistrict && !isMobile && (
                <button
                  type="button"
                  onClick={() => setFilterDistrict("")}
                  style={{
                    fontSize: 11,
                    borderRadius: "999px",
                    border: "none",
                    padding: "4px 8px",
                    background: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {loading ? (
              <p style={{ fontSize: 13 }}>डेटा लोड होत आहे...</p>
            ) : visibleBulls.length === 0 ? (
              <p style={{ fontSize: 13 }}>
                Filter नुसार कोणताही बैल नाही. Filter बदलून पाहा.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {visibleBulls.map((b) => {
                  const isMine =
                    auth.user && Number(auth.user.id) === Number(b.user_id);

                  let photos = [];
                  try {
                    photos = b.photos_json ? JSON.parse(b.photos_json) : [];
                  } catch {
                    photos = [];
                  }
                  const mainPhoto = b.main_photo || photos[0] || null;

                  return (
                    <li
                      key={b.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "9px 10px",
                        marginBottom: "8px",
                        display: "grid",
                        gridTemplateColumns: "92px 1fr",
                        gap: "10px",
                        background: "#f9fafb",
                        transition: "all 0.12s",
                        boxShadow: "0 0 0 rgba(0,0,0,0)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 10px 20px rgba(15,23,42,0.12)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div>
                        {mainPhoto ? (
                          <img
                            src={`${API_BASE}/${mainPhoto}`}
                            alt={b.name}
                            style={{
                              width: "92px",
                              height: "92px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "92px",
                              height: "92px",
                              borderRadius: "10px",
                              border: "1px dashed #cbd5f5",
                              fontSize: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94a3b8",
                              textAlign: "center",
                              padding: "4px",
                            }}
                          >
                            No photo
                          </div>
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "spaceBetween",
                            alignItems: "flex-start",
                            marginBottom: "4px",
                            gap: 6,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#0f172a",
                              }}
                            >
                              {b.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                marginTop: 2,
                              }}
                            >
                              {b.village ? b.village + ", " : ""}
                              {b.taluka ? b.taluka + ", " : ""}
                              {b.district}
                            </div>
                          </div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#16a34a",
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹ {b.price?.toLocaleString?.("en-IN") || b.price}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                            fontSize: 11,
                          }}
                        >
                          {b.has_race_exp ? (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "999px",
                                background: "#eef2ff",
                                color: "#4338ca",
                                border: "1px solid #c7d2fe",
                              }}
                            >
                              🏁 Race Exp
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "999px",
                                background: "#f1f5f9",
                                color: "#64748b",
                              }}
                            >
                              No race record
                            </span>
                          )}
                          {b.weight_kg && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "999px",
                                background: "#fef9c3",
                                color: "#854d0e",
                                border: "1px solid #facc15",
                              }}
                            >
                              ⚖️ {b.weight_kg} kg
                            </span>
                          )}
                          {b.video_url && (
                            <a
                              href={b.video_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "2px 6px",
                                borderRadius: "999px",
                                background: "#e0f2fe",
                                color: "#0369a1",
                                fontSize: 11,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              ▶ Video
                            </a>
                          )}
                        </div>

                        <p
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#0f172a",
                          }}
                        >
                          संपर्क:{" "}
                          <a
                            href={`tel:${b.contact_phone}`}
                            style={{ color: "#2563eb" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {b.contact_phone}
                          </a>{" "}
                          ·{" "}
                          <a
                            href={`https://wa.me/91${b.contact_phone}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#16a34a" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            WhatsApp
                          </a>{" "}
                          ·{" "}
                          <Link
                            to={`/bull/${b.id}`}
                            style={{ fontSize: "12px", color: "#0f172a" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View details →
                          </Link>
                        </p>

                        {isMine && (
                          <div
                            style={{
                              marginTop: 4,
                              display: "flex",
                              gap: 6,
                              fontSize: 11,
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(b);
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "999px",
                                border: "1px solid #bfdbfe",
                                background: "#eff6ff",
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(b);
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "999px",
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------- LOGIN / SIGNUP PAGE ----------
function AuthPage({ auth, setAuth }) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.token) {
      navigate("/");
    }
  }, [auth, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup && !form.name) {
      setError("नाव भरावे.");
      return;
    }
    if (!form.mobile || !form.password) {
      setError("मोबाईल आणि पासवर्ड दोन्ही आवश्यक.");
      return;
    }

    try {
      const path = isSignup ? "signup" : "login";
      const res = await fetch(`${API_BASE}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Auth error");
      }

      const authData = { token: data.token, user: data.user };
      setAuth(authData);
      localStorage.setItem("bail_auth", JSON.stringify(authData));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Auth error");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2fe 0, #f8fafc 40%, #f1f5f9 100%)",
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "420px", margin: "40px auto" }}>
        <div
          style={{
            background: "rgba(15,23,42,0.95)",
            color: "white",
            borderRadius: "16px 16px 0 0",
            padding: "16px 18px",
            boxShadow: "0 18px 45px rgba(15,23,42,0.6)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            Seller Login / Signup
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              opacity: 0.9,
            }}
          >
            बैल add / manage करण्यासाठी seller account वापरा.
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px 18px 20px",
            borderRadius: "0 0 16px 16px",
            boxShadow: "0 18px 45px rgba(15,23,42,0.15)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: "12px",
              borderRadius: "999px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <button
              onClick={() => setIsSignup(true)}
              style={{
                flex: 1,
                padding: "7px 0",
                border: "none",
                cursor: "pointer",
                background: isSignup ? "#0f172a" : "transparent",
                color: isSignup ? "white" : "#0f172a",
                fontSize: "13px",
              }}
            >
              Signup
            </button>
            <button
              onClick={() => setIsSignup(false)}
              style={{
                flex: 1,
                padding: "7px 0",
                border: "none",
                cursor: "pointer",
                background: !isSignup ? "#0f172a" : "transparent",
                color: !isSignup ? "white" : "#0f172a",
                fontSize: "13px",
              }}
            >
              Login
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "7px 8px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "8px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "10px", fontSize: "14px" }}
          >
            {isSignup && (
              <div>
                <label>नाव</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="तुमचं नाव"
                />
              </div>
            )}
            <div>
              <label>मोबाईल नंबर</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                style={inputStyle}
                placeholder="10 digit mobile"
              />
            </div>
            <div>
              <label>पासवर्ड</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                style={inputStyle}
                placeholder="पासवर्ड"
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: "4px",
                background:
                  "linear-gradient(135deg,#16a34a,#22c55e,#22c55e,#16a34a)",
                color: "white",
                border: "none",
                padding: "9px 16px",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow: "0 12px 30px rgba(22,163,74,0.55)",
              }}
            >
              {isSignup ? "नवीन account तयार करा" : "Login"}
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: "12px",
              background: "transparent",
              border: "none",
              color: "#2563eb",
              fontSize: "13px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- DETAIL PAGE (INSTAGRAM STYLE PHOTOS) ----------
function BullDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bull, setBull] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBull = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/bulls/${id}`);
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Bull नाही.");
        setBull(data.data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Bull नाही.");
      } finally {
        setLoading(false);
      }
    };
    fetchBull();
  }, [id]);

  let photos = [];
  let mainPhoto = null;
  if (bull) {
    try {
      photos = bull.photos_json ? JSON.parse(bull.photos_json) : [];
    } catch {
      photos = [];
    }
    mainPhoto = bull.main_photo || photos[0] || null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #e0f2fe 0, #f8fafc 40%, #f1f5f9 100%)",
        padding: "20px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "white",
            color: "#0f172a",
            borderRadius: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 14px 35px rgba(15,23,42,0.12)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "20px" }}>Bail Details</h1>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ← Back to list
          </button>
        </header>

        <section
          style={{
            background: "white",
            padding: "16px 18px",
            borderRadius: "16px",
            boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
            border: "1px solid #e2e8f0",
          }}
        >
          {loading ? (
            <p>डेटा लोड होत आहे...</p>
          ) : error ? (
            <p style={{ color: "#b91c1c" }}>{error}</p>
          ) : !bull ? (
            <p>Bull सापडला नाही.</p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "280px 1fr",
                  gap: "18px",
                }}
              >
                <div>
                  {/* INSTAGRAM STYLE MAIN PHOTO */}
                  <div
                    style={{
                      background: "#000",
                      borderRadius: "18px",
                      overflow: "hidden",
                      boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
                    }}
                  >
                    {mainPhoto ? (
                      <img
                        src={`${API_BASE}/${mainPhoto}`}
                        alt={bull.name}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9ca3af",
                          fontSize: "13px",
                          background:
                            "linear-gradient(135deg,#1f2937,#0f172a,#020617)",
                          textAlign: "center",
                          padding: "10px",
                        }}
                      >
                        No photo available
                      </div>
                    )}
                  </div>

                  {/* THUMBNAILS SCROLL STRIP */}
                  {photos.length > 1 && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "6px 4px",
                        borderRadius: "14px",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        gap: 6,
                        overflowX: "auto",
                      }}
                    >
                      {photos.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            minWidth: "64px",
                            height: "64px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={`${API_BASE}/${p}`}
                            alt={`photo-${idx}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {bull.video_url && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={bull.video_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          fontSize: 13,
                        }}
                      >
                        ▶ Video पाहा
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <h2
                    style={{
                      margin: "0 0 6px",
                      fontSize: 20,
                      color: "#0f172a",
                    }}
                  >
                    {bull.name}
                  </h2>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {bull.village ? bull.village + ", " : ""}
                    {bull.taluka ? bull.taluka + ", " : ""}
                    {bull.district}
                  </p>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#16a34a",
                      marginBottom: "10px",
                    }}
                  >
                    ₹ {bull.price?.toLocaleString?.("en-IN") || bull.price}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                      fontSize: 12,
                    }}
                  >
                    {bull.age_years && (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#eef2ff",
                          color: "#3730a3",
                        }}
                      >
                        वय: {bull.age_years} वर्षे
                      </span>
                    )}
                    {bull.weight_kg && (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#fef9c3",
                          color: "#854d0e",
                        }}
                      >
                        वजन: {bull.weight_kg} kg
                      </span>
                    )}
                    {bull.has_race_exp ? (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#dcfce7",
                          color: "#166534",
                        }}
                      >
                        🏁 Race Experience
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#f1f5f9",
                          color: "#64748b",
                        }}
                      >
                        Race record नाही
                      </span>
                    )}
                    {bull.best_position && (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: "#fee2e2",
                          color: "#b91c1c",
                        }}
                      >
                        Best position: {bull.best_position}
                      </span>
                    )}
                  </div>

                  {bull.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#0f172a",
                        marginBottom: 10,
                      }}
                    >
                      {bull.description}
                    </p>
                  )}

                  <p style={{ fontSize: 13 }}>
                    संपर्क:{" "}
                    <a
                      href={`tel:${bull.contact_phone}`}
                      style={{ color: "#2563eb" }}
                    >
                      {bull.contact_phone}
                    </a>{" "}
                    ·{" "}
                    <a
                      href={`https://wa.me/91${bull.contact_phone}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#16a34a" }}
                    >
                      WhatsApp
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "6px 9px",
  borderRadius: "9px",
  border: "1px solid #cbd5f5",
  fontSize: "13px",
  marginTop: "3px",
  boxSizing: "border-box",
  outline: "none",
};

export default App;
