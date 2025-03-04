# Product Listing CRUD Operations

This project is a Node.js application that demonstrates CRUD (Create, Read, Update, Delete) operations for managing a product listing. The application uses Express.js for the server, MySQL for the database, and EJS for templating.

## Features

- **Create**: Add new products with details such as name, price, description, and image.
- **Read**: View a list of all products.
- **Update**: Edit existing product details.
- **Delete**: Remove products from the listing.

## Prerequisites

- Node.js
- MySQL

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/Product_listing-CRUD-Operations.git
    cd Product_listing-CRUD-Operations
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a [.env](http://_vscodecontentref_/0) file in the root directory and add your database configuration:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=yourpassword
    DB_DATABASE=yourdatabase
    ```

4. Create the [products](http://_vscodecontentref_/1) table in your MySQL database:
    ```sql
    CREATE TABLE products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10, 2) NOT NULL,
        product_desc TEXT NOT NULL,
        product_image VARCHAR(255) NOT NULL
    );
    ```

## Usage

1. Start the server:
    ```sh
    npm start
    ```

2. Open your browser and navigate to `http://localhost:3000/home` to view the product listing.

## Project Structure

```plaintext
.
├── public
│   ├── images
│   └── styles.css
├── routes
│   └── staticRouter.js
├── views
│   ├── editform.ejs
│   ├── index.html
│   └── products.ejs
├── .env
├── database.js
├── index.js
├── package.json
└── README.md
```

## Routes

- **GET /home**: Render the home page.
- **GET /products**: Fetch and display all products.
- **GET /editform/:product_id**: Render the edit form for a specific product.
- **POST /home**: Add a new product.
- **POST /editproduct/:product_id**: Edit an existing product.
- **DELETE /products/:id**: Delete a product.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Acknowledgements

- Express.js
- MySQL
- EJS
- dotenv
- body-parser
- nodemon