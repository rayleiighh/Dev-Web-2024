import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // 🔥 Redirection immédiate vers le Dashboard
        navigate("/dashboard");
    };

    return (
        <div className="login-container">
            <FaArrowLeft className="back-arrow" onClick={() => navigate('/')} />
            <h1>PowerTrack ⚡</h1>
            <h2>Se connecter :</h2>

            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" className="input-field" />
                <input type="password" placeholder="Mot de passe" className="input-field" />
                <button type="submit">Se connecter</button>
            </form>

            <button className="secondary" onClick={() => navigate('/inscription')}>
                Créer un compte
            </button>
        </div>
    );
};

export default Login;
