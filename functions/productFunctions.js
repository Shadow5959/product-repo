const app = require('../server.js');
const path = require('path');

const db = require('../database.js');
const dotenv = require('dotenv');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const domPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const htmlPurify = domPurifier(new JSDOM().window);
const fs = require('fs');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './public/images')
    },
    filename: function (req, file, cb) {
       return cb(null, `${Date.now()}-${file.originalname}`)
    },
});
const upload = multer({ storage: storage});


function deleteProduct(product_id, callback) {
    console.log("product id: ", product_id);
    const query = `
        DELETE FROM products p
        WHERE p.product_id = ?
    `;
    const quer2 = `
        DELETE FROM product_images pi
        WHERE pi.product_id = ?
    `;
    const imageDirectory = path.join(__dirname, '../public/images');
    const imageQuery = `SELECT image_name FROM product_images WHERE product_id = ?`;

    db.query(imageQuery, [product_id], (err, images) => {
        if (err) {
            return callback(err);
        }

        images.forEach(image => {
            const baseURL = "http://localhost:4000/images/";

            const imageName = image.image_name.replace(baseURL, "");
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
    });
    db.query(quer2, [product_id], (err, result) => {
        if (err) {
            return callback(err);
        }
    });
    db.query(query, [product_id], (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
    
}
function createProduct(product_name, product_price, product_desc, images, categories, callback) {
    const sanitizedDesc = htmlPurify.sanitize(product_desc);
    const productQuery = `INSERT INTO products (product_name, product_price, product_desc) VALUES (?, ?, ?)`;

    db.query(productQuery, [product_name, product_price, sanitizedDesc], (err, result) => {
        if (err) return callback(err);
        
        const productId = result.insertId;

        let imageQueryDone = false;
        let categoryQueryDone = false;

        // Handle images insertion
        if (images && images.length > 0) {
            const imageValues = images.map(image => [productId, image]);
            const imageQuery = `INSERT INTO product_images (product_id, image_name) VALUES ?`;

            db.query(imageQuery, [imageValues], (err) => {
                if (err) return callback(err);
                imageQueryDone = true;
                if (categoryQueryDone) callback(null, result);
            });
        } else {
            imageQueryDone = true;
        }

        // Handle category linking
        const idquery = `SELECT cat_id FROM category WHERE cat_name IN (?)`;
        db.query(idquery, [categories], (err, catResults) => {
            if (err) return callback(err);

            if (catResults.length > 0) {
                const categoryValues = catResults.map(row => [productId, row.cat_id]);
                const query = `INSERT INTO productcategory (product_id, cat_id) VALUES ?`;

                db.query(query, [categoryValues], (err) => {
                    if (err) return callback(err);
                    categoryQueryDone = true;
                    if (imageQueryDone) callback(null, result);
                });
            } else {
                categoryQueryDone = true;
            }
        });

        if (!images || images.length === 0) imageQueryDone = true;
        if (categories.length === 0) categoryQueryDone = true;

        if (imageQueryDone && categoryQueryDone) callback(null, result);
    });
}



function editProduct(product_id, product_name, product_price, product_desc, product_images, categories, callback) {
    const sanitizedDesc = htmlPurify.sanitize(product_desc);
    
    const getProductQuery = `SELECT p.product_name, p.product_desc, p.product_id, p.product_price, pi.image_name, pi.image_id 
                             FROM products p
                             LEFT JOIN product_images pi ON p.product_id = pi.product_id
                             WHERE p.product_id = ?`;

    db.query(getProductQuery, [product_id], (err, result) => {
        if (err) {
            return callback(err);
        }

        if (result.length === 0) {
            return callback(new Error('Product not found'));
        }

        const currentImages = result.map(row => row.image_name);
        const finalImages = product_images && product_images.length > 0 ? product_images : currentImages;

        const updateProductQuery = `
            UPDATE products
            SET product_name = ?, product_price = ?, product_desc = ?
            WHERE product_id = ?
        `;
        const quer2 = `
            DELETE FROM productcategory
            WHERE product_id = ?
        `;
        const quer3 = `
            INSERT INTO productcategory (product_id, cat_id)
            VALUES ?
        `;

        db.query(updateProductQuery, [product_name, product_price, sanitizedDesc, product_id], (err, result) => {
            if (err) {
            return callback(err);
            }

            db.query(quer2, [product_id], (err) => {
            if (err) {
                return callback(err);
            }

            const idquery = `SELECT cat_id FROM category WHERE cat_name IN (?)`;
            db.query(idquery, [categories], (err, catResults) => {
                if (err) return callback(err);

                if (catResults.length > 0) {
                const categoryValues = catResults.map(row => [product_id, row.cat_id]);
                db.query(quer3, [categoryValues], (err) => {
                    if (err) return callback(err);

                    const insertImagesQuery = `
                    INSERT INTO product_images (product_id, image_name)
                    VALUES ?
                    `;

                    const newImages = finalImages.filter(image => !currentImages.includes(image));
                    const imageValues = newImages.map(image => [product_id, image]);

                    if (imageValues.length > 0) {
                    db.query(insertImagesQuery, [imageValues], (err, result) => {
                        if (err) {
                        return callback(err);
                        }
                        callback(null, result);
                    });
                    } else {
                    callback(null, result);
                    }
                });
                } else {
                callback(null, result);
                }
            });
            });
        
        });
    });
}

function deleteImage(product_id,image_id, callback) {
    console.log("product id: ", product_id);
   
    const quer2 = `
        DELETE FROM product_images pi
        WHERE pi.product_id = ? AND pi.image_id = ?
    `;
    const imageDirectory = path.join(__dirname, '../public/images');
    const imageQuery = `SELECT image_name FROM product_images WHERE product_id = ? AND image_id = ?`;

    db.query(imageQuery, [product_id, image_id], (err, images) => {
        if (err) {
            return callback(err);
        }

        images.forEach(image => {
            const baseURL = "http://localhost:4000/images/";

            const imageName = image.image_name.replace(baseURL, "");
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
    });
    db.query(quer2, [product_id, image_id], (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
    
      
}


    
module.exports = {deleteProduct, createProduct, editProduct, deleteImage};  
