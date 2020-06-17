const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const templates = require('../../VueJS/interface_admin/src/json/templates.json').templates;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


const  idRoot = "14IRqWoyuIsFryI5hee6LYnrQNQ5-J36g";


// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), templateDrive,5);  //Drive Tree creation with id template in params
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback,id_template) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,id_template);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}



/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles(auth,name,parentID) {

  const drive = google.drive({version: 'v3', auth});
  try {
    const res = await drive.files.list({
      q: "'"+ parentID +"' in parents and name='"+name+"' and trashed=false",
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    })
    const files = await res.data.files;
    return files

  } catch (error) {
    console.log(error);
  }
}



/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function creation(auth, name, parent) {
  console.log(" \n creation function start ----- ")

  const drive = google.drive({version: 'v3', auth});

  var fileMetadata = {
    'name': name,
    'mimeType': 'application/vnd.google-apps.folder',
    parents: [parent]  
  };

  let files = await listFiles(auth,name,parent);
  let folder_exist = false; 
  let id_folder;

  files.map((file) => {
    if(file.name == name){
      folder_exist = true;
      id_folder = file.id;
    }
  });

  try {
    if(!folder_exist){
      console.log("Création du Dossier...");
  
      const res = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      })
        console.log("Dossier \"" + res.config.data.name + "\" créé !");
        console.log("Dossier ID: ", res.data.id); 
        
        const id = await res.data.id;
        return id;
    }
        //console.log(response) //Full response 
    else{
      const id = await id_folder;
      console.log("Dossier \""+ name +"\" existant ! (ID: " + id_folder + ")");
      return id;
    }
    
  } catch (error) {
    console.log(error);
  }
}

async function templateDrive(auth,id_template){

    const temp = templates[id_template];

    console.log(temp);

    let root = creation(auth,"Vega",idRoot);  //TODO D'ou vient les infos sur le site et ses ecrans (hors liste templates)
    let folderParent;

    root.then(function(res){
      folderParent = res;
      let display1 = creation(auth,"Accueil",folderParent);
      let display2 = creation(auth,"Fruits&Legumes",folderParent);
      
      display1.then(function(res){
        folderParent = res;

        for(let i =0; i <= temp.zones.length-1;i++){
          let zone = creation(auth,temp.zones[i].folderName,folderParent);
        }
        
      })
    })
}

