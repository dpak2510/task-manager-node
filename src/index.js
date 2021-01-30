const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const multer = require('multer');
require('./db/mongoose');

const app = express();
const port = process.env.PORT;

app.use(express.json());  /* this statement is used to get request body at req.body */

app.use(userRouter);

app.use(taskRouter);

app.listen(port, () => {
    console.log('Server is running at ' + port);
});