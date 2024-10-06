import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import React, { useState, useEffect, useRef } from 'react';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { Space_Grotesk } from 'next/font/google';
import Button from '@/components/shared/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(context) {
    const { user } = await getSession(context.req, context.res);

    await dbConnect();

    // Check if user exists in the database
    let existingUser = await User.findOne({ auth0Id: user.sub }).lean();

    // If user does not exist, create a new record
    if (!existingUser) {
      existingUser = new User({
        auth0Id: user.sub,
        name: user.name,
        email: user.email,
        picture: user.picture,
        article: user.savedArticles,
      });
      await existingUser.save();

      // Convert the new user document to a plain object
      existingUser = existingUser.toObject();
    }

    // Convert MongoDB ObjectId `_id` to string to avoid serialization issues
    existingUser._id = existingUser._id.toString();

    // Convert Date objects to strings for serialization
    if (existingUser.createdAt) {
      existingUser.createdAt = existingUser.createdAt.toISOString();
    }

    // Pass the user profile data to the page component
    return { props: { user: existingUser } };
  },
});

export default function Profile({ user }) {
  const useOnScreen = (ref) => {
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => setIntersecting(entry.isIntersecting),
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current); // Make sure ref.current is not null
        }
      };
    }, [ref]);

    return isIntersecting;
  };

  const FadeInSection = ({ children }) => {
    const ref = useRef();
    const isVisible = useOnScreen(ref);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 50 }}
        transition={{ duration: 0.8 }}>
        {children}
      </motion.div>
    );
  };

  return (
    <div
      className={`h-screen bg-hero-bg text-white py-20 space-y-8 px-44 ${spaceGrotesk.className}`}>
      <FadeInSection>
        <h1 className="text-4xl font-bold">Welcome, {user.name}</h1>
      </FadeInSection>
      <div>
        <FadeInSection>
          <div className="text-xl font-semibold">Your Saved Articles</div>
        </FadeInSection>
        <div className="grid grid-cols-3">
          {user.savedArticles.map((article) => (
            <FadeInSection>
              <div
                className="border border-white mx-1 p-2 my-5"
                key={article.id}>
                <h1 className="text-primary-bg font-bold text-xl">
                  {article.title}
                </h1>
                <p className="text-justify">
                  {article.content.substring(0, 300)}...
                </p>
                <Link href={article.url}>
                  <Button className="bg-primary-bg mt-2" text="Read More" />
                </Link>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </div>
  );
}
