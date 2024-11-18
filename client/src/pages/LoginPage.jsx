import React, {useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

import BackgroundImage from "../assets/background.png";


const LoginPage = () => {
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const handleLoginForm = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    axios.post("/api/users/signIn", {
      user: username,
      pass: password,
    }).then((response) => {
      navigate("/");
    }).catch((error) => {
      setLoginError(error.response?.data);
    });
  };

  return (
    <div className="place-content-center h-screen w-screen" style={{backgroundImage: `url(${BackgroundImage})`}}>
      <form className='grid grid-cols-1 gap-3 bg-slate-50 p-3 m-3 rounded' onSubmit={handleLoginForm}>
        <h1>Log In</h1>

        <div>
          <h2 className="above_textbox">Username</h2>
          <input name="username" type="text" placeholder="Enter Username" />
        </div>

        <div>
          <h2 className="above_textbox">Password</h2>
          <input name="password" type="password" placeholder="Enter Password" />
        </div>

        <div>
          <button type="submit" className=''>Submit</button>
        </div>

        <p className="text-red-600"><strong>{loginError}</strong></p>
      </form>
    </div>
  );
};
export default LoginPage;
