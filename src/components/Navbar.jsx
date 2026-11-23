import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <NavLink to="/" className="navbar-brand">
          🏍️ SPK Motor Bekas
        </NavLink>
        <ul className="navbar-nav">
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>
              Beranda
            </NavLink>
          </li>
          <li>
            <NavLink to="/katalog" className={({ isActive }) => (isActive ? 'active' : '')}>
              List Motor Bekas
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
