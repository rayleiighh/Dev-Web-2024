import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const Inscription = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        // Vérification des champs
        if (!username || !email || !password || !confirmPassword) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        // Vérification du mot de passe
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true); // Active le chargement
        setError(""); // Réinitialise les erreurs précédentes

        try {
            const response = await fetch("http://localhost:5000/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Une erreur est survenue");
            }

            console.log("✅ Inscription réussie :", data);

            alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
            navigate("/login"); // Redirige vers la page de connexion

        } catch (error) {
            console.error("❌ Erreur lors de l'inscription :", error);
            setError(error.message);
        } finally {
            setLoading(false); // Désactive le chargement
        }
    };

    // Réinitialise l'erreur lorsque l'utilisateur commence à taper
    const handleChange = (setter) => (e) => {
        setter(e.target.value);
        setError(""); // Efface l'erreur lorsqu'on commence à taper
    };

    return (
        <div className="register-container">
            <FaArrowLeft className="back-arrow" onClick={() => navigate('/')} />
            <h1>PowerTrack ⚡</h1>
            <h2>Créez votre compte :</h2>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleRegister}>
                <input 
                    type="text" 
                    placeholder="Nom d'utilisateur" 
                    value={username} 
                    onChange={handleChange(setUsername)} 
                    className="input-field"
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={handleChange(setEmail)} 
                    className="input-field"
                />
                <input 
                    type="password" 
                    placeholder="Mot de passe" 
                    value={password} 
                    onChange={handleChange(setPassword)} 
                    className="input-field"
                />
                <input 
                    type="password" 
                    placeholder="Confirmer le mot de passe" 
                    value={confirmPassword} 
                    onChange={handleChange(setConfirmPassword)} 
                    className="input-field"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Création en cours..." : "Créer un compte"}
                </button>
            </form>

            <button className="secondary" onClick={() => navigate('/login')}>
                Déjà un compte ? Se connecter
            </button>
        </div>
    );
};

export default Inscription;
