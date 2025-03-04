const app = require('./server.js');
const path = require('path');
const db = require('./database.js');
const dotenv = require('dotenv');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const domPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const htmlPurify = domPurifier(new JSDOM().window);
const fs = require('fs');
const multer = require('multer');
const {deleteProduct, createProduct, editProduct, deleteImage} = require('./functions/productFunctions.js');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './public/images')
    },
    filename: function (req, file, cb) {
       return cb(null, `${Date.now()}-${file.originalname}`)
    },
});
const upload = multer({ storage: storage});
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {v4 : uuidv4} = require('uuid');
const {setUser} = require('./service/auth.js');
const { restrictToLoggedinUserOnly } = require('./middlewares/auth.js');
const { sendOTP, generateOTP } = require('./service/sendMail.js');
const otpCache = {};

app.get("/home", restrictToLoggedinUserOnly, (req, res) => {
const q = `SELECT * FROM products`;
const q2 = `SELECT * FROM products.category`
db.query(q, (err, result) => {
    if (err) {
        console.error('Error getting products:', err);
        return res.status(500).send('Error getting products');
    }
db.query(q2, (err, result2) => {
    if (err) {
        console.error('Error getting products:', err);
        return res.status(500).send('Error getting products');
    }
    return res.render("index", { products: result, categories: result2});
});
});
});
app.get("/editform/:product_id", restrictToLoggedinUserOnly,(req, res) => {
    const { product_id } = req.params;
    console.log(`Received data: Product ID - ${product_id}`);
    const q = `SELECT p.product_name, p.product_desc, p.product_id, p.product_price, pi.image_name, pi.image_id FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    WHERE p.product_id = ?`;
    const q2 = `SELECT pc.product_id, pc.cat_id, c.cat_name FROM productcategory pc 
    LEFT JOIN category c ON pc.cat_id = c.cat_id
    WHERE product_id = ?`;
    const q3 = `SELECT * FROM products.category`;
    db.query(q, [product_id], (err, result) => {
        if (err) {
            console.error('Error getting products:', err);
            return res.status(500).send('Error getting products');
        } else {
            db.query(q2, [product_id], (err, result2) => {
                if (err) {
                    console.error('Error getting categories:', err);
                    return res.status(500).send('Error getting categories');
                } else {
                    db.query(q3, (err, result3) => {
                        if (err){
                            console.error('Error getting categories:', err);
                            return res.status(500).send('Error getting categories');
                        } else {
                            if (result.length > 0) {
                                const productCategoryIds = result2.map(cat => cat.cat_id)
                                console.log("productCategory", result2);
                                console.log("category", result3);
                                return res.render("editform", { product: result, productCategories: result2, categories: result3, productCategoryIds  });
                            } else {
                                return res.status(404).send('Product not found');
                            }
                        }
                    });
                }
            });
        }
    });
});

app.get("/products", restrictToLoggedinUserOnly, (req, res) => {
    const searchQuery = req.query.search || "";
    const checkedCategories = req.query.categories ? req.query.categories : [];

    console.log(`Received data: Search - ${searchQuery}, Categories - ${checkedCategories}`);

    if (!Array.isArray(checkedCategories)) {
        checkedCategories = [checkedCategories]; // Convert single category to an array
    }

    const q = `
        SELECT p.product_id, p.product_name, p.product_desc, p.product_price,
               GROUP_CONCAT(DISTINCT c.cat_name SEPARATOR ', ') AS categories,
               GROUP_CONCAT(DISTINCT c.cat_id SEPARATOR ', ') AS categoriesId,
               GROUP_CONCAT(DISTINCT pi.image_name SEPARATOR ', ') AS images
        FROM products p
        LEFT JOIN productcategory pc ON p.product_id = pc.product_id
        LEFT JOIN category c ON pc.cat_id = c.cat_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        GROUP BY p.product_id
        ORDER BY p.product_id ASC
    `;

    const categoryQuery = `SELECT * FROM products.category`;

    db.query(q, (err, products) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).send("Error fetching products");
        }

        db.query(categoryQuery, (err, categories) => {
            if (err) {
                console.error("Error fetching categories:", err);
                return res.status(500).send("Error fetching categories");
            }

            // ✅ Apply Regex Filtering AFTER fetching products
            let filteredProducts = products;

            if (searchQuery) {
                try {
                    const regex = new RegExp(searchQuery, "i"); // Case-insensitive regex
                    filteredProducts = products.filter(product =>
                        regex.test(product.product_name) ||
                        regex.test(product.product_desc) ||
                        (product.categories && regex.test(product.categories))
                    );
                } catch (error) {
                    console.error("Invalid regex pattern:", error);
                    return res.status(400).send("Invalid search query");
                }
            }

            // ✅ Apply Category Filtering AFTER regex filtering
            if (checkedCategories.length > 0) {
                filteredProducts = filteredProducts.filter(product => {
                    if (!product.categories) return false; // Skip products without categories
                    const productCategoryIds = product.categoriesId ? product.categoriesId.split(", ") : [];
                    return checkedCategories.some(catId => productCategoryIds.includes(catId));
                });
            }

            res.render("products", { products: filteredProducts, categories });
        });
    });
});

