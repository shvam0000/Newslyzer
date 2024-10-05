import React from 'react';
import Image from 'next/image';
import { Space_Grotesk } from 'next/font/google';
import HeroImg from './home-hero.png';
import IndepthOne from './indepeth1.png';
import IndepthTwo from './indepth2.png';
import Building from './building.png';
import Button from '../shared/button';
import Link from 'next/link';
import Shoe from './shoe.png';
import Buil from './buil.png';
import Man from './man.png';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const data = [
  {
    imgUrl: Shoe,
    text: 'Bias Free',
    subText: 'Unmask the news',
    link: '/',
  },
  {
    imgUrl: Man,
    text: 'Facts Only',
    subText: 'No More Confusion',
    link: '/',
  },
  {
    imgUrl: Buil,
    text: 'News Analysis',
    subText: 'Stay aware, Stay Informed',
    link: '/',
  },
];

const HomeHero = () => {
  return (
    <div>
      <div className="flex justify-center items-center bg-hero-bg h-screen text-black">
        <div
          className={`${spaceGrotesk.className} w-1/2 mx-auto text-center text-7xl font-semibold`}>
          Unbiasing <br /> the News <br /> with Data
          <Link href="/newslyzer">
            <button className="bg-primary-bg text-xl block w-fit mx-auto text-white rounded-lg px-2 py-1 mt-1">
              Get Started
            </button>
          </Link>
        </div>
        <figure className="w-1/2 mx-auto">
          <Image src={HeroImg} alt="Hero Image" width={400} height={100} />
        </figure>
      </div>
      <div className="h-screen bg-newslyzer-blue">
        <div className="flex justify-center items-center  h-screen text-black">
          <div className={`w-1/2 mx-auto text-center`}>
            <div className={`uppercase ${spaceGrotesk.className} text-7xl `}>
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
          className={` ${spaceGrotesk.className} text-3xl flex justify-center my-2`}>
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
          <figure className="w-1/2 mx-auto text-center relative">
            <Image src={IndepthOne} alt="Hero Image" width={400} height={100} />
          </figure>
        </div>
      </div>
      <div className="h-screen bg-primary-bg">
        <div className="flex justify-center items-center  h-screen text-black">
          <figure className="mx-auto text-center relative">
            <Image src={IndepthTwo} alt="Hero Image" width={400} height={100} />
          </figure>
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
        </div>
      </div>
      <div className="bg-primary-bg space-y-3 px-10 py-10">
        {data.map((item, index) => (
          <Link href={item.link} key={index}>
            <div className="bg-secpmdary-bg mx-32 flex items-center rounded-md justify-between p-1 my-5">
              <div className="flex items-center space-x-1 text-white">
                <Image
                  src={item.imgUrl}
                  alt="Hero Image"
                  width={100}
                  height={100}
                />
                <div className="pl-20">
                  <p>Bias Free</p>
                  <p>Unmast the news</p>
                </div>
              </div>
              <div className="pr-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                  <path
                    d="M 22.707 16.707 L 12.707 26.707 C 12.317 27.098 11.683 27.098 11.293 26.707 C 10.902 26.317 10.902 25.683 11.293 25.293 L 20.586 16 L 11.293 6.707 C 10.902 6.317 10.902 5.683 11.293 5.293 C 11.683 4.902 12.317 4.902 12.707 5.292 L 22.707 15.293 C 22.895 15.48 23.001 15.735 23.001 16 C 23.001 16.265 22.895 16.52 22.707 16.707 Z"
                    fill="#CAF0F8"></path>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="bg-primary-bg py-20 px-44">
        <p className="text-hero-bg text-4xl">
          Ready to see the real news? Join us in this quest for truth.
        </p>
        <div className="flex items-center my-5 space-x-5">
          <Button text="Sign Up" />
          <Button text="Learn More" className="bg-black" />
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
