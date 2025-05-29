"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState } from 'react';
import { loginWithEmailAndPassword } from '../services/auth';
import api from '../services/api/api';

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user, idToken } = await loginWithEmailAndPassword(email, password);

      // Requête au backend pour récupérer infos Firestore
      const res = await api.get('/login-info', {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      const userData = res.data;
      setUserInfo(res.data); // données Firestore

      // Redirection selon le rôle
      if (userData.role === 'recruiter') {
        navigate('/dashboard-recruteur');
      } else {
        navigate('/dashboard-candidat');
      }

    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre bleue en haut  */}
      <div className="w-full bg-blue-600 p-4">
        <span className="text-xl font-bold text-white">Humain+</span>
      </div>

      {/* Contenu centré */}
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]"> {/* Ajuste la hauteur pour compenser la barre */}
        <div className="border-2 border-gray-200 rounded-lg p-8 flex flex-col w-full max-w-md bg-white shadow-sm mx-4"> {/* mx-4 pour un peu de marge sur mobile */}
          {/* Logo/Titre  */}
          <div className="text-center mb-6">
            <span className="text-2xl font-bold text-blue-600">Humain+</span>
            <p className="text-sm text-gray-500 mt-1">Plateforme de recrutement intelligent</p>
          </div>

          {/* afficher Error */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              {userInfo && <pre>{JSON.stringify(userInfo, null, 2)}</pre>}
            </div>
          )}

          {/* Formulaire */}
          <div className="space-y-4">
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                placeholder="votre@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/* Bouton de connexion */}
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 cursor-pointer"
              onClick={handleLogin}
            >
              Se connecter
            </button>

            {/* Lien mot de passe oublié */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Pas de compte ?
              <Link to="/Register" className="text-blue-600 hover:text-blue-500 underline">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}