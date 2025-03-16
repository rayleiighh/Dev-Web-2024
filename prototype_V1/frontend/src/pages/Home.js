import React from 'react';

const Home = () => {
    return (
        <div style={styles.container}>
            <h1>Bienvenue sur le Suivi de Consommation Électrique ⚡</h1>
            <p>Cette application vous permet de suivre en temps réel la consommation électrique de vos appareils connectés.</p>
            <p>Consultez les mesures enregistrées et analysez vos habitudes de consommation.</p>
        </div>
    );
};

const styles = {
    container: {
        textAlign: 'center',
        padding: '40px'
    }
};

export default Home;
