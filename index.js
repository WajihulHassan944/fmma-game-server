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


const imageSchema = new mongoose.Schema({
  url: String,
  title: String,
  text: String
});

const Image = mongoose.model('Image', imageSchema);

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
  const { title, text } = req.body; // Destructure title and text from req.body

  // Save the image URL, title, and text to the database
  const newImage = new Image({ url: imageUrl, title: title, text: text });
  await newImage.save();
  res.status(200).send('Blog uploaded successfully');
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



// Define route for fetching images
app.get('/images', async (req, res) => {
  const images = await Image.find();
  res.send(images);
});

app.get("/", (req, res) => {
  res.send("Backend server for blogs images has started running successfully...");
});

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
