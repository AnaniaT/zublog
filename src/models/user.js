const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
      lowercase: true,
      minlength: [7, 'Username too short.'],
      maxlength: [21, 'Username too long.'],
      validate(value) {
        if (value.includes(' ')) {
          throw new Error('Username must not contain spaces');
        }
        if (!/^[a-zA-Z]/) {
          throw new Error('Username must start with a letter');
        }
        if (!/^[A-Za-z][A-Za-z0-9_.]{6,20}$/.test(value.trim())) {
          throw new Error('No special characters allowed');
        }
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Enter a valid email');
        }
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [7, 'Password too short.'],
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
    hasTick: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    social: {
      telegram: {
        type: String,
      },
      instagram: {
        type: String,
      },
      facebook: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);
// creating the relationship with their posts
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

userSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'author',
});

// instance methods
userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

userSchema.methods.getPublicData = function () {
  const userObject = this.toObject();
  if (userObject.avatar) {
    userObject.hasAvatar = true; // html/hbs
  }
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

// Model Functions (query methods)
userSchema.statics.findByCredentials = async function (username, password) {
  const user = await User.findOne({ username, active: true });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

// Model Middlewares
userSchema.pre('save', async function (next) {
  // this refres to the saving object
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.post('save', function (error, doc, next) {
  // generating a custom error message for unique constrain fails
  if (error.name === 'MongoError' && error.code === 11000) {
    const fieldName = Object.keys(error.keyPattern)[0];
    const capFieldName = fieldName[0].toUpperCase() + fieldName.slice(1);
    next(new Error('Oops! ' + fieldName + ' is already taken'));
  } else {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
