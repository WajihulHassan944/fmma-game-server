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



app.delete('/fightertodelete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for fighter ID:', id);
  try {
    const fighter = await Fighter.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Fighter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/fightertoupdate/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, category } = req.body;

  try {
      const fighter = await Fighter.findByIdAndUpdate(id, { name, description, category }, { new: true });

      if (!fighter) {
          return res.status(404).json({ message: 'Fighter not found' });
      }

      res.status(200).json({ message: 'Fighter updated successfully', fighter });
  } catch (error) {
      console.error('Error updating fighter:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/fighters/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await Fighter.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Fighter not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


// API endpoint for fetching fighter details by name
app.get('/fightersByName/:name', async (req, res) => {
  const { name } = req.params;

  try {
      const fighter = await Fighter.findOne({ name: name });
      if (fighter) {
          res.status(200).json(fighter);
      } else {
          res.status(404).json({ message: 'Fighter not found' });
      }
  } catch (error) {
      console.error('Error fetching fighter details by name:', error);
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
  matchFighterA: String,
  matchFighterB: String,
  matchName: String,
  matchDescription: String,
  matchVideoUrl: String,
  matchLive: String,
  matchDate: Date,
  matchStatus: String,
  BoxingMatch: {
    fighterOneStats: [{
      roundNumber: Number,
      HP: Number,
      BP: Number,
      TP: Number,
      RW: Number,
      RL: Number,
      KO: Number,
      SP: Number
    }],
    fighterTwoStats: [{
      roundNumber: Number,
      HP: Number,
      BP: Number,
      TP: Number,
      RW: Number,
      RL: Number,
      KO: Number,
      SP: Number
    }]
  },
  MmaMatch: {
    fighterOneStats: [{
      roundNumber: Number,
      ST: Number, // Strikes
      KI: Number, // Kicks
      KN: Number, // Knees
      El: Number, // Elbows
      RW: Number, // Round Winner
      RL: Number, // Round Loser
      KO: Number, // Knockout
      SP: Number
    }],
    fighterTwoStats: [{
      roundNumber: Number,
      ST: Number, // Strikes
      KI: Number, // Kicks
      KN: Number, // Knees
      El: Number, // Elbows
      RW: Number, // Round Winner
      RL: Number, // Round Loser
      KO: Number, // Knockout
      SP: Number
    }]
  },
  usersPredictions: [{
    playerName: String,
    PredictionsForBoxing: [{
      playerRound: Number,
      hpPrediction1: Number,
      hpPrediction2: Number,
      bpPrediction1: Number,
      bpPrediction2: Number,
      tpPrediction1: Number,
      tpPrediction2: Number,
      rwPrediction1: Number,
      rwPrediction2: Number,
      koPrediction1: Number,
      koPrediction2: Number,
    }],
    PredictionsForMMA: [{
      playerRound: Number,
      stPrediction1: Number,
      stPrediction2: Number,
      kiPrediction1: Number,
      kiPrediction2: Number,
      knPrediction1: Number,
      knPrediction2: Number,
      elPrediction1: Number,
      elPrediction2: Number,
      spPrediction1: Number,
      spPrediction2: Number,
      rwPrediction1: Number,
      rwPrediction2: Number,
    }]
  }]
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
  const { matchCategory, matchFighterA , matchFighterB , matchName , matchDescription , matchVideoUrl , matchLive , matchDate, matchStatus} = req.body; // Destructure title and text from req.body

  // Save the image URL, title, and text to the database
  const newMatch = new Match({ url: imageUrl, matchCategory:matchCategory, matchFighterA:matchFighterA , matchFighterB:matchFighterB , matchName:matchName , matchDescription:matchDescription , matchVideoUrl:matchVideoUrl , matchLive:matchLive, matchDate:matchDate, matchStatus:matchStatus });
  await newMatch.save();
  res.status(200).send('Match Added Successfully');
});






app.delete('/matchtodelete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for Match ID:', id);
  try {
    const match = await Match.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/matchtoupdate/:id', async (req, res) => {
  const { id } = req.params;
  const { matchCategory, matchFighterA , matchFighterB , matchName , matchDescription  } = req.body;
  try {
      const match = await Match.findByIdAndUpdate(id, { matchCategory, matchFighterA , matchFighterB , matchName , matchDescription }, { new: true });

      if (!match) {
          return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ message: 'Match updated successfully', match });
  } catch (error) {
      console.error('Error updating Match:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});



app.put('/matchToUpdateStatus/:id', async (req, res) => {
  const { id } = req.params;
  const { matchStatus  } = req.body;
  try {
      const match = await Match.findByIdAndUpdate(id, { matchStatus }, { new: true });

      if (!match) {
          return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ message: 'Match status updated successfully', match });
  } catch (error) {
      console.error('Error updating Match status:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/match/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await Match.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Match not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/match/addRoundResults/:id', async (req, res) => {
  const { id } = req.params;
  const { fighterOneStats, fighterTwoStats } = req.body;

  try {
    // Find the match document
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update round results for Fighter One
    const existingFighterOneRoundIndex = match.BoxingMatch.fighterOneStats.findIndex(stat => stat.roundNumber === fighterOneStats.roundNumber);
    if (existingFighterOneRoundIndex !== -1) {
      match.BoxingMatch.fighterOneStats[existingFighterOneRoundIndex] = fighterOneStats;
    } else {
      match.BoxingMatch.fighterOneStats.push(fighterOneStats);
    }

    // Update round results for Fighter Two
    const existingFighterTwoRoundIndex = match.BoxingMatch.fighterTwoStats.findIndex(stat => stat.roundNumber === fighterTwoStats.roundNumber);
    if (existingFighterTwoRoundIndex !== -1) {
      match.BoxingMatch.fighterTwoStats[existingFighterTwoRoundIndex] = fighterTwoStats;
    } else {
      match.BoxingMatch.fighterTwoStats.push(fighterTwoStats);
    }

    // Save the updated match document
    await match.save();

    res.status(200).json({ message: 'Round results added successfully', match });
  } catch (error) {
    console.error('Error adding round results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/match/addRoundResultsMMA/:id', async (req, res) => {
  const { id } = req.params;
  const { fighterOneStats, fighterTwoStats } = req.body;

  try {
    // Find the match document
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update round results for Fighter One
    const existingFighterOneRoundIndex = match.MmaMatch.fighterOneStats.findIndex(stat => stat.roundNumber === fighterOneStats.roundNumber);
    if (existingFighterOneRoundIndex !== -1) {
      match.MmaMatch.fighterOneStats[existingFighterOneRoundIndex] = fighterOneStats;
    } else {
      match.MmaMatch.fighterOneStats.push(fighterOneStats);
    }

    // Update round results for Fighter Two
    const existingFighterTwoRoundIndex = match.MmaMatch.fighterTwoStats.findIndex(stat => stat.roundNumber === fighterTwoStats.roundNumber);
    if (existingFighterTwoRoundIndex !== -1) {
      match.MmaMatch.fighterTwoStats[existingFighterTwoRoundIndex] = fighterTwoStats;
    } else {
      match.MmaMatch.fighterTwoStats.push(fighterTwoStats);
    }

    // Save the updated match document
    await match.save();

    res.status(200).json({ message: 'Round results added successfully', match });
  } catch (error) {
    console.error('Error adding round results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/match/addPredictions/:id', async (req, res) => {
  const { id } = req.params;
  const { predictions } = req.body;

  try {
    // Find the match document
    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Validate the incoming predictions
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({ message: 'Invalid predictions format' });
    }

    // Update user predictions for the match
    predictions.forEach(userPrediction => {
      const { playerName, predictionsForBoxing, predictionsForMMA } = userPrediction;

      console.log(`Processing predictions for user: ${playerName}`);

      // Find or create the user's predictions object
      let userPredictions = match.usersPredictions.find(prediction => prediction.playerName === playerName);
      console.log('Existing userPredictions:', userPredictions);
      
      // If userPredictions is undefined, create a new prediction object
      if (!userPredictions) {
        console.log('UserPredictions is undefined. Creating a new prediction object.');
        userPredictions = { playerName, predictionsForBoxing: [], predictionsForMMA: [] };
        match.usersPredictions.push(userPredictions);
        console.log('New userPredictions:', userPredictions);
      }

      // Add or update Boxing predictions
      if (predictionsForBoxing && Array.isArray(predictionsForBoxing) && predictionsForBoxing.length > 0) {
        predictionsForBoxing.forEach(boxingPrediction => {
          const { playerRound } = boxingPrediction;
          const existingBoxingPredictionIndex = userPredictions.predictionsForBoxing.findIndex(prediction => prediction.playerRound === playerRound);
          if (existingBoxingPredictionIndex !== -1) {
            userPredictions.predictionsForBoxing[existingBoxingPredictionIndex] = boxingPrediction;
          } else {
            userPredictions.predictionsForBoxing.push(boxingPrediction);
          }
        });
      }

      // Add or update MMA predictions
      if (predictionsForMMA && Array.isArray(predictionsForMMA) && predictionsForMMA.length > 0) {
        predictionsForMMA.forEach(mmaPrediction => {
          const { playerRound } = mmaPrediction;
          const existingMMAPredictionIndex = userPredictions.predictionsForMMA.findIndex(prediction => prediction.playerRound === playerRound);
          if (existingMMAPredictionIndex !== -1) {
            userPredictions.predictionsForMMA[existingMMAPredictionIndex] = mmaPrediction;
          } else {
            userPredictions.predictionsForMMA.push(mmaPrediction);
          }
        });
      }
    });

    // Save the updated match document
    await match.save();

    res.status(200).json({ message: 'Predictions added successfully', match });
  } catch (error) {
    console.error('Error adding predictions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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



app.delete('/categorytodelete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for Category ID:', id);
  try {
    const category = await Category.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/categorytoupdate/:id', async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  try {
      const categorys = await Category.findByIdAndUpdate(id, { category }, { new: true });

      if (!categorys) {
          return res.status(404).json({ message: 'Category not found' });
      }

      res.status(200).json({ message: 'Category updated successfully', categorys });
  } catch (error) {
      console.error('Error updating Category:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/category/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await Category.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
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



app.delete('/combattodelete/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Received DELETE request for Combat ID:', id);
  try {
    const combat = await Combat.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Combat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/combattoupdate/:id', async (req, res) => {
  const { id } = req.params;
  const {  category, attackName, attackDamage, attackKey } = req.body;

  try {
      const fighter = await Combat.findByIdAndUpdate(id, {  category, attackName, attackDamage, attackKey }, { new: true });

      if (!fighter) {
          return res.status(404).json({ message: 'Combat not found' });
      }

      res.status(200).json({ message: 'Combat updated successfully', fighter });
  } catch (error) {
      console.error('Error updating Combat:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/combat/:objectId', async (req, res) => {
  const { objectId } = req.params;

  try {
    const user = await Combat.findById(objectId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'Combat not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
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



/// end for admin













app.get("/", (req, res) => {
  res.send("Backend server for fmma game has started running successfully...");
});

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
