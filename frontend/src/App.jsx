import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import NavBar from "./pages/NavBar";
import { supabase } from "../supabaseClient";

export const AuthContext = createContext(null);

function App() {
  const currentSession = supabase.auth.session?.() ?? null;
  const [session, setSession] = useState(currentSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      <BrowserRouter>
        <div className="flex flex-col overflow-hidden h-screen">
          <NavBar />
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
