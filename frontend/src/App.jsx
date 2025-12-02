import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import NavBar from "./pages/NavBar";
import Moderation from "./pages/Moderation";
import BottomBar from "./pages/BottomBar";
import { supabase } from "../supabaseClient";
import useWindowDimensions from "./WindowDimensions";

export const AuthContext = createContext(null);

function App() {
  const currentSession = supabase.auth.session?.() ?? null;
  const [session, setSession] = useState(currentSession);
  const [viewMyPins, setViewMyPins] = useState(false);
  const [viewPolicePins, setViewPolicePins] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  // When user clicks on notification, pin should popup on map
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [viewBookmarkedPins, setViewBookmarkedPins] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmarks from Supabase when user signs in
  useEffect(() => {
    async function loadBookmarks() {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("bookmarks")
          .select("pin_id")
          .eq("user_id", session.user.id);
        
        if (error) {
          console.error("Error loading bookmarks:", error);
        } else {
          setBookmarks(data.map((d) => d.pin_id));
        }
      } else {
        setBookmarks([]);
      }
    }
    loadBookmarks();
  }, [session]);

  // Toggle bookmark in Supabase
  const toggleBookmark = async (pinId) => {
    if (!session?.user?.id) {
      window.location.href = "/signin";
      return;
    }

    const isBookmarked = bookmarks.includes(pinId);

    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", session.user.id)
        .eq("pin_id", pinId);

      if (error) {
        console.error("Error removing bookmark:", error);
      } else {
        setBookmarks((prev) => prev.filter((id) => id !== pinId));
      }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: session.user.id, pin_id: pinId });

      if (error) {
        console.error("Error adding bookmark:", error);
      } else {
        setBookmarks((prev) => [...prev, pinId]);
      }
    }
  };
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
        viewPolicePins,
        setViewPolicePins,
        selectedPinId,
        setSelectedPinId,
        viewBookmarkedPins,
        setViewBookmarkedPins,
        bookmarks,
        setBookmarks,
        toggleBookmark,
      }}
    >
      <BrowserRouter>
        <div className={`flex flex-col overflow-hidden h-screen `}>
          {width > 600 ? <NavBar /> : <></>}
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/home" element={<Home />} />
            <Route path="/moderation" element={<Moderation />} />
          </Routes>
          <BottomBar />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