app.post("/home", (req, res) => {
    const { name, price, description, images, categories} = req.body;
    console.log(`Received data: Name - ${name}, Price - ${price}, Description - ${description}, Images - ${images}, categories - ${categories}`);   
    
    createProduct(name, price, description, images, categories, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).send('Error inserting product');
        }
        console.log('Product inserted:', result);
        if (!res.headersSent) res.redirect('/products'); // Prevent multiple redirects
    });
    
});

app.post("/upload", upload.array("images", 10), (req, res) => {
    const images = req.files ? req.files.map(file => `/images/${file.filename}`) : [];
    console.log("Files uploaded: ", images);
    res.status(200).json({ imageUrls: images });
});
app.get("/products/:product_id",restrictToLoggedinUserOnly, (req, res) => {
    const { product_id } = req.params;
    console.log(`Received data: Product ID - ${product_id}`);
    
    deleteProduct(product_id, (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Error deleting product');
        }
        console.log('Product deleted:', result);
        res.redirect('/products');
    });
});
app.post("/editproduct/:product_id", (req, res) => {
    const { product_id } = req.params;
    const { name, price, description, images, categories} = req.body;
   
    console.log(`Received data: Name - ${name}, Price - ${price}, Description - ${description}, Images - ${images}, Categories - ${categories}`);
    console.log(`Received data: Product ID - ${product_id}`);
   
    editProduct(product_id, name, price, description, images, categories, (err, result) => {
        if (err) {
            console.error('Error editing product:', err);
            return res.status(500).send('Error editing product');
        }
        console.log('Product edited:', result);
        res.redirect('/products');
    });
});

app.get("/removeimage/:product_id/:image_id",restrictToLoggedinUserOnly, (req, res) => {
    const { product_id } = req.params;
    const { image_id } = req.params;
    console.log(`Received data: Product ID - ${product_id}`);
    console.log(`Received data: Image ID - ${image_id}`);
    deleteImage(product_id, image_id, (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Error deleting product');
        }
        console.log('Product deleted:', result);
        res.redirect(`/editform/${product_id}`);
    });
});
app.post("/delete-image", (req, res) => {
    const imageURL = req.body;
    console.log("Received data: ", imageURL.url);
    imageName = imageURL.url;
    const imageDirectory = path.join(__dirname, 'public/images');   
    const imagePath = path.join(imageDirectory, path.basename(imageName));
    console.log(`Deleting image file: ${imagePath}`);
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.error(`Error deleting image file: ${imagePath}`, err);
        } else {
            console.log(`Deleted image file: ${imagePath}`);
        }
    });

});
app.get("/categoryList",restrictToLoggedinUserOnly, (req, res) => {
    const q = `SELECT * FROM products.category`;
    db.query(q, (err, result) => {
        if (err) {
            console.error('Error getting categories:', err);
            return res.status(500).send('Error getting categories');
        }
        return res.render("categoryList", { categories: result });
    });
});

app.get("/addCat",restrictToLoggedinUserOnly, (req, res) => {
    return res.render("addCat");
});
app.post("/addCat", (req, res) => {
    const { name, description } = req.body;
    const cleanName = htmlPurify.sanitize(name);
    const cleanDescription = htmlPurify.sanitize(description);
    console.log(`Received data: Name - ${name}, Description - ${cleanDescription}`);

    const q = `INSERT INTO category (cat_name, cat_desc) VALUES (?, ?)`;
    db.query(q, [cleanName, cleanDescription], (err, result) => {
        if (err) {
            console.error('Error inserting category:', err);
            return res.json({ success: false, message: "Error inserting category" });
        }
        console.log('Category inserted:', result);
        res.json({ success: true, message: "Category added successfully!" });
    });
});
app.get("/deletecategory/:cat_id",restrictToLoggedinUserOnly, (req, res) => {
    const { cat_id } = req.params;
    console.log(`Received data: Category ID - ${cat_id}`);
    const q = `DELETE FROM category WHERE cat_id = ?`;
    db.query(q, [cat_id], (err, result) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).send('Error deleting category');
        }
        console.log('Category deleted:', result);
        res.redirect('/categoryList');
    });
});

