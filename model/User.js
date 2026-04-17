const mongooose = require("mongoose");

const userSchema = new mongooose.Schema(
  {
    name: {
      type: String,
    },
    iPAddress: {
      type: String,
     
    },
    location: {
      area: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    deviceType: {
      type: String,
 
    },
    cnic: {
      type: String,
      
    },
    phoneNumber: {
      type: String,
  
    },
  },
  {
    timestamps: true,
  },
);

const User = mongooose.model("User", userSchema);

module.exports = User;
