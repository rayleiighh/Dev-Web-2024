import React, { useState } from 'react';

const Settings = () => {
    // État pour stocker la fréquence de mise à jour
    const [updateFrequency, setUpdateFrequency] = useState(5); // Valeur par défaut : 5 min

    // Gestionnaire de changement de fréquence
    const handleFrequencyChange = (event) => {
        setUpdateFrequency(event.target.value);
    };

    return (
        <div style={styles.container}>
            <h2>Paramètres</h2>
            <label style={styles.label}>Fréquence de mise à jour des données (en minutes) :</label>
            <select value={updateFrequency} onChange={handleFrequencyChange} style={styles.select}>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
                <option value="10">10 min</option>
                <option value="30">30 min</option>
            </select>
            <p>Actuellement sélectionné : <strong>{updateFrequency} minutes</strong></p>
        </div>
    );
};

const styles = {
    container: {
        textAlign: 'center',
        padding: '40px'
    },
    label: {
        display: 'block',
        margin: '10px 0',
        fontSize: '16px'
    },
    select: {
        padding: '5px',
        fontSize: '16px'
    }
};

export default Settings;
