
import './App.css';
import React from 'react';
import Login from './components/login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './components/signup';
import VerifyCode from './components/verifycode';
import Home from './components/home';
import Group from './components/group';
import Settlements from './components/settlement';

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
     </Routes>
   </Router>
  );
}

export default App;
