
import './App.css';
import { CartProvider } from './context/CartContext';

import Store from './screens/Store';
import Cart from './components/Cart';
import { Checkout } from './screens/Checkout';

function App() {
  
  return (
    <div className="App">
      <CartProvider>
        <Store/>
        <Cart/>
        <Checkout />
      </CartProvider>
    </div>
  );
}

export default App;
