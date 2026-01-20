import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import customDesignRoutes from './routes/customDesign.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// console.log(`[Debug] Looking for .env file at: ${envPath}`);
// console.log(`[Debug] BYTESCALE_API_KEY: ${process.env.BYTESCALE_SECRET_API_KEY ? 'Loaded' : 'undefined'}`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/custom-designs", customDesignRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/user", userRoutes);
app.use("/api/checkout", checkoutRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Hello 3D printing world, Ana Elback" }); 
});

app.get("/upload", (req, res) => {
    res.render("upload");
});

app.get("/products", (req,res) => {
    res.render("products");
});

app.get("/addProduct", (req,res) => {
    res.render("addProduct");
});

app.get("/cart", (req,res) => {
    res.render("cart");
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/profile", (req, res) => {
    res.render("profile")
});

app.listen(port, async () => {
    try {
        console.log(`Server is running on http://localhost:${port}`);  
        await connectDB();  
    } catch(e) {
        console.log("Error occured: ", e);
    }
});

