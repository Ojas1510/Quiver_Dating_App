import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import API_URL from "../api";

const AuthModal = ({ setShowModal, isSignUp }) => {
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [error, setError] = useState(null);
  const [, setCookie] = useCookies(["user"]);

  const handleClick = () => setShowModal(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp && password !== confirmPassword) {
        setError("Passwords are not the same.");
        return;
      }

      const response = await axios.post(
        `${API_URL}/${isSignUp ? "signup" : "login"}`,
        { email, password }
      );

      setCookie("AuthToken", response.data.token);
      setCookie("UserId", response.data.userId);

      if (isSignUp) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      setError(error.response?.data || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-modal">
      <div className="close-icon" onClick={handleClick}>
        <h4>❌</h4>
      </div>
      <br />
      <h2><b>{isSignUp ? "Get Started" : "Log In"}</b></h2>
      <p>
        By clicking Log In, you agree to my terms. Learn how I process your data
        in my Privacy Policy and Cookie Policy.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          id="password"
          name="password"
          placeholder="password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignUp && (
          <input
            type="password"
            id="password-check"
            name="password-check"
            placeholder="confirm password"
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
        <div>
          <input className="secondary-button" type="submit" />
        </div>
        <p>{error}</p>
      </form>
      <hr />
      <h2>Get The App</h2>
    </div>
  );
};

export default AuthModal;
