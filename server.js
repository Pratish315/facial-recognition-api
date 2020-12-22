const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const clarifai = require('clarifai');

const app = express()

const clarifai_app = new Clarifai.App({
    apiKey: '1671dc52247642daa536e4c5ec8a28a2'
   });


app.use(bodyParser.json());
app.use(cors());


app.post('/imageurl', (req, res) => {
    clarifai_app.models
    .initModel({
      id: Clarifai.FACE_DETECT_MODEL,
    })
    .then((model) => {
      return model.predict(
        req.body.input
      );
    })
    .then(data => {
        res.json(data);
    })
    .catch(err => res.status(400).json("failed to interact with API"))
})

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'postgres',
      database : 'db_smart_brain'
    }
  });




app.get('/', (req,res) =>{
    res.send("success");
})


app.post('/signin', (req,res) => {
    const {email, password} = req.body;
    if (!email || !password){
        return console.log("blank fields");
    }
    db.select('*').from('users').where('email', '=', req.body.email)
        .then(data => {
            if (data.length && bcrypt.compareSync(req.body.password, data[0].password)){
                res.json(data[0])
            } else {
                res.status(400).json("incorrect login details")
            }
        })
        .catch(err => res.status(400).json('unable to get user'))
    
})

app.post('/register', (req,res) => {
        const {name, email, password } = req.body;
        if (!name || !email || !password){
            return console.log("blank fields");
        }
        const hash = bcrypt.hashSync(password);
        db('users').returning('*').insert({
            email: email,
            name : name,
            password : hash,
            joined : new Date()
        }).then(user => {
            res.json(user[0]);
        })
        .catch(err => res.status(400).json('unable to register'))
        
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({id})
        .then(user => {
            if (user.length){
                res.json(user[0])
            } else {
                res.status(400).json("Not found")
            }
        })
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').returning('entries').where('id', '=', id).increment('entries', 1)
        .then(entries => res.json(entries[0]))
        .catch(err => res.status(400).json("unable to get entries"))
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})