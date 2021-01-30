const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // console.log(req.header('Authorization'));
        const token = req.header('Authorization').replace('Bearer ','');
        const decoded = jwt.verify( token, process.env.TOKEN_KEY);
        // console.log("Decoded:", decoded);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        if(!user)
            throw new Error();
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        // console.log(error);
        res.status(401).send({'error': 'Please Authenticate!'});
    }
}

module.exports = auth;