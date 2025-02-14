# Expense Tracker

A web-based application designed to help users manage and track their expenses efficiently.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- User authentication and authorization
- Create, read, update, and delete expenses
- Categorize expenses
- Visualize spending patterns
- Group expenses for shared tracking

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/rachit4018/expense_tracker.git
   cd expense_tracker

2. **Switch to the development branch**:
   git checkout dev

3. **Set up a virtual environment**:
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
4. **Install dependencies:**
     pip install -r requirements.txt
5. **Configure the database:**
     Update the DATABASES section in settings.py with your PostgreSQL credentials.
6. **Apply database migrations:**
     python manage.py migrate
7. **Create a superuser:**
     python manage.py createsuperuser
8. **Run the development server:**
   python manage.py runserver

## Usage
1. Access the application: Navigate to http://127.0.0.1:8000/ in your browser.
2. Register/Login: Create an account or log in with existing credentials.
3. Manage Expenses: Add expenses, categorize them, and track group spending.
4. API Access: Use provided endpoints for programmatic interaction.

## Project Architecture
The application is structured as follows:

Frontend: HTML templates styled with CSS and JavaScript.
Backend: Django REST Framework for handling API requests.
Database: PostgreSQL for persistent data storage.
Media Storage: Handles user-uploaded files like receipt images.

## API Documentation
**Authentication**
POST /api/auth/login/: Authenticate a user and retrieve a JWT token.
POST /api/auth/register/: Register a new user.
**Expense Management**
GET /api/expenses/: Retrieve all expenses.
POST /api/expenses/: Create a new expense.
GET /api/expenses/{id}/: Retrieve a specific expense by ID.
PUT /api/expenses/{id}/: Update an expense.
DELETE /api/expenses/{id}/: Delete an expense.
**Group Management**
GET /api/groups/: List all groups the user is part of.
POST /api/groups/: Create a new group.
GET /api/groups/{id}/: Retrieve details of a specific group.

## License
This project is licensed under the MIT License.
