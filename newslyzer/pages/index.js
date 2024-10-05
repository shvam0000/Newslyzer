import React from 'react';
import HomeHero from '../components/home/hero';
import Footer from '@/components/shared/footer';
import NavBar from '@/components/shared/navbar';

const Home = () => {
  return (
    <div>
      <NavBar />
      <HomeHero />
      <Footer />
    </div>
  );
};

export default Home;
