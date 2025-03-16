import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import "@testing-library/jest-dom/extend-expect";
// Mock components to avoid rendering their actual logic
jest.mock('../components/login', () => () => <div>Login Component</div>);
jest.mock('../components/signup', () => () => <div>Signup Component</div>);
jest.mock('../components/verifycode', () => () => <div>VerifyCode Component</div>);
jest.mock('../components/home', () => () => <div>Home Component</div>);
jest.mock('../components/group', () => () => <div>Group Component</div>);
jest.mock('../components/settlement', () => () => <div>Settlements Component</div>);
jest.mock('../components/expense', () => () => <div>Expense Component</div>);

describe('App Component', () => {
  test('renders Login component for the root route', () => {
    render(<App />);
    expect(screen.getByText('Login Component')).toBeInTheDocument();
  });

  test('renders Signup component for the /signup route', () => {
    window.history.pushState({}, '', '/signup');
    render(<App />);
    expect(screen.getByText('Signup Component')).toBeInTheDocument();
  });

  test('renders VerifyCode component for the /verifycode route', () => {
    window.history.pushState({}, '', '/verifycode');
    render(<App />);
    expect(screen.getByText('VerifyCode Component')).toBeInTheDocument();
  });

  test('renders Home component for the /home route', () => {
    window.history.pushState({}, '', '/home');
    render(<App />);
    expect(screen.getByText('Home Component')).toBeInTheDocument();
  });

  test('renders Group component for the /groups/:groupId route', () => {
    window.history.pushState({}, '', '/groups/123');
    render(<App />);
    expect(screen.getByText('Group Component')).toBeInTheDocument();
  });

  test('renders Settlements component for the /settlements/:username route', () => {
    window.history.pushState({}, '', '/settlements/testuser');
    render(<App />);
    expect(screen.getByText('Settlements Component')).toBeInTheDocument();
    
  });

  test('renders Expense component for the /expense/:groupId route', () => {
    window.history.pushState({}, '', '/expense/14');
    render(<App />);
    expect(screen.getByText('Expense Component')).toBeInTheDocument();
  });

  test('renders Resend code component for the /resend/', () => {
    window.history.pushState({}, '', '/resend/');
    render(<App />);
    expect(screen.getByText('Resend Verification Code')), toBeInTheDocument();
  });
});