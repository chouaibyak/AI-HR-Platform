import React, { useState } from 'react';
import { Mail, Phone, User, MessageSquare } from 'lucide-react';

export default function ContactGuest() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici vous ajouterez la logique pour envoyer les données
    console.log('Formulaire soumis:', formData);
    // Exemple: envoi à une API ou service d'email
    alert('Merci pour votre message! Nous vous contacterons bientôt.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className='mt-20 p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold text-blue-600 mb-6'>Contactez-nous</h1>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='flex items-center border-b border-gray-300 py-2'>
          <User className='text-gray-500 mr-2' />
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            placeholder='Votre nom complet'
            className='flex-1 outline-none'
            required
          />
        </div>

        <div className='flex items-center border-b border-gray-300 py-2'>
          <Mail className='text-gray-500 mr-2' />
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            placeholder='Votre email'
            className='flex-1 outline-none'
            required
          />
        </div>

        <div className='flex items-center border-b border-gray-300 py-2'>
          <Phone className='text-gray-500 mr-2' />
          <input
            type='tel'
            name='phone'
            value={formData.phone}
            onChange={handleChange}
            placeholder='Votre téléphone (optionnel)'
            className='flex-1 outline-none'
          />
        </div>

        <div className='flex items-start border-b border-gray-300 py-2'>
          <MessageSquare className='text-gray-500 mr-2 mt-2' />
          <textarea
            name='message'
            value={formData.message}
            onChange={handleChange}
            placeholder='Votre message'
            rows='4'
            className='flex-1 outline-none resize-none'
            required
          />
        </div>

        <button
          type='submit'
          className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300'
        >
          Envoyer
        </button>
      </form>

      <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-blue-600 mb-2'>Coordonnées</h3>
          <p className='text-gray-600'>Email: contact@humainplus.com</p>
          <p className='text-gray-600'>Téléphone: +212 23 45 67 89</p>
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-blue-600 mb-2'>Horaires</h3>
          <p className='text-gray-600'>Lundi-Vendredi: 9h-18h</p>
          <p className='text-gray-600'>Samedi: 10h-14h</p>
        </div>
      </div>
    </div>
  );
}