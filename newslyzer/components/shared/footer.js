import React from 'react';
import { InstagramIcon, LinkedInIcon } from '@/utils/icons';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="py-10 bg-primary-bg text-white">
      <div className="flex justify-evenly items-start">
        <div>
          <div className="text-hero-bg">Company</div>
          <div>About</div>
          <div>Team</div>
          <div>Jobs</div>
        </div>
        <div>
          <div className="text-hero-bg">Product</div>
          <div>Features</div>
          <div>Pricing</div>
          <div>Updates</div>
        </div>
        <div>
          <div className="text-hero-bg">Help</div>
          <div>Support</div>
          <div>Contact</div>
          <div>FAQs</div>
        </div>
      </div>
      <div className="flex justify-between items-center px-44 my-10">
        <div>© {currentYear} Newslyzer - Truth over bias</div>
        <div className="flex justify-center items-center space-x-3">
          <figure className="text-white text-2xl">
            <InstagramIcon />
          </figure>
          <figure className="text-white text-2xl">
            <LinkedInIcon />
          </figure>
        </div>
      </div>
    </div>
  );
};

export default Footer;
