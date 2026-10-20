import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mascot } from '../components/ui.jsx';
import { pageMotion } from '../lib/motion.js';

export default function NotFoundPage() {
  return (
    <motion.div {...pageMotion} className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center">
        <Mascot size={130} mood="sad" />
        <p className="mt-6 text-7xl font-extrabold text-primary">404</p>
        <h1 className="mt-2 text-2xl">This page wandered off</h1>
        <p className="mt-2 max-w-sm text-slate">We couldn't find what you were looking for. Let's get you back on track.</p>
        <Link to="/" className="btn btn-primary mt-6">Take me home</Link>
      </div>
    </motion.div>
  );
}
