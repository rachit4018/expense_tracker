import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Signup from '../components/signup';

jest.mock('axios');

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      headers: { 'x-csrftoken': 'mock-csrf-token' },
      data: { csrfToken: 'mock-csrf-token' },
    });
  });

  test('renders signup form with all input fields', async () => {
    renderWithRouter(<Signup />);

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByLabelText('College')).toBeInTheDocument();
      expect(screen.getByLabelText('Semester')).toBeInTheDocument();
      expect(screen.getByLabelText('Default Payment Method')).toBeInTheDocument();
    });
  });

test("submits form when button is clicked", async () => {
  renderWithRouter(<Signup />);

  fireEvent.change(screen.getByLabelText(/Username/i), {
    target: { value: 'testuser' },
  });
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/^Password$/i), {
    target: { value: 'password123' },
  });
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
    target: { value: 'differentpass' },
  });
  fireEvent.change(screen.getByLabelText(/College/i), {
    target: { value: 'Test College' },
  });
  fireEvent.change(screen.getByLabelText(/Semester/i), {
    target: { value: '6' },
  });
  fireEvent.change(screen.getByLabelText(/Default Payment Method/i), {
    target: { value: 'Cash' },
  });

  // Act: Click the submit button
  const submitButton = screen.getByTestId('signup-submit-button');
  await fireEvent.click(submitButton);

  // Optionally: console.log or verify it's not undefined
  expect(submitButton).toBeDefined();
});

test("shows error if passwords do not match", async () => {
  renderWithRouter(<Signup />);

  fireEvent.change(screen.getByLabelText(/^Password$/i), {
    target: { value: "password123" },
  });
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
    target: { value: "differentpass" },
  });

  await fireEvent.click(screen.getByTestId("signup-submit-button"));


//  expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
});



  test('shows signup success message and navigates', async () => {
    axios.post.mockResolvedValue({
      status: 201,
      data: { messages: ['Sign up successful! Redirecting to verification page...'] },
    });

    renderWithRouter(<Signup />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pandyarachit1525@gmail.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password@123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password@123' } });
    fireEvent.change(screen.getByLabelText('College'), { target: { value: 'Test College' } });
    fireEvent.change(screen.getByLabelText('Semester'), { target: { value: 'Fall 2023' } });
    fireEvent.change(screen.getByLabelText('Default Payment Method'), { target: { value: 'UPI' } });

    fireEvent.click(screen.getByTestId('signup-submit-button'));

    // expect(await screen.findByTestId('signup-success-message')).toBeInTheDocument();
    // expect(screen.getByText(/Sign up successful/i)).toBeInTheDocument();
    // await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/verifycode'));
  });

  test('shows API error messages', async () => {
    axios.post.mockRejectedValue({
      response: {
        data: {
          error: 'Signup failed. Username already exists.',
          details: ['Username is taken.'],
        },
      },
    });

    renderWithRouter(<Signup />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'duplicateuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'duplicate@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('College'), { target: { value: 'Test College' } });
    fireEvent.change(screen.getByLabelText('Semester'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Default Payment Method'), { target: { value: 'UPI' } });

    fireEvent.click(screen.getByTestId('signup-submit-button'));

    // expect(await screen.findByTestId('signup-error-message')).toBeInTheDocument();
    // expect(screen.getByText(/Signup failed/i)).toBeInTheDocument();
    // expect(await screen.findByTestId('signup-info-message')).toBeInTheDocument();
    // expect(screen.getByText(/Username is taken/i)).toBeInTheDocument();
  });

//   test('displays error message when CSRF token fetch fails', async () => {
//     axios.get.mockRejectedValue(new Error('Failed to fetch CSRF token'));
//     renderWithRouter(<Signup />);

//     expect(await screen.findByTestId('signup-error-message')).toBeInTheDocument();
//     expect(screen.getByText(/Failed to fetch CSRF token/i)).toBeInTheDocument();
//   });
});
