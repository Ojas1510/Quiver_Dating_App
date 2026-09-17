const express = require("express");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const PORT = process.env.PORT || 8000;
const uri = process.env.MONGO_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "*";

if (!uri) throw new Error("MONGO_DB_URL is not configured");
if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");

const app = express();
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const getDatabase = async () => {
  const client = new MongoClient(uri);
  await client.connect();
  return { client, database: client.db("app-data") };
};

app.get("/", (req, res) => {
  res.json("Hello to my app");
});

app.post("/signup", async (req, res) => {
  let client;
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json("Email and password are required");

    const result = await getDatabase();
    client = result.client;
    const users = result.database.collection("users");
    const sanitizedEmail = email.toLowerCase().trim();
    const existingUser = await users.findOne({ email: sanitizedEmail });

    if (existingUser) return res.status(409).json("User already exists. Please log in");

    const generatedUserId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      user_id: generatedUserId,
      email: sanitizedEmail,
      hashed_password: hashedPassword,
      matches: [],
    };

    await users.insertOne(user);
    const token = jwt.sign({ user_id: generatedUserId, email: sanitizedEmail }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(201).json({ token, userId: generatedUserId });
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.post("/login", async (req, res) => {
  let client;
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json("Email and password are required");

    const result = await getDatabase();
    client = result.client;
    const users = result.database.collection("users");
    const sanitizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: sanitizedEmail });

    if (!user) return res.status(400).json("Invalid credentials");

    const correctPassword = await bcrypt.compare(password, user.hashed_password);
    if (!correctPassword) return res.status(400).json("Invalid credentials");

    const token = jwt.sign({ user_id: user.user_id, email: sanitizedEmail }, JWT_SECRET, {
      expiresIn: "24h",
    });
    return res.status(201).json({ token, userId: user.user_id });
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.get("/user", async (req, res) => {
  let client;
  try {
    const { userId } = req.query;
    const result = await getDatabase();
    client = result.client;
    const user = await result.database.collection("users").findOne({ user_id: userId });
    if (!user) return res.status(404).json("User not found");
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.get("/users", async (req, res) => {
  let client;
  try {
    const userIds = JSON.parse(req.query.userIds || "[]");
    const result = await getDatabase();
    client = result.client;
    const foundUsers = await result.database.collection("users").find({
      user_id: { $in: userIds },
    }).toArray();
    return res.json(foundUsers);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.get("/gendered-users", async (req, res) => {
  let client;
  try {
    const result = await getDatabase();
    client = result.client;
    const users = result.database.collection("users");
    const gender = req.query.gender;
    const query = gender === "everyone" ? {} : { gender_identity: gender };
    const foundUsers = await users.find(query).toArray();
    return res.json(foundUsers);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.put("/user", async (req, res) => {
  let client;
  try {
    const { formData } = req.body;
    if (!formData?.user_id) return res.status(400).json("User ID is required");

    const result = await getDatabase();
    client = result.client;
    const users = result.database.collection("users");
    const updateDocument = {
      $set: {
        first_name: formData.first_name,
        dob_day: formData.dob_day,
        dob_month: formData.dob_month,
        dob_year: formData.dob_year,
        show_gender: formData.show_gender,
        gender_identity: formData.gender_identity,
        gender_interest: formData.gender_interest,
        url: formData.url,
        about: formData.about,
        matches: formData.matches || [],
      },
    };
    const updatedUser = await users.updateOne({ user_id: formData.user_id }, updateDocument);
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.put("/addmatch", async (req, res) => {
  let client;
  try {
    const { userId, matchedUserId } = req.body;
    const result = await getDatabase();
    client = result.client;
    const users = result.database.collection("users");
    const updatedUser = await users.updateOne(
      { user_id: userId },
      { $addToSet: { matches: { user_id: matchedUserId } } }
    );
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.get("/messages", async (req, res) => {
  let client;
  try {
    const { userId, correspondingUserId } = req.query;
    const result = await getDatabase();
    client = result.client;
    const messages = result.database.collection("messages");
    const foundMessages = await messages.find({
      from_userId: userId,
      to_userId: correspondingUserId,
    }).toArray();
    return res.json(foundMessages);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.post("/message", async (req, res) => {
  let client;
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json("Message is required");

    const result = await getDatabase();
    client = result.client;
    const insertedMessage = await result.database.collection("messages").insertOne(message);
    return res.json(insertedMessage);
  } catch (err) {
    console.error(err);
    return res.status(500).json("Server error");
  } finally {
    if (client) await client.close();
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
