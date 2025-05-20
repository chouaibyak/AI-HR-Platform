"use client"

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidatDashboard from './pages/CondidatDashboard/CondidatDashboard';
import RecruteurDashboard from './pages/RecruteurDashboard/RecruteurDashboard';
import ProfilPage from './pages/RecruteurDashboard/ProfilPage';
import SideBarre from './pages/RecruteurDashboard/SideBarre';
import Homme from './pages/RecruteurDashboard/Homme';

export default function Home() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard-candidat" element={<CandidatDashboard />} />
        <Route path="/dashboard-recruteur" element={<RecruteurDashboard />} />
        <Route path='/ProfilPage' element={<ProfilPage />} />
      </Routes>
    </BrowserRouter>


  )
}
