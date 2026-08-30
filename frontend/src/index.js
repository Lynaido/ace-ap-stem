import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/nunito-sans';
import './index.css';
import 'katex/dist/katex.min.css';
import App from './App';
import './styles/ace-overrides.css';
import reportWebVitals from './reportWebVitals';

document.documentElement.style.setProperty(
  '--ace-sprite-image',
  "url('/images/ace-sprite-v2.png')"
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
