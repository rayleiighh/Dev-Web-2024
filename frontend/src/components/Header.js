import React from 'react';

const Header = () => {
    return (
        <header style={styles.header}>
            <h1>Suivi de Consommation Électrique ⚡</h1>
            <nav>
                <Link to="/" style={styles.link}>Accueil</Link>
                <Link to="/dashboard" style={styles.link}>Tableau de Bord</Link>
                <Link to="/settings" style={styles.link}>Paramètres</Link>
            </nav>
        </header>
    );
};

const styles = {
    header: {
        backgroundColor: '#282c34',
        padding: '20px',
        textAlign: 'center',
        color: 'white'
    },
    link: {
        color: 'white',
        margin: '0 15px',
        textDecoration: 'none',
        fontSize: '18px'
    }
};

export default Header;
