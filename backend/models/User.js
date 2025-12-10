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
      required: function() {
        // Password is not required for client role (passwordless login via phone)
        return this.role !== 'client';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: function() {
        // Phone is required for client role
        return this.role === 'client';
      },
      trim: true,
      unique: true,
      sparse: true, // Allow null values for non-client users
    },
    // normalized phone stripped of non-digit chars for robust lookups
    normalizedPhone: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
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

// Hash password before saving (only if password exists)
userSchema.pre('save', async function (next) {
  // Skip password hashing if no password or not modified
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Normalize phone number before saving
userSchema.pre('save', function (next) {
  if (this.phone && typeof this.phone === 'string') {
    this.normalizedPhone = this.phone.replace(/\D/g, '');
  } else {
    this.normalizedPhone = undefined;
  }
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false; // No password set (client users)
  }
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
