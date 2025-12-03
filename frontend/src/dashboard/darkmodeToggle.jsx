import { useContext } from "react";
import { DarkModeSwitch } from "../App";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export default function ThemeToggle() {
  const { theme, setTheme } = useContext(DarkModeSwitch);

  const changeTheme = () => {
    // If toggle button is clicked and theme is light,
    // change the theme to dark
    if (theme === "light") {
      setTheme("dark");
    } else {
      // Change theme to light if toggle button is clicked and theme is dark
      setTheme("light");
    }
  };

  return (
    <button
      onClick={changeTheme}
      className="
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-gray-200 dark:bg-gray-700
        text-gray-800 dark:text-gray-200
        hover:bg-gray-300 dark:hover:bg-gray-600
        transition-all
      "
    >
      {theme === "light" ? (
        <>
          <MdDarkMode size={20} />
          Dark Mode
        </>
      ) : (
        <>
          <MdLightMode size={20} />
          Light Mode
        </>
      )}
    </button>
  );
}
