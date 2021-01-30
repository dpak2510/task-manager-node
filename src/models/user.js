const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate( value ){
            if(!validator.isEmail(value)){
                throw new Error('Use a valid emailID format!');
            }
        }
    },
    age: {
        type: Number,
        required: true,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('Age must be positive!');
            }
        }
    }, 
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6,
        validate(value){
            if(value.toLowerCase().includes('password'))
                throw new Error('\'password\' must not be a part of password')
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function(){
    const user = this.toObject();
    delete user.tokens;
    delete user.password;
    delete user.avatar;
    return user;
}

userSchema.methods.createToken = async function(){
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.TOKEN_KEY);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}

userSchema.statics.checkCredentials = async (email, pass) => {
    const user = await User.findOne({email});
    if(!user)
        throw new Error("Unable to login");
    const isMatch = await bcryptjs.compare(pass, user.password);
    if(!isMatch)
        throw new Error("Unable to login");
    return user;
}

// middleware to hash the password before saving the user
userSchema.pre('save',async function(next){
    if(this.isModified('password'))
        this.password = await bcryptjs.hash(this.password, 8); // second argument is number of times you want to repeat the hash cycle
    next();
});

// middleware to remove all tasks before removing a user.
userSchema.pre('remove', async function(next){
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;