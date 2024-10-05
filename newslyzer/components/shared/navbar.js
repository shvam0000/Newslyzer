import Image from 'next/image';
import Shapes from './Shapes.png';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function NavBar() {
  return (
    <nav>
      <div
        className={`bg-hero-bg flex justify-between items-center px-44 pt-10 ${spaceGrotesk.className} text-xl font-semibold`}>
        <div>Home</div>
        <figure>
          <Image src={Shapes} alt="Shapes" height={100} width={20} />
        </figure>
        <div>Login</div>
      </div>
    </nav>
  );
}
