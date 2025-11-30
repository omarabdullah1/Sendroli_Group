const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['receptionist', 'designer', 'worker', 'financial', 'admin', 'client'],
      required: [true, 'Role is required'],
      default: 'receptionist',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activeToken: {
      type: String,
      default: null,
      select: false, // Don't include in normal queries for security
    },
    sessionInfo: {
      ipAddress: {
        type: String,
        default: null,
      },
      userAgent: {
        type: String,
        default: null,
      },
      deviceFingerprint: {
        type: String,
        default: null,
      },
      loginTime: {
        type: Date,
        default: null,
      },
      lastActivity: {
        type: Date,
        default: null,
      },
      isValid: {
        type: Boolean,
        default: false,
      },
      sessionVersion: {
        type: Number,
        default: 0,
      },
    },
    deviceInfo: {
      userAgent: {
        type: String,
        default: null,
      },
      deviceName: {
        type: String,
        default: null,
      },
      loginTime: {
        type: Date,
        default: null,
      },
      ipAddress: {
        type: String,
        default: null,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password and activeToken from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.activeToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
