const express = require('express')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex');
const cors_proxy = require('cors-anywhere');

const PORT = process.env.PORT

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const app = express();
app.use(express.json());
app.use(cors());

// var host = process.env.HOST || '0.0.0.0';
// var port = process.env.PORT || 8080;

// cors_proxy.createServer({
//     originWhitelist: [], // Allow all origins
//     requireHeader: ['origin', 'x-requested-with'],
//     removeHeaders: ['cookie', 'cookie2']
// }).listen(port, host, function() {
//     console.log('Running CORS Anywhere on ' + host + ':' + port);
// });

const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
          }
    }
});

app.get('clarifai', async (req, res) => {
    const PAT = 'b7f5f05974764529ab113565cd90b500';
    const USER_ID = 'mljx0bi1jwgg';
    const APP_ID = 'my-first-application-klq8aa';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';
  
    const raw = JSON.stringify({
      user_app_id: {
        user_id: USER_ID,
        app_id: APP_ID,
      },
      inputs: [
        {
          data: {
            image: {
              url: req.body.imageURL
            },
          },
        },
      ],
    });
  
    const requestOptions = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Key ' + PAT,
      },
      body: raw,
    };
  
    fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if(result) {
            res.send(result);
            console.log("Works");
        }
        const regions = result.outputs[0]?.data?.regions;
        if (!regions) throw new Error('No regions found in the response.');
  
        const newBoxes = regions.map((region) => {
          const boundingBox = region.region_info.bounding_box;
  
          return calculateFaceLocation({
            topRow: boundingBox.top_row,
            leftCol: boundingBox.left_col,
            bottomRow: boundingBox.bottom_row,
            rightCol: boundingBox.right_col,
          });
        });
  
        setBox(newBoxes); // Set state with the new bounding boxes (replacing old boxes)
      })
      .catch((error) => console.log('error', error));
})

app.get('/', (req, res) => { res.send('It works') })

app.post('/signin', (req, res) => { signin.handleSignIn(req, res, bcrypt, db) })

app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt) })

app.get('/profile/:id', (req, res) => { profile.handleProfileGet(req, res, db)})

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.put('/image', (req, res) => { image.handleImagePut(req, res, db)})

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})