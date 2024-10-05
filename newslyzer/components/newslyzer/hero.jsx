import React, { useState } from 'react';
import { Space_Grotesk } from 'next/font/google';
import Button from '../shared/button'; // Assuming you have a shared button component

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const NewsLyzerHero = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle the search logic here
    console.log('Search Query:', searchQuery);
  };

  return (
    <div className="min-h-screen">
      {/* Search Section */}
      <div className="flex flex-col flex-wrap items-center mt-20">
        <h1 className={`text-5xl mb-8 font-bold ${spaceGrotesk.className}`}>
          Find the News You Need
        </h1>

        <form
          onSubmit={handleSearch}
          className="flex items-center space-x-4 w-1/2">
          <input
            type="text"
            placeholder="Search for articles, news, or topics..."
            className="w-full p-4 rounded-lg text-black focus:outline-none text-lg border border-primary-bg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            text="Search"
            className="bg-hero-bg text-white px-4 py-2 rounded-lg"
          />
        </form>
      </div>
    </div>
  );
};

export default NewsLyzerHero;
