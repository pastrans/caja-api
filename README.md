# POS & Cash Register REST API

API REST modular para la gestión de puntos de venta (POS), control de aperturas y cierres de cajas registradoras, registro de transacciones y administración de usuarios/empleados con control de acceso basado en roles (RBAC).

---

## 🛠️ Stack Tecnológico & Arquitectura

* **Lenguaje & Entorno:** Node.js & TypeScript
* **Framework Web:** Express.js
* **Base de Datos & ORM:** PostgreSQL & Prisma ORM
* **Arquitectura:** Clean Architecture (Domain, Use Cases, Infrastructure, Presentation)
* **Seguridad & Autenticación:** JWT (JSON Web Tokens), Bcrypt, CORS
---

## 🚀 Dev

Sigue estos pasos para levantar el entorno de desarrollo local:

1. **Configurar variables de entorno:**  
   Clonar el archivo `.env.template` y crear el `.env`:
   ```bash
   cp .env.template .env