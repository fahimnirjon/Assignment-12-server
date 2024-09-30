const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const express = require("express");
const jwt = require('jsonwebtoken')
const app = express();
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173/", "https://horizon-hunt.web.app/" ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());


    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
// Home and health route
app.get("/", (req, res) => {
  res.send("Hello BitCraft");
});
// health
app.get("/health", (req, res) => {
  res.status(200).send("Helth is Good");
});
// Database connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.db6gj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // ==========================> coupon related related  route implementation <=============================
    // ==========================> coupon related related  route implementation <=============================
    // ==========================> coupon related related  route implementation <=============================
    // coupon related
    const couponCollection = client.db("bit-craft").collection("coupon");
    // add coupon
    app.post("/coupon/post", async (req, res) => {
      const newItem = req.body;
      const result = await couponCollection.insertOne(newItem);
      res.send(result);
    });
    // get all coupons
    app.get("/coupons",verifyToken, async (req, res) => {
      const result = await couponCollection.find().toArray();
      res.send(result);
    });
    // delete coupon added
    app.delete("/coupon/delete/:id",verifyToken, verifyAdmin, async (req, res) => {
      const result = await couponCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // update coupon route
    app.put("/coupon/update/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const data = {
        $set: {
          description: req.body.description,
          code: req.body.code,
          expiryDate: req.body.expiryDate,
          discountAmount: req.body.discountAmount,
        },
      };
      const result = await couponCollection.updateOne(query, data, options);
      res.send(result);
    });
    // ==========================> user related  route implementation <=============================
    // ==========================> user related  route implementation <=============================
    // ==========================> user related  route implementation <=============================
    const userCollection = client.db("bit-craft").collection("users");

    // create  user route added
    app.post("/users/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      // Check if user already exists based on email
      const existingUser = await userCollection.findOne({
        email: newItem.email,
      });

      console.log(existingUser);
      if (existingUser) {
        // User already exists, send an appropriate response
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
      // Insert the new user if not already existing
      const result = await userCollection.insertOne(newItem);
      res.status(201).send(result);
    });
    // get single user
    app.get("/users/details/:email", async (req, res) => {
      const result = await userCollection.findOne({
        email: req.params.email,
      });
      res.send(result);
    });
    // get user status
    app.get("/user/status/:email", async (req, res) => {
      const user = await userCollection.findOne({
        email: req.params.email,
      });
      if (user.status === "Verified") {
        res.send({ status: true });
      } else if (user.status === "") {
        res.send({ status: false });
      }
    });
    // get user Role
    app.get("/user/role/:email", async (req, res) => {
      const user = await userCollection.findOne({
        email: req.params.email,
      });

      res.send(user.Role);
    });
    // Update user role
    app.put("/user/role/update/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const newRole = req.body.role;

        // Ensure the new role is provided
        if (!newRole) {
          return res.status(400).send({ message: "Role is required" });
        }
        // Create the query object to find the user by email
        const query = { email: email };

        // Create the update object to set the new role
        const update = {
          $set: {
            Role: newRole,
          },
        };

        // Perform the update operation on the user collection
        const result = await userCollection.updateOne(query, update);

        // Check if the update was successful
        if (result.matchedCount > 0) {
          res.status(200).send({ message: "User role updated successfully" });
        } else {
          res.status(404).send({ message: "User not found" });
        }
      } catch (error) {
        // Handle any errors that occur during the operation
        console.error("Error updating user role:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // get all users
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // delete product post
    app.delete("/users/delete/:id", async (req, res) => {
      const result = await userCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    const reportCollection = client.db("bit-craft").collection("reports");
    // create  report route added
    app.post("/report/post", async (req, res) => {
      const newItem = req.body;
      const result = await reportCollection.insertOne(newItem);
      res.send(result);
    });
    // get all reports
    app.get("/reports", async (req, res) => {
      const cursor = reportCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get product reports
    app.get("/reports/:id", async (req, res) => {
      const result = await reportCollection.find({
        product_id: req.params.id,
      });
      const data = await result.toArray();
      res.send(data);
    });
    // delete report
    app.delete("/report/delete/:id", async (req, res) => {
      const result = await reportCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    // ==========================> review related  route implementation <=============================
    const reviewCollection = client.db("bit-craft").collection("reviews");
    // create  review route added
    app.post("/review/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await reviewCollection.insertOne(newItem);
      res.send(result);
    });
    // get all review
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get product reviews
    app.get("/reviews/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await reviewCollection.find({
        product_id: req.params.id,
      });
      const data = await result.toArray();
      res.send(data);
    });
    // ==========================> product related  route implementation <=============================
    // ==========================> product related  route implementation <=============================
    // ==========================> product related  route implementation <=============================
    const productCollection = client.db("bit-craft").collection("products");
    // create product
    app.post("/product/post", async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await productCollection.insertOne(newItem);
      res.send(result);
    });
    // get all product
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get single product
    app.get("/product/details/:id", async (req, res) => {
      const result = await productCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // get my products
    app.get("/products/my/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await productCollection
        .find({ user_email: req.params.email })
        .toArray();
      res.send(result);
    });
    // delete product post
    app.delete("/product/delete/:id", async (req, res) => {
      const result = await productCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // get trending  products
    app.get("/products/trending", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      const trendingProducts = allProducts.sort((a, b) => {
        return b.vote.upVote - a.vote.upVote;
      });
      res.json(trendingProducts);
    });
    // get Accepted products
    app.get("/products/accepted", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      const acceptedProducts = allProducts.filter(
        (product) => product.status === "Accepted"
      );
      res.send(acceptedProducts);
    });
    // get Pending products
    app.get("/products/pending", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      res.send(allProducts);
    });
    // get featured products
    app.get("/products/featured", async (req, res) => {
      const allProducts = await productCollection.find().toArray();
      const featuredProduct = allProducts.filter(
        (product) => product.featured === true
      );
      res.send(featuredProduct);
    });

    // update product route
    app.put("/product/update/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const data = {
        $set: {
          name: req.body.name,
          title: req.body.title,
          image: req.body.image,
          tags: req.body.tags,
          description: req.body.description,
        },
      };
      const result = await productCollection.updateOne(query, data, options);
      res.send(result);
    });
    // update product status
    app.put("/product/update/status/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const options = { upsert: false }; // Typically, upsert should be false for update
        const data = {
          $set: {
            status: req.body.status,
          },
        };
        const result = await productCollection.updateOne(query, data, options);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "An error occurred while updating the product status.",
          error: error.message,
        });
      }
    });
    // update product featured
    app.put("/products/update/featured/:id", async (req, res) => {
      try {
        const query = { _id: new ObjectId(req.params.id) };
        const options = { upsert: false }; // Typically, upsert should be false for update
        const data = {
          $set: {
            featured: req.body.featured,
          },
        };
        const result = await productCollection.updateOne(query, data, options);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "An error occurred while updating the product featured.",
          error: error.message,
        });
      }
    });

    // UpVote down vote
    app.patch("/update-vote/:id", async (req, res) => {
      const { id } = req.params;
      const { userEmail, upVote, downVote } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format");
      }
      try {
        const document = await productCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!document) {
          return res.status(404).send("Document not found");
        }
        if (document.vote.users.includes(userEmail)) {
          return res.status(400).send("User has already voted");
        }
        const update = {
          $addToSet: { "vote.users": userEmail },
          $inc: {},
        };
        if (typeof upVote === "number") update.$inc["vote.upVote"] = upVote;
        if (typeof downVote === "number")
          update.$inc["vote.downVote"] = downVote;
        const result = await productCollection.updateOne(
          { _id: new ObjectId(id) },
          update
        );
        if (result.modifiedCount === 0) {
          return res.status(400).send("No changes made");
        }
        res.send("Vote count updated and user added successfully");
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
      }
    });
    // search product  by search input
    app.get("/products/accepted/:text", async (req, res) => {
      const searchText = req.params.text.toLowerCase();
      const productData = await productCollection.find().toArray();
      // get accepted product
      const acceptedProducts = productData.filter(
        (product) => product.status === "Accepted"
      );
      if (!searchText) {
        res.send(acceptedProducts);
      }
      const searchResult = acceptedProducts.filter((product) =>
        product.tags.toString().toLowerCase().match(searchText)
      );
      res.send(searchResult);
    });
    // ========================<<<<<<<< Moderator home >>>>>>>>>>>>>>>>==========================

    // ========================<<<<<<<< Admin Statistics >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< Admin Statistics >>>>>>>>>>>>>>>>==========================
    // Admin statistics page
    app.get("/admin/statistic", async (req, res) => {
      const cursor1 = userCollection.find();
      let users = await cursor1.toArray();
      const cursor2 = reviewCollection.find();
      let reviews = await cursor2.toArray();
      const cursor3 = productCollection.find();
      let products = await cursor3.toArray();
      let result = [
        {
          name: "Users",
          value: users.length,
        },
        {
          name: "Reviews",
          value: reviews.length,
        },
        {
          name: "Products",
          value: products.length,
        },
      ];
      res.send(result);
    });
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port : http://localhost:${port}`);
});
