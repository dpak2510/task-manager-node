const express = require('express');
const User = require('./../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();

// Create a user API

router.post('/users', async (req, res) => {
    try{
        const user = new User(req.body);
        await user.save();
        const token = await user.createToken();
        res.status(201).send({user, token});
    }
    catch(e)
    {
        res.status(400).send(e);
    }
});


// Read users API

router.get('/users/me', auth, async (req,res)=>{
    // await req.user.populate('tasks').execPopulate();
    res.status(200).send(req.user);
})


// Update a user API

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ["name", "email", "password", "age"];
    const tryingToUpdate = Object.keys(req.body);
    const isValid = tryingToUpdate.every((user) => allowedUpdates.includes(user));
    if(!isValid)
        return res.status(400).send({ 'error': 'Invalid Update'});
    try {
        tryingToUpdate.forEach((key) => req.user[key] = req.body[key]);
        await req.user.save();
        res.status(200).send(req.user);
    } catch (error) {
        res.status(400).send({error});
    }
});


// Delete a user API

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send({error});
    }
})

// login API

router.post('/users/login', async (req, res) => {
    try {
        // console.log("inside login");
        const user = await User.checkCredentials(req.body.email, req.body.password);
        // console.log("password verified");
        const token = await user.createToken();
        // console.log("token created");
        res.status(200).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});


// Logout API

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token );
        await req.user.save();
        res.status(200).send("You are logged out");
    } catch (error) {
        res.status(500).send({ error });
    }
});


// Profile pic upload

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('Please provide a jpg, jpeg or png file'));
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res)=>{
    try {
        const buffer = await sharp(req.file.buffer).resize({ height: 250, width: 250}).png().toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send({error});
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
});


// Read Avatar

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar)
            return res.status(404).send({ error: "404" });
        res.set('Content-Type','image/png').status(200).send(user.avatar);
    } catch (error) {
        res.status(500).send();
    }
});


// Delete Avatar API

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.status(200).send("Avatar has been deleted");
    } catch (error) {
        res.status(500).send();
    }

});


// Logout all API

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send('You\'ve been logged out from all devices successfully');
    } catch (error) {
        res.status(500).send({error});
    }
});

module.exports = router;