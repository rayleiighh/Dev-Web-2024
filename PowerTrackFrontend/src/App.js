import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Accueil from './Accueil';
import Inscription from './Inscription';
import Login from './Login';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import Dashboard from './Dashboard';

const MainContent = () => {
    

    return (
        <div className="app-container">
            
            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/inscription" element={<Inscription />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
};

const App = () => {
    return <MainContent />;
};

export default App;
