
import './App.css';
import React from 'react';
import Login from './components/login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './components/signup';
import VerifyCode from './components/verifycode';
import Home from './components/home';
import Group from './components/group';
import Settlements from './components/settlements';
import Expense from './components/expense';
import Resend from './components/resend';
import ResetPassword from './components/resetpassword';

function App() {
  return (
   <Router>
     <Routes>
       <Route path="/" exact element={<Login />} />
       <Route path="/signup" element={<Signup />} />
       <Route path="/verifycode" element={<VerifyCode />} />
       <Route path = "/home" element ={<Home />} />
       <Route path="/groups/:groupId" element={<Group />} />
       <Route path="/settlements/:username" element={<Settlements />} />
       <Route path="/expense/:groupId" element={<Expense />} />
       <Route path="/resend" element={<Resend />} />
       <Route path="/reset_password" element={<ResetPassword />} />
       <Route path="/reset_password/:token" element={<ResetPassword />} />

     </Routes>
   </Router>
  );
}

export default App;
