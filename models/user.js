const mongoose = require('mongoose');

const UserScheme = new mongoose.Schema({
    
    nombre: {
        type: String
    },
    apellido: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        required : true
    },
    password: {
        type: String
    }
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('user', UserScheme);
