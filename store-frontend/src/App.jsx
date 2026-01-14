import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Checkout from './pages/Checkout';
import CustomDesign from './pages/CustomDesign';
import Home from './pages/Home';
import Product from './pages/Product';
import Shop from './pages/Shop';

function App() {
  return (
    <div className="App">
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/custom" element={<CustomDesign />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Checkout />} /> {/* Redirect Cart icon to Checkout for simplicity as per MVP */}
          </Routes>
        </Router>
      </CartProvider>
    </div>
  );
}

export default App;
