import { Link } from 'react-router-dom';
import logo from '../assets/prodpilot-logo.jpg';

export default function AuthCard({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="intro-content">
          <div className="brand light"><img className="auth-logo" src={logo} alt="ProdPilot logo" /><span>ProdPilot</span></div>
          <p className="eyebrow">PLAN WITH PURPOSE</p>
          <h1>Small steps.<br />Real progress.</h1>
          <p>Organise your day, focus on what matters, and celebrate every finished task.</p>
          <div className="quote-card">“The secret of getting ahead is getting started.”<span>— Mark Twain</span></div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand brand"><img className="brand-logo" src={logo} alt="ProdPilot logo" /><span>ProdPilot</span></div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-footer">{footerText} <Link to={footerLink}>{footerLabel}</Link></p>
        </div>
      </section>
    </main>
  );
}
