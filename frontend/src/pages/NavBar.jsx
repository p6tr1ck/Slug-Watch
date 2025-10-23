import { Link } from "react-router-dom";

export default function NavBar() {
  return (
  <nav className="p-4 bg-gray-100">
    <Link to="/signin" className="mr-4">Sign In</Link>
    <Link to="/home">Home</Link>
  </nav>
  )
}