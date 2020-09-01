import React from 'react';
import { styles } from './styles.scss';

const LoadingScreen = ({ children }) => (
  <div className={styles.background}>
    <div className={styles.logo}>
      <img src="https://res.cloudinary.com/enlite/image/upload/v1598967817/images/logo-loading_bzoegg.svg" alt="Enlite" />
      <h1>Enlite</h1>
    </div>
    <div className={styles.spinner}>
      <div className={styles.bounce1} />
      <div className={styles.bounce2} />
      <div />
    </div>
    <div className={styles.message}>
      {children}
    </div>
  </div>
);

export default LoadingScreen;
