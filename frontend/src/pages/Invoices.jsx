import { Routes, Route } from 'react-router-dom';
import InvoiceList from '../components/Invoices/InvoiceList';
import InvoiceForm from '../components/Invoices/InvoiceForm';
import InvoiceDetail from '../components/Invoices/InvoiceDetail';

const Invoices = () => {
  return (
    <div className="invoices-page">
      <Routes>
        <Route path="/" element={<InvoiceList />} />
        <Route path="/new" element={<InvoiceForm />} />
        <Route path="/edit/:id" element={<InvoiceForm />} />
        <Route path="/:id" element={<InvoiceDetail />} />
      </Routes>
    </div>
  );
};

export default Invoices;

