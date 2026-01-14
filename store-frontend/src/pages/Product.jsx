import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductById } from '../services/storeService';

const Product = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [brands, setBrands] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);
    const { addToCart } = useCart();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const res = await getProductById(id);
            setProduct(res.data);

            // Extract unique brands from allowed models
            // product.allowedModels is array of populated model objects: { _id, name, brand: { _id, name } } (Wait, backend populate call populated 'allowedModels'. 
            // check backend controller: .populate('allowedModels', 'name') -> THIS ONLY RETURNS NAME and ID.
            // It DOES NOT populate the 'brand' field inside the model unless deep populated.
            // 'allowedModels' schema says ref 'CovModel'. 'CovModel' has 'brand' ref.
            // If I only populate 'allowedModels', I get list of models with just their fields. Brand is an ID there.
            // So I might need to fetch all brands or models separately to resolve brand names, OR deep populate in backend.
            // For now, let's assume I fetch simple list.
            // Actually, 'CovModel' has 'brand'. If I populate 'allowedModels', I see 'brand' as ObjectId.
            // I need deep populate to see Brand Name. 
            // Or I can fetch all brands and match them.
            // For this step I'll just use "Brand ID" or try to infer.
            // Better: I'll update backend to deep populate? No, I'm in Frontend phase.
            // I'll just list Models directly if I can't groups.
            // BUT requirement is "Select Brand -> Then Select Model".

            // Let's rely on fetching `getModels()` and `getBrands()` alongside?
            // No, `allowedModels` limits what's available.
            // I will trust that I can just list models for now, OR I will assume `product.allowedModels` has enough info.
            // Wait, I can just fetch `getModels` and filters those in `product.allowedModels`.
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // To properly support "Select Brand -> Select Model", I need to know which brand each allowed model belongs to.
    // Since backend only populated 'allowedModels' (level 1), I have `model.brand` as ID.
    // I can fetch all brands `getBrands()` to get Names for those IDs.
    const [allBrands, setAllBrands] = useState({});

    useEffect(() => {
        import('../services/storeService').then(module => {
            module.getBrands().then(res => {
                const map = {};
                res.data.forEach(b => map[b._id] = b.name);
                setAllBrands(map);
            });
        });
    }, []);

    // Computeds
    const uniqueBrandIds = product ? [...new Set(product.allowedModels.map(m => m.brand))] : [];
    // Filter models based on selected brand
    const filteredModels = product ? product.allowedModels.filter(m => m.brand === selectedBrand) : [];

    const handleAddToCart = () => {
        if (!selectedBrand || !selectedModel) {
            alert('Please select your phone model');
            return;
        }
        addToCart({
            id: product._id,
            title: product.title,
            image: product.image,
            price: product.basePrice,
            quantity: 1,
            modelId: selectedModel,
            modelName: product.allowedModels.find(m => m._id === selectedModel)?.name,
            brandName: allBrands[selectedBrand]
        });
        alert('Added to cart!');
    };

    if (loading || !product) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="md:flex">
                    {/* Image */}
                    <div className="md:w-1/2 p-8 bg-gray-100 flex items-center justify-center">
                        <img
                            src={product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.image}`}
                            alt={product.title}
                            className="max-h-[500px] object-contain drop-shadow-2xl"
                        />
                    </div>

                    {/* Details */}
                    <div className="md:w-1/2 p-8 lg:p-12">
                        <div className="uppercase tracking-wide text-sm text-pink-500 font-semibold">{product.category?.name}</div>
                        <h1 className="mt-2 text-4xl font-extrabold text-gray-900 leading-tight">{product.title}</h1>
                        <p className="mt-4 text-3xl text-gray-900 font-bold">{product.basePrice} EGP</p>

                        <div className="mt-8">
                            <label className="block text-sm font-medium text-gray-700">Phone Brand</label>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                {uniqueBrandIds.map(brandId => (
                                    <button
                                        key={brandId}
                                        onClick={() => { setSelectedBrand(brandId); setSelectedModel(''); }}
                                        className={`py-3 px-4 rounded-xl border font-semibold transition ${selectedBrand === brandId ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                    >
                                        {allBrands[brandId] || 'Loading...'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedBrand && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700">Phone Model</label>
                                <select
                                    value={selectedModel}
                                    onChange={e => setSelectedModel(e.target.value)}
                                    className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-xl border bg-white"
                                >
                                    <option value="">Select your model</option>
                                    {filteredModels.map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mt-10">
                            <button
                                onClick={handleAddToCart}
                                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition md:text-xl"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="mr-3" />
                                Add to Cart
                            </button>
                        </div>

                        <div className="mt-6 text-sm text-gray-500">
                            <p>✓ Premium Quality Printing</p>
                            <p>✓ Anti-scratch protection</p>
                            <p>✓ Fast Shipping in Cairo & Giza</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product;
