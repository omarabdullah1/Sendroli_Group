import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../services/storeService';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([
                    getProducts(categoryId ? { category: categoryId } : {}),
                    getCategories()
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId]);

    const categoryName = categories.find(c => c._id === categoryId)?.name || 'All Designs';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <Link
                                key={cat._id}
                                to={`/products?category=${cat._id}`}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${categoryId === cat._id ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {cat.name}
                            </Link>
                        ))}
                        {categoryId && (
                            <Link to="/products" className="px-4 py-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 text-sm font-medium">
                                Clear Filter
                            </Link>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {products.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-gray-500">No designs found in this category.</div>
                        ) : (
                            products.map(product => (
                                <Link to={`/product/${product._id}`} key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition transform hover:-translate-y-1 group">
                                    <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                                        <img
                                            src={product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.image}`}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 truncate">{product.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
                                        <div className="mt-3 flex justify-between items-end">
                                            <span className="text-lg font-bold text-pink-600">{product.basePrice} EGP</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;
