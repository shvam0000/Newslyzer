import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { Space_Grotesk } from 'next/font/google';
import Button from '@/components/shared/button';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(context) {
    const { user } = await getSession(context.req, context.res);

    // Connect to MongoDB
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

const savedArticles = [
  {
    id: '1',
    title: 'This is first post',
    content:
      'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,',
  },
  {
    id: '2',
    title: 'This is first post',
    content:
      'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,',
  },
  {
    id: '3',
    title: 'This is first post',
    content:
      'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,',
  },
];

export default function Profile({ user }) {
  return (
    <div
      className={`h-screen bg-hero-bg text-white py-20 space-y-8 px-44 ${spaceGrotesk.className}`}>
      <h1 className="text-4xl font-bold">Welcome, {user.name}</h1>
      <div>
        <div className="text-xl font-semibold">Your Saved Articles</div>
        <div className="grid grid-cols-3">
          {savedArticles.map((article) => (
            <div className="border border-white mx-1 p-2 my-5" key={article.id}>
              <h1 className="text-primary-bg font-bold text-xl">
                {article.title}
              </h1>
              <p className="text-justify">
                {article.content.substring(0, 300)}...
              </p>
              <Link href={`/profile/articles/${article.id}`}>
                <Button className="bg-primary-bg mt-2" text="Read More" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
