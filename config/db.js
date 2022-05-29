const mongoose = require('mongoose');
const password = 'tecsup2022';
const dbname = 'daw02';
const uri =  `mongodb+srv://atsumi2002:${password}@cluster0.ywba3.mongodb.net/${dbname}?retryWrites=true&w=majority`;


module.exports = () => {

    const connect = ()=>{
        mongoose.connect(
            uri, 
            {
                useNewUrlParser: true, 
                useUnifiedTopology: true,
                keepAlive: true
            },
            (err) => {
                if(err){ 
                    console.log(err);
                    console.log('Error en conexion a BD...!!!');
                }else{
                    console.log('Conexion Correcta..........!!!');
                }
            }
        );
    }

    connect();
};
