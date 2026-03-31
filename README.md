# 💸 Expense Tracker

A full-stack, production-ready **Expense Tracking and Settlement Application** built using **Django (DRF)** and **React.js**.
The application enables users to manage expenses, split costs in groups, and track settlements with secure authentication.

---

## 🚀 Features

* 🔐 JWT Authentication with CSRF Protection
* 👥 Group-based expense management
* 💰 Expense splitting (equal/custom-ready)
* 📊 Settlement tracking and status updates
* 📧 Email verification system
* 🔑 Password reset with token verification
* 🐳 Dockerized setup (local & production)
* 🌐 Nginx reverse proxy for production
* 🧪 Frontend unit testing (Jest + RTL)

---

## 🛠 Tech Stack

### Backend

* Django
* Django REST Framework
* PostgreSQL
* Custom JWT Authentication

### Frontend

* React.js
* Tailwind CSS
* Axios (centralized instance with interceptors)

### DevOps

* Docker & Docker Compose
* Nginx
* Gunicorn

---

## 📂 Project Structure

```
expense_tracker/
│
├── backend/
│   ├── expense_tracker_project/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   ├── prod.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │
│   ├── expense_tracker/
│   ├── Dockerfile.local
│   ├── Dockerfile.prod
│
├── frontend/
│   └── ex_tracker/
│       ├── src/
│       │   ├── components/
│       │   ├── api/
│       │   ├── tests/
│       │   └── config.js
│       ├── Dockerfile.local
│       ├── Dockerfile.prod
│
├── nginx/
│   └── prod.conf
│
├── docker-compose.local.yml
├── docker-compose.prod.yml
├── .env.local
├── .env.prod
```

---

## ⚙️ Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/rachit4018/expense_tracker.git
cd expense_tracker
```

---

### 2. Create `.env.local`

```env
DB_NAME=expense_tracker_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

SECRET_KEY=dev-secret
DEBUG=True

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

---

### 3. Run containers

```bash
docker compose -f docker-compose.local.yml up --build
```

---

### 4. Access application

* Frontend → http://localhost:3000
* Backend → http://localhost:8000

---

## 🌍 Production Setup

### 1. Create `.env.prod`

```env
SECRET_KEY=your-production-secret
DEBUG=False

ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

DATABASE_URL=postgres://user:password@db:5432/expense_tracker_db

CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

---

### 2. Run production containers

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

---

## 🔐 Authentication Flow

1. User logs in → JWT token generated
2. Token stored in browser (localStorage)
3. Every request includes:

```
Authorization: Bearer <token>
X-CSRFToken: <csrf_token>
```

### Security Layers

* JWT authentication
* CSRF protection
* Secure cookies in production

---

## 📡 API Endpoints (Sample)

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| POST   | /signup/                       | Register user            |
| POST   | /login/                        | Login                    |
| POST   | /verify_code/                  | Email verification       |
| POST   | /reset_password/               | Reset password           |
| GET    | /api/v1/expenses/              | Fetch expenses           |
| POST   | /expenses/:groupId/add/        | Add expense              |
| GET    | /api/v1/settlements/:username/ | Get settlements          |
| PATCH  | /api/v1/settlements/:id/       | Mark settlement complete |

---

## 🧪 Testing

### Run frontend tests

```bash
cd frontend/ex_tracker
npm test
```

### Testing Stack

* Jest
* React Testing Library
* Axios mocked via axiosInstance

---

## 🐳 Architecture Overview

```
React (Frontend)
      ↓
    Nginx
      ↓
Django (Gunicorn)
      ↓
 PostgreSQL
```

---

## ⚡ Highlights

* Production-ready Docker architecture
* Secure authentication (JWT + CSRF)
* Centralized Axios instance with interceptors
* Modular Django settings (base / local / prod)
* Scalable backend and clean frontend structure

---

## 🛠 Future Improvements

* Expense analytics dashboard
* Real-time updates (WebSockets)
* Multi-currency support
* Payment gateway integration

---

## 👨‍💻 Author

Rachit Pandya
GitHub: https://github.com/rachit4018

---

## ⭐ Contributing

Feel free to fork the repo and submit pull requests.

---

## 📄 License

This project is licensed under the MIT License.
