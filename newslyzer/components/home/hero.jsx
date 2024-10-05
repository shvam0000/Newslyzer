import React from 'react';
import Image from 'next/image';
import { Silkscreen } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import HeroImg from './home-hero.png';
import IndepthOne from './indepeth1.png';
import Building from './building.png';
import Button from '../shared/button';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const HomeHero = () => {
  return (
    <div>
      <div className="flex justify-center items-center bg-hero-bg h-screen text-black">
        <div
          className={`${spaceGrotesk.className} w-1/2 mx-auto text-center text-7xl font-semibold`}>
          Unbiasing <br /> the News <br /> with Data
        </div>
        <figure className="w-1/2 mx-auto">
          <Image src={HeroImg} alt="Hero Image" width={400} height={100} />
        </figure>
      </div>
      <div className="h-screen bg-newslyzer-blue">
        <div className="flex justify-center items-center  h-screen text-black">
          <div className={`w-1/2 mx-auto text-center`}>
            <div className={`uppercase ${silkscreen.className} text-7xl `}>
              Analyse!
            </div>
            <div className={`${spaceGrotesk.className} text-xl px-32 py-5`}>
              Ever wondered if there&apos;s a way to filter out the noise, bias
              and nonsense from the news? That&apos;s where we come in. Unmask
              the truth with us.
            </div>
            <button className="bg-hero-bg text-white px-2 py-1 rounded-md w-1/2">
              ANALYSE NOW
            </button>
          </div>
          <figure className="w-1/2 mx-auto text-center">
            <Image src={Building} alt="Hero Image" width={400} height={100} />
          </figure>
        </div>
      </div>
      <div className="h-screen bg-cover bg-center bg-no-repeat bg-hero-image text-white flex justify-center items-center text-7xl">
        Let's Start with the Facts.
      </div>
      <div className="bg-primary-bg text-white h-64 py-20 pb-20">
        <h1
          className={` ${silkscreen.className} text-3xl flex justify-center my-2`}>
          Stay Alert
        </h1>
        <p
          className={`flex justify-center ${spaceGrotesk.className} text-xl my-4`}>
          Want the best from the news analysis world? Sign up and get truth
          delivered to your inbox.
        </p>
        <form className="flex justify-center space-x-2 my-2">
          <input
            type="email"
            className="bg-white text-black focus:outline-none p-1 placeholder-gray-300 rounded-md "
            placeholder="Email Address"
          />
          <Button text="Sign Up" />
        </form>
      </div>
      <div className="h-screen bg-primary-bg">
        <div className="flex justify-center items-center  h-screen text-black">
          <div className={`w-1/2 mx-auto text-center text-hero-bg px-6`}>
            <div
              className={`uppercase ${spaceGrotesk.className} text-6xl text-hero-bg px-6`}>
              In-depth Analysis that You Can Actually Trust
            </div>
            <div className={`${spaceGrotesk.className} text-xl px-32 py-5`}>
              Instead of a million voices screaming, get one calm whisper
              guiding you to truth. Our models serve you facts, not conjecture.
            </div>
          </div>
          <figure className="w-1/2 mx-auto text-center">
            <Image src={IndepthOne} alt="Hero Image" width={400} height={100} />
          </figure>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
