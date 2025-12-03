import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import NavBar from "./pages/NavBar";
import BottomBar from "./pages/BottomBar";
import { supabase } from "../supabaseClient";
import useWindowDimensions from "./WindowDimensions";
import { ThemeProvider } from "./dashboard/Darkmode";

export const AuthContext = createContext(null);
export const DarkModeSwitch = createContext();

function App() {
  const currentSession = supabase.auth.session?.() ?? null;
  const [session, setSession] = useState(currentSession);
  const [viewMyPins, setViewMyPins] = useState(false);
  const [viewPolicePins, setViewPolicePins] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [selectDashboardItem, setSelectDashboardItem] = useState(false);
  const [theme, setTheme] = useState("light");
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
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          session,
          setSession,
          viewMyPins,
          setViewMyPins,
          createMode,
          setCreateMode,
          viewPolicePins,
          setViewPolicePins,
          selectDashboardItem,
          setSelectDashboardItem,
        }}
      >
        <DarkModeSwitch.Provider value={{ theme, setTheme }}>
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
        </DarkModeSwitch.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
