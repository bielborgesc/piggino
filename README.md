<div align="center">
  <img src="frontend/public/piggino-logo.jpg" alt="Piggino Logo" width="150px" />
  <h1>🐷 Piggino</h1>
  <p><strong>Your smart, intuitive, and personal financial assistant.</strong></p>
  <p>A full-stack web application designed to simplify the management of expenses, income, and credit cards.</p>
</div>

---

## 🚀 About The Project

Piggino was born from the need for a financial tracking tool that combines a simple user experience with powerful features. More than just a spreadsheet, Piggino is a complete web application built on a modern, scalable, and production-ready architecture.

Version 1.0 is fully functional and deployed, offering users the essential tools to take control of their finances with clarity and purpose.

<img width="1908" height="912" alt="image" src="https://github.com/user-attachments/assets/50e4c04f-4074-43f6-a68c-1146b4a9b769" />

### ✨ Core Features (v1.0)

* 🔐 **Secure Authentication:** Robust user registration and login system using JWT (JSON Web Tokens).
* 📊 **Intuitive Dashboard:** A clear overview of financial health, including balances, monthly income, and expenses.
* 💸 **Transaction Management:** Full CRUD functionality for income and expense tracking, with support for installment purchases.
* 🏷️ **Custom Categories:** Users can create and manage personalized categories to organize their transactions.
* 💳 **Financial Sources:** Ability to register multiple sources, such as bank accounts and credit cards.

---

## 🛠️ Architecture & Tech Stack

Piggino is built with a containerized microservices architecture, leveraging modern technologies and DevOps best practices to ensure scalability, security, and an agile development cycle.

<img width="1268" height="511" alt="image" src="https://github.com/user-attachments/assets/49e6b3a6-f10e-451a-9c3e-723e6ab41645" />

### Solution Architecture

* **Backend API (.NET):** A robust RESTful API built with ASP.NET 8, following Domain-Driven Design (DDD) principles with a clear separation of concerns (Controllers, Services, Repositories).
* **Frontend SPA (React):** A modern and reactive Single-Page Application developed with React, Vite, TypeScript, and Tailwind CSS for a fast and fluid user experience.
* **Database:** Utilizes SQLite for simplicity and portability, managed via Entity Framework Core.
* **Infrastructure as Code (IaC):** The entire infrastructure is defined and orchestrated through a `docker-compose.yml` file, ensuring consistency between development and production environments.
* **Reverse Proxy (Caddy):** Caddy is used as the reverse proxy to manage all incoming traffic, route requests to the appropriate frontend and backend services, and automate the generation and renewal of SSL/TLS certificates for HTTPS.
* **CI/CD with GitHub Actions:** A fully automated continuous integration and continuous deployment pipeline. Every push to the `main` branch triggers a workflow that builds the Docker images, pushes them to Docker Hub, and updates the application in production with zero downtime.

### Technology Stack

| Category | Technology |
| :--- | :--- |
| 🖥️ **Backend** | ASP.NET 8, C#, Entity Framework Core, LINQ, SQLite |
| 🎨 **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Axios |
| ☁️ **Infra & DevOps** | Docker, Docker Compose, Caddy Server, Digital Ocean, GitHub Actions |
| 🔑 **Authentication** | JWT (JSON Web Tokens) |

---

## 🌿 Branching Strategy

This project follows a GitFlow-like branching model to ensure code stability in production:

* `main`: Contains the stable, production-ready code. Only accepts merges from the `develop` branch. Every merge to `main` triggers the deployment pipeline.
* `develop`: The main development branch where all new features are integrated before being released.
* `feature/*`: Short-lived branches created from `develop` to build new features in isolation.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## 👨‍💻 Author

**Gabriel Borges**

* [GitHub](https://github.com/bielborgesc)
* [LinkedIn](https://www.linkedin.com/in/bielborgesc/)
