import React from 'react';

const MesureList = ({ mesures }) => {
    return (
        <div style={styles.container}>
            <h3>Liste des Mesures</h3>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Appareil</th>
                        <th style={styles.th}>Consommation (W)</th>
                        <th style={styles.th}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {mesures.length > 0 ? (
                        mesures.map((mesure) => (
                            <tr key={mesure._id}>
                                <td style={styles.td}>{mesure.appareil}</td>
                                <td style={styles.td}>{mesure.consommation} W</td>
                                <td style={styles.td}>{new Date(mesure.date).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={styles.emptyRow}>Aucune donnée disponible</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        textAlign: 'center'
    },
    table: {
        width: '80%',
        margin: 'auto',
        borderCollapse: 'collapse'
    },
    th: {
        backgroundColor: '#282c34',
        color: 'white',
        padding: '10px',
        border: '1px solid black'
    },
    td: {
        padding: '10px',
        border: '1px solid black'
    },
    emptyRow: {
        textAlign: 'center',
        padding: '10px'
    }
};

export default MesureList;
