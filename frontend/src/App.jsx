import "./index.css";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import NavBar from "./pages/NavBar";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col overflow-hidden h-screen">
        <NavBar/>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
