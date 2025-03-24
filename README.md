
## Requirements
To run and deploy this project, you need:
- **Node.js** (version 16.14.2 or later)
- **Docker Compose** installed:
  - Ubuntu: `sudo apt install docker-compose`
  - Windows: `choco install docker-compose`

---

## Installation
To set up and run the application locally, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/waritph/Devop_final_project.git
cd Devop_final_project
```

### 2. Install Dependencies
Install the required Node.js dependencies:
```bash
npm install
npm install nodemon --save-dev
npm install jsonwebtoken bcrypt
npm install multer ejs mongoose-paginate
npm install winston sequelize mysql2 promptpay-qr
npm install express mongoose dotenv cors
```

### 3. Initialize Node.js Project
```bash
npm init -y
```

---

## Environment Variables
Create a `.env` file to configure your environment variables. For example:
```env
MONGO_USER=yourMongoUser
MONGO_PASSWORD=yourMongoPassword
MONGO_PORT=yourMongoPort
HOST=localhost
PORT=8080
ENV=dev
```

---

## Docker Setup
Use Docker Compose for containerization. Ensure Docker Compose is installed:
- On Ubuntu: `sudo apt install docker-compose`
- On Windows: `choco install docker-compose`

Build and start the Docker containers:
```bash
docker-compose up --build
```

---

## Running the App
### Start the Node.js server:
```bash
npm run start
```
Or use nodemon for development:
```bash
npm run dev
```

