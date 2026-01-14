import { faSearch, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/storeService';

const Home = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        getCategories().then(res => setCategories(res.data)).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">
                            COVERATY
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/custom" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition">
                                Custom Design
                            </Link>
                            <button className="text-gray-500 hover:text-gray-800">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                            <Link to="/cart" className="relative text-gray-500 hover:text-gray-800">
                                <FontAwesomeIcon icon={faShoppingBag} />
                                {/* Badge example */}
                                {/* <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span> */}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
                        Express Yourself w/ <br />
                        <span className="text-pink-300">Premium Covers</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100">
                        Choose from thousands of exclusive designs or create your own custom masterpiece.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link to="/custom" className="px-8 py-3 rounded-full bg-pink-500 text-white font-bold shadow-lg hover:bg-pink-600 transition transform hover:-translate-y-1">
                            Create Custom
                        </Link>
                        <a href="#categories" className="px-8 py-3 rounded-full bg-white text-indigo-600 font-bold shadow-lg hover:bg-gray-50 transition transform hover:-translate-y-1">
                            Browse Designs
                        </a>
                    </div>
                </div>

                {/* Abstract shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>
            </div>

            {/* Categories Grid */}
            <div id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {categories.map(cat => (
                        <Link to={`/products?category=${cat._id}`} key={cat._id} className="group cursor-pointer">
                            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                                {cat.coverImage ? (
                                    <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                    <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; 2026 Coveraty Store. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
