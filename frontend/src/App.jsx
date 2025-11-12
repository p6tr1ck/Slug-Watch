import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import NavBar from "./pages/NavBar";
import BottomBar from "./pages/BottomBar";
import { supabase } from "../supabaseClient";
import useWindowDimensions from "./WindowDimensions";

export const AuthContext = createContext(null);

function App() {
  const currentSession = supabase.auth.session?.() ?? null;
  const [session, setSession] = useState(currentSession);
  const [viewMyPins, setViewMyPins] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    // checks if a user is already logged in
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    init();

    // update the session whenever it changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        setSession,
        viewMyPins,
        setViewMyPins,
        createMode,
        setCreateMode,
      }}
    >
      <BrowserRouter>
        <div
          className={`flex flex-col overflow-hidden h-screen ${
            width <= 600 ? "pb-20" : ""
          }`}
        >
          {width > 600 ? <NavBar /> : <></>}
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/home" element={<Home />} />
          </Routes>
          {width <= 600 ? <BottomBar /> : <></>}
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
