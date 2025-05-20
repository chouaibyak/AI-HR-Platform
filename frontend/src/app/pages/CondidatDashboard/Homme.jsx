import api from '@/app/services/api/api';
import React, { useState, useEffect } from 'react';

export default function HommeCandidat() {
  const [userinfo, setUserInfo] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  const getUserInfo = async () => {
    const res = await api.get('/me');
    setUserInfo(res.data);
  };

  const fetchRecommendedJobs = async () => {
    const res = await api.get('/jobs/recommended');
    setRecommendedJobs(res.data);
  };

  useEffect(() => {
    getUserInfo();
    fetchRecommendedJobs();
  }, []);

  return (
    <div className='flex flex-col h-full p-5'>
      <div className='flex-1 overflow-auto'>
        <div className='text-center'>
          <h1 className='text-5xl font-bold text-gray-900 py-15'>
            Welcome {userinfo?.name}
          </h1>
          <p className='text-lg text-gray-600 font-medium max-w-3xl mx-auto'>
            Your job search assistant powered by AI: Upload your CV, get automatic analysis, and receive personalized job offers.
          </p>
        </div>

        {/* CV Upload and Analysis Section */}
        <div className='w-full flex flex-col items-center space-y-10 mt-10'>
          <div className='bg-white p-8 shadow-xl rounded-2xl w-full max-w-xl text-center'>
            <h3 className='text-xl font-semibold text-gray-800 mb-4'>Upload Your CV</h3>
            <button className='bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300'>
              Upload CV
            </button>
            <p className='text-gray-500 text-sm mt-2'>
              Your CV will be analyzed using AI to identify your key skills.
            </p>
          </div>

          {/* Recommended Jobs Section */}
          <div className='w-full max-w-4xl mt-10'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>Recommended Jobs for You</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {recommendedJobs.length > 0 ? (
                recommendedJobs.map((job, index) => (
                  <div key={index} className='bg-white p-6 shadow-md rounded-xl'>
                    <h3 className='text-lg font-semibold text-blue-700'>{job.title}</h3>
                    <p className='text-gray-600 text-sm mt-1'>{job.company}</p>
                    <p className='text-gray-500 text-sm mt-2'>{job.location}</p>
                    <p className='text-gray-500 text-sm mt-2'>Match: {job.matchScore}%</p>
                    <button className='mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm'>
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 text-center col-span-3'>No recommended jobs found yet. Please upload your CV.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
