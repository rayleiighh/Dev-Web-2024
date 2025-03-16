import React from 'react'; 
import { useNavigate } from 'react-router-dom';

const Accueil = () => {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            <div className="title-container">
                <h1>Bienvenue chez</h1>
                <h1><span className="powertrack-title">PowerTrack ⚡</span></h1>
            </div>
            <p className="description">
                Gardez le contrôle de votre énergie, partout et à tout moment.
            </p>
            <p className="info-text">
                Notre application vous permet de suivre en temps réel la consommation électrique de vos appareils,
                de les contrôler à distance et de recevoir des alertes en cas d’anomalie.
            </p>
            <button onClick={() => navigate('/inscription')}>Créer un compte</button>
            <button className="secondary" onClick={() => navigate('/login')}>Se connecter</button>
        </div>
    );
};

export default Accueil;
