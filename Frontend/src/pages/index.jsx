import Layout from "./Layout.jsx";

import Home from "./Home";

import Pricing from "./Pricing";

import Legal from "./Legal";

import Contact from "./Contact";

import Admin from "./Admin";

import Account from "./Account";

import Checkout from "./Checkout";

import HowItWorks from "./HowItWorks";

import Documentation from "./Documentation";

import Status from "./Status";

import Login from "./Login";

import Register from "./Register";

import ResetPassword from "./ResetPassword";

import RefundPolicy from "./RefundPolicy";
import Success from "./Success";
import Fail from "./Fail";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFail from "./PaymentFail";

import { UserProfile } from "../components/UserProfile";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Pricing: Pricing,
    
    Legal: Legal,
    
    Contact: Contact,
    
    Admin: Admin,
    
    Account: Account,
    
    checkout: Checkout,
    
    HowItWorks: HowItWorks,
    
    Documentation: Documentation,
    
    Status: Status,
    
    Login: Login,

    Register: Register,

    ResetPassword: ResetPassword,

    RefundPolicy: RefundPolicy,
    Success: Success,
    Fail: Fail,
    
    UserProfile: UserProfile,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                

                <Route path="/Home" element={<Home />} />

                <Route path="/Pricing" element={<Pricing />} />

                <Route path="/Legal" element={<Legal />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/checkout" element={<Checkout />} />
                
                <Route path="/HowItWorks" element={<HowItWorks />} />
                
                <Route path="/Documentation" element={<Documentation />} />
                
                <Route path="/Status" element={<Status />} />
                
                <Route path="/Login" element={<Login />} />

                <Route path="/Register" element={<Register />} />

                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/RefundPolicy" element={<RefundPolicy />} />
                <Route path="/success" element={<Success />} />
                <Route path="/fail" element={<Fail />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />

                <Route path="/profile" element={<UserProfile />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
