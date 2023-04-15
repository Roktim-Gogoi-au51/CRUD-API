const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Initialize Firebase Admin SDK
var serviceAccount = require("./restapi-cfe93-firebase-adminsdk-zbm3g-1cff154346.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://restapi-cfe93-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Set up Express server
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cors());

//registration endpoint
app.post('/register',async(req,res)=>{
    try {
        await admin.auth().createUser({
            email:req.body.email,
            password:req.body.password
        })
        console.log(req.body)
        res.status(201).send('user created')
    } catch (error) {
        console.log(error.message)
        res.status(400).send(error.messsage)
    }
})

//signin endpoint
app.post('/login',async(req,res)=>{
    try {
        const user = await admin.auth().getUserByEmail(req.body.email);
        if(!user){
            res.status(404).send('user not found');
            return;
        }
        const token = jwt.sign({uid:user.uid},'thisisthesecretkey');
        res.status(200).json({token});

    } catch (error) {
        console.log(error.message)
        res.status(400).send(error.message)
    }
})

//Implementation of CRUD operation

const db = admin.database();
const resource = db.ref('resource')

//endpoint to create a new resource
app.post('/resource',authenticated, async (req, res) => {
    try {
      const { name, resourceContent } = req.body;
      const newResource = resource.push();
      await newResource.set({ name, resourceContent });
      res.status(201).send('Resource created successfully');
    } catch (error) {
      console.log(error.message);
      res.status(500).send(error.message);
    }
});

//endpoint to view all the resources
app.get('/resource',authenticated, async (req, res) => {
    try {
      const snapshot = await resource.once('value');
      res.status(200).json(snapshot.val());
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error retrieving resource' });
    }
});

//endpoint to update
app.put('/resource/:id',authenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, resourceContent } = req.body;
      await resource.child(id).update({ name, resourceContent });
      res.status(200).json({ message: 'Resource updated successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error updating resource' });
    }
});
  
  //endpoint to delete
app.delete('/resource/:id',authenticated, async (req, res) => {
try {
    const { id } = req.params;
    await resource.child(id).remove();
    res.status(200).json({ message: 'Resource deleted successfully' });
} catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error deleting resource' });
}
});
  

//middleware function to secure the CRUD endpoints
function authenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      console.log(token)
      jwt.verify(token, 'thisisthesecretkey', (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  }

  
  

// listening to the server port
const port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log(`listening to server port ${port}`)
})