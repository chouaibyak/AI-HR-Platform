import React, { useEffect, useState } from 'react'
import { auth } from "@/app/firebase";
import api from "@/app/services/api/api";



export default function () {

  const [profil, setProfil] = useState(null)
  const [updatevalue, setUpdateValue] = useState({
    name: '',
    role: '',
    email: ''
  })



  const getUserProfil = async () => {
    const user = auth.currentUser
    const res = await api.get('/me')
    setProfil(res.data)
    setUpdateValue({
      name: res.data.name || '',
      role: res.data.role || '',
      email: res.data.email || ''
    })
  }

  useEffect(() => {
    getUserProfil()
  }, [])

  const handelChange = (e) => {
    const { name, value } = e.target
    setUpdateValue((prev) => (
      { ...prev, [name]: value }
    ))
  }

  const handelSubmit = async (e) => {
    e.preventDefault()
    const res = await api.put('/update-profile', updatevalue, {
      headers: {
        Authorization: `Bearer ${auth.currentUser?.accessToken}`,
      },
    })
    alert('Profile updated successfully!')
  }

  return (
    <div className='shadow-lg mt-20 mx-x max-w-5xl w-full h-auto border border-gray-200 rounded-xl p-10 bg-white'>
      <div className='mb-6'>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Mon Profil</h1>
        <p className='text-gray-500 text-sm'>
          Mettez à jour vos informations personnelles pour garder votre profil à jour.
        </p>
      </div>

      <form className="w-full" onSubmit={handelSubmit}>
        <table className="w-full table-fixed border-separate border-spacing-y-6">
          <tbody>
            <tr>
              <td className="w-1/4 text-gray-700 font-medium align-top">Full Name</td>
              <td>
                <input
                  type="text"
                  name="name"
                  value={updatevalue.name}
                  onChange={handelChange}
                  className="w-full border-b border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-600 transition"
                />
              </td>
            </tr>

            <tr>
              <td className="text-gray-700 font-medium align-top">Role</td>
              <td>
                <input
                  type="text"
                  name="role"
                  value={updatevalue.role}
                  onChange={handelChange}
                  className="w-full border-b border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-600 transition"
                />
              </td>
            </tr>

            <tr>
              <td className="text-gray-700 font-medium align-top">Email</td>
              <td>
                <input
                  type="email"
                  name="email"
                  value={updatevalue.email}
                  onChange={handelChange}
                  className="w-full border-b border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-600 transition"
                />
              </td>
            </tr>

            <tr>
              <td></td>
              <td className="pt-4 flex gap-4 justify-end">
                <button
                  type="Reset"
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 transition"
                  onClick={() => getUserProfil()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
                >
                  Update
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  )
}
