require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const { uploadFile, getFileStream } = require('../s3')

const User = require('../models/user')
const Album = require('../models/album')
const Picture = require('../models/picture')
const mongoose = require('mongoose')
const album = require('../models/album')
const db = "mongodb+srv://admin-mikee:" + process.env.MONGODB_PW + "@cluster0.zcifu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) {
        console.error('Error! ' + err)
    } else {
        console.log(('Connected to mongodb'));
    }
})

router.get('/', (req, res) => {
    res.send('From API route')
})


/* AUTHENTICATION */

verifyToken = (req, res, next) => {
    // Verify if Authorization header exists
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    // Get token --> remove 'Bear ' string
    let token = req.headers.authorization.split(' ')[1]
    // Verify if token exists
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    // Verify token
    let payload = jwt.verify(token, process.env.JWT_KEY)
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    // Assign payload subject as user id
    req.userId = payload.subject
    next()
}

router.post('/register', (req,res)  => {
    let userData = req.body
    let user = new User(userData)
    user.save((error, registeredUser) => {
        if (error) {
            console.log(error);
        } else {
            let payload = { subject: registeredUser._id }
            let token = jwt.sign(payload, process.env.JWT_KEY)
            res.status(200).send({token})
        }
    })
})

router.post('/login', (req,res) => {
    let userData = req.body

    User.findOne({email: userData.email}, (error, user) => {
        if (error){
            console.log(error);
        } else {
            if (!user) { // If user does not exist
                res.status(401).send('Invalid email')
            } else // If user exists
            if ( user.password !== userData.password ) {
                res.status(401).send('Invalid password')
            } else {
                let payload = { subject: user._id }
                let token = jwt.sign(payload, process.env.JWT_KEY)
                res.status(200).send({token})
            }
        }
    })
})


/* S3 IMAGE */

encode = (data) => {
    const buf = Buffer.from(data);
    const base64 = buf.toString('base64');
    return base64
}

router.get('/images/:key', async (req,res) => {
    const key = req.params.key
    const resized = req.query.resized

    // Get image from s3
    const readStream = await getFileStream(key,resized)

    // Convert buffet to base64
    const result = encode(readStream.Body)

    // Send image as response
    res.send(result)
})

router.post('/images', upload.single('image'), async (req,res) => {
    // req.file is the `image` file, which will be uploaded to s3
    const file = req.file

    // S3 upload original image
    await uploadFile(file, false)

    // S3 upload resized image
    await uploadFile(file, true)

    // Remove file from uploads folder
    await unlinkFile(file.path)
    
    // Send image key as response
    res.send({ imageKey: file.filename })
})


/* MONGODB ALBUM */

router.get('/albums', (req,res) => {
  Album.find({}, (error, albums) => {
      if (error) {
          console.log(error);
      } else {
          res.json(albums)
      }
  })
})

router.get('/albums/:key', (req,res) => {

  const albumId = req.params.key
  console.log(albumId);

  Album.findById(albumId, (error, album) => {
      if (error) {
          res.status(500).json({
            message: 'Something went wrong'
          })
      } else {
          console.log(album)
          res.status(200).json({
            message: 'Album fetched successfully',
            albumData: album
          })
      }
  })
})

router.post('/albums', (req,res) => {

  const album = new Album({
    name: req.body.name,
    description: req.body.description,
    key: req.body.imageKey,
  })
  
  album.save((error, newAlbum) => {
      if (error) {
          console.log(error);
      } else {
          console.log("New album created, id : " + newAlbum._id);
      }
      res.status(201).send(newAlbum)
  })
})

router.patch('/albums/:key', (req,res) => {
    const albumKey = req.params.key
    let albumData = req.body

    

    /*const filter = { key : keyToUpdate }
    const update = {  }

    let album = await Album.findOneAndUpdate(filter, update, {
        returnOriginal: false
    })*/
})

router.delete('/albums/:id', (req, res) => {
  const albumId = req.params.id
  
  album.findByIdAndDelete( albumId, (err) => {
    if (err) {
      res.status(500).json({
        message: 'Something went wrong'
      })
    } else {
      res.status(200).json({
        message: 'Deleted successfully'
      })
    }
  })
})

/* Add picture to album */
router.get('/albums/:id/pictures', (req, res) => {
  //const albumId = req.params.id

  //const picture = req.body

  console.log('yo')
  res.send('yo')
})

/* Add picture to album */
router.post('/albums/:id/pictures', (req, res) => {

  const picture = new Picture({
    key: req.body.key,
    album: req.body.album
  })
  
  picture.save((error, newPicture) => {
    if (error) {
        console.log(error);
    } else {
        console.log("New picture added, id : " + newPicture._id);
    }
    res.status(201).send(newPicture)
})
})


module.exports = router