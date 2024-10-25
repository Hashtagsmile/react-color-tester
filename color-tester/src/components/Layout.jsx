import React from 'react';
import Header from './Header/Header'
import Footer from './Footer';
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className='content'>{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
