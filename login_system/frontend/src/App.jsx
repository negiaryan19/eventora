import React, { useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";

const API = axios.create({
  baseURL: "http://localhost:4000/",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

const InputField = ({ label, type, name, value, onChange }) => (
  <div style={styles.inputGroup}>
    <label style={styles.label}>{label}</label>

    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required
      style={styles.input}
    />
  </div>
);

const Signup = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    country: "",
    phone: "",
    gender: "",
    dob: "",
  });

  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      await API.post("/auth/signup", form);

      alert("Signup successful!");

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Create Account</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <InputField
            label="Country"
            type="text"
            name="country"
            value={form.country}
            onChange={handleChange}
          />

          <InputField
            label="Phone"
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          {/* Gender */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Gender</label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <InputField
            label="Date of Birth"
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
          />

          <button style={styles.button}>Signup</button>
        </form>

        <p style={styles.text}>
          Already have an account?{" "}
          <Link style={styles.link} to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const res = await API.post("/auth/login", form);

      if (res.data.requires2FA) {
        navigate('/login-otp', {
          state: {
            email: res.data.email
          }
        });
        return;
      }

      localStorage.setItem("token", res.data.token);

      if (res.data.mustChangePassword) {
        alert("You must change your password!");
      } else {
        alert("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Welcome Back</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <button style={styles.button}>Login</button>
        </form>

        <p style={styles.text}>
          Don't have an account?{" "}
          <Link style={styles.link} to="/signup">
            Signup
          </Link>
        </p>

        <p style={styles.text}>
          <Link style={styles.link} to="/request-reset">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
};

const LoginOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const verifyOTP = async () => {
    try {
      const res = await API.post(
        "/auth/verify-login-otp",
        {
          email,
          otp
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );
      alert("Login successful");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.heading}>
          Verify Login OTP
        </h2>

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        <InputField
          label="Enter OTP"
          type="text"
          name="otp"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value)
          }
        />

        <button
          style={styles.button}
          onClick={verifyOTP}
        >
          Verify OTP
        </button>

      </div>
    </div>
  );
};

const Verify2FA = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const verify = async () => {
    try {
      await API.post(
        '/auth/verify-enable-2fa',
        { otp }
      );
      alert('2FA Enabled');
      navigate('/dashboard');
    } catch (err) {
      alert(
        err.response?.data?.error
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <h2 style={styles.heading}>
          Verify 2FA
        </h2>

        <InputField
          label="OTP"
          type="text"
          name="otp"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value)
          }
        />

        <button
          style={styles.button}
          onClick={verify}
        >
          Verify OTP
        </button>

      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const enable2FA = async () => {
    try {
      await API.post('/auth/enable-2fa');
      navigate('/verify-2fa');
    } catch (err) {
      alert(
        err.response?.data?.error
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Dashboard</h2>

        <p style={styles.text}>You are logged in</p>

        <p style={styles.text}>
          <Link style={styles.link} to="/change-password">
            Change Password
          </Link>
        </p>
        <button
          style={styles.button}
          onClick={enable2FA}
        >
          Enable 2FA
        </button>
        <button style={styles.button} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

const RequestReset = () => {
  const [email, setEmail] = useState("");

  const [msg, setMsg] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    try {
      const res = await API.post("/auth/request-reset", {
        email,
      });

      setMsg(res.data.message);
    } catch (err) {
      setMsg(
        "If an account exists, password reset instructions were sent."
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Forgot Password</h2>

        {msg && <p style={styles.success}>{msg}</p>}

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button style={styles.button}>Request Reset</button>
        </form>

        <p style={styles.text}>
          <Link style={styles.link} to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const [form, setForm] = useState({
    email: "",
    token: "",
    newPassword: "",
  });

  const [msg, setMsg] = useState("");

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    try {
      const res = await API.post("/auth/reset-password", form);

      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Reset Password</h2>

        {msg && <p style={styles.success}>{msg}</p>}

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Token"
            type="text"
            name="token"
            value={form.token}
            onChange={handleChange}
          />

          <InputField
            label="New Password"
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
          />

          <button style={styles.button}>Reset Password</button>
        </form>
        <p style={styles.text}>
          <Link style={styles.link} to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [msg, setMsg] = useState("");

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    try {
      const res = await API.post("/auth/change-password", form);

      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Change failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Change Password</h2>

        {msg && <p style={styles.success}>{msg}</p>}

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Current Password"
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
          />

          <InputField
            label="New Password"
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
          />

          <button style={styles.button}>Change Password</button>
        </form>
        <p style={styles.text}>
          <Link style={styles.link} to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            font-family: 'Poppins', sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          input::placeholder {
            color: rgba(255,255,255,0.7);
          }

          input:focus,
          select:focus {
            border: 1px solid #ffffff;
            box-shadow: 0 0 10px rgba(255,255,255,0.4);
          }

          button:hover {
            transform: translateY(-2px);
            opacity: 0.95;
          }

          option {
            color: black;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0px);
            }
          }
        `}
      </style>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/request-reset" element={<RequestReset />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />
          <Route path="/login-otp" element={<LoginOTP />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const styles = {
     page: {
         minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", background: "linear-gradient(-45deg, #031220, #08213d, #0d3b66, #031220)", backgroundSize: "400% 400%", animation: "bgMove 12s ease infinite", 
    }
    , container: {
         width: "100%", maxWidth: "420px", padding: "40px 35px", borderRadius: "35px", background: "linear-gradient(180deg, rgba(24,114,184,0.35), rgba(7,31,61,0.55))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(90,190,255,0.45)", animation: "fadeIn 0.7s ease, glow 4s infinite", boxShadow: "0 0 25px rgba(0,174,255,0.2)", position: "relative", overflow: "hidden", color: "white", 
    }
    , heading: {
         textAlign: "center", marginBottom: "30px", fontSize: "30px", fontWeight: "600", color: "#dff6ff", letterSpacing: "1px", textShadow: "0 0 12px rgba(53,191,255,0.8)", 
    }
    , inputGroup: {
         marginBottom: "18px", textAlign: "left", 
    }
    , label: {
         display: "block", marginBottom: "8px", color: "#c9ecff", fontSize: "14px", fontWeight: "500", 
    }
    , input: {
         width: "100%", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,50,100,0.45)", color: "white", outline: "none", fontSize: "14px", transition: "0.3s", boxSizing: "border-box", 
    }
    , select: {
         width: "100%", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,50,100,0.45)", color: "white", outline: "none", fontSize: "14px", transition: "0.3s", boxSizing: "border-box", 
    }
    , button: {
         width: "100%", padding: "14px", marginTop: "10px", border: "none", borderRadius: "10px", background: "linear-gradient(90deg, #0066cc, #1ca3ff)", color: "white", fontWeight: "600", fontSize: "15px", cursor: "pointer", letterSpacing: "1px", transition: "0.3s", boxShadow: "0 0 15px rgba(28,163,255,0.45)", 
    }
    , link: {
         color: "#7fd8ff", textDecoration: "none", fontWeight: "500", 
    }
    , text: {
         textAlign: "center", marginTop: "16px", color: "#d4f1ff", fontSize: "13px", 
    }
    , error: {
         background: "rgba(255,0,0,0.12)", color: "#ffb3b3", padding: "12px", borderRadius: "10px", marginBottom: "15px", border: "1px solid rgba(255,0,0,0.15)", textAlign: "center", 
    }
    , success: {
         background: "rgba(0,255,120,0.12)", color: "#b8ffd8", padding: "12px", borderRadius: "10px", marginBottom: "15px", border: "1px solid rgba(0,255,120,0.15)", textAlign: "center", 
    }
    , 
}
;
