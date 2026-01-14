import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api'; // Use raw api instance for custom upload
import { getBrands, getModels } from '../services/storeService';

const CustomDesign = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        getBrands().then(res => setBrands(res.data));
        getModels().then(res => setModels(res.data));
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation (Size < 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File is too large. Max 5MB.');
                return;
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAddToCart = async () => {
        if (!image || !selectedModel) {
            alert('Please select an image and your phone model.');
            return;
        }

        try {
            setLoading(true);
            // Upload first
            const formData = new FormData();
            formData.append('image', image);
            const uploadRes = await api.post('/custom-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = uploadRes.data.url;

            // Add to Cart
            const brandName = brands.find(b => b._id === selectedBrand)?.name;
            const modelName = models.find(m => m._id === selectedModel)?.name;

            addToCart({
                id: 'custom-' + Date.now(),
                title: 'Custom Design',
                image: imageUrl,
                price: 250, // Fixed price for custom? Prompt says "200" or similar in screenshot
                quantity: 1,
                modelId: selectedModel,
                modelName: modelName + ' (' + brandName + ')',
                brandName: brandName,
                isCustom: true
            });

            alert('Added to Cart!');
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Upload failed.');
        } finally {
            setLoading(false);
        }
    };

    const filteredModels = models.filter(m => m.brand === selectedBrand || m.brand?._id === selectedBrand);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Design Your Own Case</h1>

                <div className="space-y-8">
                    {/* Upload Area */}
                    <div className={`border-4 border-dashed rounded-2xl p-12 text-center transition ${preview ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input type="file" id="custom-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <label htmlFor="custom-upload" className="cursor-pointer block">
                            {preview ? (
                                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                            ) : (
                                <div>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-6xl text-gray-400 mb-4" />
                                    <p className="text-xl font-medium text-gray-600">Click to upload your photo</p>
                                    <p className="text-sm text-gray-400 mt-2">High quality images recommended (Max 5MB)</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Model Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand</label>
                            <select
                                value={selectedBrand}
                                onChange={e => setSelectedBrand(e.target.value)}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500"
                            >
                                <option value="">-- Brand --</option>
                                {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
                            <select
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value)}
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500"
                                disabled={!selectedBrand}
                            >
                                <option value="">-- Model --</option>
                                {filteredModels.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-6 flex justify-between items-center">
                        <div className="text-2xl font-bold">Price: <span className="text-pink-600">250 EGP</span></div>
                        <button
                            onClick={handleAddToCart}
                            disabled={loading}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition transform hover:scale-105"
                        >
                            {loading ? 'Processing...' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomDesign;
