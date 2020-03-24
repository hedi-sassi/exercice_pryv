const Parallel = require('paralleljs');
const express = require('express');
const fs = require('fs');


const app = express();

//use middleware to parse JSON body
app.use(express.json());

class Credential{

    constructor(username, token){
        this.username = username;
        this.token = token;
    }

}

//Test parallel fetch
app.post('/data', (req, res) => {
    
    //retrieve credentials
    const username_s=req.body.source.username;
    const token_s=req.body.source.token;

    const username_b=req.body.backup.username;
    const token_b=req.body.backup.token;

    const c1 = new Credential(username_s, token_s);
    const c2 = new Credential(username_b, token_b);

    const credentials = Array.from([c1, c2]);

    //fetch data
    const data = fetchStreamsPara(credentials);

    //display them
    showData(data);
});


/**
 * @brief Simply print that data once the promises are resolved
 * @param {*} data an array of promises
 */
function showData(data){

    //print the values
    data.forEach(async function(d) {

        const value = await d;

        console.log(value);
    });
}

/**
 * @brief This function iterates on all pairs of credentials and launch asynchronous GET requests
 * @param {*} credentials an array of credentials (username, token)
 * @param {*} callback the function that will be executed with the streams as argument
 * @return the streams fetched from all the accounts as an array of promises
 */
function fetchStreamsPara(credentials) {

    var data = new Array();

    function getStream(credentials){

        const request = require('request');

        const url = `https://${credentials.username}.pryv.me/streams?auth=${credentials.token}`;

        //create a Promise
        const promise = new Promise ((resolve, reject) => {
            request.get(url, (error, response, body) => {

            if (!error && response.statusCode == 200) {      
                resolve(body);
            }
            else{
                reject("request failed");
            }
        })});

        data.push(promise);
    }

    //launch asynchronous get
    credentials.forEach(e => {
        getStream(e)
    });

    return data;
}



const PORT =  7001;

app.listen(PORT, () => console.log('Server running on port '+ PORT));
