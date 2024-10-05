import { useRouter } from 'next/router';
import { Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import Button from '@/components/shared/button';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

// Dummy articles data
const articles = [
  {
    id: '1',
    title: 'This is first post',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam.',
  },
  {
    id: '2',
    title: 'This is second post',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam.',
  },
  {
    id: '3',
    title: 'This is third post',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam.',
  },
];

export default function Article() {
  const router = useRouter();
  const { id } = router.query;
  console.log('id', id);

  const article = articles.find((article) => article.id === id);

  if (!article) {
    return <div>Article not found!</div>;
  }

  return (
    <div
      className={`h-screen text-primary-bg py-20 px-44 ${spaceGrotesk.className}`}>
      <h1 className="text-4xl font-bold">{article.title}</h1>
      <p className="text-justify mt-4">{article.content}</p>
      <Link href="/">
        <Button className="bg-primary-bg mt-5" text="Back to Profile" />
      </Link>
    </div>
  );
}