app.get("/editcat/:cat_id",restrictToLoggedinUserOnly, (req, res) => {
    const { cat_id } = req.params;
    console.log(`Received data: Category ID -${cat_id}`);
    const q = `SELECT * FROM products.category WHERE cat_id = ?`;
    db.query(q, [cat_id], (err, result) => {
        if (err) {
            console.error('Error getting category:', err);
            return res.status(500).send('Error getting category');
        }
        return res.render("editcat", { category: result });
    });

});
app.post("/editcat/:cat_id", (req, res) => {
    const { cat_id } = req.params;
    const { name, description } = req.body;
    console.log(`Received data: Category ID - ${cat_id}, Name - ${name}, Description - ${description}`);
    const q = `UPDATE category SET cat_name = ?, cat_desc = ? WHERE cat_id = ?`;
    db.query(q, [name, description, cat_id], (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.json({ success: false, message: "Error updating category" });
        }
        console.log('Category updated:', result);
        res.redirect('/categoryList');
    });
});
app.get("/login", (req, res) => {
    return res.render("loginPage", { message: "" });
});
app.get("/register", (req, res) => {
    res.render('register', {message: ""});
});
app.post("/register", (req, res) => {
    const { name, email: rawEmail, password, cpassword } = req.body;
    const email = rawEmail.toLowerCase();
    console.log(`Received data: Name - ${name}, Email - ${email}`);

    if (password !== cpassword) {
        return res.render('register', {message: "*Passwords do not match" });
    } else {
        const equery = `SELECT userEmail FROM products.users WHERE userEmail = ?;`
        db.query(equery, [email], async (err, result) => {
            if (err) {
                console.error('Error checking email:', err);
                return res.json({ success: false, message: "Error checking email" });
            }
            if (result.length > 0) {
                return res.render('register', { message: "*Email already exists" });
            } else {
                const query = `INSERT INTO products.users (userName, userEmail, userPassword) VALUES (?, ?, ?);`
                let hashPassword = await bcrypt.hash(password, 8);
                
                db.query(query, [name, email, hashPassword], async (err, result) => {
                    if (err) {
                        console.error('Error registering user:', err);
                        return res.json({ success: false, message: "Error registering user" });
                    }
                    
                    console.log('User registered:', result);
                    
                    // **Trigger OTP Verification**
                    const otp = generateOTP();
                    otpCache[email] = otp;
                    console.log('OTP Cache:', otpCache);
                    sendOTP(email, otp);
                    
                    res.render('otpVerify', { email: req.body.email});
                });
            }
        });
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Received data: Email - ${email}, Password - ${password}`);
    const query = `SELECT * FROM products.users WHERE userEmail = ?;`
    db.query(query, [email], async (err, result) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.json({ success: false, message: "Error logging in" });
        }
        if (result.length > 0) {
            const user = result[0];
            if (!user.userVerification) {
                // Trigger OTP Verification
                const otp = generateOTP();
                otpCache[email] = otp;
                console.log('OTP Cache:', otpCache);
                sendOTP(email, otp);
                return res.render('otpVerify', { email: email, message: "*Please verify your email before logging in" });
            }
            const isMatch = await bcrypt.compare(password, user.userPassword);
            if (isMatch) {
                console.log('User logged in:', user);
                const token = setUser(user);
                res.cookie("uid", token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
                return res.redirect('/products');
            } else {
                return res.render('loginPage', { message: "*Invalid email or password" });
            }
        } else {
            return res.render('loginPage', { message: "*Invalid email or password" });
        }
    });
});

app.get("/logout", (req, res) => {
    res.clearCookie("uid");
    res.redirect('/login');
});
app.post("/otpVerify", (req, res) => {
    const { email: rawEmail, otp } = req.body;
    const email = rawEmail.toLowerCase();
    console.log(`Received data: Email - ${email}, OTP - ${otp}`);
    console.log("OTP Cache: ", otpCache);

    if (otpCache[email] && otpCache[email] === otp) {
        delete otpCache[email];
        // Clear OTP after verification
        const updateQuery = `UPDATE products.users SET userVerification = true WHERE userEmail = ?`;
        db.query(updateQuery, [email], (err, result) => {
            if (err) {
            console.error('Error updating user verification:', err);
            return res.json({ success: false, message: "Error updating user verification" });
            }
            console.log('User verification updated:', result);
        });
        console.log("OTP verified successfully");
        
        // Send JSON response to trigger redirect on the frontend
        return res.json({ success: true, message: "OTP verified successfully!" });
    } else {
        return res.json({ success: false, message: "Invalid OTP" });
    }
});
app.post("/resendOtp", (req, res) => {
    const { email: rawEmail } = req.body;
    const email = rawEmail.toLowerCase();

    if (!email) {
        return res.json({ success: false, message: "Email is required to resend OTP" });
    }

    // Generate a new OTP
    const otp = generateOTP();
    otpCache[email] = otp; // Store the new OTP
    console.log('OTP Cache', otpCache);
    console.log(`New OTP generated for ${email}:`, otp);

    // Send the OTP via email
    sendOTP(email, otp);

    return res.json({ success: true, message: "OTP resent successfully" });
});




app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});