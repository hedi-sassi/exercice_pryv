const express = require('express');
const request = require('request');

const app = express();

//use middleware to parse JSON body
app.use(express.json());


//Trigger backup on /data path
app.post('/data', (req, res) => {

    //retrieve credentials
    const username_s=req.body.source.username;
    const token_s=req.body.source.token;

    const username_b=req.body.backup.username;
    const token_b=req.body.backup.token;


    //fetch both streams
    fetchStreams(username_s, token_s, username_b, token_b, (u_b, t_b, s_s, s_b) => {

        //launch backup 
        if(s_s == null || s_b == null){
            console.log("fetchStream failed");
        }
        else{
            backup(u_b, t_b, s_s, s_b);
        }
    });

});


/**
 * @brief Function used to fetch the stream of data from a given account
 * @param {*} username User name of the account where tha backup event will be created
 * @param {*} token Access token for this account
 * @param {*} stream The stream that will be backed up
 * @return the answer of the API's response
 */
function backup(username, token, stream1, stream2){

    const url_backup = `https://${username}.pryv.me/events?auth=${token}`;

    //extract streams from body
    const s1 = JSON.parse(stream1).streams
    const s2 = JSON.parse(stream2).streams

    //content of the POST request
    const content = {
        uri: url_backup,
        body: createEvent(s1, s2),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    //Execute POST request
    request.post(content ,(err, resp, body) => {

        if(resp.statusCode != 201 || err){
            console.log("Backup failed");
        }

        console.log(body);
    });
}

/**
 * @brief Function used to construct an Event containing the concatenation of two streams
 * @param {*} stream1 first stream
 * @param {*} stream2 second stream
 * @return an Event containing the data of the two streams 
 */
function createEvent(stream1, stream2){

    const start = "{\"streamId\":\"a\",\"type\":\"exercise-1/streams\",\"content\":["
    const end = "]}"

    const string_s1 = JSON.stringify(stream1);
    const string_s2 = JSON.stringify(stream2);

    const event = start + string_s1.substring(1, string_s1.length -1) + ',' + string_s2.substring(1, string_s2.length -1) + end;

    return event
}

/**
 * @brief Function used to backup a stream of data in an account
 * @param {*} username User name of the account where the stream will be fetched
 * @param {*} token Access token for this account
 * @return a stream or null if the get method failed
 */
function fetchStreams(username_s, token_s, username_b, token_b, callback) {

    const url_s = `https://${username_s}.pryv.me/streams?auth=${token_s}`;
    const url_b = `https://${username_b}.pryv.me/streams?auth=${token_b}`;

    var stream_s = null;
    var stream_b = null;

    request.get(url_s, (error, response, body) => {

        if (!error && response.statusCode == 200) {         
            stream_s = body;
        }

        request.get(url_b, (error, response, body) => {

            if (!error && response.statusCode == 200) {          
                stream_b = body;
            }         
            
            callback(username_b, token_b, stream_s, stream_b)   //execute backup
        });
    });
}


const PORT =  1234;

app.listen(PORT, () => console.log('Server running on port '+ PORT));