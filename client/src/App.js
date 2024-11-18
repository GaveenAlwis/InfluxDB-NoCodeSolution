import React, {useEffect} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import AppRoutes from "./AppRoutes";
import axios from "axios";
import "./assets/App.css";


axios.defaults.withCredentials = true;

/**
 *
 * @function
 * @return {JSX.Element}
 */
const App = () => {
  const navigate = useNavigate();

  // If not logged in, navigate to "login"
  useEffect(() => {
    console.log("Check logged in");

    axios.get("/api/users/me")
      .then((response) => {
        navigate("/");
      })
      .catch((error) => {
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="App">
      <Routes>
        {AppRoutes.map((route, index) => {
          const {element, ...rest} = route;
          return <Route key={index} {...rest} element={element} />;
        })}
      </Routes>
    </div>
  );
};

export default App;
