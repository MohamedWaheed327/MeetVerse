import { MdOutlineLightMode, MdDarkMode } from "react-icons/md";
import { useContext } from "react";
import { ThemeContext } from "../../../Context/ThemeContext";

const DarkMode = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <>
      {theme === "light" && (
        <MdDarkMode
          onClick={toggleTheme}
          className="text-2xl cursor-pointer duration-300 transition-all drop-shadow-sm "
        />
      )}

      {theme === "dark" && (
        <MdOutlineLightMode
          onClick={toggleTheme}
          className="text-2xl cursor-pointer duration-300 transition-all drop-shadow-sm text-gray-100"
        />
      )}
    </>
  );
};

export default DarkMode;
