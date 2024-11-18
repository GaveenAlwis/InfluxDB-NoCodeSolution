import React from "react";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";

const AppRoutes = [
  {
    index: true,
    element: <Home />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
];

export default AppRoutes;
