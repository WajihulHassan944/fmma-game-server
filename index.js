const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
const apiKey = process.env.API_KEY;
const multer = require('multer');
const FormData = require('form-data');

app.use(express.json());
app.use(cors());

const PORT = 3000;


app.get('/api/data', (req, res) => {
  try {
    // Include apiKey in the response
    res.json({ success: true, apiKey: apiKey });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// fighters start

const fighterSchema = new mongoose.Schema({
  url: String,
  name: String,
  description: String,
  category: String
});

const Fighter = mongoose.model('Fighter', fighterSchema);

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  const formData = new FormData();
  const { default: fetch } = await import('node-fetch');
  formData.append('image', req.file.buffer.toString('base64'));

  const response = await fetch('https://api.imgbb.com/1/upload?key=368cbdb895c5bed277d50d216adbfa52', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  const imageUrl = data.data.url;
  const { name, description , category } = req.body; // Destructure title and text from req.body

  // Save the image URL, title, and text to the database
  const newFighter = new Fighter({ url: imageUrl, name: name, description:description, category:category });
  await newFighter.save();
  res.status(200).send('Fighter Added Successfully');
});


app.get('/blog/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await Image.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/blogtodelete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for blog ID:', id);
  try {
    const blog = await Image.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/fighters', async (req, res) => {
  const fighters = await Fighter.find();
  res.send(fighters);
});

// fighters end






// match start

const matchSchema = new mongoose.Schema({
  url: String,
  matchCategory: String,
   matchFighterA: String , 
   matchFighterB: String ,
    matchName: String ,
     matchDescription: String ,
      matchVideoUrl: String , 
      matchLive: String
});

const Match = mongoose.model('Match', matchSchema);

app.post('/addMatch', upload.single('image'), async (req, res) => {
  const formData = new FormData();
  const { default: fetch } = await import('node-fetch');
  formData.append('image', req.file.buffer.toString('base64'));

  const response = await fetch('https://api.imgbb.com/1/upload?key=368cbdb895c5bed277d50d216adbfa52', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  const imageUrl = data.data.url;
  const { matchCategory, matchFighterA , matchFighterB , matchName , matchDescription , matchVideoUrl , matchLive } = req.body; // Destructure title and text from req.body

  // Save the image URL, title, and text to the database
  const newMatch = new Match({ url: imageUrl, matchCategory:matchCategory, matchFighterA:matchFighterA , matchFighterB:matchFighterB , matchName:matchName , matchDescription:matchDescription , matchVideoUrl:matchVideoUrl , matchLive:matchLive });
  await newMatch.save();
  res.status(200).send('Match Added Successfully');
});



app.get('/match', async (req, res) => {
  const match = await Match.find();
  res.send(match);
});

// match end









// category start

const categorySchema = new mongoose.Schema({
  category: String
});

const Category = mongoose.model('Category', categorySchema);

app.post('/addCategory', async (req, res) => {
  
  const { category }  = req.body;
  console.log(category);
  // Save the image URL, title, and text to the database
  const newCategory = new Category({ category:category });
  await newCategory.save();
  res.status(200).send('Category Added Successfully');
});




app.get('/category', async (req, res) => {
  const category = await Category.find();
  res.send(category);
});

// category end





// combat start

const combatSchema = new mongoose.Schema({
  category: String,
  attackName: String,
  attackDamage: String,
  attackKey: String
});

const Combat = mongoose.model('Combat', combatSchema);

app.post('/addCombat', async (req, res) => {
  
  const { category, attackName, attackDamage, attackKey  }  = req.body;
 console.log(category);
  const newCombat = new Combat({ category:category , attackName:attackName, attackDamage:attackDamage, attackKey:attackKey });
  await newCombat.save();
  res.status(200).send('Combat Added Successfully');
});




app.get('/combat', async (req, res) => {
  const combat = await Combat.find();
  res.send(combat);
});

// combat end






//admin login routes

const bcrypt = require('bcrypt');

const userSchema555 = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const Gameuser555 = new mongoose.model("Gameuser555", userSchema555);



app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Gameuser555.findOne({ email: email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const objectId = user._id.toString();
        res.status(200).json({ message: 'Login successful', objectId: objectId });
      } else {
        res.status(401).json({ message: 'Invalid password' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Registration endpoint
app.post('/admin/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await Gameuser555.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new Gameuser555({
      name: name,
      email: email,
      password: hashedPassword
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



/// end for admin













app.get("/", (req, res) => {
  res.send("Backend server for fmma game has started running successfully...");
});

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
