const mongoose = require('mongoose');

const StoryScheme = new mongoose.Schema({
    
    titulo: {
        type: String
    },
    texto: {
        type: String
    },
    autor: {
        type: String
    },
    imagen: {
        type: String
    }
},
{
    versionKey: false,
    timestamps: true
}
);

module.exports = mongoose.model('story', StoryScheme);
