"use client"

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithEmailAndPassword } from '../services/auth';
import api from "../services/api/api";

export default function Register() {

  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null);
  const [formValue, setFormValue] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState();

  const postRegister = () => {
    fetch('/register')
      .then(res => res.json())
      .then(res => setFormValue(res))
  }


  const handelChange = (e) => {
    const { name, value } = e.target
    setFormValue(prev => {
      return { ...prev, [name]: value }
    })
  }

  const handelRoleSelect = (role) => {
    setSelectedRole(role)
    setFormValue(prev => {
      return { ...prev, role: role }
    })
  }

  const handelSubmit = (e) => {
    e.preventDefault();

    // Vérification des champs
    if (!formValue.name ||
      !formValue.email ||
      !formValue.password ||
      !formValue.role) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    registerWithEmailAndPassword(formValue.name, formValue.email, formValue.password)
      .then(async ({ user, idToken }) => {
        await api.post('/register', {
          name: formValue.name,
          email: formValue.email,
          role: formValue.role
        }, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        navigate('/login');
      })
      .catch(error => {
        setError(error.message);
      });


    setError('');
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="border-2 border-gray-200 rounded-lg p-8 flex flex-col w-full max-w-md bg-white shadow-sm">
        {/* Logo/Titre */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-blue-600">Humain+</span>
          <p className="text-sm text-gray-500 mt-1">Plateforme de recrutement intelligent</p>
        </div>

        {/* Affichage de l'erreur */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          {/* Sélection Recruteur/Candidat */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => handelRoleSelect('recruiter')}
              className={`
                flex-1 py-2 px-4 border rounded-md font-medium cursor-pointer
                ${selectedRole === 'recruiter'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
              `}
            >
              Recruteur
            </button>
            <button
              type="button"
              onClick={() => handelRoleSelect('candidate')}
              className={`
                flex-1 py-2 px-4 border rounded-md font-medium cursor-pointer
                ${selectedRole === 'candidate'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
              `}
            >
              Candidat
            </button>
          </div>

          {/* Champ Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"  // Added name attribute
              placeholder="username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formValue.name}
              onChange={handelChange}
            />
          </div>

          {/* Champ Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"  // Added name attribute
              placeholder="votre@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formValue.email}
              onChange={handelChange}
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"  // Added name attribute
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formValue.password}
              onChange={handelChange}
            />
          </div>

          {/* Bouton de connexion */}
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4 cursor-pointer"
            onClick={handelSubmit}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}