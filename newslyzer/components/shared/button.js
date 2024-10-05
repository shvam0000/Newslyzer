import React from 'react';

const Button = ({ text, onMouseDown, type, className }) => {
  return (
    <button
      className={`${className} bg-hero-bg text-white px-2 py-1 rounded-md`}>
      {text}
    </button>
  );
};

export default Button;
