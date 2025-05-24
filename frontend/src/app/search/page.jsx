'use client'; // Required for using hooks like useSearchParams

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // Correct hook for Next.js App Router
import MainNavbar from '@/app/components/MainNavbar'; // Assuming you want the navbar on this page too

// You might need to pass appropriate props for ProfileMenuComponent and NotificationComponent
// if they are required by MainNavbar and you want them on the search page.
// For simplicity, this example might omit them or pass null if MainNavbar handles it gracefully.

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = searchParams.get('q');
    setSearchTerm(query || '');
    if (query) {
      // Here you would typically fetch search results from your API
      // For example: fetch(`/api/search?q=${encodeURIComponent(query)}`)
      //   .then(res => res.json())
      //   .then(data => {
      //     setResults(data.results);
      //     setLoading(false);
      //   })
      //   .catch(error => {
      //     console.error("Error fetching search results:", error);
      //     setLoading(false);
      //   });
      console.log(`Fetching results for: ${query}`);
      // Placeholder:
      setResults([
        { id: 1, title: `Result 1 for "${query}"`, description: "This is a sample search result." },
        { id: 2, title: `Result 2 for "${query}"`, description: "Another sample item found." },
      ]);
      setLoading(false);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 
        Adjust MainNavbar props as needed. 
        You might want a different title or simplified navbar for search results.
        If ProfileMenuComponent and NotificationComponent are specific to dashboards,
        you might pass null or alternative components here.
      */}
      <MainNavbar
        pageTitle="Résultats de recherche"
        // Example: Pass null if dashboard-specific components aren't relevant here
        ProfileMenuComponent={null}
        NotificationComponent={null}
      // onToggleSidebar might not be relevant here if there's no sidebar
      />
      <main className="flex-grow p-6 mt-16"> {/* mt-16 for fixed navbar height */}
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Résultats de recherche pour : <span className="text-blue-600">{searchTerm}</span>
          </h1>
          {loading && <p>Chargement des résultats...</p>}
          {!loading && results.length === 0 && searchTerm && (
            <p>Aucun résultat trouvé pour "{searchTerm}".</p>
          )}
          {!loading && results.length === 0 && !searchTerm && (
            <p>Veuillez entrer un terme de recherche.</p>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map(result => (
                <div key={result.id} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-blue-700">{result.title}</h2>
                  <p className="text-gray-600">{result.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* You can add a footer here if needed */}
    </div>
  );
}