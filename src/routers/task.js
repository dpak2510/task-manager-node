const express = require('express');
const Task = require('./../models/task');
const router = express.Router();
const auth = require('../middleware/auth');

// Create a task API

router.post('/tasks', auth, async (req, res) => {
    try{
        const task = new Task({
            ...req.body,
            owner: req.user._id
        });
        await task.save();
        res.status(201).send(task);
    }
    catch(e)
    {
        res.status(400).send(e);
    }
})


// Read tasks API
// GET //tasks?completed=true&limit=10&skip=10&sortBy=createdAt:desc

router.get('/tasks', auth, async (req,res)=>{
    const match = {};
    const sort = {};
    if(req.query.completed)
        match.completed = (req.query.completed === 'true');
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = ( parts[1] === 'desc' ? -1 : 1 );
    }
    try{
        await req.user.populate({ // populate method is uses virtual key tasks that is defined in user model
            path: 'tasks',
            match, // fetches only those tasks that matches to what specified, if passed-match object is empty then all tasks are fetched.
            options: {
                limit: parseInt(req.query.limit), // set limits on the data fetched, it only works when an integer is provided
                skip: parseInt(req.query.skip), // skips the specified number of tasks from the start, it only works when an integer is provoded as a value
                sort // 1 implies ascending, -1 implies descending
            }
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    }
    catch(e)
    {
        res.status(500).send(e);
    }
});


// Read a task API

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try{
        const task = await Task.findOne({ _id, owner: req.user._id });
        if(!task)
            return res.status(404).send('Not found');
        res.status(200).send(task);
    }
    catch(e)
    {
        res.status(500).send(e);
    }
});


// Update a task API

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ["description", "completed"];
    const tryingToUpdate = Object.keys(req.body);
    const isValid = tryingToUpdate.every((user) => allowedUpdates.includes(user));
    if(!isValid)
        return res.status(400).send({ 'error': 'Invalid Update'});
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if(!task)
            return res.status(404).send();
        tryingToUpdate.forEach((key) => {
            task[key] = req.body[key]
        });
        await task.save()
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send({error: 'Invalid User properties'});
    }
})


// Delete a task API

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        if(!task)
            return res.status(404).send();
        await task.remove();
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send({error});
    }
})

module.exports = router;