# NodeJS Social Media API

This guide will walk you through the setup and deployment of a NodeJS Social Media API for [VueJS SocMed](https://github.com/mrhabibie/vue-socmed) app.

## ⚠️ Minimum Requirements

Ensure your environment meets these requirements:

| Component | Required Version | Installation Link                                              |
| --------- | ---------------- | -------------------------------------------------------------- |
| NodeJS    | latest           | [Installation](https://nodejs.org/en/download)                 |
| MongoDB   | latest           | [Installation](https://www.mongodb.com/try/download/community) |

## 📝 Setup Environment

1. Clone Social Media API project from [this repository](https://github.com/mrhabibie/nodejs-socmed-api) :
   - HTTPS
     ```console
     $ git clone https://github.com/mrhabibie/nodejs-socmed-api
     ```
   - SSH
     ```console
     $ git clone git@github.com:mrhabibie/nodejs-socmed-api.git
     ```
2. Move to project directory :
   ```console
   $ cd nodejs-socmed-api
   ```
3. Install all the required project dependencies :
   ```console
   $ npm install
   ```
4. Copy `.env.example` to `.env` :
   ```console
   $ cp .env.example .env
   ```
5. Set the `MONGODB_URI` and `PORT` if needed.

## 🚀 Running the Application

1. Make sure [Setup Environment](#-setup-environment) are done.
2. To start the application locally :
   ```console
   $ npm run start
   ```
   The application will be available at http://localhost:3000 (the port maybe different it's based on your `.env` file, please see at console log).

## Developer Info

Having problem with this project?
[Contact me](https://wa.me/6282143603556).
